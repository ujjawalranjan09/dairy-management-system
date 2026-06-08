const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', paymentController.getAllPayments);
router.get('/pending', paymentController.getPendingPayments);
// ADMIN + EMPLOYEE can record/update payments, mark paid, or mark failed
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), paymentController.createOrUpdatePayment);
router.put('/:id/mark-paid', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), paymentController.markAsPaid);
router.put('/:id/mark-failed', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), paymentController.markAsFailed);

module.exports = router;