const express = require('express');
const router = express.Router();
const { sendDailyPurchaseSummary, sendMonthlyBill, sendPaymentReminders } = require('../services/whatsappService');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Send daily summary manually
router.post('/daily-summary', async (req, res) => {
  try {
    await sendDailyPurchaseSummary();
    res.json({ message: 'Daily summaries sent' });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({ error: 'Failed to send summaries' });
  }
});

// Send monthly bill to a customer
router.post('/monthly-bill', async (req, res) => {
  try {
    const { customerId, month, year } = req.body;
    const result = await sendMonthlyBill(parseInt(customerId), parseInt(month), parseInt(year), req.ownerId);
    res.json({ message: 'Bill sent', result });
  } catch (error) {
    console.error('Monthly bill error:', error);
    res.status(500).json({ error: 'Failed to send bill' });
  }
});

// Send payment reminders
router.post('/reminders', async (req, res) => {
  try {
    const result = await sendPaymentReminders(req.ownerId);
    res.json({ message: `Reminders sent: ${result.sent}/${result.total}`, result });
  } catch (error) {
    console.error('Reminders error:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

module.exports = router;
