const express = require('express');
const router = express.Router();
const { createAccount, getAccounts } = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createAccount);
router.get('/', authMiddleware, getAccounts);

module.exports = router;
