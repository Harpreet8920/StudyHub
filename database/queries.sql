USE studyhub;

-- Signup
INSERT INTO users (username, email, password) VALUES (?, ?, ?);

-- Find user by email
SELECT * FROM users WHERE email = ?;

-- Fetch tasks for logged-in user
SELECT id, user_id, task_name, status, priority, due_date, category, created_at
FROM tasks
WHERE user_id = ?
ORDER BY created_at DESC;

-- Add task
INSERT INTO tasks (user_id, task_name, status, priority, due_date, category)
VALUES (?, ?, 'pending', ?, ?, ?);

-- Edit/toggle/update task
UPDATE tasks
SET task_name = ?, status = ?, priority = ?, due_date = ?, category = ?
WHERE id = ? AND user_id = ?;

-- Delete task
DELETE FROM tasks
WHERE id = ? AND user_id = ?;
