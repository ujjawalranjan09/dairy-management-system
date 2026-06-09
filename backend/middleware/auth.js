const jwt = require('jsonwebtoken');
const prisma = require('../src/db');

const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
};

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user + convenience fields
    req.user = user;
    req.userRole = user.role || ROLES.ADMIN;
    // Effective data owner: ADMIN uses own id; EMPLOYEE/CUSTOMER use ownerId (fallback to self)
    req.ownerId = user.ownerId || user.id;
    req.customerId = user.customerId || null;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Role-based authorization middleware (use after authenticateToken)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'Role information missing' });
    }
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        requiredRoles: allowedRoles,
        yourRole: req.userRole 
      });
    }
    next();
  };
};

// Helper: is the current user an admin of the business?
const isAdmin = (req) => req.userRole === ROLES.ADMIN;

// Helper: get the user id that "owns" the business data
const getOwnerId = (userOrReq) => {
  if (userOrReq && userOrReq.ownerId) return userOrReq.ownerId;
  if (userOrReq && userOrReq.user && userOrReq.user.ownerId) return userOrReq.user.ownerId;
  if (userOrReq && userOrReq.id) return userOrReq.id; // ADMIN case or direct user
  return null;
};

module.exports = { 
  authenticateToken, 
  authorizeRoles, 
  ROLES,
  isAdmin,
  getOwnerId 
};