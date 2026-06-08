const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.ownerId;

    // CUSTOMER: return personal summary instead of full business dashboard
    if (req.userRole === ROLES.CUSTOMER && req.customerId) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

      const currentMonth = new Date(); currentMonth.setDate(1); currentMonth.setHours(0,0,0,0);
      const nextMonth = new Date(currentMonth); nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [todayPurchases, monthlyPurchases, pendingPayments] = await Promise.all([
        prisma.purchase.findMany({ where: { userId: ownerId, customerId: req.customerId, date: { gte: today, lt: tomorrow } } }),
        prisma.purchase.findMany({ where: { userId: ownerId, customerId: req.customerId, date: { gte: currentMonth, lt: nextMonth } } }),
        prisma.payment.findMany({ where: { userId: ownerId, customerId: req.customerId, status: 'PENDING' } })
      ]);

      const todaySales = todayPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);
      const monthlySales = monthlyPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      const recentPurchases = await prisma.purchase.findMany({
        where: { userId: ownerId, customerId: req.customerId },
        include: { customer: true, product: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return res.json({
        stats: {
          totalCustomers: 1,
          todaySales,
          pendingPayments: pendingPayments.length,
          pendingAmount,
          monthlySales,
          isCustomerView: true
        },
        recentPurchases,
        topCustomers: []
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month range
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Count total customers
    const totalCustomers = await prisma.customer.count({
      where: { userId: ownerId }
    });

    // Get today's sales
    const todayPurchases = await prisma.purchase.findMany({
      where: {
        userId: ownerId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todaySales = todayPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    // Get pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        userId: ownerId,
        status: 'PENDING'
      }
    });

    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get monthly sales
    const monthlyPurchases = await prisma.purchase.findMany({
      where: {
        userId: ownerId,
        date: {
          gte: currentMonth,
          lt: nextMonth
        }
      }
    });

    const monthlySales = monthlyPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    // Get recent purchases (last 5)
    const recentPurchases = await prisma.purchase.findMany({
      where: { userId: ownerId },
      include: {
        customer: true,
        product: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get top customers by monthly purchase
    const customerPurchases = await prisma.purchase.findMany({
      where: {
        userId: ownerId,
        date: {
          gte: currentMonth,
          lt: nextMonth
        }
      },
      include: {
        customer: true
      }
    });

    const customerTotals = customerPurchases.reduce((acc, p) => {
      const customerId = p.customerId;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: p.customer,
          total: 0
        };
      }
      acc[customerId].total += p.quantity * p.price;
      return acc;
    }, {});

    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({
      stats: {
        totalCustomers,
        todaySales,
        pendingPayments: pendingPayments.length,
        pendingAmount,
        monthlySales
      },
      recentPurchases,
      topCustomers
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};