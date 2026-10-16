const db = require('../config/db');

// 1. Создание транзакции (остается без изменений, всё четко)
exports.createTransaction = async (req, res) => {
  const { account_id, target_account_id, category_id, amount, type, description } = req.body;
  const userId = req.user.id;

  if (!account_id || !amount || !type) {
    return res.status(400).json({ message: 'Счет, сумма и тип транзакции обязательны' });
  }

  const txAmount = parseFloat(amount);
  if (txAmount <= 0) return res.status(400).json({ message: 'Сумма должна быть больше нуля' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const accountCheck = await client.query(
      'SELECT id, balance, currency FROM accounts WHERE id = \$1 AND user_id = \$2',
      [parseInt(account_id), parseInt(userId)]
    );

    if (accountCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Счет не найден' });
    }

    const sourceAccount = accountCheck.rows[0];

    if (type === 'income') {
      await client.query('UPDATE accounts SET balance = balance + \$1 WHERE id = \$2', [txAmount, parseInt(account_id)]);
    } else if (type === 'expense') {
      await client.query('UPDATE accounts SET balance = balance - \$1 WHERE id = \$2', [txAmount, parseInt(account_id)]);
    } else if (type === 'transfer') {
      const targetCheck = await client.query(
        'SELECT id, currency FROM accounts WHERE id = \$1 AND user_id = \$2',
        [parseInt(target_account_id), parseInt(userId)]
      );
      if (targetCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Счет-получатель не найден' });
      }

      const targetAccount = targetCheck.rows[0];
      if (sourceAccount.currency !== targetAccount.currency) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Разные валюты!' });
      }

      await client.query('UPDATE accounts SET balance = balance - \$1 WHERE id = \$2', [txAmount, parseInt(account_id)]);
      await client.query('UPDATE accounts SET balance = balance + \$1 WHERE id = \$2', [txAmount, parseInt(target_account_id)]);
    }

    await client.query(
      'INSERT INTO transactions (user_id, account_id, target_account_id, category_id, amount, type, description) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7)',
      [userId, account_id, type === 'transfer' ? target_account_id : null, type === 'transfer' ? null : category_id, txAmount, type, description || '']
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Успешно' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
};

// 2. ПОЛНОЦЕННЫЙ БАНКОВСКИЙ РАСЧЕТ ВЫПИСКИ ИЗ БАЗЫ ДАННЫХ
exports.getBankStatement = async (req, res) => {
  const userId = req.user.id;
  const { account_id, filterMode, month, year, startDate, endDate } = req.query;

  if (!account_id) return res.status(400).json({ message: 'account_id обязателен' });

  try {
    // Определяем временные границы выписки
    let startPeriod, endPeriod;
    if (filterMode === 'month') {
      startPeriod = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
      let nextMonth = parseInt(month) + 1;
      let nextYear = parseInt(year);
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      endPeriod = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`;
    } else {
      startPeriod = `${startDate} 00:00:00`;
      endPeriod = `${endDate} 23:59:59`;
    }

    // МАТЕМАТИКА 1: Считаем остаток строго ДО НАЧАЛА выбранного периода
    const startBalanceResult = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'income' AND account_id = $1 THEN amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN type = 'expense' AND account_id = $1 THEN amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN type = 'transfer' AND account_id = $1 THEN amount ELSE 0 END), 0) +
         COALESCE(SUM(CASE WHEN type = 'transfer' AND target_account_id = $1 THEN amount ELSE 0 END), 0) as start_balance
       FROM transactions 
       WHERE user_id = $2 AND transaction_date < $3`,
      [parseInt(account_id), parseInt(userId), startPeriod]
    );
    const startBalance = parseFloat(startBalanceResult.rows[0].start_balance);

    // МАТЕМАТИКА 2: Извлекаем транзакции строго внутри периода и считаем обороты
    const txResult = await db.query(
      `SELECT t.*, a.name as account_name, c.name as category_name 
       FROM transactions t
       JOIN accounts a ON t.account_id = a.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND (t.account_id = $2 OR t.target_account_id = $2)
         AND t.transaction_date >= $3 AND t.transaction_date <= $4
       ORDER BY t.transaction_date DESC`,
      [parseInt(userId), parseInt(account_id), startPeriod, endPeriod]
    );

    const periodTransactions = txResult.rows;

    let totalIn = 0;
    let totalOut = 0;

    periodTransactions.forEach(t => {
      if (t.type === 'transfer' && t.target_account_id === parseInt(account_id)) {
        totalIn += parseFloat(t.amount);
      } else if (t.type === 'income') {
        totalIn += parseFloat(t.amount);
      } else {
        totalOut += parseFloat(t.amount);
      }
    });

    // МАТЕМАТИКА 3: Конечный баланс = Начало + Приход - Расход
    const endBalance = startBalance + totalIn - totalOut;

    res.json({
      startBalance,
      totalIn,
      totalOut,
      endBalance,
      transactions: periodTransactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// 3. Получение транзакций для главной страницы (остается прежним)
exports.getTransactions = async (req, res) => {
  const userId = req.user.id;
  const { month, year, startDate, endDate } = req.query;
  try {
    let queryText = `
      SELECT t.*, a.name as account_name, c.name as category_name 
      FROM transactions t JOIN accounts a ON t.account_id = a.id LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = $1
    `;
    const queryParams = [parseInt(userId)];
    if (startDate && endDate) {
      queryText += ` AND t.transaction_date >= $2 AND t.transaction_date <= $3`;
      queryParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    } else if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
      let nextMonth = parseInt(month) + 1; let nextYear = parseInt(year);
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`;
      queryText += ` AND t.transaction_date >= $2 AND t.transaction_date < $3`;
      queryParams.push(start, end);
    }
    queryText += ` ORDER BY t.transaction_date DESC`;
    const transactions = await db.query(queryText, queryParams);
    res.json(transactions.rows);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// 4. Удаление (остается прежним)
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const txCheck = await client.query('SELECT * FROM transactions WHERE id = \$1 AND user_id = \$2', [parseInt(id), parseInt(userId)]);
    if (txCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Нет доступа' }); }
    const tx = txCheck.rows[0];
    const txAmount = parseFloat(tx.amount);
    if (tx.type === 'income') await client.query('UPDATE accounts SET balance = balance - \$1 WHERE id = \$2', [txAmount, tx.account_id]);
    else if (tx.type === 'expense') await client.query('UPDATE accounts SET balance = balance + \$1 WHERE id = \$2', [txAmount, tx.account_id]);
    else if (tx.type === 'transfer') {
      await client.query('UPDATE accounts SET balance = balance + \$1 WHERE id = \$2', [txAmount, tx.account_id]);
      if (tx.target_account_id) await client.query('UPDATE accounts SET balance = balance - \$1 WHERE id = \$2', [txAmount, tx.target_account_id]);
    }
    await client.query('DELETE FROM transactions WHERE id = \$1', [parseInt(id)]);
    await client.query('COMMIT');
    res.json({ message: 'Успешно' });
  } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ message: 'Ошибка' }); } finally { client.release(); }
};
