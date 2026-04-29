const mysql = require("mysql2/promise");
const { getDatabaseConfig } = require("./env");

const dbConfig = getDatabaseConfig();

// Use connection string directly if available, otherwise use object
const pool = mysql.createPool(process.env.DATABASE_URL || {
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: dbConfig.ssl
});

module.exports = pool;
