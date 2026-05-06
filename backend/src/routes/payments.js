const router = require('express').Router();
const { createPaymentIntent, confirmPayment, getRevenue } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
router.post('/intent', authenticate, createPaymentIntent);
router.post('/confirm', authenticate, confirmPayment);
router.get('/revenue', authenticate, authorize('admin'), getRevenue);
module.exports = router;
