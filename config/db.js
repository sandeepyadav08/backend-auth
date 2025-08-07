// db.js
require('dotenv').config(); // Load environment variables

const mysql = require('mysql2');

// ✅ Create promise-based connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,       // e.g., gondola.proxy.rlwy.net
  user: process.env.DB_USER,       // e.g., root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,   // e.g., railway
  port: process.env.DB_PORT || 3306,
});

// ✅ Optional: Log if connected (callback-style)
db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ MySQL connected successfully!');
  }
});

// ✅ Export promise-wrapped version
module.exports = db.promise();
