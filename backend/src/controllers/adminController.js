const pool = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    const [bookings, revenue, flights, users, recentBookings] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='confirmed') as confirmed, COUNT(*) FILTER (WHERE status='cancelled') as cancelled, COUNT(*) FILTER (WHERE status='pending') as pending FROM bookings`),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(amount) FILTER (WHERE currency='USD'),0) as usd, COALESCE(SUM(amount) FILTER (WHERE currency='EUR'),0) as eur, COALESCE(SUM(amount) FILTER (WHERE currency='RWF'),0) as rwf FROM payments WHERE status='completed'`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='scheduled') as scheduled, COUNT(*) FILTER (WHERE status='cancelled') as cancelled FROM flights`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE role='passenger') as passengers, COUNT(*) FILTER (WHERE role='agent') as agents FROM users WHERE is_active=true`),
      pool.query(`SELECT b.booking_reference, b.status, b.total_amount, b.currency, b.created_at, u.first_name, u.last_name, f.flight_number, a1.code as origin, a2.code as destination FROM bookings b JOIN users u ON b.user_id=u.id JOIN flights f ON b.flight_id=f.id JOIN airports a1 ON f.origin_airport_id=a1.id JOIN airports a2 ON f.destination_airport_id=a2.id ORDER BY b.created_at DESC LIMIT 10`)
    ]);
    res.json({ bookings: bookings.rows[0], revenue: revenue.rows[0], flights: flights.rows[0], users: users.rows[0], recentBookings: recentBookings.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id,first_name,last_name,email,phone,role,is_active,created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserStatus = async (req, res) => {
  const { is_active } = req.body;
  try {
    const result = await pool.query('UPDATE users SET is_active=$1,updated_at=NOW() WHERE id=$2 RETURNING id,first_name,last_name,email,role,is_active', [is_active, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  try {
    const result = await pool.query('UPDATE users SET role=$1,updated_at=NOW() WHERE id=$2 RETURNING id,first_name,last_name,email,role', [role, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getManifest = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.booking_reference, b.cabin_class, b.status as booking_status
      FROM passengers p JOIN bookings b ON p.booking_id=b.id
      WHERE b.flight_id=$1 AND b.status != 'cancelled' ORDER BY p.seat_number`, [req.params.flight_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboard, getAllUsers, updateUserStatus, updateUserRole, getManifest };
