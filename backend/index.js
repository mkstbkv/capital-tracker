const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const categoryRoutes = require('./src/routes/categoryRoutes'); 
const currencyRoutes = require('./src/routes/currencyRoutes'); 
const budgetRoutes = require('./src/routes/budgetRoutes');
const app = express();

app.use(cors());
app.use(express.json());

// Подключение изолированных маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/currency', currencyRoutes); 
app.use('/api/budgets', budgetRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен по адресу: http://localhost:${PORT}`);
});
