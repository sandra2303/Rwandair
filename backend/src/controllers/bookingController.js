const pool = require('../config/db');

const generateRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const createBooking = async (req, res) => {
  const { flight_id, return_flight_id, trip_type, cabin_class, passengers, currency } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const flightRes = await client.query('SELECT * FROM flights WHERE id=$1 FOR UPDATE', [flight_id]);
    const flight = flightRes.rows[0];
    if (!flight) throw new Error('Flight not found');

    const seatCol = cabin_class === 'first' ? 'available_first_class_seats' : cabin_class === 'business' ? 'available_business_seats' : 'available_economy_seats';
    const priceCol = cabin_class === 'first' ? 'first_class_price' : cabin_class === 'business' ? 'business_price' : 'economy_price';

    if (flight[seatCol] < passengers.length) throw new Error('Not enough seats available');

    const totalAmount = parseFloat(flight[priceCol]) * passengers.length;

    let ref, refExists = true;
    while (refExists) {
      ref = generateRef();
      const check = await client.query('SELECT id FROM bookings WHERE booking_reference=$1', [ref]);
      refExists = check.rows.length > 0;
    }

    const bookingRes = await client.query(
      `INSERT INTO bookings (booking_reference,user_id,flight_id,return_flight_id,trip_type,cabin_class,total_passengers,total_amount,currency,booked_by_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [ref, req.user.id, flight_id, return_flight_id || null, trip_type || 'one-way', cabin_class, passengers.length, totalAmount, currency || 'USD', req.user.role === 'agent' ? req.user.id : null]
    );
    const booking = bookingRes.rows[0];

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const prefix = cabin_class === 'business' ? 'B' : cabin_class === 'first' ? 'F' : 'E';
      const seatNum = `${prefix}${i + 1}`;
      await client.query(
        'INSERT INTO passengers (booking_id,first_name,last_name,date_of_birth,passport_number,nationality,seat_number,meal_preference,is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [booking.id, p.first_name, p.last_name, p.date_of_birth, p.passport_number, p.nationality, seatNum, p.meal_preference || 'standard', i === 0]
      );
      await client.query(
        'INSERT INTO seats (flight_id,seat_number,cabin_class,is_available,booking_id) VALUES ($1,$2,$3,false,$4) ON CONFLICT (flight_id,seat_number) DO UPDATE SET is_available=false,booking_id=$4',
        [flight_id, seatNum, cabin_class, booking.id]
      );
    }

    await client.query(`UPDATE flights SET ${seatCol}=${seatCol}-$1,updated_at=NOW() WHERE id=$2`, [passengers.length, flight_id]);
    await client.query('COMMIT');
    res.status(201).json({ booking, message: 'Booking created. Proceed to payment.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, f.flight_number, f.departure_time, f.arrival_time, f.status as flight_status,
        a1.code as origin_code, a1.city as origin_city,
        a2.code as dest_code, a2.city as dest_city
      FROM bookings b
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      WHERE b.user_id=$1 ORDER BY b.created_at DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookingById = async (req, res) => {
  try {
    // Try by booking_reference first, then by UUID
    const id = req.params.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const query = `
      SELECT b.*, f.flight_number, f.departure_time, f.arrival_time, f.status as flight_status,
        a1.code as origin_code, a1.city as origin_city, a1.name as origin_name,
        a2.code as dest_code, a2.city as dest_city, a2.name as dest_name,
        ac.model as aircraft_model
      FROM bookings b
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      JOIN aircraft ac ON f.aircraft_id=ac.id
      WHERE ${isUUID ? 'b.id=$1' : 'b.booking_reference=$1'}`;

    const bookingRes = await pool.query(query, [id]);
    if (!bookingRes.rows[0]) return res.status(404).json({ message: 'Booking not found' });
    const booking = bookingRes.rows[0];
    if (req.user.role === 'passenger' && booking.user_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    const passengers = await pool.query('SELECT * FROM passengers WHERE booking_id=$1', [booking.id]);
    const payment = await pool.query('SELECT * FROM payments WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1', [booking.id]);
    res.json({ ...booking, passengers: passengers.rows, payment: payment.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE', [req.params.id]);
    const booking = result.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (req.user.role === 'passenger' && booking.user_id !== req.user.id) throw new Error('Access denied');
    if (booking.status === 'cancelled') throw new Error('Booking already cancelled');

    await client.query('UPDATE bookings SET status=$1,updated_at=NOW() WHERE id=$2', ['cancelled', booking.id]);
    const seatCol = booking.cabin_class === 'first' ? 'available_first_class_seats' : booking.cabin_class === 'business' ? 'available_business_seats' : 'available_economy_seats';
    await client.query(`UPDATE flights SET ${seatCol}=${seatCol}+$1,updated_at=NOW() WHERE id=$2`, [booking.total_passengers, booking.flight_id]);
    await client.query('UPDATE seats SET is_available=true,booking_id=NULL WHERE booking_id=$1', [booking.id]);
    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getAllBookings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.first_name, u.last_name, u.email,
        f.flight_number, f.departure_time,
        a1.code as origin_code, a1.city as origin_city,
        a2.code as dest_code, a2.city as dest_city
      FROM bookings b
      JOIN users u ON b.user_id=u.id
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      ORDER BY b.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking, getAllBookings };
