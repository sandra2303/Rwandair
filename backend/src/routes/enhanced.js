const router = require('express').Router();
const { modifyBooking, upgradeSeat, getNotifications, markNotificationRead, getRevenueStats } = require('../controllers/enhancedController');
const { authenticate, authorize } = require('../middleware/auth');

router.patch('/bookings/:booking_id/modify', authenticate, modifyBooking);
router.patch('/bookings/:booking_id/upgrade', authenticate, upgradeSeat);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);
router.get('/revenue/stats', authenticate, authorize('admin'), getRevenueStats);

module.exports = router;
