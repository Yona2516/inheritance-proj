const mysql = require('mysql2/promise'); // Using promise-based API
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: '127.0.0.1', // Explicit IPv4 address
  port: 3306,        // Explicit port
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
    console.error('❌ MySQL connection error: ', err.message);
    process.exit(1); // Exit if DB connection fails
  }
})();

module.exports = pool;