const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const register = async (req, res) => {
  const { first_name, last_name, email, password, phone, passport_number, nationality, date_of_birth } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (first_name,last_name,email,password,phone,passport_number,nationality,date_of_birth) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,first_name,last_name,email,role',
      [first_name, last_name, email, hashed, phone, passport_number, nationality, date_of_birth]
    );
    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token: generateToken(user), user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query('SELECT id,first_name,last_name,email,phone,passport_number,nationality,date_of_birth,role,created_at FROM users WHERE id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { first_name, last_name, phone, passport_number, nationality, date_of_birth } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET first_name=$1,last_name=$2,phone=$3,passport_number=$4,nationality=$5,date_of_birth=$6,updated_at=NOW() WHERE id=$7 RETURNING id,first_name,last_name,email,phone,passport_number,nationality,date_of_birth,role',
      [first_name, last_name, phone, passport_number, nationality, date_of_birth, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getProfile, updateProfile };
