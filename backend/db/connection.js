// db/connection.js
// ============================================
// Sets up the MySQL connection pool.
// A "pool" means it keeps a few connections open
// and reuses them, which is faster than opening
// a new connection on every request.
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // How many connections to keep open at once
  waitForConnections: true,
  connectionLimit: 10,
});
/*
mysql.createPool uses those .env credentials to authenticate — that's the master key moment. 
And database: process.env.DB_NAME tells it to specifically use ai_librarian. 
So by the time any route file calls pool.execute(...), the connection is already authenticated and pointed at the right database.
*/

// Test the connection when the server starts
// so you know immediately if something is wrong
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release(); // Always release connections back to the pool!
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your .env file — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  });

module.exports = pool;
