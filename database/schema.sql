CREATE DATABASE IF NOT EXISTS studyhub;
USE studyhub;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

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
);
