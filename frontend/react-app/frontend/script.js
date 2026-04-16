(() => {
  const API_BASE_URL =
    document.querySelector('meta[name="api-base-url"]')?.content || "http://localhost:5000/api";

  const TOKEN_KEY = "studyhub_token";
  const NOTES_KEY = "studyhub_notes";
  const THEME_KEY = "studyhub_theme";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function apiRequest(path, options = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_error) {
      data = null;
    }

    if (!response.ok) {
      throw new Error((data && data.message) || "Request failed");
    }

    return data;
  }

  function redirectTo(page) {
    window.location.href = `./${page}`;
  }

  function normalizeDueDate(dueDateValue) {
    if (!dueDateValue) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(String(dueDateValue))) return String(dueDateValue).slice(0, 10);

    const parsed = new Date(dueDateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  }

  function formatCreatedDate(dateValue) {
    return new Date(dateValue).toLocaleString();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isOverdue(task) {
    if (!task.due_date || task.status === "completed") {
      return false;
    }

    const today = new Date();
    const due = new Date(task.due_date);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  function logout() {
    clearToken();
    redirectTo("login.html");
  }

  function setupGlobalNav() {
    const isLoggedIn = Boolean(getToken());

    document.querySelectorAll('[data-auth="guest"]').forEach((node) => {
      node.hidden = isLoggedIn;
    });

    document.querySelectorAll('[data-auth="user"]').forEach((node) => {
      node.hidden = !isLoggedIn;
    });

    const page = document.body.dataset.page;
    const navHome = document.querySelector('[data-nav="home"]');
    const navDashboard = document.querySelector('[data-nav="dashboard"]');

    if (page === "home") navHome?.classList.add("active");
    if (page === "dashboard") navDashboard?.classList.add("active");

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    const navDashboardLink = document.querySelector('[data-nav="dashboard"]');
    if (navDashboardLink) {
      navDashboardLink.addEventListener("click", (event) => {
        if (getToken()) {
          return;
        }
        event.preventDefault();
        redirectTo("login.html");
      });
    }
  }

  function initHomePage() {
    const getStartedBtn = document.getElementById("getStartedBtn");
    if (!getStartedBtn) return;

    getStartedBtn.addEventListener("click", () => {
      if (getToken()) {
        redirectTo("dashboard.html");
        return;
      }
      redirectTo("login.html");
    });
  }

  function initLoginPage() {
    if (getToken()) {
      redirectTo("dashboard.html");
      return;
    }

    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

    if (!loginForm || !loginError || !loginSubmitBtn) return;

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      loginError.hidden = true;
      loginError.textContent = "";

      const formData = new FormData(loginForm);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      if (!email || !password) {
        loginError.textContent = "Please fill in all fields.";
        loginError.hidden = false;
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = "Signing in...";

      try {
        const data = await apiRequest("/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        setToken(data.token);
        redirectTo("dashboard.html");
      } catch (error) {
        loginError.textContent = error.message;
        loginError.hidden = false;
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = "Login";
      }
    });
  }

  function initSignupPage() {
    if (getToken()) {
      redirectTo("dashboard.html");
      return;
    }

    const signupForm = document.getElementById("signupForm");
    const signupError = document.getElementById("signupError");
    const signupSuccess = document.getElementById("signupSuccess");
    const signupSubmitBtn = document.getElementById("signupSubmitBtn");

    if (!signupForm || !signupError || !signupSuccess || !signupSubmitBtn) return;

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      signupError.hidden = true;
      signupSuccess.hidden = true;
      signupError.textContent = "";
      signupSuccess.textContent = "";

      const formData = new FormData(signupForm);
      const username = String(formData.get("username") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      if (!username || !email || !password) {
        signupError.textContent = "Please fill in all fields.";
        signupError.hidden = false;
        return;
      }

      if (password.length < 6) {
        signupError.textContent = "Password must be at least 6 characters.";
        signupError.hidden = false;
        return;
      }

      signupSubmitBtn.disabled = true;
      signupSubmitBtn.textContent = "Creating account...";

      try {
        await apiRequest("/signup", {
          method: "POST",
          body: JSON.stringify({ username, email, password })
        });

        signupSuccess.textContent = "Signup successful! Redirecting to login...";
        signupSuccess.hidden = false;

        window.setTimeout(() => {
          redirectTo("login.html");
        }, 900);
      } catch (error) {
        signupError.textContent = error.message;
        signupError.hidden = false;
      } finally {
        signupSubmitBtn.disabled = false;
        signupSubmitBtn.textContent = "Signup";
      }
    });
  }

  function initDashboardPage() {
    if (!getToken()) {
      redirectTo("login.html");
      return;
    }

    const dashboardError = document.getElementById("dashboardError");
    const dashboardToast = document.getElementById("dashboardToast");
    const taskForm = document.getElementById("taskForm");
    const taskNameInput = document.getElementById("taskName");
    const taskPrioritySelect = document.getElementById("taskPriority");
    const taskDueDateInput = document.getElementById("taskDueDate");
    const taskCategorySelect = document.getElementById("taskCategory");
    const taskSubmitBtn = document.getElementById("taskSubmitBtn");
    const taskCancelBtn = document.getElementById("taskCancelBtn");
    const taskList = document.getElementById("taskList");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const notesForm = document.getElementById("notesForm");
    const noteInput = document.getElementById("noteInput");
    const notesList = document.getElementById("notesList");
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
    const statTotal = document.getElementById("statTotal");
    const statCompleted = document.getElementById("statCompleted");
    const statPending = document.getElementById("statPending");

    if (
      !dashboardError ||
      !dashboardToast ||
      !taskForm ||
      !taskNameInput ||
      !taskPrioritySelect ||
      !taskDueDateInput ||
      !taskCategorySelect ||
      !taskSubmitBtn ||
      !taskCancelBtn ||
      !taskList ||
      !searchInput ||
      !statusFilter ||
      !categoryFilter ||
      !notesForm ||
      !noteInput ||
      !notesList ||
      !themeToggleBtn ||
      !dashboardLogoutBtn ||
      !statTotal ||
      !statCompleted ||
      !statPending
    ) {
      return;
    }

    let tasks = [];
    let editingId = null;
    let notes = [];
    let toastTimer = null;

    function showError(message) {
      dashboardError.textContent = message || "";
      dashboardError.hidden = !message;
    }

    function showToast(message) {
      dashboardToast.textContent = message;
      dashboardToast.hidden = false;

      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }

      toastTimer = window.setTimeout(() => {
        dashboardToast.hidden = true;
        dashboardToast.textContent = "";
      }, 2400);
    }

    function setTheme(isDark) {
      document.body.classList.toggle("dark-mode", isDark);
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
      themeToggleBtn.textContent = isDark ? "Light Mode" : "Dark Mode";
    }

    function setTaskForm(task = null) {
      editingId = task ? Number(task.id) : null;
      taskNameInput.value = task ? task.task_name : "";
      taskPrioritySelect.value = task ? task.priority : "medium";
      taskDueDateInput.value = task ? normalizeDueDate(task.due_date) : "";
      taskCategorySelect.value = task ? task.category : "Study";
      taskSubmitBtn.textContent = editingId ? "Save" : "Add";
      taskCancelBtn.hidden = !editingId;
    }

    function updateStats() {
      const total = tasks.length;
      const completed = tasks.filter((task) => task.status === "completed").length;
      const pending = total - completed;

      statTotal.textContent = String(total);
      statCompleted.textContent = String(completed);
      statPending.textContent = String(pending);
    }

    function getFilteredTasks() {
      const search = searchInput.value.trim().toLowerCase();
      const status = statusFilter.value;
      const category = categoryFilter.value;

      return tasks.filter((task) => {
        const matchesSearch = task.task_name.toLowerCase().includes(search);
        const matchesStatus = status === "all" || task.status === status;
        const matchesCategory = category === "all" || task.category === category;
        return matchesSearch && matchesStatus && matchesCategory;
      });
    }

    function renderTasks() {
      const visibleTasks = getFilteredTasks();

      if (visibleTasks.length === 0) {
        taskList.innerHTML = `
          <div class="empty-state">
            <p class="muted-text">No tasks yet. Add your first task!</p>
            <button type="button" class="primary-btn" id="focusCreateTaskBtn">Create Your First Task</button>
          </div>
        `;

        const focusBtn = document.getElementById("focusCreateTaskBtn");
        focusBtn?.addEventListener("click", () => taskNameInput.focus());
        return;
      }

      taskList.innerHTML = visibleTasks
        .map((task) => {
          const doneClass = task.status === "completed" ? "done-text" : "";
          const overdueClass = isOverdue(task) ? "task-overdue" : "";
          const dueDate = escapeHtml(normalizeDueDate(task.due_date) || "Not set");
          const overdueText = isOverdue(task) ? " | Overdue" : "";
          const taskName = escapeHtml(task.task_name);
          const taskCategory = escapeHtml(task.category);
          const taskPriority = escapeHtml(task.priority.toUpperCase());
          const createdAt = escapeHtml(formatCreatedDate(task.created_at));

          return `
            <article class="task-card ${overdueClass}">
              <div>
                <h4 class="${doneClass}">${taskName}</h4>
                <small>
                  ${taskCategory} | ${taskPriority} | Due: ${dueDate}${overdueText}
                </small>
                <small class="created-at">Created: ${createdAt}</small>
              </div>
              <div class="task-actions">
                <button type="button" class="${task.status === "completed" ? "secondary-btn" : "success-btn"}" data-action="toggle" data-id="${task.id}" data-status="${task.status}">
                  ${task.status === "completed" ? "Mark Pending" : "Mark Done"}
                </button>
                <button type="button" class="ghost-btn" data-action="edit" data-id="${task.id}">Edit</button>
                <button type="button" class="danger-btn" data-action="delete" data-id="${task.id}">Delete</button>
              </div>
            </article>
          `;
        })
        .join("");
    }

    function renderNotes() {
      if (!notes.length) {
        notesList.innerHTML = '<p class="muted-text">No notes yet.</p>';
        return;
      }

      notesList.innerHTML = notes
        .map(
          (note) => `
            <article class="note-card">
              <p>${escapeHtml(note.text)}</p>
              <button type="button" class="danger-btn" data-note-delete="${note.id}">Delete</button>
            </article>
          `
        )
        .join("");
    }

    async function fetchTasks() {
      taskList.innerHTML = '<p class="muted-text loading-text">Loading tasks...</p>';

      try {
        const data = await apiRequest("/tasks");
        tasks = Array.isArray(data) ? data : [];
        updateStats();
        renderTasks();
      } catch (error) {
        if (error.message.toLowerCase().includes("unauthorized")) {
          logout();
          return;
        }
        showError(error.message);
        updateStats();
        renderTasks();
      }
    }

    dashboardLogoutBtn.addEventListener("click", logout);

    taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      showError("");

      const task_name = taskNameInput.value.trim();
      const priority = taskPrioritySelect.value;
      const due_date = taskDueDateInput.value;
      const category = taskCategorySelect.value;

      if (!task_name) {
        showError("Task cannot be empty.");
        return;
      }

      const payload = {
        task_name,
        priority,
        due_date,
        category
      };

      if (!payload.due_date) {
        delete payload.due_date;
      }

      try {
        if (editingId) {
          const updatedTask = await apiRequest(`/tasks/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });

          tasks = tasks.map((task) => (Number(task.id) === editingId ? updatedTask : task));
          showToast("Task updated successfully.");
        } else {
          const newTask = await apiRequest("/tasks", {
            method: "POST",
            body: JSON.stringify(payload)
          });

          tasks = [newTask, ...tasks];
          showToast("Task added successfully.");
        }

        setTaskForm(null);
        updateStats();
        renderTasks();
      } catch (error) {
        showError(error.message);
      }
    });

    taskCancelBtn.addEventListener("click", () => {
      setTaskForm(null);
      showError("");
    });

    taskList.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("button[data-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.dataset.action;
      const taskId = Number(actionButton.dataset.id);
      const targetTask = tasks.find((task) => Number(task.id) === taskId);

      if (!targetTask) {
        return;
      }

      showError("");

      if (action === "edit") {
        setTaskForm(targetTask);
        taskNameInput.focus();
        return;
      }

      if (action === "toggle") {
        const nextStatus = actionButton.dataset.status === "completed" ? "pending" : "completed";

        try {
          const updatedTask = await apiRequest(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus })
          });

          tasks = tasks.map((task) => (Number(task.id) === taskId ? updatedTask : task));
          updateStats();
          renderTasks();
          showToast(nextStatus === "completed" ? "Task marked complete." : "Task moved back to pending.");
        } catch (error) {
          showError(error.message);
        }

        return;
      }

      if (action === "delete") {
        try {
          await apiRequest(`/tasks/${taskId}`, {
            method: "DELETE"
          });

          tasks = tasks.filter((task) => Number(task.id) !== taskId);
          updateStats();
          renderTasks();
          showToast("Task deleted successfully.");

          if (editingId === taskId) {
            setTaskForm(null);
          }
        } catch (error) {
          showError(error.message);
        }
      }
    });

    [searchInput, statusFilter, categoryFilter].forEach((input) => {
      input.addEventListener("input", renderTasks);
      input.addEventListener("change", renderTasks);
    });

    notesForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const noteText = noteInput.value.trim();
      if (!noteText) {
        return;
      }

      const newNote = {
        id: Date.now(),
        text: noteText
      };

      notes = [newNote, ...notes];
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      noteInput.value = "";
      renderNotes();
      showToast("Note saved.");
    });

    notesList.addEventListener("click", (event) => {
      const deleteButton = event.target.closest("button[data-note-delete]");
      if (!deleteButton) {
        return;
      }

      const noteId = Number(deleteButton.dataset.noteDelete);
      notes = notes.filter((note) => Number(note.id) !== noteId);
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      renderNotes();
      showToast("Note deleted.");
    });

    themeToggleBtn.addEventListener("click", () => {
      const isDark = !document.body.classList.contains("dark-mode");
      setTheme(isDark);
    });

    const savedTheme = localStorage.getItem(THEME_KEY);
    setTheme(savedTheme === "dark");

    const savedNotes = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
    notes = Array.isArray(savedNotes) ? savedNotes : [];
    renderNotes();

    setTaskForm(null);
    fetchTasks();
  }

  function initByPage() {
    setupGlobalNav();

    const page = document.body.dataset.page;
    if (page === "home") initHomePage();
    if (page === "login") initLoginPage();
    if (page === "signup") initSignupPage();
    if (page === "dashboard") initDashboardPage();
  }

  initByPage();
})();
