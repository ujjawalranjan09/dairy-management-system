const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', purchaseController.getAllPurchases);
router.get('/today', purchaseController.getTodayPurchases);
router.get('/customer/:customerId', purchaseController.getPurchasesByCustomer);
// ADMIN + EMPLOYEE can create purchases
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE), purchaseController.createPurchase);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), purchaseController.deletePurchase);

module.exports = router;