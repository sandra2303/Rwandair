const pool = require('./db');

const addFlights = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const airports = await client.query('SELECT id, code FROM airports');
    const aircraft = await client.query('SELECT id FROM aircraft ORDER BY created_at');
    const ap = {};
    airports.rows.forEach(a => ap[a.code] = a.id);
    const ac1 = aircraft.rows[0].id;
    const ac2 = aircraft.rows[1].id;
    const ac3 = aircraft.rows[2].id;

    const routes = [
      { prefix: 'WB1', o: 'KGL', d: 'NBO', hours: 2, ep: 250, bp: 650, es: 138, bs: 24, ac: ac1 },
      { prefix: 'WB2', o: 'NBO', d: 'KGL', hours: 2, ep: 250, bp: 650, es: 138, bs: 24, ac: ac1 },
      { prefix: 'WB3', o: 'KGL', d: 'JNB', hours: 4, ep: 450, bp: 1200, es: 204, bs: 36, ac: ac3 },
      { prefix: 'WB4', o: 'KGL', d: 'LHR', hours: 9, ep: 850, bp: 2200, es: 204, bs: 36, ac: ac3 },
      { prefix: 'WB5', o: 'KGL', d: 'DXB', hours: 3, ep: 350, bp: 900, es: 138, bs: 24, ac: ac1 },
      { prefix: 'WB6', o: 'KGL', d: 'EBB', hours: 1, ep: 150, bp: 400, es: 138, bs: 24, ac: ac2 },
      { prefix: 'WB7', o: 'KGL', d: 'ADD', hours: 2, ep: 200, bp: 550, es: 138, bs: 24, ac: ac1 },
      { prefix: 'WB8', o: 'KGL', d: 'BRU', hours: 9, ep: 900, bp: 2400, es: 204, bs: 36, ac: ac3 },
      { prefix: 'WB9', o: 'KGL', d: 'CDG', hours: 9, ep: 880, bp: 2300, es: 204, bs: 36, ac: ac3 },
      { prefix: 'WB10', o: 'KGL', d: 'DAR', hours: 2, ep: 180, bp: 500, es: 138, bs: 24, ac: ac1 },
    ];

    let count = 0;
    for (let day = 1; day <= 60; day++) {
      for (const r of routes) {
        const flightNum = r.prefix + 'D' + day;
        const dep = new Date();
        dep.setDate(dep.getDate() + day);
        dep.setHours(8 + (count % 10), 0, 0, 0);
        const arr = new Date(dep);
        arr.setHours(arr.getHours() + r.hours);

        await client.query(
          `INSERT INTO flights (flight_number,origin_airport_id,destination_airport_id,aircraft_id,departure_time,arrival_time,
            economy_price,business_price,first_class_price,available_economy_seats,available_business_seats,available_first_class_seats)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,0) ON CONFLICT (flight_number) DO NOTHING`,
          [flightNum, ap[r.o], ap[r.d], r.ac, dep.toISOString(), arr.toISOString(), r.ep, r.bp, r.es, r.bs]
        );
        count++;
      }
    }

    await client.query('COMMIT');
    console.log('Added flights for next 60 days on all routes');
    console.log('Routes available:');
    routes.forEach(r => console.log(' -', r.o, '->', r.d, '| Economy $' + r.ep, '| Business $' + r.bp));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

addFlights();
