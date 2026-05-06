const pool = require('./db');

const addTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        payment_id UUID REFERENCES payments(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        reason VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS modification_reason VARCHAR(255);
    `);

    await client.query('COMMIT');
    console.log('All new tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

addTables();
