const router = require('express').Router();
const { requestRefund, getMyRefunds, getAllRefunds, processRefund } = require('../controllers/refundController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/request', authenticate, requestRefund);
router.get('/my', authenticate, getMyRefunds);
router.get('/all', authenticate, authorize('admin'), getAllRefunds);
router.patch('/process', authenticate, authorize('admin'), processRefund);

module.exports = router;
