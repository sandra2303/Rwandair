const pool = require('../config/db');
const QRCode = require('qrcode');

const generateTicketNumber = () => 'WB' + (Math.floor(Math.random() * 9000000000) + 1000000000);

const generateTickets = async (req, res) => {
  const { booking_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingRes = await client.query(`
      SELECT b.*, f.flight_number, f.departure_time, f.arrival_time,
        a1.code as origin_code, a1.city as origin_city,
        a2.code as dest_code, a2.city as dest_city
      FROM bookings b
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      WHERE b.id=$1`, [booking_id]);

    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (booking.payment_status !== 'paid') throw new Error('Payment not completed');

    const passengers = await client.query('SELECT * FROM passengers WHERE booking_id=$1', [booking_id]);
    const tickets = [];

    for (const p of passengers.rows) {
      const existing = await client.query('SELECT * FROM tickets WHERE passenger_id=$1', [p.id]);
      if (existing.rows.length) { tickets.push(existing.rows[0]); continue; }

      let ticketNumber;
      let exists = true;
      while (exists) {
        ticketNumber = generateTicketNumber();
        const check = await client.query('SELECT id FROM tickets WHERE ticket_number=$1', [ticketNumber]);
        exists = check.rows.length > 0;
      }

      const qrData = JSON.stringify({
        ticket: ticketNumber,
        booking: booking.booking_reference,
        passenger: `${p.first_name} ${p.last_name}`,
        flight: booking.flight_number,
        from: booking.origin_code,
        to: booking.dest_code,
        departure: booking.departure_time,
        seat: p.seat_number,
      });

      const qrCode = await QRCode.toDataURL(qrData);
      const ticketRes = await client.query(
        'INSERT INTO tickets (booking_id,passenger_id,ticket_number,qr_code) VALUES ($1,$2,$3,$4) RETURNING *',
        [booking_id, p.id, ticketNumber, qrCode]
      );
      tickets.push(ticketRes.rows[0]);
    }

    await client.query('COMMIT');
    res.json({ tickets, booking });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getTickets = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const booking = await pool.query(`
      SELECT b.*, f.flight_number, f.departure_time, f.arrival_time, f.status as flight_status,
        a1.code as origin_code, a1.city as origin_city, a1.name as origin_name,
        a2.code as dest_code, a2.city as dest_city, a2.name as dest_name,
        ac.model as aircraft_model, ac.registration
      FROM bookings b
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      JOIN aircraft ac ON f.aircraft_id=ac.id
      WHERE b.id=$1`, [booking_id]);

    if (!booking.rows[0]) return res.status(404).json({ message: 'Booking not found' });

    const tickets = await pool.query(`
      SELECT t.*, p.first_name, p.last_name, p.passport_number, p.nationality,
        p.seat_number, p.meal_preference, p.date_of_birth, p.checked_in,
        p.baggage_kg, p.extra_baggage_kg
      FROM tickets t JOIN passengers p ON t.passenger_id=p.id
      WHERE t.booking_id=$1`, [booking_id]);

    res.json({ booking: booking.rows[0], tickets: tickets.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const checkIn = async (req, res) => {
  const { booking_id } = req.params;
  const { passenger_ids, seat_selections } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const bookingRes = await client.query('SELECT * FROM bookings WHERE id=$1', [booking_id]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (booking.payment_status !== 'paid') throw new Error('Payment required before check-in');
    if (booking.status === 'cancelled') throw new Error('Booking is cancelled');

    const flightRes = await client.query('SELECT * FROM flights WHERE id=$1', [booking.flight_id]);
    const dep = new Date(flightRes.rows[0].departure_time);
    const hoursUntil = (dep - new Date()) / 3600000;
    if (hoursUntil > 24) throw new Error('Check-in opens 24 hours before departure');
    if (hoursUntil < 1) throw new Error('Check-in closed 1 hour before departure');

    for (let i = 0; i < passenger_ids.length; i++) {
      const pid = passenger_ids[i];
      const newSeat = seat_selections?.[i];
      if (newSeat) {
        const seatCheck = await client.query('SELECT * FROM seats WHERE flight_id=$1 AND seat_number=$2 AND is_available=true', [booking.flight_id, newSeat]);
        if (!seatCheck.rows.length) throw new Error(`Seat ${newSeat} is not available`);
        const oldP = await client.query('SELECT seat_number FROM passengers WHERE id=$1', [pid]);
        if (oldP.rows[0]?.seat_number) {
          await client.query('UPDATE seats SET is_available=true,booking_id=NULL WHERE flight_id=$1 AND seat_number=$2', [booking.flight_id, oldP.rows[0].seat_number]);
        }
        await client.query('UPDATE passengers SET seat_number=$1,checked_in=true WHERE id=$2', [newSeat, pid]);
        await client.query('UPDATE seats SET is_available=false,booking_id=$1 WHERE flight_id=$2 AND seat_number=$3', [booking_id, booking.flight_id, newSeat]);
      } else {
        await client.query('UPDATE passengers SET checked_in=true WHERE id=$1', [pid]);
      }
      await client.query('INSERT INTO checkins (booking_id,passenger_id,seat_number) VALUES ($1,$2,(SELECT seat_number FROM passengers WHERE id=$2))', [booking_id, pid]);
    }

    await client.query('UPDATE bookings SET checked_in=true,check_in_time=NOW() WHERE id=$1', [booking_id]);
    await client.query('COMMIT');
    res.json({ message: 'Check-in successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const validateTicket = async (req, res) => {
  const { ticket_number } = req.params;
  try {
    const result = await pool.query(`
      SELECT t.*, p.first_name, p.last_name, p.passport_number, p.seat_number, p.checked_in,
        b.booking_reference, b.status as booking_status, b.cabin_class,
        f.flight_number, f.departure_time, f.status as flight_status,
        a1.code as origin_code, a2.code as dest_code
      FROM tickets t
      JOIN passengers p ON t.passenger_id=p.id
      JOIN bookings b ON t.booking_id=b.id
      JOIN flights f ON b.flight_id=f.id
      JOIN airports a1 ON f.origin_airport_id=a1.id
      JOIN airports a2 ON f.destination_airport_id=a2.id
      WHERE t.ticket_number=$1`, [ticket_number]);

    if (!result.rows[0]) return res.status(404).json({ valid: false, message: 'Ticket not found' });
    const ticket = result.rows[0];
    if (!ticket.is_valid) return res.json({ valid: false, message: 'Ticket invalidated', ticket });
    if (ticket.booking_status === 'cancelled') return res.json({ valid: false, message: 'Booking cancelled', ticket });
    res.json({ valid: true, message: 'Ticket is valid', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableSeats = async (req, res) => {
  const { flight_id } = req.params;
  try {
    const flightRes = await pool.query(`
      SELECT f.*, ac.economy_seats, ac.business_seats, ac.first_class_seats
      FROM flights f JOIN aircraft ac ON f.aircraft_id=ac.id WHERE f.id=$1`, [flight_id]);
    if (!flightRes.rows[0]) return res.status(404).json({ message: 'Flight not found' });
    const f = flightRes.rows[0];

    const takenRes = await pool.query('SELECT seat_number FROM seats WHERE flight_id=$1 AND is_available=false', [flight_id]);
    const taken = takenRes.rows.map(s => s.seat_number);

    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatMap = { economy: [], business: [], first: [] };

    for (let i = 0; i < f.business_seats; i++) {
      const row = Math.floor(i / 4) + 1;
      const col = cols[i % 4];
      const seat = `B${row}${col}`;
      seatMap.business.push({ seat, available: !taken.includes(seat) });
    }
    for (let i = 0; i < f.first_class_seats; i++) {
      const row = Math.floor(i / 4) + 1;
      const col = cols[i % 4];
      const seat = `F${row}${col}`;
      seatMap.first.push({ seat, available: !taken.includes(seat) });
    }
    for (let i = 0; i < f.economy_seats; i++) {
      const row = Math.floor(i / 6) + 1;
      const col = cols[i % 6];
      const seat = `E${row}${col}`;
      seatMap.economy.push({ seat, available: !taken.includes(seat) });
    }

    res.json({ seatMap, taken, flight: f });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addBaggage = async (req, res) => {
  const { passenger_id } = req.params;
  const { extra_kg } = req.body;
  try {
    const result = await pool.query('UPDATE passengers SET extra_baggage_kg=$1 WHERE id=$2 RETURNING *', [extra_kg, passenger_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { generateTickets, getTickets, checkIn, validateTicket, getAvailableSeats, addBaggage };
