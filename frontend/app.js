// Backend base URL
const API_BASE = "https://library-management-production-0f26.up.railway.app";

// auth state
let currentUser = null;
let authToken = null;

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  loadAuthFromStorage();
  setupAuthForms();
  setupRequestForm();
  setupTrackRequests();
  setupAdminPanel();
});

// ===== Auth helpers =====
function loadAuthFromStorage() {
  try {
    const stored = localStorage.getItem("libraryAuth");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    authToken = parsed.token;
    currentUser = parsed.user;
  } catch {
    authToken = null;
    currentUser = null;
  }
}

function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem("libraryAuth", JSON.stringify({ token, user }));
  updateAuthUI();
}

function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("libraryAuth");
  updateAuthUI();
}

function updateAuthUI() {
  const label = document.getElementById("auth-user-label");
  const logoutBtn = document.getElementById("logoutBtn");
  const requestStatusSpan = document.getElementById("request-status");
  const adminSection = document.getElementById("admin-section");

  if (currentUser) {
    if (label) {
      label.textContent = `Logged in as ${currentUser.name} (${currentUser.role})`;
    }
    if (logoutBtn) logoutBtn.classList.remove("hidden");

    // Pre-fill student email in track/request sections
    const studentEmailInput = document.getElementById("studentEmail");
    const trackEmailInput = document.getElementById("trackEmail");
    if (studentEmailInput) {
      studentEmailInput.value = currentUser.email;
      studentEmailInput.readOnly = true;
    }
    if (trackEmailInput) {
      trackEmailInput.value = currentUser.email;
      trackEmailInput.readOnly = true;
    }

    // Admin section visibility
    if (adminSection) {
      if (currentUser.role === "admin") {
        adminSection.classList.remove("hidden");
      } else {
        adminSection.classList.add("hidden");
      }
    }

    if (requestStatusSpan) {
      requestStatusSpan.textContent =
        "You are logged in. You can submit book requests.";
      requestStatusSpan.className = "status-text";
    }
  } else {
    if (label) label.textContent = "Not logged in.";
    if (logoutBtn) logoutBtn.classList.add("hidden");

    const studentEmailInput = document.getElementById("studentEmail");
    const trackEmailInput = document.getElementById("trackEmail");
    if (studentEmailInput) {
      studentEmailInput.value = "";
      studentEmailInput.readOnly = false;
    }
    if (trackEmailInput) {
      trackEmailInput.value = "";
      trackEmailInput.readOnly = false;
    }

    if (adminSection) {
      adminSection.classList.add("hidden");
    }
  }
}

// ===== Auth forms =====
function setupAuthForms() {
  const showLoginBtn = document.getElementById("showLogin");
  const showRegisterBtn = document.getElementById("showRegister");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginStatus = document.getElementById("login-status");
  const registerStatus = document.getElementById("register-status");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!loginForm || !registerForm) {
    updateAuthUI();
    return;
  }

  // toggle views
  if (showLoginBtn && showRegisterBtn) {
    showLoginBtn.addEventListener("click", () => {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    });
    showRegisterBtn.addEventListener("click", () => {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    });
  }

  // login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginStatus) {
      loginStatus.textContent = "";
      loginStatus.className = "status-text";
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      loginStatus.textContent = "Please enter email and password.";
      loginStatus.classList.add("error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      saveAuth(data.token, data.user);
      loginForm.reset();
      loginStatus.textContent = "Logged in successfully.";
      loginStatus.classList.add("success");
    } catch (err) {
      console.error(err);
      loginStatus.textContent = err.message || "Login error";
      loginStatus.classList.add("error");
    }
  });

  // register (student)
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (registerStatus) {
      registerStatus.textContent = "";
      registerStatus.className = "status-text";
    }

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!name || !email || !password) {
      registerStatus.textContent = "Please fill in all fields.";
      registerStatus.classList.add("error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      saveAuth(data.token, data.user);
      registerForm.reset();
      registerStatus.textContent = "Registered and logged in as student.";
      registerStatus.classList.add("success");
    } catch (err) {
      console.error(err);
      registerStatus.textContent = err.message || "Registration error";
      registerStatus.classList.add("error");
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
    });
  }

  updateAuthUI();
}

// ===== Request Form =====
function setupRequestForm() {
  const form = document.getElementById("request-form");
  const statusSpan = document.getElementById("request-status");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (statusSpan) {
      statusSpan.textContent = "";
      statusSpan.className = "status-text";
    }

    if (!authToken || !currentUser) {
      if (statusSpan) {
        statusSpan.textContent = "Please login first to request a book.";
        statusSpan.classList.add("error");
      }
      return;
    }

    const payload = {
      // studentName & email come from token on backend
      studentId: document.getElementById("studentId").value.trim(),
      bookTitle: document.getElementById("bookTitle").value.trim(),
      bookAuthor: document.getElementById("bookAuthor").value.trim(),
      notes: document.getElementById("notes").value.trim()
    };

    if (!payload.bookTitle) {
      if (statusSpan) {
        statusSpan.textContent = "Book title is required.";
        statusSpan.classList.add("error");
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request");
      }

      form.reset();
      if (statusSpan) {
        statusSpan.textContent = "Request submitted successfully!";
        statusSpan.classList.add("success");
      }
    } catch (err) {
      console.error(err);
      if (statusSpan) {
        statusSpan.textContent = err.message || "Request error";
        statusSpan.classList.add("error");
      }
    }
  });
}

