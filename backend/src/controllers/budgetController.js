const db = require('../config/db');

// 1. ФУНКЦИЯ УСТАНОВКИ ЛИМИТА (То, что просил роутер)
exports.setBudget = async (req, res) => {
  const { category_id, amount, month, year } = req.body;
  const userId = req.user.id;

  if (!category_id || !amount || !month || !year) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Лимит должен быть больше нуля' });
  }

  try {
    const result = await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [parseInt(userId), parseInt(category_id), parseFloat(amount), parseInt(month), parseInt(year)]
    );

    res.status(200).json({ message: 'Лимит успешно установлен', budget: result.rows });
  } catch (error) {
    console.error('Ошибка при установке лимита:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// 2. БЕЗОПАСНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ БЮДЖЕТОВ С АВТОПОДСТАНОВКОЙ ДАТ
exports.getBudgetsWithExpenses = async (req, res) => {
  const userId = req.user.id;
  const { filterMode, month, year, startDate, endDate } = req.query;

  try {
    let startPeriod, endPeriod;
    let budgetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    let budgetYear = year ? parseInt(year) : new Date().getFullYear();

    if (filterMode === 'range' && startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
      const startParsed = new Date(startDate);
      budgetMonth = startParsed.getMonth() + 1;
      budgetYear = startParsed.getFullYear();
      startPeriod = `${startDate} 00:00:00`;
      endPeriod = `${endDate} 23:59:59`;
    } else {
      const targetMonth = month ? parseInt(month) : budgetMonth;
      const targetYear = year ? parseInt(year) : budgetYear;
      
      startPeriod = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
      
      let nextMonth = targetMonth + 1;
      let nextYear = targetYear;
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      endPeriod = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`;
      
      budgetMonth = targetMonth;
      budgetYear = targetYear;
    }

    const result = await db.query(
      `SELECT 
         c.id as category_id,
         c.name as category_name,
         COALESCE(b.amount, 0) as limit_amount,
         COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as current_expense
       FROM categories c
       LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = $1 AND b.month = $4 AND b.year = $5
       LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = $1 
         AND t.transaction_date >= $2 AND t.transaction_date <= $3
       WHERE c.type = 'expense' AND (c.user_id IS NULL OR c.user_id = $1)
       GROUP BY c.id, c.name, b.amount
       ORDER BY c.name ASC`,
      [parseInt(userId), startPeriod, endPeriod, budgetMonth, budgetYear]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении динамических бюджетов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
