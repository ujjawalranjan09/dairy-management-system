const axios = require('axios');
const prisma = require('../src/db');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const formattedPhone = phoneNumber.replace(/[\s+]/g, '');

    if (!WHATSAPP_API_URL || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('[WhatsApp Simulated] To:', phoneNumber);
      console.log('[WhatsApp Simulated] Message:', message.substring(0, 200));
      return { success: true, simulated: true };
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error.message);
    throw error;
  }
};

const sendDailyPurchaseSummary = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });

    for (const user of users) {
      const purchases = await prisma.purchase.findMany({
        where: { userId: user.id, date: { gte: today, lt: tomorrow } },
        include: { customer: true, product: true }
      });

      const customerPurchases = purchases.reduce((acc, purchase) => {
        const customerId = purchase.customerId;
        if (!acc[customerId]) {
          acc[customerId] = { customer: purchase.customer, purchases: [], total: 0 };
        }
        acc[customerId].purchases.push(purchase);
        acc[customerId].total += purchase.quantity * Number(purchase.price);
        return acc;
      }, {});

      for (const customerId in customerPurchases) {
        const { customer, purchases: custPurchases, total } = customerPurchases[customerId];

        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const monthlyPurchases = await prisma.purchase.findMany({
          where: { userId: user.id, customerId: customer.id, date: { gte: currentMonth, lt: tomorrow } }
        });
        const monthlyTotal = monthlyPurchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

        const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        let message = `🥛 *${user.name || 'My Dairy Shop'}*\n`;
        message += `📅 ${dateStr}\n\n`;
        message += `Hello ${customer.name}!\n\n`;
        message += `Today's purchases:\n`;

        custPurchases.forEach(p => {
          const itemTotal = p.quantity * Number(p.price);
          message += `• ${p.product.productName} ${p.quantity}${p.product.unit} = ₹${itemTotal}\n`;
        });

        message += `\n*Today Total: ₹${total}*\n`;
        message += `Monthly Total: ₹${monthlyTotal}\n`;
        message += `\nThank you! 🙏`;

        try {
          await sendWhatsAppMessage(customer.phoneNumber, message);
        } catch (error) {
          console.error(`Failed to send to ${customer.name}:`, error.message);
        }
      }
    }
    console.log('Daily purchase summaries completed');
  } catch (error) {
    console.error('Daily purchase summary error:', error);
    throw error;
  }
};

// Send monthly bill to a specific customer
const sendMonthlyBill = async (customerId, month, year, userId) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId }
    });
    if (!customer) throw new Error('Customer not found');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const purchases = await prisma.purchase.findMany({
      where: { customerId, userId, date: { gte: startDate, lte: endDate } },
      include: { product: true },
      orderBy: { date: 'asc' }
    });

    const payments = await prisma.payment.findMany({
      where: { customerId, userId, month, year, status: 'PAID' }
    });

    const totalPurchases = purchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = totalPurchases - totalPaid;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month - 1];

    let message = `🥛 *My Dairy Shop*\n`;
    message += `🧾 *Monthly Bill*\n`;
    message += `📅 ${monthName} ${year}\n\n`;
    message += `Hello ${customer.name}!\n\n`;
    message += `Your bill for ${monthName} ${year}:\n\n`;

    // Group by product
    const productGroups = {};
    purchases.forEach(p => {
      const name = p.product.productName;
      if (!productGroups[name]) productGroups[name] = { qty: 0, total: 0, unit: p.product.unit };
      productGroups[name].qty += p.quantity;
      productGroups[name].total += p.quantity * Number(p.price);
    });

    Object.entries(productGroups).forEach(([name, data]) => {
      message += `• ${name}: ${data.qty}${data.unit} = ₹${data.total}\n`;
    });

    message += `\n*Total Bill: ₹${totalPurchases}*\n`;
    if (totalPaid > 0) message += `*Paid: ₹${totalPaid}*\n`;
    if (outstanding > 0) message += `*Due: ₹${outstanding}*\n`;
    message += `\nPlease pay at your convenience. 🙏`;

    return await sendWhatsAppMessage(customer.phoneNumber, message);
  } catch (error) {
    console.error('Send monthly bill error:', error);
    throw error;
  }
};

// Send payment reminder to overdue customers
const sendPaymentReminders = async (userId) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get customers with pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: { userId, status: 'PENDING' },
      include: { customer: { select: { id: true, name: true, phoneNumber: true } } }
    });

    let sent = 0;
    for (const payment of pendingPayments) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[payment.month - 1];

      let message = `🥛 *My Dairy Shop*\n`;
      message += `⏰ *Payment Reminder*\n\n`;
      message += `Hello ${payment.customer.name}!\n\n`;
      message += `Your payment of *₹${payment.amount}* for *${monthName} ${payment.year}* is pending.\n\n`;
      message += `Please pay at your convenience. 🙏\n`;
      message += `\nThank you!`;

      try {
        await sendWhatsAppMessage(payment.customer.phoneNumber, message);
        sent++;
      } catch (error) {
        console.error(`Reminder failed for ${payment.customer.name}:`, error.message);
      }
    }

    return { total: pendingPayments.length, sent };
  } catch (error) {
    console.error('Send reminders error:', error);
    throw error;
  }
};

const sendPaymentConfirmation = async (phoneNumber, customerName, amount) => {
  try {
    const message = `🥛 *My Dairy Shop*\n\n✅ Payment Received!\n\nHello ${customerName},\n\nWe have received your payment of *₹${amount}*.\n\nThank you for your business! 🙏`;
    return await sendWhatsAppMessage(phoneNumber, message);
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendDailyPurchaseSummary,
  sendMonthlyBill,
  sendPaymentReminders,
  sendPaymentConfirmation
};
