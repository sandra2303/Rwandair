const pool = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail, paymentConfirmationEmail } = require('../utils/emailService');

const createPaymentIntent = async (req, res) => {
  const { booking_id, currency, payment_method } = req.body;
  try {
    const bookingRes = await pool.query('SELECT * FROM bookings WHERE id=$1', [booking_id]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.payment_status === 'paid') return res.status(400).json({ message: 'Already paid' });

    const curr = (currency || booking.currency || 'USD').toLowerCase();

    if (payment_method === 'mtn_momo') {
      const payment = await pool.query(
        'INSERT INTO payments (booking_id,amount,currency,payment_method,payment_gateway,transaction_id,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [booking_id, booking.total_amount, curr.toUpperCase(), 'mtn_momo', 'mtn', `MTN-${Date.now()}`, 'pending']
      );
      return res.json({ payment: payment.rows[0], type: 'mtn_momo' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(booking.total_amount) * 100),
      currency: curr,
      metadata: { booking_id, booking_reference: booking.booking_reference },
    });

    const payment = await pool.query(
      'INSERT INTO payments (booking_id,amount,currency,payment_method,payment_gateway,stripe_payment_intent_id,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [booking_id, booking.total_amount, curr.toUpperCase(), payment_method || 'card', 'stripe', intent.id, 'pending']
    );
    res.json({ clientSecret: intent.client_secret, payment: payment.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Payment error', error: err.message });
  }
};

const confirmPayment = async (req, res) => {
  const { booking_id, payment_intent_id, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (payment_method === 'mtn_momo') {
      await client.query('UPDATE payments SET status=$1,paid_at=NOW() WHERE booking_id=$2 AND payment_method=$3', ['completed', booking_id, 'mtn_momo']);
    } else {
      await client.query('UPDATE payments SET status=$1,paid_at=NOW() WHERE stripe_payment_intent_id=$2', ['completed', payment_intent_id]);
    }
    await client.query('UPDATE bookings SET payment_status=$1,status=$2,updated_at=NOW() WHERE id=$3', ['paid', 'confirmed', booking_id]);

    // Send payment confirmation email
    try {
      const bookingRes = await client.query('SELECT b.*, u.email, u.first_name FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.id=$1', [booking_id]);
      if (bookingRes.rows[0]) {
        await sendEmail(bookingRes.rows[0].email, 'RwandAir - Payment Confirmed', paymentConfirmationEmail(bookingRes.rows[0]));
      }
    } catch(e) { console.error('Email error:', e.message); }

    await client.query('COMMIT');
    res.json({ message: 'Payment confirmed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getRevenue = async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT COUNT(DISTINCT b.id) as total_bookings, COALESCE(SUM(p.amount),0) as total_revenue,
        COALESCE(SUM(p.amount) FILTER (WHERE p.currency='USD'),0) as usd,
        COALESCE(SUM(p.amount) FILTER (WHERE p.currency='EUR'),0) as eur,
        COALESCE(SUM(p.amount) FILTER (WHERE p.currency='RWF'),0) as rwf
      FROM payments p JOIN bookings b ON p.booking_id=b.id WHERE p.status='completed'`);
    res.json(summary.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPaymentIntent, confirmPayment, getRevenue };
