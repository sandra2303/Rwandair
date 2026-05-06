import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const flightAPI = {
  search: (params) => API.get('/flights/search', { params }),
  getAll: () => API.get('/flights'),
  getById: (id) => API.get(`/flights/${id}`),
  getAirports: () => API.get('/flights/airports'),
  getAircraft: () => API.get('/flights/aircraft'),
  create: (data) => API.post('/flights', data),
  updateStatus: (id, status) => API.patch(`/flights/${id}/status`, { status }),
};

export const bookingAPI = {
  create: (data) => API.post('/bookings', data),
  getMyBookings: () => API.get('/bookings/my'),
  getAll: () => API.get('/bookings/all'),
  getById: (id) => API.get(`/bookings/${id}`),
  cancel: (id) => API.patch(`/bookings/${id}/cancel`),
};

export const paymentAPI = {
  createIntent: (data) => API.post('/payments/intent', data),
  confirm: (data) => API.post('/payments/confirm', data),
  getRevenue: () => API.get('/payments/revenue'),
};

export const ticketAPI = {
  generate: (bookingId) => API.post(`/tickets/generate/${bookingId}`),
  getByBooking: (bookingId) => API.get(`/tickets/booking/${bookingId}`),
  checkIn: (bookingId, data) => API.post(`/tickets/checkin/${bookingId}`, data),
  validate: (ticketNumber) => API.get(`/tickets/validate/${ticketNumber}`),
  getSeats: (flightId) => API.get(`/tickets/seats/${flightId}`),
  addBaggage: (passengerId, extra_kg) => API.patch(`/tickets/baggage/${passengerId}`, { extra_kg }),
};

export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: () => API.get('/admin/users'),
  updateUserStatus: (id, is_active) => API.patch(`/admin/users/${id}/status`, { is_active }),
  updateUserRole: (id, role) => API.patch(`/admin/users/${id}/role`, { role }),
  getManifest: (flightId) => API.get(`/admin/flights/${flightId}/manifest`),
};

export const passwordAPI = {
  forgot: (email) => API.post('/password/forgot', { email }),
  reset: (token, password) => API.post('/password/reset', { token, password }),
  change: (current_password, new_password) => API.post('/password/change', { current_password, new_password }),
};

export const refundAPI = {
  request: (booking_id, reason) => API.post('/refunds/request', { booking_id, reason }),
  getMy: () => API.get('/refunds/my'),
  getAll: () => API.get('/refunds/all'),
  process: (refund_id, status) => API.patch('/refunds/process', { refund_id, status }),
};

export const enhancedAPI = {
  modifyBooking: (booking_id, data) => API.patch(`/enhanced/bookings/${booking_id}/modify`, data),
  upgradeSeat: (booking_id, new_cabin_class) => API.patch(`/enhanced/bookings/${booking_id}/upgrade`, { new_cabin_class }),
  getNotifications: () => API.get('/enhanced/notifications'),
  markRead: (id) => API.patch(`/enhanced/notifications/${id}/read`),
  getRevenueStats: () => API.get('/enhanced/revenue/stats'),
};

export default API;
