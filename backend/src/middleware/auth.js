const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, role, is_active, first_name, last_name FROM users WHERE id=$1', [decoded.id]);
    if (!result.rows[0] || !result.rows[0].is_active) return res.status(401).json({ message: 'User not found or inactive' });
    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { authenticate, authorize };
