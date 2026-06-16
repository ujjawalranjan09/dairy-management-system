const prisma = require('../src/db');

// Record an advance payment
const createAdvance = async (req, res) => {
  try {
    const { customerId, amount, method, note, date } = req.body;
    const userId = req.ownerId;

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer and amount are required' });
    }

    const advance = await prisma.advancePayment.create({
      data: {
        customerId: parseInt(customerId),
        amount: parseFloat(amount),
        remaining: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        method: method || 'CASH',
        note: note || '',
        userId
      },
      include: { customer: { select: { id: true, name: true, phoneNumber: true } } }
    });

    res.status(201).json({ message: 'Advance payment recorded', advance });
  } catch (error) {
    console.error('Create advance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get advances for a customer or all customers
const getAdvances = async (req, res) => {
  try {
    const { customerId } = req.query;
    const userId = req.ownerId;

    const where = { userId };
    if (customerId) where.customerId = parseInt(customerId);

    const advances = await prisma.advancePayment.findMany({
      where,
      include: { customer: { select: { id: true, name: true, phoneNumber: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total remaining per customer
    const customerBalances = {};
    advances.forEach(a => {
      if (!customerBalances[a.customerId]) {
        customerBalances[a.customerId] = {
          customer: a.customer,
          totalAdvance: 0,
          totalRemaining: 0
        };
      }
      customerBalances[a.customerId].totalAdvance += Number(a.amount);
      customerBalances[a.customerId].totalRemaining += Number(a.remaining);
    });

    res.json({
      advances,
      balances: Object.values(customerBalances).filter(b => b.totalRemaining > 0)
    });
  } catch (error) {
    console.error('Get advances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Use advance to pay a bill (auto-adjust)
const useAdvance = async (req, res) => {
  try {
    const { customerId, amount, month, year } = req.body;
    const userId = req.ownerId;

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer and amount are required' });
    }

    const useAmount = parseFloat(amount);
    let remaining = useAmount;

    // Get advances with remaining balance, oldest first
    const advances = await prisma.advancePayment.findMany({
      where: { customerId: parseInt(customerId), userId, remaining: { gt: 0 } },
      orderBy: { date: 'asc' }
    });

    const used = [];
    for (const advance of advances) {
      if (remaining <= 0) break;
      const canUse = Math.min(remaining, Number(advance.remaining));
      const newRemaining = Number(advance.remaining) - canUse;

      await prisma.advancePayment.update({
        where: { id: advance.id },
        data: { remaining: newRemaining }
      });

      used.push({ advanceId: advance.id, used: canUse, newRemaining });
      remaining -= canUse;
    }

    // If month/year provided, mark the payment as paid
    if (month && year && remaining <= 0) {
      try {
        await prisma.payment.upsert({
          where: {
            customerId_month_year_userId: {
              customerId: parseInt(customerId),
              month: parseInt(month),
              year: parseInt(year),
              userId
            }
          },
          update: { status: 'PAID', paymentDate: new Date(), method: 'ADVANCE' },
          create: {
            customerId: parseInt(customerId),
            amount: useAmount,
            month: parseInt(month),
            year: parseInt(year),
            status: 'PAID',
            paymentDate: new Date(),
            method: 'ADVANCE',
            userId
          }
        });
      } catch (e) {
        console.log('Payment upsert skipped:', e.message);
      }
    }

    res.json({ message: `₹${useAmount} used from advance`, used, remainingUnpaid: remaining });
  } catch (error) {
    console.error('Use advance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createAdvance, getAdvances, useAdvance };
