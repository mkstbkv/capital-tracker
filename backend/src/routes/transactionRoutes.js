const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, deleteTransaction, getBankStatement } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Все операции с деньгами строго защищены токеном
router.post('/', authMiddleware, createTransaction); // POST /api/transactions
router.get('/', authMiddleware, getTransactions);    // GET /api/transactions
router.delete('/:id', authMiddleware, deleteTransaction); 
router.get('/statement', authMiddleware, getBankStatement); 

module.exports = router;
