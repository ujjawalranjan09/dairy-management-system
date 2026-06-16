const prisma = require('../src/db');

// Get stock for a date range
const getStock = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.ownerId;

    let dateFilter = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      dateFilter = { equals: d };
    } else if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { equals: today };
    }

    const stock = await prisma.stock.findMany({
      where: { userId, date: dateFilter },
      include: { product: { select: { id: true, productName: true, unit: true, price: true } } },
      orderBy: [{ date: 'desc' }, { product: { productName: 'asc' } }]
    });

    res.json({ stock });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save stock entry for a date
const saveStock = async (req, res) => {
  try {
    const { date, entries } = req.body;
    const userId = req.ownerId;

    if (!date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Date and entries array are required' });
    }

    const stockDate = new Date(date);
    stockDate.setHours(0, 0, 0, 0);

    const results = [];
    for (const entry of entries) {
      const { productId, openingQty, receivedQty, soldQty, wastedQty } = entry;
      const opening = parseFloat(openingQty) || 0;
      const received = parseFloat(receivedQty) || 0;
      const sold = parseFloat(soldQty) || 0;
      const wasted = parseFloat(wastedQty) || 0;
      const closing = opening + received - sold - wasted;

      const stock = await prisma.stock.upsert({
        where: {
          date_productId_userId: {
            date: stockDate,
            productId: parseInt(productId),
            userId
          }
        },
        update: {
          openingQty: opening,
          receivedQty: received,
          soldQty: sold,
          wastedQty: wasted,
          closingQty: closing
        },
        create: {
          date: stockDate,
          productId: parseInt(productId),
          openingQty: opening,
          receivedQty: received,
          soldQty: sold,
          wastedQty: wasted,
          closingQty: closing,
          userId
        }
      });
      results.push(stock);
    }

    res.json({ message: 'Stock saved', stock: results });
  } catch (error) {
    console.error('Save stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get stock summary for a date range
const getStockSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.ownerId;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const stock = await prisma.stock.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: { product: { select: { id: true, productName: true, unit: true, price: true } } },
      orderBy: { date: 'desc' }
    });

    // Group by product
    const productSummary = {};
    stock.forEach(s => {
      const pid = s.productId;
      if (!productSummary[pid]) {
        productSummary[pid] = {
          product: s.product,
          totalReceived: 0,
          totalSold: 0,
          totalWasted: 0,
          latestClosing: 0
        };
      }
      productSummary[pid].totalReceived += s.receivedQty;
      productSummary[pid].totalSold += s.soldQty;
      productSummary[pid].totalWasted += s.wastedQty;
      if (!productSummary[pid].latestClosing || s.date > productSummary[pid].latestDate) {
        productSummary[pid].latestClosing = s.closingQty;
        productSummary[pid].latestDate = s.date;
      }
    });

    res.json({
      summary: Object.values(productSummary),
      entries: stock
    });
  } catch (error) {
    console.error('Stock summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getStock, saveStock, getStockSummary };
