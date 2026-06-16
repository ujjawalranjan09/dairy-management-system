const express = require('express');
const router = express.Router();
const { createAdvance, getAdvances, useAdvance } = require('../controllers/advanceController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getAdvances);
router.post('/', createAdvance);
router.post('/use', useAdvance);

module.exports = router;
