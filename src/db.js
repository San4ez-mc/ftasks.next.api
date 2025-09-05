const mysql = require('mysql2/promise');
const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

let pool;

function getPool() {
  if (!pool) {
    if (DATABASE_URL) {
      pool = mysql.createPool(DATABASE_URL);
    } else {
      pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
      });
    }
  }
  return pool;
}

module.exports = { getPool };
