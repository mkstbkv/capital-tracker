const express = require('express');
const router = express.Router();
const { getGoals, createGoal, fundGoal } = require('../controllers/goalController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getGoals);
router.post('/', authMiddleware, createGoal);
router.post('/fund', authMiddleware, fundGoal);

module.exports = router;
