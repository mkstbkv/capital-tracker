const db = require('../config/db');

// Получение общих и личных категорий
exports.getCategories = async (req, res) => {
  try {
    const categories = await db.query(
      'SELECT * FROM categories WHERE user_id IS NULL OR user_id = $1 ORDER BY name ASC',
      [parseInt(req.user.id)]
    );
    res.json(categories.rows);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ message: 'Ошибка при получении категорий' });
  }
};

// Создание личной категории пользователем
exports.createCategory = async (req, res) => {
  const { name, type } = req.body;
  const userId = req.user.id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Название и тип категории обязательны' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ message: 'Неверный тип категории' });
  }

  try {
    const cleanName = name.trim();

    // Проверяем, нет ли уже категории с таким же именем (регистронезависимо)
    const checkExists = await db.query(
      'SELECT * FROM categories WHERE (user_id = $1 OR user_id IS NULL) AND LOWER(name) = LOWER($2) AND type = $3',
      [parseInt(userId), cleanName, type]
    );

    if (checkExists.rows.length > 0) {
      return res.status(400).json({ message: 'Такая категория уже существует в вашей системе' });
    }

    // Сохраняем категорию в базу данных
    const newCategory = await db.query(
      'INSERT INTO categories (user_id, name, type, icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [parseInt(userId), cleanName, type, 'folder']
    );

    res.status(201).json({ 
      message: 'Категория успешно создана', 
      category: newCategory.rows[0] 
    });
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА КАТЕГОРИЙ:', error.message);
    res.status(500).json({ message: 'Ошибка сервера при сохранении категории' });
  }
};
