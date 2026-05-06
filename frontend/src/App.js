import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Flights from './pages/Flights';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import TicketPage from './pages/TicketPage';
import CheckIn from './pages/CheckIn';
import ValidateTicket from './pages/ValidateTicket';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AgentPortal from './pages/AgentPortal';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';
import MyRefunds from './pages/MyRefunds';
import RevenueCharts from './pages/RevenueCharts';
import Notifications from './components/Notifications';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/book" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
          <Route path="/tickets/:booking_id" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
          <Route path="/checkin/:booking_id" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
          <Route path="/validate" element={<ProtectedRoute roles={['admin','agent']}><ValidateTicket /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/refunds" element={<ProtectedRoute><MyRefunds /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute roles={['admin']}><RevenueCharts /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute roles={['agent','admin']}><AgentPortal /></ProtectedRoute>} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
