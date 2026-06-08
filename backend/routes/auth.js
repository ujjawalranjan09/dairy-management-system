const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getProfile);

// ADMIN only user management (for ERP: create employees & customer portals)
router.get('/users', authenticateToken, authorizeRoles(ROLES.ADMIN), authController.getAllUsers);
router.post('/users', authenticateToken, authorizeRoles(ROLES.ADMIN), authController.createUser);

module.exports = router;