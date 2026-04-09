export default class TaskModel {
  constructor({
    id,
    taskName,
    task_name,
    status,
    priority,
    dueDate,
    due_date,
    category,
    createdAt,
    created_at
  }) {
    this.id = id;
    this.taskName = taskName || task_name;
    this.status = status;
    this.priority = priority || "medium";
    this.dueDate = dueDate || due_date || null;
    this.category = category || "Study";
    this.createdAt = createdAt || created_at;
  }

  isCompleted() {
    return this.status === "completed";
  }

  isOverdue() {
    if (!this.dueDate || this.isCompleted()) return false;
    const today = new Date();
    const due = new Date(this.dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  normalizedDueDate() {
    if (!this.dueDate) return "";
    if (this.dueDate instanceof Date) return this.dueDate.toISOString().slice(0, 10);
    const asString = String(this.dueDate);
    if (/^\d{4}-\d{2}-\d{2}/.test(asString)) return asString.slice(0, 10);
    const parsed = new Date(asString);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return "";
  }

  formattedDate() {
    return new Date(this.createdAt).toLocaleString();
  }
}
