const request = require('supertest');
process.env.PORT = 5001;
const app = require('../server');
const pool = require('../config/db');

let authToken = '';
let adminToken = '';
let userId = '';

describe('=== PHASE 4: SOFTWARE TEST PLAN ===', () => {

  // ==========================================
  // MODULE 1: AUTHENTICATION TESTS
  // ==========================================
  describe('MODULE 1: Authentication', () => {

    test('TC-001: Register new passenger with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Test',
          last_name: 'Passenger',
          email: `test_${Date.now()}@test.com`,
          password: 'Test@1234',
          phone: '+250788000099',
          passport_number: 'RW999999',
          nationality: 'Rwandan',
          date_of_birth: '1995-01-01'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('passenger');
      authToken = res.body.token;
      userId = res.body.user.id;
      console.log('TC-001 PASSED: User registered successfully');
    });

    test('TC-002: Register with duplicate email should fail', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          password: 'Pass@2024'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already registered');
      console.log('TC-002 PASSED: Duplicate email rejected');
    });

    test('TC-003: Login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'Pass@2024' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('john@example.com');
      authToken = res.body.token;
      console.log('TC-003 PASSED: Login successful');
    });

    test('TC-004: Login with wrong password should fail', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPassword' });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
      console.log('TC-004 PASSED: Wrong password rejected');
    });

    test('TC-005: Admin login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@rwandair.com', password: 'Admin@2024' });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
      console.log('TC-005 PASSED: Admin login successful');
    });

    test('TC-006: Access protected route without token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
      console.log('TC-006 PASSED: Unauthorized access blocked');
    });

    test('TC-007: Access admin route with passenger token', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(403);
      console.log('TC-007 PASSED: Role-based access control working');
    });

    test('TC-008: Get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email');
      console.log('TC-008 PASSED: Profile retrieved successfully');
    });
  });

  // ==========================================
  // MODULE 2: FLIGHT TESTS
  // ==========================================
  describe('MODULE 2: Flight Management', () => {

    test('TC-009: Get all airports', async () => {
      const res = await request(app).get('/api/flights/airports');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('code');
      console.log('TC-009 PASSED: Airports retrieved -', res.body.length, 'airports');
    });

    test('TC-010: Get all flights', async () => {
      const res = await request(app).get('/api/flights');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      console.log('TC-010 PASSED: Flights retrieved -', res.body.length, 'flights');
    });

    test('TC-011: Search flights with valid route', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'NBO', departure_date: date, cabin_class: 'economy', passengers: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('outbound');
      console.log('TC-011 PASSED: Flight search returned', res.body.outbound.length, 'flights');
    });

    test('TC-012: Search flights with invalid route returns empty', async () => {
      const res = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'XYZ', departure_date: '2026-12-01', cabin_class: 'economy', passengers: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body.outbound.length).toBe(0);
      console.log('TC-012 PASSED: Invalid route returns empty results');
    });

    test('TC-013: Admin can create a new flight', async () => {
      const airports = await request(app).get('/api/flights/airports');
      const aircraft = await request(app).get('/api/flights/aircraft');
      const kgl = airports.body.find(a => a.code === 'KGL');
      const nbo = airports.body.find(a => a.code === 'NBO');
      const ac = aircraft.body[0];

      const flightNum = 'WBT' + Date.now().toString().slice(-7);
      const res = await request(app)
        .post('/api/flights')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          flight_number: flightNum,
          origin_airport_id: kgl.id,
          destination_airport_id: nbo.id,
          aircraft_id: ac.id,
          departure_time: new Date(Date.now() + 10 * 86400000).toISOString(),
          arrival_time: new Date(Date.now() + 10 * 86400000 + 2 * 3600000).toISOString(),
          economy_price: 250,
          business_price: 650,
          first_class_price: 0,
          available_economy_seats: 138,
          available_business_seats: 24,
          available_first_class_seats: 0
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('flight_number');
      console.log('TC-013 PASSED: Flight created by admin -', res.body.flight_number);
    });

    test('TC-014: Passenger cannot create a flight', async () => {
      const res = await request(app)
        .post('/api/flights')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ flight_number: 'WB999' });
      expect(res.statusCode).toBe(403);
      console.log('TC-014 PASSED: Passenger blocked from creating flights');
    });
  });

  // ==========================================
  // MODULE 3: BOOKING TESTS
  // ==========================================
  describe('MODULE 3: Booking Management', () => {
    let bookingId = '';
    let bookingRef = '';

    test('TC-015: Create a valid booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().split('T')[0];

      const flightRes = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'NBO', departure_date: date, cabin_class: 'economy', passengers: 1 });

      const flight = flightRes.body.outbound[0];
      expect(flight).toBeDefined();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          flight_id: flight.id,
          trip_type: 'one-way',
          cabin_class: 'economy',
          currency: 'USD',
          passengers: [{
            first_name: 'John',
            last_name: 'Doe',
            date_of_birth: '1990-01-01',
            passport_number: 'RW123456',
            nationality: 'Rwandan',
            meal_preference: 'standard'
          }]
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.booking).toHaveProperty('booking_reference');
      expect(res.body.booking.status).toBe('pending');
      bookingId = res.body.booking.id;
      bookingRef = res.body.booking.booking_reference;
      console.log('TC-015 PASSED: Booking created -', bookingRef);
    });

    test('TC-016: Get user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      console.log('TC-016 PASSED: User bookings retrieved -', res.body.length, 'bookings');
    });

    test('TC-017: Get booking by ID', async () => {
      // Get a fresh booking that has not been cancelled
      const allBookings = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${authToken}`);
      const activeBooking = allBookings.body.find(b => b.status !== 'cancelled');
      if (!activeBooking) { console.log('TC-017 SKIPPED: No active booking'); return; }
      const res = await request(app)
        .get(`/api/bookings/${activeBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('booking_reference');
      console.log('TC-017 PASSED: Booking details retrieved -', res.body.booking_reference);
    });

    test('TC-018: Admin can view all bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      console.log('TC-018 PASSED: Admin retrieved all bookings -', res.body.length, 'total');
    });

    test('TC-019: Cancel a booking', async () => {
      if (!bookingId) return;
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Booking cancelled successfully');
      console.log('TC-019 PASSED: Booking cancelled successfully');
    });

    test('TC-020: Cancel already cancelled booking should fail', async () => {
      if (!bookingId) return;
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(400);
      console.log('TC-020 PASSED: Double cancellation prevented');
    });
  });

  // ==========================================
  // MODULE 4: PAYMENT TESTS
  // ==========================================
  describe('MODULE 4: Payment Processing', () => {
    let payBookingId = '';

    beforeAll(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const date = tomorrow.toISOString().split('T')[0];

      const flightRes = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'NBO', departure_date: date, cabin_class: 'economy', passengers: 1 });

      if (flightRes.body.outbound.length > 0) {
        const flight = flightRes.body.outbound[0];
        const bookRes = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            flight_id: flight.id,
            trip_type: 'one-way',
            cabin_class: 'economy',
            currency: 'USD',
            passengers: [{
              first_name: 'John', last_name: 'Doe',
              date_of_birth: '1990-01-01',
              passport_number: 'RW123456',
              nationality: 'Rwandan'
            }]
          });
        if (bookRes.body.booking) payBookingId = bookRes.body.booking.id;
      }
    });

    test('TC-021: Create MTN MoMo payment intent', async () => {
      if (!payBookingId) return;
      const res = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ booking_id: payBookingId, currency: 'RWF', payment_method: 'mtn_momo' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('payment');
      console.log('TC-021 PASSED: MTN MoMo payment intent created');
    });

    test('TC-022: Confirm MTN MoMo payment', async () => {
      if (!payBookingId) return;
      const res = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ booking_id: payBookingId, payment_method: 'mtn_momo' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Payment confirmed');
      console.log('TC-022 PASSED: Payment confirmed successfully');
    });

    test('TC-023: Pay already paid booking should fail', async () => {
      if (!payBookingId) return;
      const res = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ booking_id: payBookingId, currency: 'USD', payment_method: 'mtn_momo' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Already paid');
      console.log('TC-023 PASSED: Double payment prevented');
    });

    test('TC-024: Admin can view revenue report', async () => {
      const res = await request(app)
        .get('/api/payments/revenue')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total_bookings');
      console.log('TC-024 PASSED: Revenue report retrieved');
    });
  });

  // ==========================================
  // MODULE 5: TICKET TESTS
  // ==========================================
  describe('MODULE 5: Ticket & Check-In', () => {
    let ticketBookingId = '';
    let ticketNumber = '';

    beforeAll(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const date = tomorrow.toISOString().split('T')[0];

      const flightRes = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'NBO', departure_date: date, cabin_class: 'economy', passengers: 1 });

      if (flightRes.body.outbound.length > 0) {
        const flight = flightRes.body.outbound[0];
        const bookRes = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            flight_id: flight.id,
            trip_type: 'one-way',
            cabin_class: 'economy',
            currency: 'USD',
            passengers: [{ first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', passport_number: 'RW123456', nationality: 'Rwandan' }]
          });

        if (bookRes.body.booking) {
          ticketBookingId = bookRes.body.booking.id;
          await request(app)
            .post('/api/payments/intent')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ booking_id: ticketBookingId, currency: 'USD', payment_method: 'mtn_momo' });
          await request(app)
            .post('/api/payments/confirm')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ booking_id: ticketBookingId, payment_method: 'mtn_momo' });
        }
      }
    });

    test('TC-025: Generate ticket after payment', async () => {
      if (!ticketBookingId) return;
      const res = await request(app)
        .post(`/api/tickets/generate/${ticketBookingId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.tickets.length).toBeGreaterThan(0);
      expect(res.body.tickets[0]).toHaveProperty('ticket_number');
      ticketNumber = res.body.tickets[0].ticket_number;
      console.log('TC-025 PASSED: Ticket generated -', ticketNumber);
    });

    test('TC-026: Get tickets for booking', async () => {
      if (!ticketBookingId) return;
      const res = await request(app)
        .get(`/api/tickets/booking/${ticketBookingId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('tickets');
      expect(res.body).toHaveProperty('booking');
      console.log('TC-026 PASSED: Tickets retrieved for booking');
    });

    test('TC-027: Validate a valid ticket', async () => {
      if (!ticketNumber) return;
      const res = await request(app)
        .get(`/api/tickets/validate/${ticketNumber}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.valid).toBe(true);
      console.log('TC-027 PASSED: Ticket validated successfully');
    });

    test('TC-028: Validate invalid ticket number', async () => {
      const res = await request(app)
        .get('/api/tickets/validate/WB0000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.valid).toBe(false);
      console.log('TC-028 PASSED: Invalid ticket rejected');
    });

    test('TC-029: Get available seats for a flight', async () => {
      const flightRes = await request(app).get('/api/flights');
      const flightId = flightRes.body[0].id;
      const res = await request(app)
        .get(`/api/tickets/seats/${flightId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('seatMap');
      console.log('TC-029 PASSED: Seat map retrieved');
    });

    test('TC-030: Generate ticket for unpaid booking should fail', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const date = tomorrow.toISOString().split('T')[0];

      const flightRes = await request(app)
        .get('/api/flights/search')
        .query({ origin: 'KGL', destination: 'NBO', departure_date: date, cabin_class: 'economy', passengers: 1 });

      if (flightRes.body.outbound.length > 0) {
        const bookRes = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            flight_id: flightRes.body.outbound[0].id,
            trip_type: 'one-way', cabin_class: 'economy', currency: 'USD',
            passengers: [{ first_name: 'Test', last_name: 'User', date_of_birth: '1990-01-01', passport_number: 'RW111111', nationality: 'Rwandan' }]
          });

        const res = await request(app)
          .post(`/api/tickets/generate/${bookRes.body.booking.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Payment not completed');
        console.log('TC-030 PASSED: Unpaid ticket generation blocked');
      }
    });
  });

  // ==========================================
  // MODULE 6: ADMIN TESTS
  // ==========================================
  describe('MODULE 6: Admin Dashboard', () => {

    test('TC-031: Admin can access dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bookings');
      expect(res.body).toHaveProperty('revenue');
      expect(res.body).toHaveProperty('flights');
      expect(res.body).toHaveProperty('users');
      console.log('TC-031 PASSED: Dashboard stats retrieved');
    });

    test('TC-032: Admin can get all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      console.log('TC-032 PASSED: Users retrieved -', res.body.length, 'users');
    });

    test('TC-033: Admin can update flight status', async () => {
      const flightRes = await request(app).get('/api/flights');
      const flightId = flightRes.body[0].id;
      const res = await request(app)
        .patch(`/api/flights/${flightId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delayed' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('delayed');
      await request(app).patch(`/api/flights/${flightId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'scheduled' });
      console.log('TC-033 PASSED: Flight status updated');
    });

    test('TC-034: Health check endpoint', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('RwandAir API running');
      console.log('TC-034 PASSED: API health check passed');
    });
  });

  afterAll(async () => {
    await pool.end();
  });
});