// ===== Track Requests (student) =====
function setupTrackRequests() {
  const trackBtn = document.getElementById("trackBtn");
  const trackEmailInput = document.getElementById("trackEmail");
  const statusSpan = document.getElementById("track-status");

  if (!trackBtn || !trackEmailInput) return;

  trackBtn.addEventListener("click", async () => {
    if (statusSpan) {
      statusSpan.textContent = "";
      statusSpan.className = "status-text";
    }

    if (!authToken || !currentUser) {
      if (statusSpan) {
        statusSpan.textContent = "Please login to view your requests.";
        statusSpan.classList.add("error");
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/requests/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch your requests");
      const data = await res.json();
      renderStudentRequestsTable(data);
      if (statusSpan) {
        statusSpan.textContent =
          data.length === 0 ? "You have no requests yet." : `Found ${data.length} request(s).`;
      }
    } catch (err) {
      console.error(err);
      if (statusSpan) {
        statusSpan.textContent = err.message || "Fetch error";
        statusSpan.classList.add("error");
      }
    }
  });
}

function renderStudentRequestsTable(requests) {
  const tbody = document.querySelector("#student-requests-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  requests.forEach((req) => {
    const tr = document.createElement("tr");

    const created = new Date(req.createdAt).toLocaleString();
    const book = `${req.bookTitle}${req.bookAuthor ? " — " + req.bookAuthor : ""}`;
    const statusPill = createStatusPill(req.status);

    tr.innerHTML = `
      <td>${created}</td>
      <td>${escapeHtml(book)}</td>
      <td></td>
      <td>${escapeHtml(req.notes || "-")}</td>
    `;

    tr.children[2].appendChild(statusPill);
    tbody.appendChild(tr);
  });
}

// ===== Admin Panel =====
function setupAdminPanel() {
  const refreshBtn = document.getElementById("refreshAdminTable");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", fetchAllRequestsForAdmin);
  }
  updateAuthUI(); // show/hide admin section initially
}

async function fetchAllRequestsForAdmin() {
  const statusSpan = document.getElementById("admin-panel-status");
  if (!authToken || !currentUser || currentUser.role !== "admin") {
    if (statusSpan) {
      statusSpan.textContent = "Login as admin to view requests.";
      statusSpan.className = "status-text error";
    }
    return;
  }

  if (statusSpan) {
    statusSpan.textContent = "Loading requests...";
    statusSpan.className = "status-text";
  }

  try {
    const res = await fetch(`${API_BASE}/api/requests`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch admin requests");

    const data = await res.json();
    renderAdminRequestsTable(data);

    if (statusSpan) {
      statusSpan.textContent = `Loaded ${data.length} request(s).`;
    }
  } catch (err) {
    console.error(err);
    if (statusSpan) {
      statusSpan.textContent = err.message || "Admin fetch error";
      statusSpan.classList.add("error");
    }
  }
}

function renderAdminRequestsTable(requests) {
  const tbody = document.querySelector("#admin-requests-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const statusOptions = ["Pending", "Approved", "Rejected", "Collected", "Returned"];

  requests.forEach((req) => {
    const tr = document.createElement("tr");

    const created = new Date(req.createdAt).toLocaleString();
    const book = `${req.bookTitle}${req.bookAuthor ? " — " + req.bookAuthor : ""}`;

    tr.innerHTML = `
      <td>
        <div><strong>${escapeHtml(req.studentName)}</strong></div>
        <div class="status-text">${escapeHtml(req.studentEmail)}</div>
      </td>
      <td>${escapeHtml(book)}</td>
      <td></td>
      <td>${created}</td>
      <td></td>
    `;

    const statusCell = tr.children[2];
    const actionCell = tr.children[4];

    statusCell.appendChild(createStatusPill(req.status));

    const select = document.createElement("select");
    statusOptions.forEach((status) => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      if (status === req.status) opt.selected = true;
      select.appendChild(opt);
    });

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update";
    updateBtn.className = "btn small secondary";

    updateBtn.addEventListener("click", async () => {
      await updateRequestStatus(req._id, select.value);
    });

    actionCell.appendChild(select);
    actionCell.appendChild(updateBtn);

    tbody.appendChild(tr);
  });
}

async function updateRequestStatus(id, status) {
  const statusSpan = document.getElementById("admin-panel-status");
  if (statusSpan) {
    statusSpan.textContent = "Updating status...";
    statusSpan.className = "status-text";
  }

  try {
    const res = await fetch(`${API_BASE}/api/requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) throw new Error("Failed to update status");

    if (statusSpan) {
      statusSpan.textContent = "Status updated.";
      statusSpan.classList.add("success");
    }

    await fetchAllRequestsForAdmin();
  } catch (err) {
    console.error(err);
    if (statusSpan) {
      statusSpan.textContent = err.message || "Update error";
      statusSpan.classList.add("error");
    }
  }
}

// ===== Helpers =====
function createStatusPill(status) {
  const span = document.createElement("span");
  span.className = `status-pill ${status}`;
  span.textContent = status;
  return span;
}

function escapeHtml(str) {
  return str
    ? str.replace(/[&<>"']/g, (c) => {
        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };
        return map[c];
      })
    : "";
}
