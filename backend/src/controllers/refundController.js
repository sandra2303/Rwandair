const pool = require('../config/db');
const { sendEmail, refundConfirmationEmail } = require('../utils/emailService');

const requestRefund = async (req, res) => {
  const { booking_id, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(`
      SELECT b.*, u.email, u.first_name, u.last_name
      FROM bookings b JOIN users u ON b.user_id=u.id
      WHERE b.id=$1`, [booking_id]);
    const booking = bookingRes.rows[0];
    if (!booking) throw new Error('Booking not found');
    if (booking.user_id !== req.user.id && req.user.role === 'passenger') throw new Error('Access denied');
    if (booking.payment_status !== 'paid') throw new Error('No payment found for this booking');
    if (booking.status !== 'cancelled') throw new Error('Booking must be cancelled before requesting refund');

    // Check if refund already exists
    const existingRefund = await client.query('SELECT id FROM refunds WHERE booking_id=$1', [booking_id]);
    if (existingRefund.rows.length) throw new Error('Refund already requested for this booking');

    const paymentRes = await client.query('SELECT * FROM payments WHERE booking_id=$1 AND status=$2 ORDER BY created_at DESC LIMIT 1', [booking_id, 'completed']);
    if (!paymentRes.rows[0]) throw new Error('No completed payment found');
    const payment = paymentRes.rows[0];

    // Calculate refund amount (80% refund policy)
    const refundAmount = (parseFloat(booking.total_amount) * 0.8).toFixed(2);

    const refundRes = await client.query(
      'INSERT INTO refunds (booking_id, payment_id, amount, currency, reason, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [booking_id, payment.id, refundAmount, booking.currency, reason || 'Booking cancelled', 'pending']
    );

    await client.query('UPDATE bookings SET payment_status=$1, updated_at=NOW() WHERE id=$2', ['refunded', booking_id]);
    await client.query('COMMIT');

    // Send refund confirmation email
    await sendEmail(booking.email, 'RwandAir - Refund Request Received',
      refundConfirmationEmail({ first_name: booking.first_name }, booking, refundAmount));

    res.json({ refund: refundRes.rows[0], message: `Refund of ${booking.currency} ${refundAmount} has been initiated` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getMyRefunds = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, b.booking_reference, b.currency, b.total_amount
      FROM refunds r JOIN bookings b ON r.booking_id=b.id
      WHERE b.user_id=$1 ORDER BY r.created_at DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllRefunds = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, b.booking_reference, b.currency, b.total_amount,
        u.first_name, u.last_name, u.email
      FROM refunds r
      JOIN bookings b ON r.booking_id=b.id
      JOIN users u ON b.user_id=u.id
      ORDER BY r.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const processRefund = async (req, res) => {
  const { refund_id, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE refunds SET status=$1, processed_at=NOW() WHERE id=$2 RETURNING *',
      [status, refund_id]
    );
    res.json({ refund: result.rows[0], message: `Refund ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requestRefund, getMyRefunds, getAllRefunds, processRefund };
