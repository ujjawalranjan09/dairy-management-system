const prisma = require('../src/db');
const { ROLES } = require('../middleware/auth');

const getAllProducts = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: { userId: req.ownerId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    if (req.userRole === ROLES.CUSTOMER) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    // Only ADMIN can manage products (pricing is critical)
    if (req.userRole !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only administrators can create products' });
    }

    const { productName, price, unit } = req.body;

    if (!productName || !price || !unit) {
      return res.status(400).json({ error: 'Product name, price, and unit are required' });
    }

    const product = await prisma.product.create({
      data: {
        productName,
        price: parseFloat(price),
        unit,
        userId: req.ownerId
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (req.userRole !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only administrators can update products' });
    }

    const { id } = req.params;
    const { productName, price, unit } = req.body;

    if (!productName || !price || !unit) {
      return res.status(400).json({ error: 'Product name, price, and unit are required' });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        productName,
        price: parseFloat(price),
        unit
      }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (req.userRole !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Only administrators can delete products' });
    }

    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: parseInt(id),
        userId: req.ownerId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};