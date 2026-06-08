const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.ownerId;

    // CUSTOMER: return personal summary instead of full business dashboard
    if (req.userRole === ROLES.CUSTOMER && req.customerId) {
      const today = req.query.date ? new Date(req.query.date) : new Date();
      today.setHours(0, 0, 0, 0);
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

    // Get today's date range (or previous date selected by admin)
    const today = req.query.date ? new Date(req.query.date) : new Date();
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

    // Get today's sales (with product info)
    const todayPurchases = await prisma.purchase.findMany({
      where: {
        userId: ownerId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        product: true
      }
    });

    const todaySales = todayPurchases.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    // Calculate today's product sales breakdown
    const productSalesMap = {};
    todayPurchases.forEach(p => {
      const prodId = p.productId;
      if (p.product) {
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            productId: prodId,
            productName: p.product.productName,
            unit: p.product.unit,
            quantity: 0,
            totalSales: 0
          };
        }
        productSalesMap[prodId].quantity += p.quantity;
        productSalesMap[prodId].totalSales += p.quantity * Number(p.price);
      }
    });
    const todayProductSales = Object.values(productSalesMap);

    // Get pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        userId: ownerId,
        status: 'PENDING'
      }
    });

    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Get today's paid payments for cash/online daily metrics
    const todayPayments = await prisma.payment.findMany({
      where: {
        userId: ownerId,
        status: 'PAID',
        paymentDate: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const todayCashCollected = todayPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0);
    const todayOnlineCollected = todayPayments.filter(p => p.method === 'ONLINE').reduce((sum, p) => sum + Number(p.amount), 0);

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
      if (p.customer) {
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: p.customer,
            total: 0
          };
        }
        acc[customerId].total += p.quantity * p.price;
      }
      return acc;
    }, {});

    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Get employee stats (Admin view only)
    let employeeStats = [];
    if (req.userRole === ROLES.ADMIN) {
      const employees = await prisma.user.findMany({
        where: {
          ownerId: ownerId,
          role: 'EMPLOYEE'
        }
      });

      employeeStats = await Promise.all(employees.map(async (emp) => {
        // Customers created by this employee
        const createdCustomers = await prisma.customer.findMany({
          where: { creatorId: emp.id },
          select: { id: true }
        });
        const customerIdsCreated = createdCustomers.map(c => c.id);

        // Purchases recorded by this employee
        const recordedPurchases = await prisma.purchase.findMany({
          where: { creatorId: emp.id },
          select: { customerId: true }
        });
        const customerIdsPurchased = recordedPurchases.map(p => p.customerId);

        // Payments recorded by this employee
        const recordedPayments = await prisma.payment.findMany({
          where: { creatorId: emp.id },
          select: { customerId: true, amount: true, status: true, method: true }
        });
        const customerIdsPaid = recordedPayments.map(p => p.customerId);

        // Union of all customer IDs managed by this employee
        const allManagedCustomerIds = new Set([
          ...customerIdsCreated,
          ...customerIdsPurchased,
          ...customerIdsPaid
        ]);

        const totalPaymentsManaged = recordedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalPaymentsCollected = recordedPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0);
        const cashCollected = recordedPayments.filter(p => p.status === 'PAID' && p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0);
        const onlineCollected = recordedPayments.filter(p => p.status === 'PAID' && p.method === 'ONLINE').reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          customersManagedCount: allManagedCustomerIds.size,
          totalPaymentsManaged,
          totalPaymentsCollected,
          cashCollected,
          onlineCollected
        };
      }));
    }

    res.json({
      stats: {
        totalCustomers,
        todaySales,
        pendingPayments: pendingPayments.length,
        pendingAmount,
        monthlySales,
        todayCashCollected,
        todayOnlineCollected
      },
      recentPurchases,
      topCustomers,
      todayProductSales,
      employeeStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};