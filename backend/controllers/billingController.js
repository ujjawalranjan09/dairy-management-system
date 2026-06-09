const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const getMonthlyBilling = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // CUSTOMER users get only their own billing via the dedicated customer endpoint
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId) return res.json({ billing: [], month: parseInt(month), year: parseInt(year) });

      const customer = await prisma.customer.findFirst({
        where: { id: req.customerId, userId: req.ownerId }
      });
      if (!customer) return res.json({ billing: [], month: parseInt(month), year: parseInt(year) });

      const purchases = await prisma.purchase.findMany({
        where: {
          userId: req.ownerId,
          customerId: req.customerId,
          date: { gte: startDate, lte: endDate }
        },
        include: { product: true }
      });

      const productBreakdown = purchases.reduce((acc, purchase) => {
        const productName = purchase.product.productName;
        if (!acc[productName]) {
          acc[productName] = { quantity: 0, total: 0, price: purchase.price };
        }
        acc[productName].quantity += purchase.quantity;
        acc[productName].total += purchase.quantity * Number(purchase.price);
        return acc;
      }, {});

      const total = purchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

      // Check payment status
      const payments = await prisma.payment.findMany({
        where: {
          customerId: req.customerId,
          month: parseInt(month),
          year: parseInt(year),
          userId: req.ownerId
        }
      });

      const totalPaid = payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      let paymentStatus = 'PENDING';
      if (totalPaid >= total && total > 0) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIALLY PAID';
      }

      const remainingAmount = Math.max(0, total - totalPaid);

      return res.json({
        billing: [{
          customer,
          productBreakdown,
          total,
          purchaseCount: purchases.length,
          paymentStatus,
          totalPaid,
          remainingAmount
        }],
        month: parseInt(month),
        year: parseInt(year)
      });
    }

    // Get customers for ADMIN/EMPLOYEE
    let customersWhere = { userId: req.ownerId };
    
    // EMPLOYEE: Filter to show only customers assigned to them OR customers who have purchases recorded by them
    if (req.userRole === ROLES.EMPLOYEE) {
      customersWhere.OR = [
        { assignedEmployeeId: req.user.id },
        { purchases: { some: { creatorId: req.user.id } } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where: customersWhere
    });

    // Get purchases for the month
    let purchasesWhere = {
      userId: req.ownerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (req.userRole === ROLES.EMPLOYEE) {
      purchasesWhere.OR = [
        { creatorId: req.user.id },
        { customer: { assignedEmployeeId: req.user.id } }
      ];
    }

    const purchases = await prisma.purchase.findMany({
      where: purchasesWhere,
      include: {
        customer: true,
        product: true
      }
    });

    // Get payments for the month to attach paymentStatus
    let paymentsWhere = {
      userId: req.ownerId,
      month: parseInt(month),
      year: parseInt(year)
    };

    if (req.userRole === ROLES.EMPLOYEE) {
      paymentsWhere.OR = [
        { creatorId: req.user.id },
        { customer: { assignedEmployeeId: req.user.id } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where: paymentsWhere
    });

    // Group by customer and product
    const billing = customers.map(customer => {
      const customerPurchases = purchases.filter(p => p.customerId === customer.id);

      const productBreakdown = customerPurchases.reduce((acc, purchase) => {
        const productName = purchase.product.productName;
        if (!acc[productName]) {
          acc[productName] = {
            quantity: 0,
            total: 0,
            price: purchase.price
          };
        }
        acc[productName].quantity += purchase.quantity;
        acc[productName].total += purchase.quantity * Number(purchase.price);
        return acc;
      }, {});

      const total = customerPurchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

      const customerPayments = payments.filter(p => p.customerId === customer.id);
      const totalPaid = customerPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      let paymentStatus = 'PENDING';
      if (totalPaid >= total && total > 0) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIALLY PAID';
      }

      const remainingAmount = Math.max(0, total - totalPaid);

      return {
        customer,
        productBreakdown,
        total,
        purchaseCount: customerPurchases.length,
        paymentStatus,
        totalPaid,
        remainingAmount
      };
    }).filter(b => b.purchaseCount > 0);

    res.json({ billing, month: parseInt(month), year: parseInt(year) });
  } catch (error) {
    console.error('Get monthly billing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCustomerBilling = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { month, year } = req.query;
    const targetId = parseInt(customerId);

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // CUSTOMER can only access their linked customer
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId || req.customerId !== targetId) {
        return res.status(403).json({ error: 'Access denied to this billing record' });
      }
    }

    // Verify customer belongs to business
    const customer = await prisma.customer.findFirst({
      where: {
        id: targetId,
        userId: req.ownerId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: req.ownerId,
        customerId: targetId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        product: true
      },
      orderBy: { date: 'asc' }
    });

    // Group by product
    const productBreakdown = purchases.reduce((acc, purchase) => {
      const productName = purchase.product.productName;
      if (!acc[productName]) {
        acc[productName] = {
          quantity: 0,
          total: 0,
          price: purchase.price
        };
      }
      acc[productName].quantity += purchase.quantity;
      acc[productName].total += purchase.quantity * Number(purchase.price);
      return acc;
    }, {});

    const total = purchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

    // Check payment status
    const payments = await prisma.payment.findMany({
      where: {
        customerId: targetId,
        month: parseInt(month),
        year: parseInt(year),
        userId: req.ownerId
      }
    });

    const totalPaid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    let paymentStatus = 'PENDING';
    if (totalPaid >= total && total > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIALLY PAID';
    }

    res.json({
      customer,
      productBreakdown,
      purchases,
      total,
      paymentStatus,
      payments
    });
  } catch (error) {
    console.error('Get customer billing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMonthlyBilling,
  getCustomerBilling
};