const mysql = require("mysql2/promise");
const { getDatabaseConfig } = require("./env");

const dbConfig = getDatabaseConfig();
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: dbConfig.ssl
});

module.exports = pool;
