const pool = require('./db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Airports
    await client.query(`
      INSERT INTO airports (code, name, city, country, timezone) VALUES
      ('KGL','Kigali International Airport','Kigali','Rwanda','Africa/Kigali'),
      ('NBO','Jomo Kenyatta International Airport','Nairobi','Kenya','Africa/Nairobi'),
      ('ADD','Addis Ababa Bole International Airport','Addis Ababa','Ethiopia','Africa/Addis_Ababa'),
      ('JNB','O.R. Tambo International Airport','Johannesburg','South Africa','Africa/Johannesburg'),
      ('LHR','Heathrow Airport','London','United Kingdom','Europe/London'),
      ('CDG','Charles de Gaulle Airport','Paris','France','Europe/Paris'),
      ('DXB','Dubai International Airport','Dubai','UAE','Asia/Dubai'),
      ('BRU','Brussels Airport','Brussels','Belgium','Europe/Brussels'),
      ('DAR','Julius Nyerere International Airport','Dar es Salaam','Tanzania','Africa/Dar_es_Salaam'),
      ('EBB','Entebbe International Airport','Entebbe','Uganda','Africa/Kampala')
      ON CONFLICT (code) DO NOTHING;
    `);

    // Aircraft
    await client.query(`
      INSERT INTO aircraft (model, registration, total_seats, economy_seats, business_seats, first_class_seats) VALUES
      ('Boeing 737-800','9XR-WA',162,138,24,0),
      ('Boeing 737 MAX 8','9XR-WB',178,150,28,0),
      ('Airbus A330-200','9XR-WC',252,204,36,12),
      ('Boeing 737-700','9XR-WD',128,108,20,0)
      ON CONFLICT (registration) DO NOTHING;
    `);

    // Users
    const adminPass = await bcrypt.hash('Admin@2024', 10);
    const agentPass = await bcrypt.hash('Agent@2024', 10);
    const passPass = await bcrypt.hash('Pass@2024', 10);

    await client.query(`
      INSERT INTO users (first_name, last_name, email, password, role, phone) VALUES
      ('Admin','RwandAir','admin@rwandair.com',$1,'admin','+250788000001'),
      ('Travel','Agent','agent@rwandair.com',$2,'agent','+250788000002'),
      ('John','Doe','john@example.com',$3,'passenger','+250788000003')
      ON CONFLICT (email) DO NOTHING;
    `, [adminPass, agentPass, passPass]);

    // Flights
    const airports = await client.query('SELECT id, code FROM airports');
    const aircraft = await client.query('SELECT id FROM aircraft ORDER BY created_at');
    const ap = {};
    airports.rows.forEach(a => ap[a.code] = a.id);
    const ac1 = aircraft.rows[0].id;
    const ac3 = aircraft.rows[2].id;

    await client.query(`
      INSERT INTO flights (flight_number, origin_airport_id, destination_airport_id, aircraft_id, departure_time, arrival_time, economy_price, business_price, first_class_price, available_economy_seats, available_business_seats, available_first_class_seats)
      VALUES
      ('WB101',$1,$2,$3, NOW()+INTERVAL '2 days', NOW()+INTERVAL '2 days 2 hours', 250.00, 650.00, 0, 138, 24, 0),
      ('WB102',$2,$1,$3, NOW()+INTERVAL '3 days', NOW()+INTERVAL '3 days 2 hours', 250.00, 650.00, 0, 138, 24, 0),
      ('WB201',$1,$4,$5, NOW()+INTERVAL '4 days', NOW()+INTERVAL '4 days 4 hours', 450.00, 1200.00, 2500.00, 204, 36, 12),
      ('WB301',$1,$6,$5, NOW()+INTERVAL '5 days', NOW()+INTERVAL '5 days 9 hours', 850.00, 2200.00, 4500.00, 204, 36, 12),
      ('WB401',$1,$7,$3, NOW()+INTERVAL '6 days', NOW()+INTERVAL '6 days 3 hours', 350.00, 900.00, 0, 138, 24, 0),
      ('WB501',$1,$8,$3, NOW()+INTERVAL '7 days', NOW()+INTERVAL '7 days 1 hour', 150.00, 400.00, 0, 138, 24, 0)
      ON CONFLICT (flight_number) DO NOTHING;
    `, [ap['KGL'], ap['NBO'], ac1, ap['JNB'], ac3, ap['LHR'], ap['DXB'], ap['EBB']]);

    await client.query('COMMIT');
    console.log('Seed completed');
    console.log('Admin: admin@rwandair.com / Admin@2024');
    console.log('Agent: agent@rwandair.com / Agent@2024');
    console.log('Passenger: john@example.com / Pass@2024');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

seed();
