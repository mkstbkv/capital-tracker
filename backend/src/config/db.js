const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('Ошибка бэкенда при подключении к PG:', err.stack);
  else console.log('Бэкенд успешно подключен к PostgreSQL!');
});

module.exports = pool;
