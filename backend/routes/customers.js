const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), customerController.createCustomer);
router.put('/:id', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), customerController.updateCustomer);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), customerController.deleteCustomer);

module.exports = router;