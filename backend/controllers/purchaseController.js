const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const getAllPurchases = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // CUSTOMER: only their own purchases
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId) {
        return res.json({ purchases: [] });
      }
      let where = { userId: req.ownerId, customerId: req.customerId };
      if (startDate && endDate) {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) };
      }
      const purchases = await prisma.purchase.findMany({
        where,
        include: { customer: true, product: true },
        orderBy: { date: 'desc' }
      });
      return res.json({ purchases });
    }

    let where = { userId: req.ownerId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        customer: true,
        product: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({ purchases });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTodayPurchases = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let where = {
      userId: req.ownerId,
      date: { gte: today, lt: tomorrow }
    };

    // CUSTOMER scoped to their record
    if (req.userRole === ROLES.CUSTOMER && req.customerId) {
      where.customerId = req.customerId;
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        customer: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by customer
    const grouped = purchases.reduce((acc, purchase) => {
      const customerId = purchase.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: purchase.customer,
          purchases: [],
          total: 0
        };
      }
      acc[customerId].purchases.push(purchase);
      acc[customerId].total += purchase.quantity * purchase.price;
      return acc;
    }, {});

    res.json({ purchases, grouped });
  } catch (error) {
    console.error('Get today purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPurchasesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { month, year } = req.query;
    const targetCustomerId = parseInt(customerId);

    // CUSTOMER can only request their own
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId || req.customerId !== targetCustomerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let where = {
      userId: req.ownerId,
      customerId: targetCustomerId
    };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        product: true
      },
      orderBy: { date: 'desc' }
    });

    const total = purchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    res.json({ purchases, total });
  } catch (error) {
    console.error('Get purchases by customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createPurchase = async (req, res) => {
  try {
    // CUSTOMER cannot create purchases
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Customers cannot record purchases' });
    }

    const { customerId, productId, quantity, date } = req.body;

    if (!customerId || !productId || !quantity) {
      return res.status(400).json({ error: 'Customer, product, and quantity are required' });
    }

    // Get product price (scoped to owner)
    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(productId),
        userId: req.ownerId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify customer belongs to business
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(customerId),
        userId: req.ownerId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const purchase = await prisma.purchase.create({
      data: {
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        price: product.price,
        date: date ? new Date(date) : new Date(),
        userId: req.ownerId
      },
      include: {
        customer: true,
        product: true
      }
    });

    res.status(201).json({
      message: 'Purchase created successfully',
      purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePurchase = async (req, res) => {
  try {
    // Only ADMIN can delete purchases
    if (req.userRole !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only administrators can delete purchases' });
    }

    const { id } = req.params;

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!existingPurchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    await prisma.purchase.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllPurchases,
  getTodayPurchases,
  getPurchasesByCustomer,
  createPurchase,
  deletePurchase
};