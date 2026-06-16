const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

// Reusable include for customer with default products and assigned employee
const customerInclude = {
  defaultProducts: {
    include: {
      product: {
        select: { id: true, productName: true, price: true, unit: true }
      }
    }
  },
  assignedEmployee: {
    select: { id: true, name: true, phone: true }
  }
};

const getAllCustomers = async (req, res) => {
  try {
    // CUSTOMER role: customers list is not relevant; return empty
    if (req.userRole === ROLES.CUSTOMER) {
      return res.json({ customers: [] });
    }

    const customers = await prisma.customer.findMany({
      where: { userId: req.ownerId },
      include: customerInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchCustomers = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.json({ customers: [] });
    }

    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const customers = await prisma.customer.findMany({
      where: {
        userId: req.ownerId,
        OR: [
          { name: { contains: query } },
          { phoneNumber: { contains: query } }
        ]
      },
      include: customerInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ customers });
  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    // CUSTOMER role can only view their own linked customer (if any)
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId || req.customerId !== customerId) {
        return res.status(403).json({ error: 'Access denied to this customer record' });
      }
    }

    const where = {
      id: customerId,
      userId: req.ownerId
    };

    const customer = await prisma.customer.findFirst({
      where,
      include: {
        ...customerInclude,
        purchases: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCustomer = async (req, res) => {
  try {
    // Only ADMIN and EMPLOYEE can create customers
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, phoneNumber, address, defaultProducts, assignedEmployeeId } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    // Build data object
    const data = {
      name,
      phoneNumber,
      address,
      userId: req.ownerId,
      creatorId: req.user.id
    };

    // Optional: default products assignment
    if (defaultProducts && Array.isArray(defaultProducts)) {
      data.defaultProducts = {
        create: defaultProducts.map(dp => ({
          productId: parseInt(dp.productId),
          quantity: parseFloat(dp.quantity) || 1,
          unit: dp.unit || ''
        }))
      };
    }

    // Optional: assigned employee
    if (assignedEmployeeId) {
      const employee = await prisma.user.findFirst({
        where: { 
          id: parseInt(assignedEmployeeId), 
          ownerId: req.ownerId,
          role: { in: [ROLES.EMPLOYEE, ROLES.ADMIN] }
        }
      });
      if (employee) {
        data.assignedEmployeeId = parseInt(assignedEmployeeId);
      }
    }

    const customer = await prisma.customer.create({
      data,
      include: customerInclude
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { name, phoneNumber, address, defaultProducts, assignedEmployeeId } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build update data
    const data = { name, phoneNumber, address };

    // Handle multiple default products
    if (defaultProducts !== undefined && Array.isArray(defaultProducts)) {
      data.defaultProducts = {
        deleteMany: {},
        create: defaultProducts.map(dp => ({
          productId: parseInt(dp.productId),
          quantity: parseFloat(dp.quantity) || 1,
          unit: dp.unit || ''
        }))
      };
    }

    // Handle assigned employee - allow clearing or updating
    if (assignedEmployeeId !== undefined) {
      if (assignedEmployeeId === null || assignedEmployeeId === '') {
        data.assignedEmployeeId = null;
      } else {
        const employee = await prisma.user.findFirst({
          where: {
            id: parseInt(assignedEmployeeId),
            ownerId: req.ownerId,
            role: { in: [ROLES.EMPLOYEE, ROLES.ADMIN] }
          }
        });
        if (employee) {
          data.assignedEmployeeId = parseInt(assignedEmployeeId);
        }
      }
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data,
      include: customerInclude
    });

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    // Only ADMIN can delete customers
    if (req.userRole !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only administrators can delete customers' });
    }

    const { id } = req.params;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};