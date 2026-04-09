class Task {
  constructor({ id, user_id, task_name, status, priority, due_date, category, created_at }) {
    this.id = id;
    this.userId = user_id;
    this.taskName = task_name;
    this.status = status;
    this.priority = priority;
    this.dueDate = due_date;
    this.category = category;
    this.createdAt = created_at;
  }

  toggleStatus() {
    this.status = this.status === "completed" ? "pending" : "completed";
    return this.status;
  }

  isCompleted() {
    return this.status === "completed";
  }
}

module.exports = Task;
