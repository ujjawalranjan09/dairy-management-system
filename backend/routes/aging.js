const express = require('express');
const router = express.Router();
const { getAgingReport } = require('../controllers/agingController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getAgingReport);

module.exports = router;
