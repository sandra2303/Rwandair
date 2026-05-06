const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'noreply@rwandair.com',
    pass: process.env.EMAIL_PASS || 'your_email_password',
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from: '"RwandAir" <noreply@rwandair.com>', to, subject, html });
    console.log('Email sent to:', to);
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
};

const bookingConfirmationEmail = (booking, passenger, flight) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#003580;color:white;padding:20px;text-align:center;">
      <h1>RwandAir</h1><p>Booking Confirmation</p>
    </div>
    <div style="padding:20px;background:#f9f9f9;">
      <h2>Booking Confirmed!</h2>
      <p>Dear ${passenger.first_name} ${passenger.last_name},</p>
      <p>Your booking has been confirmed. Here are your details:</p>
      <div style="background:white;padding:15px;border-radius:8px;margin:15px 0;">
        <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
        <p><strong>Flight:</strong> ${flight.flight_number}</p>
        <p><strong>From:</strong> ${flight.origin_code} - ${flight.origin_city}</p>
        <p><strong>To:</strong> ${flight.dest_code} - ${flight.dest_city}</p>
        <p><strong>Departure:</strong> ${new Date(flight.departure_time).toLocaleString()}</p>
        <p><strong>Class:</strong> ${booking.cabin_class}</p>
        <p><strong>Seat:</strong> ${passenger.seat_number}</p>
        <p><strong>Amount Paid:</strong> ${booking.currency} ${booking.total_amount}</p>
      </div>
      <p>Please arrive at the airport at least 2 hours before departure.</p>
      <p>Online check-in opens 24 hours before departure.</p>
    </div>
    <div style="background:#003580;color:white;padding:15px;text-align:center;">
      <p>Thank you for flying with RwandAir!</p>
    </div>
  </div>
`;

const paymentConfirmationEmail = (booking) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#003580;color:white;padding:20px;text-align:center;">
      <h1>RwandAir</h1><p>Payment Confirmation</p>
    </div>
    <div style="padding:20px;">
      <h2>Payment Successful!</h2>
      <p>Your payment of <strong>${booking.currency} ${booking.total_amount}</strong> has been received.</p>
      <p>Booking Reference: <strong>${booking.booking_reference}</strong></p>
      <p>Your tickets have been generated. Please check your bookings to download your boarding pass.</p>
    </div>
  </div>
`;

const flightStatusEmail = (user, flight, status, message) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:${status === 'cancelled' ? '#dc3545' : '#ffc107'};color:white;padding:20px;text-align:center;">
      <h1>RwandAir</h1><p>Flight Status Update</p>
    </div>
    <div style="padding:20px;">
      <h2>Flight ${flight.flight_number} - ${status.toUpperCase()}</h2>
      <p>Dear ${user.first_name},</p>
      <p>${message}</p>
      <p><strong>Route:</strong> ${flight.origin_code} to ${flight.dest_code}</p>
      <p><strong>Original Departure:</strong> ${new Date(flight.departure_time).toLocaleString()}</p>
    </div>
  </div>
`;

const passwordResetEmail = (user, resetLink) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#003580;color:white;padding:20px;text-align:center;">
      <h1>RwandAir</h1><p>Password Reset</p>
    </div>
    <div style="padding:20px;">
      <h2>Reset Your Password</h2>
      <p>Dear ${user.first_name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetLink}" style="background:#003580;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a>
      </div>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  </div>
`;

const refundConfirmationEmail = (user, booking, amount) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:#28a745;color:white;padding:20px;text-align:center;">
      <h1>RwandAir</h1><p>Refund Confirmation</p>
    </div>
    <div style="padding:20px;">
      <h2>Refund Processed</h2>
      <p>Dear ${user.first_name},</p>
      <p>Your refund of <strong>${booking.currency} ${amount}</strong> for booking <strong>${booking.booking_reference}</strong> has been processed.</p>
      <p>The refund will appear in your account within 3-5 business days.</p>
    </div>
  </div>
`;

module.exports = { sendEmail, bookingConfirmationEmail, paymentConfirmationEmail, flightStatusEmail, passwordResetEmail, refundConfirmationEmail };
