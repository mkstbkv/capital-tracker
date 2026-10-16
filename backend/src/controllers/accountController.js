const db = require('../config/db');

exports.createAccount = async (req, res) => {
  const { name, balance, currency } = req.body;
  const userId = req.user.id;
  try {
    if (!name) return res.status(400).json({ message: 'Название счета обязательно' });

    const newAccount = await db.query(
      'INSERT INTO accounts (user_id, name, balance, currency) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, balance || 0.00, currency || 'RUB']
    );
    res.status(201).json(newAccount.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании счета' });
  }
};

exports.getAccounts = async (req, res) => {
  const userId = req.user.id;
  try {
    const accounts = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(accounts.rows);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении счетов' });
  }
};
