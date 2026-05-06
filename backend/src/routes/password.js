const router = require('express').Router();
const { forgotPassword, resetPassword, changePassword } = require('../controllers/passwordController');
const { authenticate } = require('../middleware/auth');

router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);
router.post('/change', authenticate, changePassword);

module.exports = router;
