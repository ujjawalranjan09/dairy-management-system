const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = require('./src/db');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const purchaseRoutes = require('./routes/purchases');
const billingRoutes = require('./routes/billing');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    name: 'Dairy Management System API',
    version: '1.0.0',
    documentation: 'https://github.com/ujjawalranjan09/dairy-management-system',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dairy Management System API is running' });
});

// Import WhatsApp service for cron job
const { sendDailyPurchaseSummary } = require('./services/whatsappService');

// Schedule daily WhatsApp notifications at 10 PM
cron.schedule('0 22 * * *', async () => {
  console.log('Running daily WhatsApp notification job...');
  try {
    await sendDailyPurchaseSummary();
    console.log('Daily WhatsApp notifications sent successfully');
  } catch (error) {
    console.error('Error sending daily WhatsApp notifications:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Seed default admin if database is empty
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@dairy.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      });
      console.log('Seeded default admin user: admin@dairy.com / admin123');
    }
  } catch (error) {
    console.error('Failed to seed default admin:', error);
  }
});

module.exports = app;