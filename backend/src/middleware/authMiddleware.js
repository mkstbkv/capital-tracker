const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Получаем токен из заголовка Authorization (формат: "Bearer <TOKEN>")
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Доступ запрещен. Нет токена авторизации.' });
  }

  // 2. Отделяем слово Bearer от самого токена
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Неверный формат токена.' });
  }

  try {
    // 3. Расшифровываем и проверяем токен с помощью нашего секретного ключа
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Записываем данные пользователя (например, его id) в объект запроса
    req.user = decoded; 
    
    // 5. Пропускаем запрос дальше к контроллеру
    next(); 
  } catch (error) {
    res.status(401).json({ message: 'Токен недействителен или его срок истек.' });
  }
};
