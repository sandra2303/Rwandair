const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        passport_number VARCHAR(50),
        nationality VARCHAR(100),
        date_of_birth DATE,
        role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger','admin','agent')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS airports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        timezone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS aircraft (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model VARCHAR(100) NOT NULL,
        registration VARCHAR(20) UNIQUE NOT NULL,
        total_seats INTEGER NOT NULL,
        economy_seats INTEGER NOT NULL,
        business_seats INTEGER NOT NULL,
        first_class_seats INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS flights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flight_number VARCHAR(10) UNIQUE NOT NULL,
        origin_airport_id UUID REFERENCES airports(id),
        destination_airport_id UUID REFERENCES airports(id),
        aircraft_id UUID REFERENCES aircraft(id),
        departure_time TIMESTAMP NOT NULL,
        arrival_time TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled','delayed')),
        economy_price DECIMAL(10,2) NOT NULL,
        business_price DECIMAL(10,2) NOT NULL,
        first_class_price DECIMAL(10,2) DEFAULT 0,
        available_economy_seats INTEGER NOT NULL,
        available_business_seats INTEGER NOT NULL,
        available_first_class_seats INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_reference VARCHAR(10) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id),
        flight_id UUID REFERENCES flights(id),
        return_flight_id UUID REFERENCES flights(id),
        trip_type VARCHAR(10) DEFAULT 'one-way',
        cabin_class VARCHAR(15) DEFAULT 'economy',
        total_passengers INTEGER NOT NULL DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
        payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
        checked_in BOOLEAN DEFAULT false,
        check_in_time TIMESTAMP,
        booked_by_agent UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        passport_number VARCHAR(50) NOT NULL,
        nationality VARCHAR(100) NOT NULL,
        seat_number VARCHAR(5),
        meal_preference VARCHAR(20) DEFAULT 'standard',
        is_primary BOOLEAN DEFAULT false,
        checked_in BOOLEAN DEFAULT false,
        baggage_kg INTEGER DEFAULT 23,
        extra_baggage_kg INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        payment_method VARCHAR(30) NOT NULL,
        payment_gateway VARCHAR(20) DEFAULT 'stripe',
        transaction_id VARCHAR(255),
        stripe_payment_intent_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flight_id UUID REFERENCES flights(id),
        seat_number VARCHAR(5) NOT NULL,
        cabin_class VARCHAR(15) NOT NULL,
        is_available BOOLEAN DEFAULT true,
        booking_id UUID REFERENCES bookings(id),
        UNIQUE(flight_id, seat_number)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        passenger_id UUID REFERENCES passengers(id),
        ticket_number VARCHAR(20) UNIQUE NOT NULL,
        qr_code TEXT,
        issued_at TIMESTAMP DEFAULT NOW(),
        is_valid BOOLEAN DEFAULT true
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        passenger_id UUID REFERENCES passengers(id),
        seat_number VARCHAR(5),
        checked_in_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
