const router = require('express').Router();
const { createBooking, getUserBookings, getBookingById, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getUserBookings);
router.get('/all', authenticate, authorize('admin', 'agent'), getAllBookings);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/cancel', authenticate, cancelBooking);
module.exports = router;
