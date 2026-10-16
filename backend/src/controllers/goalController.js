const db = require('../config/db');

// 1. Получить все цели пользователя
exports.getGoals = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM saving_goals WHERE user_id = \$1 ORDER BY created_at DESC',
      [parseInt(req.user.id)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при получении целей' });
  }
};

// 2. Создать новую финансовую цель
exports.createGoal = async (req, res) => {
  const { name, target_amount, currency } = req.body;
  const userId = req.user.id;

  if (!name || !target_amount) {
    return res.status(400).json({ message: 'Название и сумма цели обязательны' });
  }

  try {
    const result = await db.query(
      `INSERT INTO saving_goals (user_id, name, target_amount, currency) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [parseInt(userId), name.trim(), parseFloat(target_amount), currency || 'KGS']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при создании цели' });
  }
};

// 3. Пополнить копилку со списанием с реального счета (Транзакция базы данных)
exports.fundGoal = async (req, res) => {
  const { goal_id, account_id, amount } = req.body;
  const userId = req.user.id;

  if (!goal_id || !account_id || !amount) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  const fundAmount = parseFloat(amount);
  if (fundAmount <= 0) return res.status(400).json({ message: 'Сумма должна быть больше нуля' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Проверяем реальный счет и его баланс
    const accountCheck = await client.query(
      'SELECT id, balance, currency FROM accounts WHERE id = \$1 AND user_id = \$2',
      [parseInt(account_id), parseInt(userId)]
    );

    if (accountCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Счет списания не найден' });
    }

    const account = accountCheck.rows[0];
    if (parseFloat(account.balance) < fundAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Недостаточно средств на выбранном счете!' });
    }

    // Списываем деньги со счета
    await client.query('UPDATE accounts SET balance = balance - \$1 WHERE id = \$2', [fundAmount, account.id]);

    // Добавляем деньги в виртуальную копилку
    await client.query('UPDATE saving_goals SET current_amount = current_amount + \$1 WHERE id = \$2 AND user_id = \$3', [fundAmount, parseInt(goal_id), userId]);

    // Фиксируем это как системный перевод в истории транзакций, чтобы математика выписок сходилась!
    await client.query(
      `INSERT INTO transactions (user_id, account_id, target_account_id, category_id, amount, type, description) 
       VALUES ($1, $2, NULL, NULL, $3, 'expense', $4)`,
      [userId, account.id, fundAmount, `Пополнение копилки (Цель ID: ${goal_id})`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Копилка успешно пополнена' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Ошибка транзакции пополнения' });
  } finally {
    client.release();
  }
};
