import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, clearToken } from "../api";
import TaskModel from "../models/Task";
import TaskStats from "../components/TaskStats";

const DEFAULT_FORM = {
  task_name: "",
  priority: "medium",
  due_date: "",
  category: "Study"
};

function DashboardPage() {
  const navigate = useNavigate();
  const [taskForm, setTaskForm] = useState(DEFAULT_FORM);
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [notesInput, setNotesInput] = useState("");
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const addTaskInputRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    const savedNotes = JSON.parse(localStorage.getItem("studyhub_notes") || "[]");
    setNotes(savedNotes);
    const savedTheme = localStorage.getItem("studyhub_theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("studyhub_theme", darkMode ? "dark" : "light");
    document.body.classList.toggle("dark-mode", darkMode);
    return () => document.body.classList.remove("dark-mode");
  }, [darkMode]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await apiRequest("/tasks");
      const mapped = data.map((item) => new TaskModel(item));
      setTasks(mapped);
    } catch (apiError) {
      if (apiError.message.toLowerCase().includes("unauthorized")) {
        clearToken();
        navigate("/login");
        return;
      }
      setError(apiError.message);
    } finally {
      setLoadingTasks(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const handleTaskField = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    setError("");
    if (!taskForm.task_name.trim()) {
      setError("Task cannot be empty.");
      return;
    }

    try {
      if (editingId) {
        const updated = await apiRequest(`/tasks/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(taskForm)
        });
        const updatedTask = new TaskModel(updated);
        setTasks((prev) => prev.map((task) => (task.id === editingId ? updatedTask : task)));
        showToast("Task updated successfully.");
        resetTaskForm();
        return;
      }

      const created = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify(taskForm)
      });
      setTasks((prev) => [new TaskModel(created), ...prev]);
      showToast("Task added successfully.");
      resetTaskForm();
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const updated = await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: currentStatus === "completed" ? "pending" : "completed" })
      });
      const updatedTask = new TaskModel(updated);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));
      showToast(updatedTask.isCompleted() ? "Task marked complete." : "Task moved back to pending.");
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showToast("Task deleted successfully.");
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingId(task.id);
    setTaskForm({
      task_name: task.taskName,
      priority: task.priority,
      due_date: task.normalizedDueDate(),
      category: task.category
    });
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    if (!notesInput.trim()) {
      return;
    }
    const updatedNotes = [{ id: Date.now(), text: notesInput.trim() }, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem("studyhub_notes", JSON.stringify(updatedNotes));
    setNotesInput("");
    showToast("Note saved.");
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem("studyhub_notes", JSON.stringify(updatedNotes));
    showToast("Note deleted.");
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const focusAddTask = () => {
    addTaskInputRef.current?.focus();
  };

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <main className="dashboard-page">
      <section className="dashboard-head">
        <h2>Student Dashboard</h2>
        <div className="dashboard-actions">
          <button type="button" className="ghost-btn" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button type="button" className="secondary-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      {error && <p className="error-msg">{error}</p>}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <section className="dashboard-grid">
        <div className="task-panel card">
          <h3>Tasks</h3>
          <form onSubmit={handleAddTask} className="inline-form">
            <input
              ref={addTaskInputRef}
              name="task_name"
              type="text"
              value={taskForm.task_name}
              onChange={handleTaskField}
              placeholder="Add new task"
            />
            <select name="priority" value={taskForm.priority} onChange={handleTaskField}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input name="due_date" type="date" value={taskForm.due_date} onChange={handleTaskField} />
            <select name="category" value={taskForm.category} onChange={handleTaskField}>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
            </select>
            <button type="submit" className="primary-btn">
              {editingId ? "Save" : "Add"}
            </button>
            {editingId && (
              <button type="button" className="ghost-btn" onClick={resetTaskForm}>
                Cancel
              </button>
            )}
          </form>

          <form className="filters-form" onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              placeholder="Search by task name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All Categories</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
            </select>
          </form>

          <div className="task-list">
            {loadingTasks ? (
              <p className="muted-text loading-text">Loading tasks...</p>
            ) : visibleTasks.length === 0 ? (
              <div className="empty-state">
                <p className="muted-text">No tasks yet. Add your first task!</p>
                <button type="button" className="primary-btn" onClick={focusAddTask}>
                  Create Your First Task
                </button>
              </div>
            ) : (
              visibleTasks.map((task) => (
                <article key={task.id} className={`task-card ${task.isOverdue() ? "task-overdue" : ""}`}>
                  <div>
                    <h4 className={task.isCompleted() ? "done-text" : ""}>{task.taskName}</h4>
                    <small>
                      {task.category} | {task.priority.toUpperCase()} | Due: {" "}
                      {task.normalizedDueDate() || "Not set"}
                      {task.isOverdue() ? " | Overdue" : ""}
                    </small>
                    <small className="created-at">Created: {task.formattedDate()}</small>
                  </div>
                  <div className="task-actions">
                    <button
                      type="button"
                      className={task.isCompleted() ? "secondary-btn" : "success-btn"}
                      onClick={() => handleToggleTask(task.id, task.status)}
                    >
                      {task.isCompleted() ? "Mark Pending" : "Mark Done"}
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => handleEditTask(task)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="notes-panel card">
          <h3>Quick Notes</h3>
          <form onSubmit={handleAddNote} className="inline-form">
            <input
              type="text"
              value={notesInput}
              onChange={(event) => setNotesInput(event.target.value)}
              placeholder="Write a quick note"
            />
            <button type="submit" className="primary-btn">
              Save
            </button>
          </form>
          <div className="notes-list">
            {notes.length === 0 ? (
              <p className="muted-text">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="note-card">
                  <p>{note.text}</p>
                  <button type="button" className="danger-btn" onClick={() => handleDeleteNote(note.id)}>
                    Delete
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <TaskStats tasks={tasks} />
    </main>
  );
}

export default DashboardPage;
