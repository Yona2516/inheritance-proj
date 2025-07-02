const mysql = require('mysql2/promise'); // Using promise-based API
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inheritance',
  password: process.env.DB_PASSWORD || '@Eliakimu122',
  database: process.env.DB_NAME || 'inheritance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection established');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
})();

module.exports = pool;