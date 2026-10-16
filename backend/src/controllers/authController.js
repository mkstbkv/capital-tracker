const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'Email уже занят' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, passwordHash]
    );
    res.status(201).json({ message: 'Успешная регистрация', user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Получаем пользователя по email (индекс 0 обязателен)
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const user = userResult.rows[0]; // ИСПРАВЛЕНО: Достаем первый объект юзера из массива rows

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Ошибка входа:', err.message);
    res.status(500).json({ message: 'Ошибка сервера на бэкенде' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userResult = await db.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(userResult.rows[0]); // ИСПРАВЛЕНО: возвращаем первый элемент
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
