const pool = require('../config/db');
const { sendEmail, flightStatusEmail } = require('../utils/emailService');

// Modify booking - change flight date
const modifyBooking = async (req, res) => {
  const { booking_id } = req.params;
  const { new_flight_id, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id=$1', [booking_id]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (booking.user_id !== req.user.id && req.user.role === 'passenger') throw new Error('Access denied');
    if (booking.status === 'cancelled') throw new Error('Cannot modify a cancelled booking');
    if (booking.checked_in) throw new Error('Cannot modify a checked-in booking');

    // Check new flight availability
    const newFlightRes = await client.query('SELECT * FROM flights WHERE id=$1', [new_flight_id]);
    const newFlight = newFlightRes.rows[0];
    if (!newFlight) throw new Error('New flight not found');

    const seatCol = booking.cabin_class === 'first' ? 'available_first_class_seats' : booking.cabin_class === 'business' ? 'available_business_seats' : 'available_economy_seats';
    if (newFlight[seatCol] < booking.total_passengers) throw new Error('Not enough seats on new flight');

    // Restore seats on old flight
    await client.query(`UPDATE flights SET ${seatCol}=${seatCol}+$1, updated_at=NOW() WHERE id=$2`, [booking.total_passengers, booking.flight_id]);
    await client.query('UPDATE seats SET is_available=true, booking_id=NULL WHERE booking_id=$1', [booking_id]);

    // Assign seats on new flight
    const passengers = await client.query('SELECT * FROM passengers WHERE booking_id=$1', [booking_id]);
    for (let i = 0; i < passengers.rows.length; i++) {
      const prefix = booking.cabin_class === 'business' ? 'B' : booking.cabin_class === 'first' ? 'F' : 'E';
      const seatNum = `${prefix}${i + 1}`;
      await client.query('UPDATE passengers SET seat_number=$1 WHERE id=$2', [seatNum, passengers.rows[i].id]);
      await client.query(
        'INSERT INTO seats (flight_id,seat_number,cabin_class,is_available,booking_id) VALUES ($1,$2,$3,false,$4) ON CONFLICT (flight_id,seat_number) DO UPDATE SET is_available=false,booking_id=$4',
        [new_flight_id, seatNum, booking.cabin_class, booking_id]
      );
    }

    // Update booking
    await client.query(
      'UPDATE bookings SET flight_id=$1, modified_at=NOW(), modification_reason=$2, updated_at=NOW() WHERE id=$3',
      [new_flight_id, reason || 'Flight change requested', booking_id]
    );
    await client.query(`UPDATE flights SET ${seatCol}=${seatCol}-$1, updated_at=NOW() WHERE id=$2`, [booking.total_passengers, new_flight_id]);

    await client.query('COMMIT');
    res.json({ message: 'Booking modified successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

// Upgrade seat class
const upgradeSeat = async (req, res) => {
  const { booking_id } = req.params;
  const { new_cabin_class } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id=$1', [booking_id]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (booking.user_id !== req.user.id && req.user.role === 'passenger') throw new Error('Access denied');
    if (booking.status === 'cancelled') throw new Error('Cannot upgrade a cancelled booking');
    if (booking.checked_in) throw new Error('Cannot upgrade after check-in');

    const classOrder = { economy: 1, business: 2, first: 3 };
    if (classOrder[new_cabin_class] <= classOrder[booking.cabin_class]) throw new Error('Can only upgrade to a higher class');

    const flightRes = await client.query('SELECT * FROM flights WHERE id=$1', [booking.flight_id]);
    const flight = flightRes.rows[0];
    const newSeatCol = new_cabin_class === 'first' ? 'available_first_class_seats' : 'available_business_seats';
    const oldSeatCol = booking.cabin_class === 'first' ? 'available_first_class_seats' : booking.cabin_class === 'business' ? 'available_business_seats' : 'available_economy_seats';
    const newPriceCol = new_cabin_class === 'first' ? 'first_class_price' : 'business_price';

    if (flight[newSeatCol] < booking.total_passengers) throw new Error('Not enough seats in new class');

    // Calculate upgrade cost
    const oldPrice = parseFloat(flight[booking.cabin_class + '_price'] || flight['economy_price']);
    const newPrice = parseFloat(flight[newPriceCol]);
    const upgradeCost = (newPrice - oldPrice) * booking.total_passengers;

    // Update seats
    await client.query(`UPDATE flights SET ${oldSeatCol}=${oldSeatCol}+$1, ${newSeatCol}=${newSeatCol}-$1, updated_at=NOW() WHERE id=$2`, [booking.total_passengers, booking.flight_id]);
    await client.query('UPDATE seats SET is_available=true, booking_id=NULL WHERE booking_id=$1', [booking_id]);

    const passengers = await client.query('SELECT * FROM passengers WHERE booking_id=$1', [booking_id]);
    for (let i = 0; i < passengers.rows.length; i++) {
      const prefix = new_cabin_class === 'business' ? 'B' : 'F';
      const seatNum = `${prefix}${i + 1}`;
      await client.query('UPDATE passengers SET seat_number=$1 WHERE id=$2', [seatNum, passengers.rows[i].id]);
      await client.query(
        'INSERT INTO seats (flight_id,seat_number,cabin_class,is_available,booking_id) VALUES ($1,$2,$3,false,$4) ON CONFLICT (flight_id,seat_number) DO UPDATE SET is_available=false,booking_id=$4',
        [booking.flight_id, seatNum, new_cabin_class, booking_id]
      );
    }

    const newTotal = parseFloat(booking.total_amount) + upgradeCost;
    await client.query('UPDATE bookings SET cabin_class=$1, total_amount=$2, modified_at=NOW(), updated_at=NOW() WHERE id=$3', [new_cabin_class, newTotal, booking_id]);

    await client.query('COMMIT');
    res.json({ message: `Seat upgraded to ${new_cabin_class}`, upgrade_cost: upgradeCost, new_total: newTotal });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

// Notify passengers of flight status change
const notifyFlightStatus = async (flightId, status, message) => {
  try {
    const bookings = await pool.query(`
      SELECT b.id, u.email, u.first_name, f.flight_number, f.departure_time,
        a1.code as origin_code, a2.code as dest_code
      FROM bookings b
      JOIN users u ON b.user_id=u.id
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      WHERE b.flight_id=$1 AND b.status NOT IN ('cancelled')`, [flightId]);

    for (const booking of bookings.rows) {
      await sendEmail(booking.email, `RwandAir - Flight ${booking.flight_number} ${status}`,
        flightStatusEmail({ first_name: booking.first_name }, booking, status, message));

      // Save notification in DB
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ((SELECT user_id FROM bookings WHERE id=$1), $2, $3, $4)',
        [booking.id, 'flight_status', `Flight ${booking.flight_number} ${status}`, message]
      );
    }
    console.log(`Notified ${bookings.rows.length} passengers about flight status: ${status}`);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get revenue stats for charts
const getRevenueStats = async (req, res) => {
  try {
    const daily = await pool.query(`
      SELECT DATE(p.paid_at) as date, SUM(p.amount) as revenue, COUNT(*) as transactions
      FROM payments p WHERE p.status='completed' AND p.paid_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(p.paid_at) ORDER BY date ASC`);

    const byRoute = await pool.query(`
      SELECT a1.code as origin, a2.code as destination,
        COUNT(b.id) as bookings, SUM(b.total_amount) as revenue
      FROM bookings b
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      WHERE b.payment_status='paid'
      GROUP BY a1.code, a2.code ORDER BY revenue DESC LIMIT 10`);

    const byClass = await pool.query(`
      SELECT cabin_class, COUNT(*) as bookings, SUM(total_amount) as revenue
      FROM bookings WHERE payment_status='paid'
      GROUP BY cabin_class`);

    const monthly = await pool.query(`
      SELECT TO_CHAR(p.paid_at, 'Mon YYYY') as month,
        SUM(p.amount) as revenue, COUNT(*) as transactions
      FROM payments p WHERE p.status='completed'
      GROUP BY TO_CHAR(p.paid_at, 'Mon YYYY'), DATE_TRUNC('month', p.paid_at)
      ORDER BY DATE_TRUNC('month', p.paid_at) DESC LIMIT 12`);

    res.json({ daily: daily.rows, byRoute: byRoute.rows, byClass: byClass.rows, monthly: monthly.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { modifyBooking, upgradeSeat, notifyFlightStatus, getNotifications, markNotificationRead, getRevenueStats };
