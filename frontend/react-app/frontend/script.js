(() => {
  const API_BASE_URL =
    document.querySelector('meta[name="api-base-url"]')?.content || "http://localhost:5000/api";

  const TOKEN_KEY = "studyhub_token";
  const THEME_KEY = "studyhub_theme";
  const PLANNER_KEY = "studyhub_planner_items";
  const GOALS_KEY = "studyhub_goals";
  const POMODORO_KEY = "studyhub_pomodoro_sessions";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function redirectTo(page) {
    window.location.href = `./${page}`;
  }

  function applySavedTheme() {
    const theme = localStorage.getItem(THEME_KEY) || "light";
    document.body.classList.toggle("dark-mode", theme === "dark");
    return theme;
  }

  function setTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, normalized);
    document.body.classList.toggle("dark-mode", normalized === "dark");
    return normalized;
  }

  function setupThemeToggleOnHome() {
    const page = document.body.dataset.page;
    const toggle = document.getElementById("homeThemeToggle");
    if (page !== "home" || !toggle) return;

    function renderToggleText() {
      const isDark = document.body.classList.contains("dark-mode");
      toggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    }

    renderToggleText();
    toggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-mode");
      setTheme(isDark ? "light" : "dark");
      renderToggleText();
    });
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
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const navDashboardLink = document.querySelector('[data-nav="dashboard"]');
    if (navDashboardLink) {
      navDashboardLink.addEventListener("click", (event) => {
        if (getToken()) return;
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
      } else {
        redirectTo("login.html");
      }
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
        window.setTimeout(() => redirectTo("login.html"), 900);
      } catch (error) {
        signupError.textContent = error.message;
        signupError.hidden = false;
      } finally {
        signupSubmitBtn.disabled = false;
        signupSubmitBtn.textContent = "Signup";
      }
    });
  }

  function normalizeDueDate(value) {
    if (!value) return "";
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function initDashboardPage() {
    if (!getToken()) {
      redirectTo("login.html");
      return;
    }

    const dashboardDate = document.getElementById("dashboardDate");
    const dashboardError = document.getElementById("dashboardError");
    const dashboardSuccess = document.getElementById("dashboardSuccess");
    const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");

    const statTotal = document.getElementById("statTotal");
    const statCompleted = document.getElementById("statCompleted");
    const statPending = document.getElementById("statPending");
    const statWeekly = document.getElementById("statWeekly");

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

    const plannerForm = document.getElementById("plannerForm");
    const plannerType = document.getElementById("plannerType");
    const plannerTitle = document.getElementById("plannerTitle");
    const plannerDate = document.getElementById("plannerDate");
    const plannerList = document.getElementById("plannerList");

    const goalForm = document.getElementById("goalForm");
    const goalTitle = document.getElementById("goalTitle");
    const goalTarget = document.getElementById("goalTarget");
    const goalCurrent = document.getElementById("goalCurrent");
    const goalsList = document.getElementById("goalsList");

    const pomodoroTime = document.getElementById("pomodoroTime");
    const pomodoroMode = document.getElementById("pomodoroMode");
    const sessionCount = document.getElementById("sessionCount");
    const timerStartBtn = document.getElementById("timerStartBtn");
    const timerPauseBtn = document.getElementById("timerPauseBtn");
    const timerResetBtn = document.getElementById("timerResetBtn");

    const alertsList = document.getElementById("alertsList");

    if (
      !dashboardError ||
      !dashboardSuccess ||
      !dashboardLogoutBtn ||
      !statTotal ||
      !statCompleted ||
      !statPending ||
      !statWeekly ||
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
      !plannerForm ||
      !plannerType ||
      !plannerTitle ||
      !plannerDate ||
      !plannerList ||
      !goalForm ||
      !goalTitle ||
      !goalTarget ||
      !goalCurrent ||
      !goalsList ||
      !pomodoroTime ||
      !pomodoroMode ||
      !sessionCount ||
      !timerStartBtn ||
      !timerPauseBtn ||
      !timerResetBtn ||
      !alertsList
    ) {
      return;
    }

    dashboardDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    let tasks = [];
    let editingId = null;

    let plannerItems = JSON.parse(localStorage.getItem(PLANNER_KEY) || "[]");
    if (!Array.isArray(plannerItems)) plannerItems = [];

    let goals = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");
    if (!Array.isArray(goals)) goals = [];

    let completedFocusSessions = Number(localStorage.getItem(POMODORO_KEY) || "0");
    if (!Number.isFinite(completedFocusSessions) || completedFocusSessions < 0) {
      completedFocusSessions = 0;
    }

    const TIMER = {
      focusSeconds: 25 * 60,
      breakSeconds: 5 * 60,
      currentSeconds: 25 * 60,
      isRunning: false,
      mode: "focus",
      intervalId: null
    };

    function showError(message) {
      dashboardError.textContent = message || "";
      dashboardError.hidden = !message;
    }

    function showSuccess(message) {
      dashboardSuccess.textContent = message || "";
      dashboardSuccess.hidden = !message;
      if (!message) return;
      window.setTimeout(() => {
        dashboardSuccess.hidden = true;
        dashboardSuccess.textContent = "";
      }, 2200);
    }

    function savePlanner() {
      localStorage.setItem(PLANNER_KEY, JSON.stringify(plannerItems));
    }

    function saveGoals() {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }

    function renderStats() {
      const total = tasks.length;
      const completed = tasks.filter((task) => task.status === "completed").length;
      const pending = total - completed;

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const weeklyItems = tasks.filter((task) => {
        const createdAt = new Date(task.created_at);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= weekAgo;
      });
      const weeklyCompleted = weeklyItems.filter((task) => task.status === "completed").length;
      const weeklyPercent = weeklyItems.length
        ? Math.round((weeklyCompleted / weeklyItems.length) * 100)
        : 0;

      statTotal.textContent = String(total);
      statCompleted.textContent = String(completed);
      statPending.textContent = String(pending);
      statWeekly.textContent = `${weeklyPercent}%`;
    }

    function getFilteredTasks() {
      const search = searchInput.value.trim().toLowerCase();
      const status = statusFilter.value;
      const category = categoryFilter.value;

      return tasks.filter((task) => {
        const taskName = String(task.task_name || "").toLowerCase();
        const matchesSearch = taskName.includes(search);
        const matchesStatus = status === "all" || task.status === status;
        const matchesCategory = category === "all" || task.category === category;
        return matchesSearch && matchesStatus && matchesCategory;
      });
    }

    function renderTasks() {
      const visible = getFilteredTasks();

      if (!visible.length) {
        taskList.innerHTML = `
          <div class="empty-state">
            <p class="muted-text">No tasks match your current filters.</p>
          </div>
        `;
        return;
      }

      taskList.innerHTML = visible
        .map((task) => {
          const dueDate = normalizeDueDate(task.due_date) || "Not set";
          const doneClass = task.status === "completed" ? "done-text" : "";
          return `
            <article class="task-card">
              <div>
                <h4 class="${doneClass}">${escapeHtml(task.task_name)}</h4>
                <small>${escapeHtml(task.category)} | ${escapeHtml(task.priority.toUpperCase())} | Due: ${escapeHtml(dueDate)}</small>
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

    function renderPlanner() {
      const sorted = [...plannerItems].sort((a, b) => a.date.localeCompare(b.date));

      if (!sorted.length) {
        plannerList.innerHTML = '<p class="muted-text">No planner items yet.</p>';
        return;
      }

      plannerList.innerHTML = sorted
        .map(
          (item) => `
            <article class="planner-item">
              <div>
                <p><strong>${escapeHtml(item.title)}</strong></p>
                <small>${escapeHtml(item.typeLabel)} | ${escapeHtml(item.date)}</small>
              </div>
              <button type="button" class="danger-btn" data-planner-delete="${item.id}">Delete</button>
            </article>
          `
        )
        .join("");
    }

    function renderGoals() {
      if (!goals.length) {
        goalsList.innerHTML = '<p class="muted-text">No goals yet. Add your first milestone.</p>';
        return;
      }

      goalsList.innerHTML = goals
        .map((goal) => {
          const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return `
            <article class="goal-item">
              <div class="goal-head">
                <h4>${escapeHtml(goal.title)}</h4>
                <strong>${percent}%</strong>
              </div>
              <small>${goal.current}/${goal.target} units completed</small>
              <div class="progress-track">
                <div class="progress-fill" style="width:${percent}%"></div>
              </div>
              <div class="goal-actions">
                <button type="button" class="ghost-btn" data-goal-adjust="-1" data-goal-id="${goal.id}">-1</button>
                <button type="button" class="ghost-btn" data-goal-adjust="1" data-goal-id="${goal.id}">+1</button>
                <button type="button" class="danger-btn" data-goal-delete="${goal.id}">Delete</button>
              </div>
            </article>
          `;
        })
        .join("");
    }

    function daysBetweenToday(dateText) {
      const today = new Date();
      const target = new Date(dateText);
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target - today;
      return Math.round(diffMs / 86400000);
    }

    function renderAlerts() {
      const alerts = [];

      tasks.forEach((task) => {
        if (!task.due_date || task.status === "completed") return;
        const days = daysBetweenToday(normalizeDueDate(task.due_date));
        if (days < 0) {
          alerts.push(`Overdue task: ${task.task_name}`);
        }
        if (days === 1) {
          alerts.push(`Task due tomorrow: ${task.task_name}`);
        }
      });

      plannerItems.forEach((item) => {
        const days = daysBetweenToday(item.date);
        if (item.type === "exam" && days >= 0 && days <= 7) {
          alerts.push(`Exam in ${days} day${days === 1 ? "" : "s"}: ${item.title}`);
        }
        if (item.type === "assignment" && days === 1) {
          alerts.push(`Assignment due tomorrow: ${item.title}`);
        }
        if (days < 0) {
          alerts.push(`Missed ${item.typeLabel.toLowerCase()}: ${item.title}`);
        }
      });

      if (!alerts.length) {
        alertsList.innerHTML = '<p class="muted-text">No urgent alerts right now.</p>';
        return;
      }

      alertsList.innerHTML = alerts
        .map((text) => `<article class="alert-item"><p>${escapeHtml(text)}</p></article>`)
        .join("");
    }

    function renderPomodoro() {
      const mins = Math.floor(TIMER.currentSeconds / 60)
        .toString()
        .padStart(2, "0");
      const secs = (TIMER.currentSeconds % 60).toString().padStart(2, "0");
      pomodoroTime.textContent = `${mins}:${secs}`;
      pomodoroMode.textContent = TIMER.mode === "focus" ? "Focus Session" : "Break Session";
      sessionCount.textContent = String(completedFocusSessions);
    }

    function stopPomodoroInterval() {
      if (TIMER.intervalId) {
        window.clearInterval(TIMER.intervalId);
        TIMER.intervalId = null;
      }
      TIMER.isRunning = false;
    }

    function startPomodoro() {
      if (TIMER.isRunning) return;
      TIMER.isRunning = true;

      TIMER.intervalId = window.setInterval(() => {
        TIMER.currentSeconds -= 1;

        if (TIMER.currentSeconds <= 0) {
          if (TIMER.mode === "focus") {
            completedFocusSessions += 1;
            localStorage.setItem(POMODORO_KEY, String(completedFocusSessions));
            TIMER.mode = "break";
            TIMER.currentSeconds = TIMER.breakSeconds;
            showSuccess("Focus session complete. Break started.");
          } else {
            TIMER.mode = "focus";
            TIMER.currentSeconds = TIMER.focusSeconds;
            showSuccess("Break complete. Back to focus.");
          }
        }

        renderPomodoro();
      }, 1000);
    }

    function resetPomodoro() {
      stopPomodoroInterval();
      TIMER.mode = "focus";
      TIMER.currentSeconds = TIMER.focusSeconds;
      renderPomodoro();
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

    async function fetchTasks() {
      taskList.innerHTML = '<p class="muted-text loading-text">Loading tasks...</p>';
      showError("");

      try {
        const data = await apiRequest("/tasks");
        tasks = Array.isArray(data) ? data : [];
      } catch (error) {
        if (error.message.toLowerCase().includes("unauthorized")) {
          logout();
          return;
        }
        showError(error.message);
      }

      renderStats();
      renderTasks();
      renderAlerts();
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
        showError("Task name is required.");
        return;
      }

      const payload = { task_name, priority, category };
      if (due_date) payload.due_date = due_date;

      try {
        if (editingId) {
          const updated = await apiRequest(`/tasks/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
          tasks = tasks.map((task) => (Number(task.id) === editingId ? updated : task));
          showSuccess("Task updated.");
        } else {
          const created = await apiRequest("/tasks", {
            method: "POST",
            body: JSON.stringify(payload)
          });
          tasks = [created, ...tasks];
          showSuccess("Task added.");
        }

        setTaskForm(null);
        renderStats();
        renderTasks();
        renderAlerts();
      } catch (error) {
        showError(error.message);
      }
    });

    taskCancelBtn.addEventListener("click", () => {
      setTaskForm(null);
      showError("");
    });

    taskList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const taskId = Number(button.dataset.id);
      const task = tasks.find((item) => Number(item.id) === taskId);
      if (!task) return;

      showError("");

      if (action === "edit") {
        setTaskForm(task);
        taskNameInput.focus();
        return;
      }

      if (action === "toggle") {
        const nextStatus = task.status === "completed" ? "pending" : "completed";
        try {
          const updated = await apiRequest(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus })
          });
          tasks = tasks.map((item) => (Number(item.id) === taskId ? updated : item));
          showSuccess(nextStatus === "completed" ? "Task marked complete." : "Task moved to pending.");
          renderStats();
          renderTasks();
          renderAlerts();
        } catch (error) {
          showError(error.message);
        }
        return;
      }

      if (action === "delete") {
        try {
          await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
          tasks = tasks.filter((item) => Number(item.id) !== taskId);
          if (editingId === taskId) setTaskForm(null);
          showSuccess("Task deleted.");
          renderStats();
          renderTasks();
          renderAlerts();
        } catch (error) {
          showError(error.message);
        }
      }
    });

    [searchInput, statusFilter, categoryFilter].forEach((node) => {
      node.addEventListener("input", renderTasks);
      node.addEventListener("change", renderTasks);
    });

    plannerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = plannerType.value;
      const title = plannerTitle.value.trim();
      const date = plannerDate.value;
      if (!title || !date) {
        showError("Planner title and date are required.");
        return;
      }

      const typeMap = {
        assignment: "Assignment",
        exam: "Exam",
        deadline: "Deadline",
        submission: "Submission"
      };

      plannerItems.unshift({
        id: Date.now(),
        type,
        typeLabel: typeMap[type] || "Plan",
        title,
        date
      });

      savePlanner();
      plannerForm.reset();
      plannerType.value = "assignment";
      renderPlanner();
      renderAlerts();
      showSuccess("Planner item added.");
    });

    plannerList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-planner-delete]");
      if (!button) return;
      const itemId = Number(button.dataset.plannerDelete);
      plannerItems = plannerItems.filter((item) => Number(item.id) !== itemId);
      savePlanner();
      renderPlanner();
      renderAlerts();
    });

    goalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = goalTitle.value.trim();
      const target = Number(goalTarget.value);
      const current = Number(goalCurrent.value);

      if (!title || !Number.isFinite(target) || !Number.isFinite(current) || target <= 0 || current < 0) {
        showError("Enter valid goal title, target, and progress values.");
        return;
      }

      goals.unshift({
        id: Date.now(),
        title,
        target,
        current: Math.min(current, target)
      });

      saveGoals();
      goalForm.reset();
      renderGoals();
      showSuccess("Goal added.");
    });

    goalsList.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest("button[data-goal-delete]");
      if (deleteBtn) {
        const id = Number(deleteBtn.dataset.goalDelete);
        goals = goals.filter((goal) => Number(goal.id) !== id);
        saveGoals();
        renderGoals();
        return;
      }

      const adjustBtn = event.target.closest("button[data-goal-adjust]");
      if (adjustBtn) {
        const id = Number(adjustBtn.dataset.goalId);
        const delta = Number(adjustBtn.dataset.goalAdjust);
        goals = goals.map((goal) => {
          if (Number(goal.id) !== id) return goal;
          const updated = Math.min(goal.target, Math.max(0, goal.current + delta));
          return { ...goal, current: updated };
        });
        saveGoals();
        renderGoals();
      }
    });

    timerStartBtn.addEventListener("click", startPomodoro);
    timerPauseBtn.addEventListener("click", stopPomodoroInterval);
    timerResetBtn.addEventListener("click", resetPomodoro);

    setTaskForm(null);
    renderPlanner();
    renderGoals();
    renderPomodoro();
    renderAlerts();
    fetchTasks();
  }

  function initByPage() {
    applySavedTheme();
    setupThemeToggleOnHome();
    setupGlobalNav();

    const page = document.body.dataset.page;
    if (page === "home") initHomePage();
    if (page === "login") initLoginPage();
    if (page === "signup") initSignupPage();
    if (page === "dashboard") initDashboardPage();
  }

  initByPage();
})();
