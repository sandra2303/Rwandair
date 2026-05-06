const pool = require('../config/db');

const searchFlights = async (req, res) => {
  const { origin, destination, departure_date, return_date, cabin_class, passengers } = req.query;
  const cabin = ['economy', 'business', 'first'].includes(cabin_class) ? cabin_class : 'economy';
  const seatCol = cabin === 'first' ? 'available_first_class_seats' : cabin === 'business' ? 'available_business_seats' : 'available_economy_seats';
  try {
    const q = `
      SELECT f.*,
        a1.code as origin_code, a1.city as origin_city, a1.name as origin_name, a1.country as origin_country,
        a2.code as dest_code, a2.city as dest_city, a2.name as dest_name, a2.country as dest_country,
        ac.model as aircraft_model, ac.registration
      FROM flights f
      JOIN airports a1 ON f.origin_airport_id = a1.id
      JOIN airports a2 ON f.destination_airport_id = a2.id
      JOIN aircraft ac ON f.aircraft_id = ac.id
      WHERE a1.code=$1 AND a2.code=$2 AND DATE(f.departure_time)=$3
        AND f.status='scheduled' AND f.${seatCol}>=$4
      ORDER BY f.departure_time ASC`;

    const outbound = await pool.query(q, [origin, destination, departure_date, parseInt(passengers) || 1]);
    let returnFlights = [];
    if (return_date) {
      const ret = await pool.query(q, [destination, origin, return_date, parseInt(passengers) || 1]);
      returnFlights = ret.rows;
    }
    res.json({ outbound: outbound.rows, return: returnFlights });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllFlights = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, a1.code as origin_code, a1.city as origin_city,
        a2.code as dest_code, a2.city as dest_city, ac.model as aircraft_model
      FROM flights f
      JOIN airports a1 ON f.origin_airport_id = a1.id
      JOIN airports a2 ON f.destination_airport_id = a2.id
      JOIN aircraft ac ON f.aircraft_id = ac.id
      ORDER BY f.departure_time ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFlightById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, a1.code as origin_code, a1.city as origin_city, a1.name as origin_name, a1.country as origin_country,
        a2.code as dest_code, a2.city as dest_city, a2.name as dest_name, a2.country as dest_country,
        ac.model as aircraft_model, ac.registration, ac.total_seats, ac.economy_seats, ac.business_seats, ac.first_class_seats
      FROM flights f
      JOIN airports a1 ON f.origin_airport_id = a1.id
      JOIN airports a2 ON f.destination_airport_id = a2.id
      JOIN aircraft ac ON f.aircraft_id = ac.id
      WHERE f.id=$1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Flight not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createFlight = async (req, res) => {
  const { flight_number, origin_airport_id, destination_airport_id, aircraft_id, departure_time, arrival_time,
    economy_price, business_price, first_class_price, available_economy_seats, available_business_seats, available_first_class_seats } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO flights (flight_number,origin_airport_id,destination_airport_id,aircraft_id,departure_time,arrival_time,
        economy_price,business_price,first_class_price,available_economy_seats,available_business_seats,available_first_class_seats)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [flight_number, origin_airport_id, destination_airport_id, aircraft_id, departure_time, arrival_time,
        economy_price, business_price, first_class_price || 0, available_economy_seats, available_business_seats, available_first_class_seats || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateFlightStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE flights SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAirports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM airports ORDER BY country, city');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAircraft = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aircraft ORDER BY model');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { searchFlights, getAllFlights, getFlightById, createFlight, updateFlightStatus, getAirports, getAircraft };
