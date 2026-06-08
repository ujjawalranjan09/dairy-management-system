const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const signToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      role: user.role || ROLES.ADMIN,
      ownerId: user.ownerId || null,
      customerId: user.customerId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || ROLES.ADMIN,
  ownerId: user.ownerId || null,
  customerId: user.customerId || null,
  createdAt: user.createdAt
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // ERP security: Public self-registration is only allowed for the very first user (initial ADMIN).
    // After that, only existing ADMINs can create new users (employees + customer portals) via the internal Users page.
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(403).json({ 
        error: 'Public registration is disabled. Please contact your administrator to create an account.' 
      });
    }

    // Check if user exists (for the first-user case)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // The very first registration becomes the business ADMIN (owner)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: ROLES.ADMIN
      }
    });

    const token = signToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ADMIN only: list users in this business (self + employees + customer portals)
const getAllUsers = async (req, res) => {
  try {
    const ownerId = req.ownerId;

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: ownerId },
          { ownerId: ownerId }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        ownerId: true,
        customerId: true,
        createdAt: true,
        linkedCustomer: {
          select: { id: true, name: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ADMIN only: create EMPLOYEE or CUSTOMER portal user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, customerId } = req.body;
    const adminId = req.ownerId; // the business owner

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }

    if (![ROLES.EMPLOYEE, ROLES.CUSTOMER].includes(role)) {
      return res.status(400).json({ error: 'role must be EMPLOYEE or CUSTOMER' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    let finalCustomerId = null;

    if (role === ROLES.CUSTOMER) {
      if (!customerId) {
        return res.status(400).json({ error: 'customerId is required when creating a CUSTOMER role user' });
      }
      // Verify the customer belongs to this business
      const customer = await prisma.customer.findFirst({
        where: { id: parseInt(customerId), userId: adminId }
      });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found or does not belong to your business' });
      }
      // Ensure no other user is already linked to this customer
      const existingPortal = await prisma.user.findUnique({
        where: { customerId: parseInt(customerId) }
      });
      if (existingPortal) {
        return res.status(400).json({ error: 'This customer already has a portal login' });
      }
      finalCustomerId = parseInt(customerId);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ownerId: adminId,
        customerId: finalCustomerId
      }
    });

    res.status(201).json({
      message: `${role} user created successfully`,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  createUser
};