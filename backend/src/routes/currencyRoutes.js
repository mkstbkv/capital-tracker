const express = require('express');
const router = express.Router();
const { getExchangeRates } = require('../controllers/currencyController');
const authMiddleware = require('../middleware/authMiddleware');

// Доступ к курсам защищаем токеном авторизации
router.get('/rates', authMiddleware, getExchangeRates);

module.exports = router;
