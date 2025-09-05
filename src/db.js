const mysql = require('mysql2/promise');
const { DATABASE_URL } = process.env;

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(DATABASE_URL);
  }
  return pool;
}

module.exports = { getPool };
