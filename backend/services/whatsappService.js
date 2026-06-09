const axios = require('axios');
const prisma = require('../src/db');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Format phone number (remove + and any spaces)
    const formattedPhone = phoneNumber.replace(/[\s+]/g, '');

    if (!WHATSAPP_API_URL || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('WhatsApp API not configured. Message would be sent to:', phoneNumber);
      console.log('Message:', message);
      return { success: true, simulated: true };
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
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

    // Get all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Get today's purchases for this user
      const purchases = await prisma.purchase.findMany({
        where: {
          userId: user.id,
          date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          customer: true,
          product: true
        }
      });

      // Group by customer
      const customerPurchases = purchases.reduce((acc, purchase) => {
        const customerId = purchase.customerId;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer: purchase.customer,
            purchases: [],
            total: 0
          };
        }
        acc[customerId].purchases.push(purchase);
        acc[customerId].total += purchase.quantity * Number(purchase.price);
        return acc;
      }, {});

      // Send message to each customer
      for (const customerId in customerPurchases) {
        const { customer, purchases: custPurchases, total } = customerPurchases[customerId];

        // Get monthly total for this customer
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const monthlyPurchases = await prisma.purchase.findMany({
          where: {
            userId: user.id,
            customerId: customer.id,
            date: {
              gte: currentMonth,
              lt: tomorrow
            }
          }
        });

        const monthlyTotal = monthlyPurchases.reduce((sum, p) => sum + (p.quantity * Number(p.price)), 0);

        // Build message
        let message = `Hello ${customer.name}\n\n`;
        message += `Today's Dairy Purchases\n\n`;

        custPurchases.forEach(p => {
          const itemTotal = p.quantity * Number(p.price);
          message += `${p.product.productName} ${p.quantity}${p.product.unit} = ₹${itemTotal}\n`;
        });

        message += `\nTotal Today = ₹${total}\n`;
        message += `Running Monthly Total = ₹${monthlyTotal}`;

        try {
          await sendWhatsAppMessage(customer.phoneNumber, message);
          console.log(`Daily summary sent to ${customer.name}`);
        } catch (error) {
          console.error(`Failed to send daily summary to ${customer.name}:`, error);
        }
      }
    }

    console.log('Daily purchase summaries completed');
  } catch (error) {
    console.error('Daily purchase summary error:', error);
    throw error;
  }
};

const sendPaymentConfirmation = async (phoneNumber, customerName, amount) => {
  try {
    const message = `Hello ${customerName}\n\nYour payment of ₹${amount} has been received.\n\nThank you for your business.`;

    return await sendWhatsAppMessage(phoneNumber, message);
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendDailyPurchaseSummary,
  sendPaymentConfirmation
};