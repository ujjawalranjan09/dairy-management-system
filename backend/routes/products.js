const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
// Only ADMIN can modify products
router.post('/', authorizeRoles(ROLES.ADMIN), productController.createProduct);
router.put('/:id', authorizeRoles(ROLES.ADMIN), productController.updateProduct);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), productController.deleteProduct);

module.exports = router;