# ✈️ RwandAir Airline Ticketing Management System

**Course:** Best Programming Practices and Design Patterns (SENG 8240)  
**Instructor:** RUTARINDWA JEAN PIERRE  
**Academic Year:** 2025/2026 | Semester II  
**Topic:** Airline Ticketing Management System  
**Case Study:** RwandAir – Rwanda's National Carrier  

---

## 📋 Table of Contents

- [Phase 1 - System Analysis and Design](#phase-1---system-analysis-and-design)
- [Phase 2 - Software Development Prototype](#phase-2---software-development-prototype)
- [Phase 3 - Docker and Version Control](#phase-3---docker-and-version-control)
- [Phase 4 - Software Test Plan](#phase-4---software-test-plan)
- [How to Run the Project](#how-to-run-the-project)
- [Default Login Credentials](#default-login-credentials)

---

## 📌 PHASE 1 - System Analysis and Design

### Topic and Case Study

- **Topic:** Airline Ticketing Management System
- **Case Study:** RwandAir – Rwanda's National Carrier

RwandAir is Rwanda's national airline headquartered at Kigali International Airport (KGL). It operates scheduled passenger flights to over 30 destinations across Africa, Europe and the Middle East using a modern fleet of Boeing 737 and Airbus A330 aircraft.

The **Airline Ticketing Management System** is a full-stack web-based platform that digitalizes the complete passenger journey — from flight search and booking, to payment, ticket generation, online check-in, and refund management.

---

### Problem Statement

RwandAir faced the following challenges before this system:

1. No centralized online booking platform — passengers had to visit offices
2. Double-booking of seats due to no real-time seat tracking
3. No support for local mobile money payments (MTN MoMo)
4. Manual paper-based ticket issuance — prone to fraud and loss
5. No self-service online check-in — long airport queues
6. Passengers not notified of flight delays or cancellations
7. No structured refund tracking process

---

### System Users and Roles

| Role | Permissions |
|---|---|
| **Passenger** | Register, search flights, book, pay, get ticket, check-in, request refund |
| **Travel Agent** | Book on behalf of passengers, manage bookings, validate tickets |
| **Administrator** | Manage flights, users, revenue reports, process refunds, view dashboard |

---

### UML Diagrams

All diagrams are available in the documentation. Below is a summary:

#### 1. Use Case Diagram
Shows interactions between Passenger, Agent, and Admin with the system including booking, payment, check-in, and admin operations.

#### 2. Class Diagram
Main classes:
- `User` → `Booking` → `Flight` → `Aircraft`
- `Booking` → `Passenger` → `Ticket`
- `Booking` → `Payment`
- `Booking` → `Refund`

#### 3. Activity Diagram
Flow: Login → Search Flights → Select Flight → Enter Passengers → Create Booking → Payment → Confirm → Generate Ticket → Check-In

#### 4. Sequence Diagram
Shows communication between: Passenger → Frontend → Backend API → Database → Stripe/MTN

#### 5. Component Diagram
Components: Frontend (React) → Backend (Express) → Database (PostgreSQL) → External Services (Stripe, MTN MoMo, SMTP)

---

## 💻 PHASE 2 - Software Development Prototype

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, React Router, Axios, React Toastify |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Tokens) + bcryptjs |
| Payments | Stripe API + MTN Mobile Money |
| Email | Nodemailer (SMTP) |
| Ticket | QRCode generator |
| Security | Helmet, Express Rate Limit, CORS |
| Testing | Jest + Supertest |
| Containerization | Docker + Docker Compose |

---

### Project Structure

```
rwandair/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Database connection
│   │   │   ├── migrate.js         # Create all tables
│   │   │   ├── seed.js            # Insert sample data
│   │   │   └── seedFlights.js     # Insert sample flights
│   │   ├── controllers/
│   │   │   ├── authController.js      # Register, Login, Profile
│   │   │   ├── flightController.js    # Search, Create, Update flights
│   │   │   ├── bookingController.js   # Create, Cancel, View bookings
│   │   │   ├── paymentController.js   # Stripe, MTN MoMo payments
│   │   │   ├── ticketController.js    # Generate tickets, Check-in
│   │   │   ├── refundController.js    # Request and process refunds
│   │   │   ├── adminController.js     # Dashboard, Users, Manifest
│   │   │   └── enhancedController.js  # Modify booking, Upgrade seat, Notifications
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT authentication + Role authorization
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── flights.js
│   │   │   ├── bookings.js
│   │   │   ├── payments.js
│   │   │   ├── tickets.js
│   │   │   ├── refunds.js
│   │   │   ├── admin.js
│   │   │   ├── enhanced.js
│   │   │   └── password.js
│   │   ├── tests/
│   │   │   └── rwandair.test.js   # 34 test cases
│   │   ├── utils/
│   │   │   └── emailService.js    # Email templates + Nodemailer
│   │   └── server.js              # App entry point
│   ├── Dockerfile
│   ├── package.json
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Notifications.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js     # Global auth state
│   │   ├── pages/
│   │   │   ├── Home.js            # Landing page + flight search
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Flights.js         # Search results
│   │   │   ├── Booking.js         # Booking form
│   │   │   ├── Payment.js         # Payment page
│   │   │   ├── MyBookings.js      # User bookings list
│   │   │   ├── BookingDetail.js   # Booking details
│   │   │   ├── TicketPage.js      # Boarding pass + QR code
│   │   │   ├── CheckIn.js         # Online check-in
│   │   │   ├── AdminDashboard.js  # Admin panel
│   │   │   ├── AgentPortal.js     # Agent panel
│   │   │   ├── RevenueCharts.js   # Revenue analytics
│   │   │   ├── MyRefunds.js       # Refund tracking
│   │   │   ├── Profile.js         # User profile
│   │   │   ├── ValidateTicket.js  # Ticket validation
│   │   │   └── PasswordPages.js   # Forgot/Reset password
│   │   ├── services/
│   │   │   └── api.js             # All Axios API calls
│   │   ├── App.js                 # Routes definition
│   │   └── index.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .gitignore
├── start.bat
└── stop.bat
```

---

### Software Programming Best Practices Applied

#### 1. Meaningful Names
```js
// Clear function names
const createBooking = async (req, res) => { ... }
const generateTickets = async (req, res) => { ... }
const confirmPayment = async (req, res) => { ... }

// Clear variable names
const available_economy_seats
const booking_reference
const payment_status
```

#### 2. Separation of Concerns (MVC Pattern)
- `routes/` → URL routing only
- `controllers/` → Business logic only
- `middleware/` → Authentication only
- `config/` → Database only
- `utils/` → Reusable utilities only

#### 3. Security Best Practices
- Passwords hashed with `bcryptjs` (10 salt rounds)
- JWT tokens for stateless authentication
- `helmet` for HTTP security headers
- Rate limiting: 200 requests per 15 minutes
- Role-based access control on every protected route
- Database transactions (BEGIN/COMMIT/ROLLBACK) for data integrity

#### 4. Design Pattern — MVC + Observer Pattern

**MVC Pattern:**
| Layer | Implementation |
|---|---|
| Model | PostgreSQL tables in `migrate.js` |
| View | React.js pages and components |
| Controller | Express.js controllers |

**Observer Pattern:**
When a flight is cancelled or delayed, all affected passengers are automatically notified via email. Implemented in `enhancedController.js` → `notifyFlightStatus()`.

---

### Database Schema

| Table | Description |
|---|---|
| `users` | Passengers, agents, admins |
| `airports` | Airport codes, cities, countries |
| `aircraft` | Fleet models and seat configuration |
| `flights` | Scheduled flights with pricing |
| `bookings` | Booking records with status |
| `passengers` | Passenger details per booking |
| `payments` | Payment records (Stripe/MTN) |
| `tickets` | Generated tickets with QR codes |
| `seats` | Seat availability per flight |
| `refunds` | Refund requests and status |
| `checkins` | Check-in records |
| `notifications` | In-app notifications |

---

### API Endpoints

#### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/profile` | Get profile | Authenticated |
| PUT | `/api/auth/profile` | Update profile | Authenticated |

#### Flights
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/flights/search` | Search flights | Public |
| GET | `/api/flights` | Get all flights | Public |
| GET | `/api/flights/airports` | Get all airports | Public |
| POST | `/api/flights` | Create flight | Admin |
| PATCH | `/api/flights/:id/status` | Update flight status | Admin |

#### Bookings
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/bookings` | Create booking | Authenticated |
| GET | `/api/bookings/my` | Get my bookings | Authenticated |
| GET | `/api/bookings/:id` | Get booking details | Authenticated |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking | Authenticated |
| GET | `/api/bookings/all` | Get all bookings | Admin |

#### Payments
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/payments/intent` | Create payment intent | Authenticated |
| POST | `/api/payments/confirm` | Confirm payment | Authenticated |
| GET | `/api/payments/revenue` | Revenue report | Admin |

#### Tickets
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/tickets/generate/:booking_id` | Generate ticket | Authenticated |
| GET | `/api/tickets/booking/:booking_id` | Get tickets | Authenticated |
| GET | `/api/tickets/validate/:ticket_number` | Validate ticket | Admin/Agent |
| POST | `/api/tickets/:booking_id/checkin` | Online check-in | Authenticated |
| GET | `/api/tickets/seats/:flight_id` | Get seat map | Authenticated |

#### Admin
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats | Admin |
| GET | `/api/admin/users` | All users | Admin |
| PATCH | `/api/admin/users/:id/role` | Update user role | Admin |
| GET | `/api/admin/flights/:id/manifest` | Flight manifest | Admin |

---

## 🐳 PHASE 3 - Docker and Version Control

### Part A: Dockerization

The application is fully dockerized using **Docker** and **Docker Compose** with 3 containers:

| Container | Image | Port | Role |
|---|---|---|---|
| `rwandair_db` | postgres:14-alpine | 5432 | PostgreSQL Database |
| `rwandair_backend` | Custom Node.js | 5000 | REST API Server |
| `rwandair_frontend` | Custom Nginx | 3000→80 | React App |

#### How Containers Communicate
```
Browser → localhost:3000 → Frontend (Nginx)
                               ↓
                        Backend API :5000
                               ↓
                        Database :5432
```

All containers share `rwandair_network` (bridge network) and find each other by service name.

#### Key Docker Features Used
- **Multi-stage build** on frontend (Node.js to build → Nginx to serve)
- **Health check** on database before backend starts
- **depends_on** to enforce correct startup order
- **Persistent volume** (`pgdata`) to save database data
- **Environment variables** passed through docker-compose

#### How to Run with Docker

```bash
# Start all containers
docker-compose up --build

# Run in background
docker-compose up --build -d

# Check running containers
docker ps

# View backend logs
docker logs rwandair_backend

# Stop all containers
docker-compose down
```

#### Access the Application
```
Frontend:  http://localhost:3000
API:       http://localhost:5000/api/health
```

---

### Part B: Version Control — Git & GitHub

This project uses **Git** as the Version Control System and **GitHub** as the remote repository.

#### Repository
🔗 **https://github.com/sandra2303/Rwandair**

#### Git Configuration
```bash
git config --global user.name "RwandAir Developer"
git config --global user.email "dev@rwandair.com"
```

#### Commit History
```
main
 ├── Phase 3: Add start.bat, stop.bat and UI improvements
 ├── Phase 2 improvements: Email notifications, password reset, refunds, seat upgrade
 ├── Phase 4: Add software test plan - 34 tests all passing
 └── Initial commit: RwandAir Airline Ticketing Management System
```

#### Git Workflow Used
```bash
# Initialize repository
git init

# Stage changes
git add .

# Commit with meaningful message
git commit -m "descriptive message"

# Push to GitHub
git push origin main
```

#### .gitignore — Files Excluded from Version Control
```
node_modules/    ← dependencies (too large)
.env             ← sensitive credentials
build/           ← compiled output
*.log            ← log files
.DS_Store        ← OS files
```

---

## 🧪 PHASE 4 - Software Test Plan

### Testing Goals

1. Verify all API endpoints return correct HTTP status codes
2. Ensure role-based access control works correctly
3. Validate complete booking lifecycle end to end
4. Confirm data integrity through database transactions
5. Enforce business rules (check-in window, refund policy, seat availability)

### Testing Tools

| Tool | Purpose |
|---|---|
| **Jest** | Test framework — runs all test cases |
| **Supertest** | Makes real HTTP requests to the API |
| **PostgreSQL** | Live test database |

### How to Run Tests

```bash
cd backend
npm test
```

### Test Results Summary

```
Test Suites: 1 passed
Tests:       34 passed
Time:        ~15 seconds
```

---

### Test Cases

#### MODULE 1: Authentication (TC-001 to TC-008)

| TC ID | Description | Expected |
|---|---|---|
| TC-001 | Register new passenger | HTTP 201, token returned |
| TC-002 | Register duplicate email | HTTP 400, error message |
| TC-003 | Login with valid credentials | HTTP 200, token returned |
| TC-004 | Login with wrong password | HTTP 401, invalid credentials |
| TC-005 | Admin login | HTTP 200, role = admin |
| TC-006 | Access protected route without token | HTTP 401 |
| TC-007 | Access admin route with passenger token | HTTP 403 |
| TC-008 | Get profile with valid token | HTTP 200, user data |

#### MODULE 2: Flight Management (TC-009 to TC-014)

| TC ID | Description | Expected |
|---|---|---|
| TC-009 | Get all airports | HTTP 200, array returned |
| TC-010 | Get all flights | HTTP 200, non-empty array |
| TC-011 | Search flights with valid route | HTTP 200, outbound flights |
| TC-012 | Search flights with invalid route | HTTP 200, empty array |
| TC-013 | Admin creates new flight | HTTP 201, flight created |
| TC-014 | Passenger tries to create flight | HTTP 403, access denied |

#### MODULE 3: Booking Management (TC-015 to TC-020)

| TC ID | Description | Expected |
|---|---|---|
| TC-015 | Create valid booking | HTTP 201, booking_reference returned |
| TC-016 | Get user bookings | HTTP 200, array returned |
| TC-017 | Get booking by ID | HTTP 200, booking details |
| TC-018 | Admin views all bookings | HTTP 200, all bookings |
| TC-019 | Cancel a booking | HTTP 200, cancelled successfully |
| TC-020 | Cancel already cancelled booking | HTTP 400, error message |

#### MODULE 4: Payment Processing (TC-021 to TC-024)

| TC ID | Description | Expected |
|---|---|---|
| TC-021 | Create MTN MoMo payment intent | HTTP 200, payment object |
| TC-022 | Confirm MTN MoMo payment | HTTP 200, payment confirmed |
| TC-023 | Pay already paid booking | HTTP 400, already paid |
| TC-024 | Admin views revenue report | HTTP 200, revenue data |

#### MODULE 5: Ticket and Check-In (TC-025 to TC-030)

| TC ID | Description | Expected |
|---|---|---|
| TC-025 | Generate ticket after payment | HTTP 200, ticket with QR code |
| TC-026 | Get tickets for booking | HTTP 200, tickets array |
| TC-027 | Validate valid ticket | HTTP 200, valid = true |
| TC-028 | Validate invalid ticket number | HTTP 404, valid = false |
| TC-029 | Get available seat map | HTTP 200, seatMap returned |
| TC-030 | Generate ticket for unpaid booking | HTTP 400, payment required |

#### MODULE 6: Admin Dashboard (TC-031 to TC-034)

| TC ID | Description | Expected |
|---|---|---|
| TC-031 | Admin accesses dashboard | HTTP 200, stats returned |
| TC-032 | Admin gets all users | HTTP 200, users array |
| TC-033 | Admin updates flight status | HTTP 200, status updated |
| TC-034 | API health check | HTTP 200, API running |

---

## 🚀 How to Run the Project

### Option 1: Using Docker (Recommended)

```bash
# 1. Make sure Docker Desktop is running

# 2. Clone the repository
git clone https://github.com/sandra2303/Rwandair.git
cd Rwandair

# 3. Start all containers
docker-compose up --build

# 4. Open in browser
# http://localhost:3000
```

### Option 2: Manual Setup

```bash
# 1. Install PostgreSQL and create database
createdb rwandair_db

# 2. Setup Backend
cd backend
npm install
# Create .env file with your database credentials
npm run migrate
npm run seed
npm start

# 3. Setup Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@rwandair.com | Admin@2024 |
| **Agent** | agent@rwandair.com | Agent@2024 |
| **Passenger** | john@example.com | Pass@2024 |

---

## 👩‍💻 Developer

**Name:** UWIMBABAZI Sandrine  
**Course:** SENG 8240 – Best Programming Practices and Design Patterns  
**Institution:** Faculty of Information Technology, Department of Software Engineering  
**Academic Year:** 2025/2026  

---

> RwandAir Airline Ticketing Management System — Built with Node.js, React.js, PostgreSQL and Docker
