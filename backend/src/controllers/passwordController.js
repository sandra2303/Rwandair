const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail, passwordResetEmail } = require('../utils/emailService');

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
    if (!userRes.rows[0]) return res.status(404).json({ message: 'No account found with this email' });
    const user = userRes.rows[0];

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Invalidate old tokens
    await pool.query('UPDATE password_resets SET used=true WHERE user_id=$1', [user.id]);

    // Save new token
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, token, expiresAt]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail(user.email, 'RwandAir - Password Reset Request', passwordResetEmail(user, resetLink));

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const resetRes = await pool.query(
      'SELECT * FROM password_resets WHERE token=$1 AND used=false AND expires_at > NOW()',
      [token]
    );
    if (!resetRes.rows[0]) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, resetRes.rows[0].user_id]);
    await pool.query('UPDATE password_resets SET used=true WHERE token=$1', [token]);

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = userRes.rows[0];
    if (!(await bcrypt.compare(current_password, user.password)))
      return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { forgotPassword, resetPassword, changePassword };
