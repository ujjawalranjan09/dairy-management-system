const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/monthly', billingController.getMonthlyBilling);
router.get('/customer/:customerId', billingController.getCustomerBilling);

module.exports = router;