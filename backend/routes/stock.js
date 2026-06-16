const express = require('express');
const router = express.Router();
const { getStock, saveStock, getStockSummary } = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getStock);
router.post('/', saveStock);
router.get('/summary', getStockSummary);

module.exports = router;
