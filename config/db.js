// db.js
require('dotenv').config(); // Load environment variables

const mysql = require('mysql2');

// ✅ Create connection and store it in `db`
const db = mysql.createConnection({
  host: process.env.DB_HOST,       // e.g., gondola.proxy.rlwy.net
  user: process.env.DB_USER,       // e.g., root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // e.g., railway
  port: process.env.DB_PORT || 3306,
});

// ✅ Use `db.connect` instead of `connection.connect`
db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ MySQL connected successfully!');
  }
});

// ✅ Export the `db` object
module.exports = db;
