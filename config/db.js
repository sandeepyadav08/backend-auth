// db.js
require('dotenv').config(); // Make sure this is at the top

const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,       // mysql.railway.internal
  user: process.env.DB_USER,       // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // railway
  port: process.env.DB_PORT || 3306,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ MySQL connected successfully!');
  }
});

module.exports = connection;
