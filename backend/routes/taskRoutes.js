const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");
const Task = require("../models/Task");

const router = express.Router();
const VALID_STATUS = ["pending", "completed"];
const VALID_PRIORITY = ["low", "medium", "high"];
const VALID_CATEGORY = ["Study", "Personal", "Work"];

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

router.use(authMiddleware);

router.get("/tasks", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
        SELECT id, user_id, task_name, status, priority, due_date, category, created_at
        FROM tasks
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const tasks = rows.map((row) => new Task(row));
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return res.status(500).json({ message: "Could not fetch tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { task_name, priority = "medium", due_date = null, category = "Study" } = req.body;
    if (!task_name || !task_name.trim()) {
      return res.status(400).json({ message: "Task name is required" });
    }
    if (!VALID_PRIORITY.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (!VALID_CATEGORY.includes(category)) {
      return res.status(400).json({ message: "Invalid category value" });
    }
    if (due_date && !isValidDateString(due_date)) {
      return res.status(400).json({ message: "Invalid due date format (YYYY-MM-DD required)" });
    }

    const [result] = await pool.execute(
      `
        INSERT INTO tasks (user_id, task_name, status, priority, due_date, category)
        VALUES (?, ?, 'pending', ?, ?, ?)
      `,
      [req.user.id, task_name.trim(), priority, due_date || null, category]
    );

    const [createdRows] = await pool.execute(
      `
        SELECT id, user_id, task_name, status, priority, due_date, category, created_at
        FROM tasks
        WHERE id = ? AND user_id = ?
      `,
      [result.insertId, req.user.id]
    );

    const createdTask = new Task(createdRows[0]);
    return res.status(201).json(createdTask);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ message: "Could not create task" });
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const [rows] = await pool.execute(
      `
        SELECT id, user_id, task_name, status, priority, due_date, category, created_at
        FROM tasks
        WHERE id = ? AND user_id = ?
      `,
      [taskId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const currentTask = new Task(rows[0]);
    const updates = {};
    const allowedFields = ["task_name", "status", "priority", "due_date", "category"];
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      updates.status = currentTask.toggleStatus();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "task_name")) {
      if (!updates.task_name || !String(updates.task_name).trim()) {
        return res.status(400).json({ message: "Task name cannot be empty" });
      }
      updates.task_name = String(updates.task_name).trim();
    }
    if (Object.prototype.hasOwnProperty.call(updates, "status") && !VALID_STATUS.includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "priority") &&
      !VALID_PRIORITY.includes(updates.priority)
    ) {
      return res.status(400).json({ message: "Invalid priority value" });
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "category") &&
      !VALID_CATEGORY.includes(updates.category)
    ) {
      return res.status(400).json({ message: "Invalid category value" });
    }
    if (Object.prototype.hasOwnProperty.call(updates, "due_date") && !updates.due_date) {
      updates.due_date = null;
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, "due_date") &&
      updates.due_date &&
      !isValidDateString(updates.due_date)
    ) {
      return res.status(400).json({ message: "Invalid due date format (YYYY-MM-DD required)" });
    }

    const setClauses = Object.keys(updates).map((field) => `${field} = ?`);
    const values = [...Object.values(updates), taskId, req.user.id];
    await pool.execute(
      `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updatedRows] = await pool.execute(
      `
        SELECT id, user_id, task_name, status, priority, due_date, category, created_at
        FROM tasks
        WHERE id = ? AND user_id = ?
      `,
      [taskId, req.user.id]
    );
    const updatedTask = new Task(updatedRows[0]);

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ message: "Could not update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", [
      taskId,
      req.user.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ message: "Could not delete task" });
  }
});

module.exports = router;
