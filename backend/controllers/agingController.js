const prisma = require('../src/db');

// Get outstanding aging report
const getAgingReport = async (req, res) => {
  try {
    const userId = req.ownerId;

    // Get all customers for this user
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: { id: true, name: true, phoneNumber: true, address: true }
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const report = [];

    for (const customer of customers) {
      // Get all purchases for this customer
      const purchases = await prisma.purchase.findMany({
        where: { customerId: customer.id, userId },
        include: { product: { select: { productName: true, unit: true } } },
        orderBy: { date: 'asc' }
      });

      // Get all paid payments
      const payments = await prisma.payment.findMany({
        where: { customerId: customer.id, userId, status: 'PAID' }
      });

      // Get advances
      const advances = await prisma.advancePayment.findMany({
        where: { customerId: customer.id, userId, remaining: { gt: 0 } }
      });

      const totalAdvance = advances.reduce((sum, a) => sum + Number(a.remaining), 0);

      // Calculate total purchases
      const totalPurchases = purchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

      // Calculate total paid
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Net outstanding
      const totalOutstanding = totalPurchases - totalPaid - totalAdvance;

      if (totalOutstanding <= 0) continue;

      // Calculate aging buckets
      // Group purchases by month
      const monthlyPurchases = {};
      purchases.forEach(p => {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyPurchases[key]) monthlyPurchases[key] = 0;
        monthlyPurchases[key] += p.quantity * Number(p.price);
      });

      // Group payments by month
      const monthlyPayments = {};
      payments.forEach(p => {
        const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
        if (!monthlyPayments[key]) monthlyPayments[key] = 0;
        monthlyPayments[key] += Number(p.amount);
      });

      // Calculate per-month outstanding
      const allMonths = new Set([...Object.keys(monthlyPurchases), ...Object.keys(monthlyPayments)]);
      const monthlyOutstanding = [];

      for (const month of allMonths) {
        const purchased = monthlyPurchases[month] || 0;
        const paid = monthlyPayments[month] || 0;
        const due = purchased - paid;
        if (due > 0) {
          monthlyOutstanding.push({ month, due, purchased, paid });
        }
      }

      // Aging buckets: 0-30 days, 31-60 days, 61-90 days, 90+ days
      const bucket0to30 = { amount: 0, months: [] };
      const bucket31to60 = { amount: 0, months: [] };
      const bucket61to90 = { amount: 0, months: [] };
      const bucket90plus = { amount: 0, months: [] };

      monthlyOutstanding.forEach(m => {
        const [year, month] = m.month.split('-').map(Number);
        const dueDate = new Date(year, month - 1, 1);
        const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 30) {
          bucket0to30.amount += m.due;
          bucket0to30.months.push(m.month);
        } else if (daysDiff <= 60) {
          bucket31to60.amount += m.due;
          bucket31to60.months.push(m.month);
        } else if (daysDiff <= 90) {
          bucket61to90.amount += m.due;
          bucket61to90.months.push(m.month);
        } else {
          bucket90plus.amount += m.due;
          bucket90plus.months.push(m.month);
        }
      });

      report.push({
        customer,
        totalPurchases,
        totalPaid,
        totalAdvance,
        totalOutstanding,
        aging: {
          '0-30': bucket0to30,
          '31-60': bucket31to60,
          '61-90': bucket61to90,
          '90+': bucket90plus
        },
        monthlyBreakdown: monthlyOutstanding.sort((a, b) => a.month.localeCompare(b.month))
      });
    }

    // Sort by total outstanding descending
    report.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    // Calculate totals
    const totals = {
      totalCustomers: report.length,
      totalOutstanding: report.reduce((sum, r) => sum + r.totalOutstanding, 0),
      bucket0to30: report.reduce((sum, r) => sum + r.aging['0-30'].amount, 0),
      bucket31to60: report.reduce((sum, r) => sum + r.aging['31-60'].amount, 0),
      bucket61to90: report.reduce((sum, r) => sum + r.aging['61-90'].amount, 0),
      bucket90plus: report.reduce((sum, r) => sum + r.aging['90+'].amount, 0)
    };

    res.json({ report, totals });
  } catch (error) {
    console.error('Aging report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAgingReport };
