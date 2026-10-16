const express = require('express');
const router = express.Router();
const { setBudget, getBudgetsWithExpenses } = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, setBudget);
router.get('/status', authMiddleware, getBudgetsWithExpenses);

module.exports = router;