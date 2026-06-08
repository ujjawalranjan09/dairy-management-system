const prisma = require('../src/db');
const { sendPaymentConfirmation } = require('../services/whatsappService');
const { ROLES } = require('../middleware/auth');

const getAllPayments = async (req, res) => {
  try {
    const { month, year, status } = req.query;

    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId) return res.json({ payments: [] });
      let where = { userId: req.ownerId, customerId: req.customerId };
      if (month && year) { where.month = parseInt(month); where.year = parseInt(year); }
      if (status) where.status = status;

      const payments = await prisma.payment.findMany({
        where,
        include: { customer: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ payments });
    }

    let where = { userId: req.ownerId };

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPendingPayments = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      if (!req.customerId) return res.json({ payments: [] });
      const payments = await prisma.payment.findMany({
        where: {
          userId: req.ownerId,
          customerId: req.customerId,
          status: 'PENDING'
        },
        include: { customer: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ payments });
    }

    const payments = await prisma.payment.findMany({
      where: {
        userId: req.ownerId,
        status: 'PENDING'
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createOrUpdatePayment = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customerId, amount, month, year, method } = req.body;

    if (!customerId || !amount || !month || !year) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify customer belongs to business
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(customerId),
        userId: req.ownerId
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        customerId: parseInt(customerId),
        month: parseInt(month),
        year: parseInt(year),
        userId: req.ownerId
      }
    });

    let payment;

    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: parseFloat(amount),
          method: method || 'CASH',
          creatorId: req.user.id
        },
        include: {
          customer: true
        }
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          customerId: parseInt(customerId),
          amount: parseFloat(amount),
          month: parseInt(month),
          year: parseInt(year),
          method: method || 'CASH',
          userId: req.ownerId,
          creatorId: req.user.id
        },
        include: {
          customer: true
        }
      });
    }

    res.json({
      message: existingPayment ? 'Payment updated successfully' : 'Payment created successfully',
      payment
    });
  } catch (error) {
    console.error('Create/update payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAsPaid = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      },
      include: {
        customer: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
        creatorId: req.user.id
      },
      include: {
        customer: true
      }
    });

    // Send WhatsApp notification
    try {
      await sendPaymentConfirmation(
        updatedPayment.customer.phoneNumber,
        updatedPayment.customer.name,
        updatedPayment.amount
      );
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
    }

    res.json({
      message: 'Payment marked as paid',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllPayments,
  getPendingPayments,
  createOrUpdatePayment,
  markAsPaid
};