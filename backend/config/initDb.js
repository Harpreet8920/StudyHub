const mysql = require("mysql2/promise");
const { getDatabaseConfig } = require("./env");

async function ensureColumn(connection, dbName, tableName, columnName, definition) {
  const [rows] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [dbName, tableName, columnName]
  );

  if (rows.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }
}

async function initializeDatabase() {
  const dbConfig = getDatabaseConfig();
  const dbName = dbConfig.database || "studyhub";

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      task_name VARCHAR(255) NOT NULL,
      status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      due_date DATE NULL,
      category ENUM('Study', 'Personal', 'Work') NOT NULL DEFAULT 'Study',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_tasks FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await ensureColumn(
    connection,
    dbName,
    "tasks",
    "priority",
    "`priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' AFTER `status`"
  );
  await ensureColumn(connection, dbName, "tasks", "due_date", "`due_date` DATE NULL AFTER `priority`");
  await ensureColumn(
    connection,
    dbName,
    "tasks",
    "category",
    "`category` ENUM('Study', 'Personal', 'Work') NOT NULL DEFAULT 'Study' AFTER `due_date`"
  );

  await connection.end();
}

module.exports = initializeDatabase;
