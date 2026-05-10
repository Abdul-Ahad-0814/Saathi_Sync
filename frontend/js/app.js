const API = "https://saathi-sync.onrender.com";

let editingDeadlineId = null;
let currentPartnersCache = [];
let currentPartnerIds = new Set();

// ===== INTELLIGENT CACHING SYSTEM =====
const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 min for live data (deadlines, groups, partners)
  MEDIUM: 15 * 60 * 1000,    // 15 min for semi-static data (resources, sessions)
  LONG: 60 * 60 * 1000       // 1 hour for static data (profile, subjects, books)
};

function getCacheKey(endpoint) {
  return `cache_${endpoint}_${getUserId()}`;
}

function getCache(endpoint, defaultTTL = CACHE_TTL.MEDIUM) {
  const key = getCacheKey(endpoint);
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;
  
  if (age > defaultTTL) {
    localStorage.removeItem(key);
    return null;
  }
  return data;
}

function setCache(endpoint, data, ttl = CACHE_TTL.MEDIUM) {
  const key = getCacheKey(endpoint);
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

function invalidateCache(...endpoints) {
  endpoints.forEach(ep => {
    localStorage.removeItem(getCacheKey(ep));
  });
}

// ===== REQUEST DEBOUNCING SYSTEM =====
const pendingRequests = new Map();
const REQUEST_TIMEOUT = 2000; // 2 seconds

function getRequestKey(endpoint, options = {}) {
  // Create unique key for endpoint + method combination
  const method = options.method || 'GET';
  return `${method}_${endpoint}`;
}

function isRequestPending(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  return pendingRequests.has(key);
}

function markRequestPending(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  pendingRequests.set(key, true);
}

function clearRequestLock(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  pendingRequests.delete(key);
}

function debounceRequest(endpoint, options = {}) {
  const key = getRequestKey(endpoint, options);
  
  // If request already pending, return null to indicate skip
  if (pendingRequests.has(key)) {
    console.warn(`Request already pending: ${key}`);
    return false;
  }
  
  // Mark as pending
  markRequestPending(endpoint, options);
  
  // Auto-clear after timeout
  setTimeout(() => {
    clearRequestLock(endpoint, options);
  }, REQUEST_TIMEOUT);
  
  return true;
}

function fetchWithCache(endpoint, options = {}, cacheTTL = CACHE_TTL.MEDIUM, useCache = true) {
  return new Promise(async (resolve, reject) => {
    // Check if request is already pending (debounce)
    if (!debounceRequest(endpoint, options)) {
      // Request already pending, return cached data or reject
      if (useCache) {
        const cached = getCache(endpoint, cacheTTL);
        if (cached) {
          resolve(cached);
          return;
        }
      }
      reject(new Error("Request already pending"));
      return;
    }

    try {
      if (useCache) {
        const cached = getCache(endpoint, cacheTTL);
        if (cached) {
          clearRequestLock(endpoint, options);
          resolve(cached);
          // Silently sync with API in background for next page load
          fetch(API + endpoint)
            .then(res => res.json())
            .then(data => setCache(endpoint, data, cacheTTL))
            .catch(() => {});
          return;
        }
      }

      const res = await fetch(API + endpoint, options);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setCache(endpoint, data, cacheTTL);
      clearRequestLock(endpoint, options);
      resolve(data);
    } catch (err) {
      clearRequestLock(endpoint, options);
      reject(err);
    }
  });
}

function isFastEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase().endsWith("@nu.edu.pk");
}

// ===== DEBOUNCED FETCH WRAPPER =====
async function fetchDebounced(endpoint, options = {}) {
  // Check if request is already pending
  if (!debounceRequest(endpoint, options)) {
    throw new Error("Request already pending. Please wait.");
  }

  try {
    const res = await fetch(API + endpoint, options);
    clearRequestLock(endpoint, options);
    return res;
  } catch (err) {
    clearRequestLock(endpoint, options);
    throw err;
  }
}


/* Responsive sidebar hamburger toggle for mobile */
(function () {
  function initSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const topbarLeft = document.querySelector('.topbar-left');
    const pageTopbar = document.querySelector('.page-topbar');
    const topbar = document.querySelector('.topbar');
    let insertTarget = topbarLeft || (pageTopbar ? pageTopbar : topbar);

    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Toggle sidebar');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = '&#9776;';

    if (insertTarget) {
      // ensure insertTarget uses flex so button sits nicely
      insertTarget.style.display = insertTarget.style.display || '';
      insertTarget.insertBefore(hamburger, insertTarget.firstChild);
    } else {
      // fallback: place at top of main container
      const main = document.querySelector('.main') || document.body;
      main.insertBefore(hamburger, main.firstChild);
    }

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      hamburger.setAttribute('aria-expanded', 'true');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeSidebar();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSidebarToggle);
  else initSidebarToggle();
})();

function getUserId() {
  return localStorage.getItem("user_id");
}

function showSignup() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) loginForm.style.display = "none";
  if (signupForm) signupForm.style.display = "block";
}

function showLogin() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (signupForm) signupForm.style.display = "none";
  if (loginForm) loginForm.style.display = "block";
}

function ensureLoggedIn() {
  const userId = getUserId();
  if (!userId) {
    alert("Please login first");
    window.location.href = "index.html";
    return null;
  }
  return userId;
}

async function login() {
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  if (!emailEl || !passwordEl) return;

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  if (!email || !password) {
    alert("Email and password are required");
    return;
  }
  if (!isFastEmail(email)) {
    alert("Only FAST university emails ending with @nu.edu.pk can access this website");
    return;
  }

  const btn = document.querySelector('button[onclick="login()"]');
  if (btn) {
    btn.classList.add("loading");
    btn.textContent = "Logging in...";
  }

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_name", data.name || "User");
      window.location.href = "dashboard.html";
      return;
    }

    alert(data.error || data.message || "Login failed");
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  } finally {
    if (btn) {
      btn.classList.remove("loading");
      btn.textContent = "Login";
    }
  }
}

async function signup() {
  const nameEl = document.getElementById("signupName");
  const emailEl = document.getElementById("signupEmail");
  const passEl = document.getElementById("signupPassword");
  const confirmEl = document.getElementById("signupConfirm");
  if (!nameEl || !emailEl || !passEl || !confirmEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passEl.value;
  const confirmPassword = confirmEl.value;

  if (!name || !email || !password || !confirmPassword) {
    alert("All fields are required");
    return;
  }
  if (!isFastEmail(email)) {
    alert("Only FAST university emails ending with @nu.edu.pk can access this website");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
  if (password.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  const btn = document.querySelector('button[onclick="signup()"]');
  if (btn) {
    btn.classList.add("loading");
    btn.textContent = "Creating account...";
  }

  try {
    const res = await fetch(API + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_name", data.name || name);
      window.location.href = "dashboard.html";
      return;
    }

    alert(data.error || data.message || "Signup failed");
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  } finally {
    if (btn) {
      btn.classList.remove("loading");
      btn.textContent = "Sign Up";
    }
  }
}

async function createGroup() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const nameEl = document.getElementById("groupName");
  const descEl = document.getElementById("groupDesc");
  if (!nameEl) return;

  const group_name = nameEl.value.trim();
  const subject_name = descEl ? descEl.value.trim() : "";
  if (!group_name) {
    alert("Group name is required");
    return;
  }

  try {
    // Debounce create request
    if (!debounceRequest("/groups", { method: "POST" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_name, subject_name, user_id: userId }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to create group");
      return;
    }

    alert("Group created successfully");
    nameEl.value = "";
    if (descEl) descEl.value = "";
    invalidateCache("/groups");
    invalidateCache(`/groups/joined/${userId}`);
    loadGroups();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadGroups(query = "") {
  const userId = getUserId();
  const list = document.getElementById("groupsList");
  if (!list) return;

  function renderGroups(data) {
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No groups yet.</p>';
      return;
    }

    data.forEach((group) => {
      const isOwner = userId && parseInt(userId, 10) === group.created_by_id;
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${group.group_name || "Untitled Group"}</h3>
        <p>${group.subject || "General"}</p>
        <small>Created by: ${group.created_by || "Unknown"}</small>
        <small>Members: ${group.member_count || 0}</small>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="joinGroup(${group.group_id})">Join Group</button>
          <button class="btn" onclick="viewGroup(${group.group_id}, '${(group.group_name || "Group").replace(/'/g, "&#39;")}')">View Group</button>
          ${isOwner ? `<button class="btn btn-danger" onclick="deleteGroup(${group.group_id})">Delete Group</button>` : ""}
        </div>
      `;
      list.appendChild(item);
    });
  }

  try {
    const endpoint = query ? `/groups?q=${encodeURIComponent(query)}` : "/groups";
    // Skip cache for searches
    const useCache = !query;
    const data = await fetchWithCache(endpoint, {}, CACHE_TTL.SHORT, useCache);
    renderGroups(data);

    if (userId) {
      loadJoinedGroups(userId);
    }
  } catch (err) {
    console.error("Error loading groups:", err);
    list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:red;">Failed to load groups.</p>';
  }
}

function getPartnerFilters() {
  const subjectFilter = (document.getElementById("subject") || { value: "" }).value.trim();
  const availabilityDate = (document.getElementById("availabilityDate") || { value: "" }).value.trim();
  const availabilityTime = (document.getElementById("availabilityTime") || { value: "" }).value.trim();
  return { subjectFilter, availabilityDate, availabilityTime };
}

function cacheCurrentPartners(partners) {
  currentPartnersCache = Array.isArray(partners) ? partners : [];
  currentPartnerIds = new Set(currentPartnersCache.map((partner) => Number(partner.user_id)));
}

async function fetchCurrentPartnersData(userId) {
  const res = await fetch(API + `/partners/${userId}/current`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function renderCurrentPartners(partners) {
  const list = document.getElementById("currentPartners");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(partners) || partners.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);">No current partners yet.</p>';
    return;
  }

  partners.forEach((partner) => {
    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <h3>${partner.name}</h3>
      <p>Email: ${partner.email}</p>
      <p>Subjects: ${partner.subject || "General"}</p>
      <small>Connected On: ${partner.connected_on || "-"}</small>
    `;
    list.appendChild(item);
  });
}

function renderPartnerResults(data, subjectFilter, availabilityTime) {
  const list = document.getElementById("results");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);">No partners found yet.</p>';
    return;
  }

  const normalizedSubject = subjectFilter.toLowerCase();
  const timePattern = /^[0-2][0-9]:[0-5][0-9]$/;

  const filtered = data.filter((partner) => {
    if (currentPartnerIds.has(Number(partner.user_id))) return false;
    const subjects = partner.subjects || partner.subject || "";
    return !normalizedSubject || subjects.toLowerCase().includes(normalizedSubject);
  });

  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);">No matches for current filters.</p>';
    return;
  }

  filtered.forEach((partner) => {
    const item = document.createElement("div");
    item.className = "card";
    const universityValue = partner.university || "";
    const hasTimeAsUniversity = timePattern.test(universityValue);
    const displayAvailabilityTime = partner.availability_time || (hasTimeAsUniversity ? universityValue : availabilityTime) || "Flexible";

    item.innerHTML = `
      <h3>${partner.name}</h3>
      <p>Subjects: ${partner.subjects || partner.subject || "General"}</p>
      <p>Availability Time: ${displayAvailabilityTime}</p>
      <button class="btn btn-secondary" onclick="connectPartner(${partner.user_id})">Add Partner</button>
    `;
    list.appendChild(item);
  });
}

function searchGroups() {
  const searchEl = document.getElementById("groupSearch");
  loadGroups(searchEl ? searchEl.value.trim() : "");
}

async function joinGroup(groupId) {
  const userId = ensureLoggedIn();
  if (!userId) return;

  try {
    // Debounce join request
    if (!debounceRequest(`/groups/${groupId}/join`, { method: "POST" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + `/groups/${groupId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    clearRequestLock(`/groups/${groupId}/join`, { method: "POST" });

    if (!res.ok) {
      alert(data.error || "Failed to join group");
      return;
    }

    alert("Joined group successfully");
    invalidateCache("/groups");
    invalidateCache(`/groups/joined/${userId}`);
    loadGroups((document.getElementById("groupSearch") || { value: "" }).value.trim());
    loadJoinedGroups(userId);
  } catch (err) {
    clearRequestLock(`/groups/${groupId}/join`, { method: "POST" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadJoinedGroups(userId) {
  const list = document.getElementById("joinedGroupsList");
  if (!list || !userId) return;

  try {
    const res = await fetch(API + `/groups/joined/${userId}`);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No joined groups yet.</p>';
      return;
    }

    data.forEach((group) => {
      const isOwner = parseInt(userId, 10) === group.created_by_id;
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${group.group_name || "Untitled Group"}</h3>
        <p>${group.subject || "General"}</p>
        <small>Members: ${group.member_count || 0}</small>
        <span class="badge-status completed">Joined</span>
        ${isOwner ? `<div style="margin-top:10px;"><button class="btn btn-danger" onclick="deleteGroup(${group.group_id})">Delete Group</button></div>` : ""}
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading joined groups:", err);
  }
}

async function viewGroup(groupId, groupName) {
  const details = document.getElementById("groupDetailsList");
  if (!details) return;

  try {
    const res = await fetch(API + `/groups/${groupId}/members`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      details.innerHTML = `<p style="color:var(--muted);">No members found for ${groupName}.</p>`;
      return;
    }

    const rows = data.map((member) => `
      <div class="group-member-row">
        <span class="member-avatar">${(member.name || "U").slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>${member.name || "Unknown"}</strong>
          <small>${member.university || "No university listed"}</small>
        </div>
      </div>
    `).join("");

    details.innerHTML = `<h3 style="margin-top:0;">${groupName}</h3>${rows}`;
  } catch (err) {
    console.error("Error viewing group:", err);
    details.innerHTML = '<p style="color:var(--danger);">Could not load group details.</p>';
  }
}

async function deleteGroup(groupId) {
  const userId = ensureLoggedIn();
  if (!userId) return;

  if (!confirm("Delete this group? All members will be removed from this group.")) return;

  try {
    // Debounce delete request
    if (!debounceRequest(`/groups/${groupId}`, { method: "DELETE" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + `/groups/${groupId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    clearRequestLock(`/groups/${groupId}`, { method: "DELETE" });

    if (!res.ok) {
      alert(data.error || "Failed to delete group");
      return;
    }

    alert("Group deleted successfully");
    const details = document.getElementById("groupDetailsList");
    if (details) details.innerHTML = "";
    invalidateCache("/groups");
    invalidateCache(`/groups/joined/${userId}`);
    loadGroups((document.getElementById("groupSearch") || { value: "" }).value.trim());
    loadJoinedGroups(userId);
  } catch (err) {
    clearRequestLock(`/groups/${groupId}`, { method: "DELETE" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function addDeadline() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const titleEl = document.getElementById("title");
  const dateEl = document.getElementById("date");
  const priorityEl = document.getElementById("priority");
  const statusEl = document.getElementById("status");
  if (!titleEl || !dateEl || !priorityEl || !statusEl) return;

  const title = titleEl.value.trim();
  const due_date = dateEl.value;
  const priority = priorityEl.value;
  const status = statusEl.value;
  if (!title || !due_date) {
    alert("Title and date are required");
    return;
  }

  const endpointPath = editingDeadlineId ? `/deadlines/${editingDeadlineId}` : `/deadlines`;
  const method = editingDeadlineId ? "PUT" : "POST";
  const payload = { title, due_date, user_id: userId, priority, status };

  try {
    // Debounce request to prevent duplicate submissions
    if (!debounceRequest(endpointPath, { method })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + endpointPath, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    clearRequestLock(endpointPath, { method });

    if (!res.ok) {
      alert(data.error || (editingDeadlineId ? "Failed to update deadline" : "Failed to add deadline"));
      return;
    }

    alert(editingDeadlineId ? "Deadline updated successfully" : "Deadline added successfully");
    titleEl.value = "";
    dateEl.value = "";
    priorityEl.value = "Medium";
    statusEl.value = "Pending";
    editingDeadlineId = null;
    const addButton = document.getElementById("deadlineSubmitBtn");
    if (addButton) addButton.textContent = "Add Deadline";
    invalidateCache(`/deadlines/${userId}`);
    loadDeadlines();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadDeadlines(priority = null, status = null) {
  const userId = getUserId();
  const list = document.getElementById("deadlinesList");
  const completedList = document.getElementById("completedDeadlinesList");
  if (!userId || !list || !completedList) return;

  const endpoint = `/deadlines/${userId}`;
  // Skip cache if filters are applied
  const useCache = !priority && !status;

  try {
    const data = await fetchWithCache(endpoint, {}, CACHE_TTL.SHORT, useCache);
    list.innerHTML = "";
    completedList.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No deadlines yet.</td></tr>';
      completedList.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No completed deadlines yet.</td></tr>';
      return;
    }

    let activeDeadlines = data.filter((deadline) => String(deadline.status || "").toLowerCase() !== "completed");
    let completedDeadlines = data.filter((deadline) => String(deadline.status || "").toLowerCase() === "completed");
    
    // Apply filters if provided
    if (priority && priority !== 'All Priorities') activeDeadlines = activeDeadlines.filter(d => d.priority === priority);
    if (status && status !== 'All Statuses') activeDeadlines = activeDeadlines.filter(d => d.status === status);

    if (activeDeadlines.length === 0) {
      list.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No active deadlines.</td></tr>';
    } else {
      activeDeadlines.forEach((deadline) => {
        const item = document.createElement("tr");
        item.innerHTML = `
          <td>${deadline.title}</td>
          <td>${deadline.due_date}</td>
          <td>${deadline.priority || "Medium"}</td>
          <td>${deadline.status || "Pending"}</td>
          <td style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick='editDeadline(${JSON.stringify(deadline)})' class="btn">Edit</button>
            <button onclick="deleteDeadline(${deadline.deadline_id})" class="btn btn-danger">Delete</button>
          </td>
        `;
        list.appendChild(item);
      });
    }

    if (completedDeadlines.length === 0) {
      completedList.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No completed deadlines yet.</td></tr>';
    } else {
      completedDeadlines.forEach((deadline) => {
        const item = document.createElement("tr");
        item.innerHTML = `
          <td>${deadline.title}</td>
          <td>${deadline.due_date}</td>
          <td>${deadline.priority || "Medium"}</td>
          <td>${deadline.status || "Completed"}</td>
          <td>
            <button onclick="deleteDeadline(${deadline.deadline_id})" class="btn btn-danger">Delete</button>
          </td>
        `;
        completedList.appendChild(item);
      });
    }
  } catch (err) {
    console.error("Error loading deadlines:", err);
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Failed to load deadlines.</td></tr>';
  }
}

function editDeadline(deadline) {
  const titleEl = document.getElementById("title");
  const dateEl = document.getElementById("date");
  const priorityEl = document.getElementById("priority");
  const statusEl = document.getElementById("status");
  const addButton = document.getElementById("deadlineSubmitBtn");

  if (!titleEl || !dateEl || !priorityEl || !statusEl) return;

  editingDeadlineId = deadline.deadline_id;
  titleEl.value = deadline.title || "";
  dateEl.value = deadline.due_date || "";
  priorityEl.value = deadline.priority || "Medium";
  statusEl.value = deadline.status || "Pending";
  if (addButton) addButton.textContent = "Update Deadline";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function markDeadlineCompleted(deadlineId) {
  try {
    const res = await fetch(API + `/deadlines/${deadlineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to mark deadline as completed");
      return;
    }

    loadDeadlines();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function deleteDeadline(id) {
  if (!confirm("Are you sure you want to delete this deadline?")) return;

  const userId = getUserId();
  try {
    // Debounce delete request
    if (!debounceRequest(`/deadlines/${id}`, { method: "DELETE" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + `/deadlines/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete deadline");
      return;
    }

    alert("Deadline deleted");
    clearRequestLock(`/deadlines/${id}`, { method: "DELETE" });
    invalidateCache(`/deadlines/${userId}`);
    loadDeadlines();
  } catch (err) {
    clearRequestLock(`/deadlines/${id}`, { method: "DELETE" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function uploadResource() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const titleEl = document.getElementById("resourceTitle");
  const descEl = document.getElementById("resourceDesc");
  const fileEl = document.getElementById("resourceFile");
  const visibilityEl = document.getElementById("resourceVisibility");
  if (!titleEl || !descEl) return;

  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const file_path = fileEl ? fileEl.value.trim() : "";
  const visibility = visibilityEl ? visibilityEl.value : "Private";

  if (!title) {
    alert("Title is required");
    return;
  }

  try {
    // Debounce upload request
    if (!debounceRequest("/resources", { method: "POST" })) {
      alert("Upload already in progress. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        user_id: userId,
        type: "Notes",
        file_path: file_path || description,
        visibility,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to upload resource");
      return;
    }

    alert("Resource uploaded successfully");
    titleEl.value = "";
    descEl.value = "";
    if (fileEl) fileEl.value = "";
    if (visibilityEl) visibilityEl.value = "Private";
    invalidateCache(`/resources/user/${userId}`);
    invalidateCache(`/resources?visibility=Public`);
    loadResources();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadResources() {
  const list = document.getElementById("resourcesList");
  if (!list) return;

  const userId = getUserId();
  if (!userId) return;

  try {
    const endpoint = `/resources/user/${userId}`;
    const data = await fetchWithCache(endpoint, {}, CACHE_TTL.MEDIUM, true);
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No resources yet.</p>';
      return;
    }

    data.forEach((resource) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${resource.title}</h3>
        <p>Subject: ${resource.subject || "General"}</p>
        <p>Type: ${resource.type || "Notes"}</p>
        <p>Visibility: ${resource.visibility || "Private"}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center;">
          ${resource.file_path ? `<a href="${resource.file_path}" target="_blank" rel="noopener noreferrer" class="btn">Open</a>` : ""}
          <button class="btn btn-danger" onclick="deleteResource(${resource.resource_id})">Delete</button>
        </div>
        <small>Uploaded by: ${resource.uploaded_by || "Unknown"}</small>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading resources:", err);
    list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:red;">Failed to load resources.</p>';
  }
}

async function deleteResource(resourceId) {
  if (!confirm("Delete this resource? This action cannot be undone.")) return;

  const userId = getUserId();
  try {
    // Debounce delete request
    if (!debounceRequest(`/resources/${resourceId}`, { method: "DELETE" })) {
      alert("Delete already in progress. Please wait a moment.");
      return;
    }

    const res = await fetch(API + `/resources/${resourceId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    clearRequestLock(`/resources/${resourceId}`, { method: "DELETE" });

    if (!res.ok) {
      alert(data.error || "Failed to delete resource");
      return;
    }

    alert("Resource deleted successfully");
    invalidateCache(`/resources/user/${userId}`);
    invalidateCache(`/resources?visibility=Public`);
    loadResources();
  } catch (err) {
    clearRequestLock(`/resources/${resourceId}`, { method: "DELETE" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function addSession() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const subjectEl = document.getElementById("subject");
  const durationEl = document.getElementById("duration");
  if (!durationEl) return;

  const subject_name = subjectEl ? subjectEl.value.trim() : "";
  const durationHours = parseFloat(durationEl.value);

  if (Number.isNaN(durationHours) || durationHours <= 0) {
    alert("Please enter a valid duration in hours");
    return;
  }

  const duration = Math.round(durationHours * 60);

  try {
    // Debounce session request
    if (!debounceRequest("/sessions", { method: "POST" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        subject_name,
        duration,
        topic_covered: subject_name || "Study session",
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add session");
      return;
    }

    alert("Study session added");
    if (subjectEl) subjectEl.value = "";
    durationEl.value = "";
    invalidateCache(`/sessions/${userId}`);
    loadSessions();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadSessions() {
  const userId = getUserId();
  const list = document.getElementById("sessionList");
  if (!userId || !list) return;

  try {
    const endpoint = `/sessions/${userId}`;
    const data = await fetchWithCache(endpoint, {}, CACHE_TTL.MEDIUM, true);
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No sessions recorded yet.</p>';
      return;
    }

    data.forEach((session) => {
      const row = document.createElement("div");
      row.className = "session-row";
      row.innerHTML = `
        <strong>${session.date}</strong>
        <span>${Math.round((session.duration_minutes || 0) / 60 * 10) / 10}h</span>
        <span>${session.topic_covered || session.subject || "Study"}</span>
        <span class="badge-status completed">Completed</span>
      `;
      list.appendChild(row);
    });

    const countBadge = document.querySelector(".history-card .badge-status");
    if (countBadge) countBadge.textContent = `${data.length} Records`;
  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

async function updateProfile() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const nameEl = document.getElementById("name");
  const availabilityEl = document.getElementById("availability");
  const subjectEl = document.getElementById("subject");
  if (!nameEl) return;

  const payload = {};
  if (nameEl.value.trim()) payload.name = nameEl.value.trim();
  if (availabilityEl) payload.availability_time = availabilityEl.value.trim() || null;

  try {
    // Debounce update request
    if (!debounceRequest(`/profile/${userId}`, { method: "PUT" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/profile/" + userId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    clearRequestLock(`/profile/${userId}`, { method: "PUT" });

    if (!res.ok) {
      alert(data.error || "Failed to update profile");
      return;
    }

    if (subjectEl && subjectEl.value.trim()) {
      await fetch(API + "/subjects/" + userId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_name: subjectEl.value.trim() }),
      });
    }

    alert("Profile updated successfully");
    invalidateCache(`/profile/${userId}`);
    invalidateCache(`/subjects/${userId}`);
    loadProfile();
  } catch (err) {
    clearRequestLock(`/profile/${userId}`, { method: "PUT" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadProfile() {
  const userId = getUserId();
  if (!userId) return;

  try {
    const [profileData, subjectData, sessions, deadlines, resources, bookmarks, groups] = await Promise.all([
      fetchWithCache(`/profile/${userId}`, {}, CACHE_TTL.LONG, true),
      fetchWithCache(`/subjects/${userId}`, {}, CACHE_TTL.LONG, true),
      fetchWithCache(`/sessions/${userId}`, {}, CACHE_TTL.MEDIUM, true),
      fetchWithCache(`/deadlines/${userId}`, {}, CACHE_TTL.SHORT, true),
      fetchWithCache(`/resources/user/${userId}`, {}, CACHE_TTL.MEDIUM, true),
      fetchWithCache(`/bookmarks/${userId}`, {}, CACHE_TTL.MEDIUM, true),
      fetchWithCache(`/groups/joined/${userId}`, {}, CACHE_TTL.SHORT, true),
    ]);

    if (profileData) {
      const nameEl = document.getElementById("name");
      const availabilityEl = document.getElementById("availability");
      const displayName = document.getElementById("profileDisplayName");
      const displayEmail = document.getElementById("profileDisplayEmail");
      const displayRole = document.getElementById("profileDisplayRole");

      if (nameEl) nameEl.value = profileData.name || "";
      if (availabilityEl) availabilityEl.value = profileData.availability_time || "";
      if (displayName) displayName.textContent = profileData.name || "Saathi User";
      if (displayEmail) displayEmail.textContent = profileData.email || "";
      if (displayRole) displayRole.textContent = profileData.role || "Student";
    }

    console.log(groups.length);
    setText("profileSessionCount", String(sessions.length));
    setText("profileDeadlineCount", String(deadlines.length));
    setText("profileResourceCount", String(resources.length));
    setText("profileBookmarkCount", String(bookmarks.length));
    setText("profileGroupCount", String(groups.length));

    if (subjectRes.ok && Array.isArray(subjectData) && subjectData.length) {
      const subjectEl = document.getElementById("subject");
      if (subjectEl) subjectEl.value = subjectData[0].subject_name || "";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

async function saveSettings() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const nameEl = document.getElementById("settingsName");
  const emailEl = document.getElementById("settingsEmail");
  const notifyDeadlinesEl = document.getElementById("notifyDeadlines");
  const notifySessionsEl = document.getElementById("notifySessions");
  const notifyResourcesEl = document.getElementById("notifyResources");
  if (!nameEl || !emailEl) return;

  const payload = {
    name: nameEl.value.trim(),
    email: emailEl.value.trim(),
    notify_deadlines: notifyDeadlinesEl ? notifyDeadlinesEl.checked : false,
    notify_sessions: notifySessionsEl ? notifySessionsEl.checked : false,
    notify_resources: notifyResourcesEl ? notifyResourcesEl.checked : false,
  };

  try {
    const res = await fetch(API + "/profile/" + userId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to save settings");
      return;
    }

    localStorage.setItem("user_name", payload.name || localStorage.getItem("user_name") || "User");
    alert("Settings saved. Notifications will be sent to your email.");
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function changePassword() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const newPasswordEl = document.getElementById("newPassword");
  const confirmPasswordEl = document.getElementById("confirmPassword");
  if (!newPasswordEl || !confirmPasswordEl) return;

  const newPassword = newPasswordEl.value;
  const confirmPassword = confirmPasswordEl.value;

  if (!newPassword || !confirmPassword) {
    alert("New password and confirm password are required");
    return;
  }

  if (newPassword.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch(API + `/profile/${userId}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update password");
      return;
    }

    newPasswordEl.value = "";
    confirmPasswordEl.value = "";
    alert("Password updated successfully");
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

function resetSettings() {
  const fields = ["settingsName", "settingsEmail", "settingsTimezone", "settingsMode", "newPassword", "confirmPassword"];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });

  ["notifyDeadlines", "notifySessions", "notifyResources"].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = idx < 2;
  });
}

async function loadSettings() {
  const userId = getUserId();
  if (!userId) return;

  try {
    const res = await fetch(API + "/profile/" + userId);
    const data = await res.json();
    if (!res.ok) return;

    const nameEl = document.getElementById("settingsName");
    const emailEl = document.getElementById("settingsEmail");
    const notifyDeadlinesEl = document.getElementById("notifyDeadlines");
    const notifySessionsEl = document.getElementById("notifySessions");
    const notifyResourcesEl = document.getElementById("notifyResources");

    if (nameEl) nameEl.value = data.name || "";
    if (emailEl) emailEl.value = data.email || "";
    if (notifyDeadlinesEl) notifyDeadlinesEl.checked = data.notify_deadlines !== false;
    if (notifySessionsEl) notifySessionsEl.checked = data.notify_sessions !== false;
    if (notifyResourcesEl) notifyResourcesEl.checked = data.notify_resources === true;
  } catch (err) {
    console.error("Error loading settings:", err);
  }
}

async function loadBooks() {
  const list = document.getElementById("books");
  if (!list) return;

  const qEl = document.getElementById("search");
  const query = qEl ? qEl.value.trim() : "";

  try {
    const endpoint = query ? `/library/search?q=${encodeURIComponent(query)}` : "/library";
    // Skip cache for search queries, use cache for default view
    const useCache = !query;
    const data = await fetchWithCache(endpoint, {}, CACHE_TTL.LONG, useCache);
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No books found.</p>';
      return;
    }

    data.forEach((book) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${book.title}</h3>
        <p>Author: ${book.author || "Unknown"}</p>
        <p>Subject: ${book.subject || "General"}</p>
        <span class="badge-status ${book.is_available ? "completed" : "pending"}">${book.is_available ? "Available" : "Unavailable"}</span>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading books:", err);
  }

  loadLibraryResources();
}

async function loadLibraryResources() {
  const list = document.getElementById("libraryResourcesList");
  if (!list) return;

  try {
    const res = await fetch(API + "/resources/public");
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No public resources yet.</p>';
      return;
    }

    data.forEach((resource) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${resource.title}</h3>
        <p>Subject: ${resource.subject || "General"}</p>
        <p>Type: ${resource.type || "Notes"}</p>
        <p>Visibility: ${resource.visibility || "Public"}</p>
        <small>Uploaded by: ${resource.uploaded_by || "Unknown"}</small>
        ${resource.file_path ? `<a href="${resource.file_path}" target="_blank" rel="noopener noreferrer" class="btn">Open</a>` : ""}
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading library resources:", err);
  }
}

async function findPartners() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const { subjectFilter, availabilityDate, availabilityTime } = getPartnerFilters();

  try {
    const params = new URLSearchParams();
    const query = [subjectFilter, availabilityDate, availabilityTime].filter(Boolean).join(" ");
    if (query) params.set("q", query);
    if (subjectFilter) params.set("subject", subjectFilter);
    if (availabilityDate) params.set("availability_date", availabilityDate);
    if (availabilityTime) params.set("availability_time", availabilityTime);

    const searchUrl = API + `/partners/${userId}${params.toString() ? `?${params.toString()}` : ""}`;
    const [partnersRes, currentPartners] = await Promise.all([
      fetch(searchUrl).then((res) => res.json()),
      currentPartnersCache.length ? Promise.resolve(currentPartnersCache) : fetchCurrentPartnersData(userId),
    ]);

    cacheCurrentPartners(currentPartners);

    renderCurrentPartners(currentPartnersCache);
    renderPartnerResults(partnersRes, subjectFilter, availabilityTime);
  } catch (err) {
    console.error("Error finding partners:", err);
  }
}

async function connectPartner(partnerId) {
  const userId = ensureLoggedIn();
  if (!userId) return;

  try {
    // Debounce connect request
    if (!debounceRequest("/partners/connect", { method: "POST" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/partners/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, partner_id: partnerId }),
    });
    const data = await res.json();
    clearRequestLock("/partners/connect", { method: "POST" });

    if (!res.ok) {
      alert(data.error || "Failed to connect partner");
      return;
    }

    alert("Partner added to current partners");
    invalidateCache(`/partners/${userId}/current`);
    await loadCurrentPartners(true);
    await findPartners();
  } catch (err) {
    clearRequestLock("/partners/connect", { method: "POST" });
    console.error("Error connecting partner:", err);
  }
}

async function loadCurrentPartners(refresh = false) {
  const userId = getUserId();
  const list = document.getElementById("currentPartners");
  if (!userId || !list) return;

  try {
    const partners = refresh || !currentPartnersCache.length ? await fetchCurrentPartnersData(userId) : currentPartnersCache;
    cacheCurrentPartners(partners);
    renderCurrentPartners(currentPartnersCache);
  } catch (err) {
    console.error("Error loading current partners:", err);
  }
}

async function loadBookmarkResources() {
  const select = document.getElementById("bookmarkResource");
  if (!select) return;

  try {
    const userId = getUserId();
    const [publicRes, ownRes] = await Promise.all([
      fetch(API + "/resources/public").then((res) => (res.ok ? res.json() : [])),
      userId ? fetch(API + `/resources/user/${userId}`).then((res) => (res.ok ? res.json() : [])) : Promise.resolve([]),
    ]);

    const seen = new Set();
    const data = [...publicRes, ...ownRes].filter((resource) => {
      if (seen.has(resource.resource_id)) return false;
      seen.add(resource.resource_id);
      return true;
    });

    select.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      select.innerHTML = '<option value="">No resources available</option>';
      return;
    }

    data.forEach((resource) => {
      const opt = document.createElement("option");
      opt.value = resource.resource_id;
      opt.textContent = `${resource.title} (${resource.type || "Notes"})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading bookmark resources:", err);
  }
}

async function addBookmark() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const resourceEl = document.getElementById("bookmarkResource");
  const topicEl = document.getElementById("bookmarkTopic");
  if (!resourceEl) return;

  const resource_id = parseInt(resourceEl.value, 10);
  const saved_topic = topicEl ? topicEl.value.trim() : "";

  if (!resource_id) {
    alert("Please select a resource");
    return;
  }

  try {
    // Debounce bookmark request
    if (!debounceRequest("/bookmarks", { method: "POST" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + "/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, resource_id, saved_topic }),
    });
    const data = await res.json();
    clearRequestLock("/bookmarks", { method: "POST" });

    if (!res.ok) {
      alert(data.error || "Failed to add bookmark");
      return;
    }

    alert("Bookmark added");
    if (topicEl) topicEl.value = "";
    if (resourceEl) resourceEl.value = "";
    invalidateCache(`/bookmarks/${userId}`);
    loadBookmarks();
  } catch (err) {
    clearRequestLock("/bookmarks", { method: "POST" });
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadBookmarks() {
  const userId = getUserId();
  const list = document.getElementById("bookmarkList");
  if (!userId || !list) return;

  try {
    const res = await fetch(API + "/bookmarks/" + userId);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No bookmarks yet.</p>';
      return;
    }

    data.forEach((bookmark) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${bookmark.resource_title}</h3>
        <p>Subject: ${bookmark.subject || "General"}</p>
        <p>Topic: ${bookmark.saved_topic || "-"}</p>
        ${bookmark.file_path ? `<a href="${bookmark.file_path}" target="_blank" class="btn">Open</a>` : ""}
        <button class="btn btn-danger" onclick="deleteBookmark(${bookmark.bookmark_id})">Delete</button>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading bookmarks:", err);
  }
}

async function deleteBookmark(bookmarkId) {
  if (!confirm("Delete this bookmark?")) return;

  const userId = getUserId();
  try {
    // Debounce delete request
    if (!debounceRequest(`/bookmarks/${bookmarkId}`, { method: "DELETE" })) {
      alert("Request already pending. Please wait a moment.");
      return;
    }

    const res = await fetch(API + `/bookmarks/${bookmarkId}`, { method: "DELETE" });
    const data = await res.json();
    clearRequestLock(`/bookmarks/${bookmarkId}`, { method: "DELETE" });

    if (!res.ok) {
      alert(data.error || "Failed to delete bookmark");
      return;
    }

    invalidateCache(`/bookmarks/${userId}`);
    loadBookmarks();
  } catch (err) {
    clearRequestLock(`/bookmarks/${bookmarkId}`, { method: "DELETE" });
    console.error("Error deleting bookmark:", err);
  }
}

function logout() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("timerStart");
  localStorage.removeItem("timerRunning");
  window.location.href = "index.html";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
    el.value = value;
  } else {
    el.textContent = value;
  }
}

function updateDashboardBarHighlights(bars) {
  bars.forEach((bar) => {
    bar.classList.remove("bar-1", "bar-2", "bar-3");
  });

  const barData = bars.map((bar, index) => ({ index, height: parseFloat(bar.style.height || "0") }));
  barData.sort((a, b) => b.height - a.height);

  if (barData[0]) bars[barData[0].index].classList.add("bar-1");
  if (barData[1]) bars[barData[1].index].classList.add("bar-2");
  if (barData[2]) bars[barData[2].index].classList.add("bar-3");
}

function animateDashboardDonut(targetPercent) {
  const donut = document.querySelector(".donut-shell");
  const text = document.getElementById("dashboardProgressPercent") || document.querySelector(".donut-center strong");
  if (!donut || !text) return;

  const safeTarget = Math.max(0, Math.min(100, Math.round(targetPercent)));
  const currentText = parseInt(text.textContent, 10);
  const from = Number.isNaN(currentText) ? 0 : currentText;

  if (from === safeTarget) {
    donut.style.setProperty("--progress", `${safeTarget}%`);
    text.textContent = `${safeTarget}%`;
    return;
  }

  let value = from;
  const step = from < safeTarget ? 1 : -1;
  const interval = setInterval(() => {
    if (value === safeTarget) {
      clearInterval(interval);
      return;
    }
    value += step;
    donut.style.setProperty("--progress", `${value}%`);
    text.textContent = `${value}%`;
  }, 10);
}

function toDateOnly(value) {
  const parts = String(value || "").split("-").map((n) => parseInt(n, 10));
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDueText(deadlineDate, today) {
  const msInDay = 24 * 60 * 60 * 1000;
  const deltaDays = Math.round((deadlineDate - today) / msInDay);

  if (deltaDays < 0) return "Overdue";
  if (deltaDays === 0) return "Due today";
  if (deltaDays === 1) return "Due tomorrow";
  return `Due in ${deltaDays} days`;
}

function hoursText(totalMinutes) {
  const hours = (totalMinutes || 0) / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

async function fetchArray(endpoint, ttl = CACHE_TTL.MEDIUM) {
  try {
    const data = await fetchWithCache(endpoint, {}, ttl, true);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error loading ${endpoint}:`, err);
    return [];
  }
}

async function fetchObject(endpoint, ttl = CACHE_TTL.MEDIUM) {
  try {
    const data = await fetchWithCache(endpoint, {}, ttl, true);
    return data || null;
  } catch (err) {
    console.error(`Error loading ${endpoint}:`, err);
    return null;
  }
}

async function loadDashboardData() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const [sessions, groups, deadlines, resources, bookmarks, profile] = await Promise.all([
    fetchArray(`/sessions/${userId}`, CACHE_TTL.MEDIUM),
    fetchArray("/groups", CACHE_TTL.SHORT),
    fetchArray(`/deadlines/${userId}`, CACHE_TTL.SHORT),
    fetchArray(`/resources/user/${userId}`, CACHE_TTL.MEDIUM),
    fetchArray(`/bookmarks/${userId}`, CACHE_TTL.MEDIUM),
    fetchObject(`/profile/${userId}`, CACHE_TTL.LONG),
  ]);

  if (profile) {
    setText("dashboardChipName", profile.name || localStorage.getItem("user_name") || "Saathi User");
    setText("dashboardChipEmail", profile.email || "student@saathi.app");
  } else {
    setText("dashboardChipName", localStorage.getItem("user_name") || "Saathi User");
  }

  const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  const totalHours = hoursText(totalMinutes);
  setText("dashboardTotalHours", totalHours);

  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 6);

  const weekDeadlines = deadlines.filter((deadline) => {
    const due = toDateOnly(deadline.due_date);
    const isCompleted = String(deadline.status || "").toLowerCase() === "completed";
    return due && due >= today && due <= weekEnd && !isCompleted;
  });

  setText("dashboardActiveProjects", String(groups.length));
  setText("dashboardDeadlinesWeek", String(weekDeadlines.length));
  setText("dashboardCompletedTasks", String(sessions.length));

  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);
  const weekMinutes = sessions.reduce((sum, session) => {
    const date = toDateOnly(session.date);
    if (date && date >= last7Start && date <= today) {
      return sum + (session.duration_minutes || 0);
    }
    return sum;
  }, 0);

  setText("dashboardTotalHoursTrend", `${hoursText(weekMinutes)}h this week`);
  setText("dashboardActiveProjectsTrend", `${resources.length} resources`);
  setText("dashboardDeadlinesWeekTrend", weekDeadlines.length ? "Upcoming" : "All clear");
  setText("dashboardCompletedTasksTrend", `${bookmarks.length} bookmarks`);

  const groupsPreview = document.getElementById("dashboardGroupsPreview");
  if (groupsPreview) {
    groupsPreview.innerHTML = "";
    if (!groups.length) {
      groupsPreview.innerHTML = '<p style="color:var(--muted);">No groups created yet.</p>';
    } else {
      groups.slice(0, 3).forEach((group) => {
        const row = document.createElement("div");
        row.className = "group-member-row";

        const initials = (group.group_name || "G")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("") || "G";

        row.innerHTML = `
          <span class="member-avatar">${initials}</span>
          <div>
            <strong>${group.group_name || "Untitled Group"}</strong>
            <small>${group.subject ? `Subject: ${group.subject}` : "No subject tagged"}</small>
          </div>
        `;
        groupsPreview.appendChild(row);
      });
    }
  }

  const upcomingContainer = document.getElementById("dashboardUpcomingDeadlines");
  if (upcomingContainer) {
    upcomingContainer.innerHTML = "";

    const sorted = deadlines
      .map((deadline) => ({ ...deadline, parsedDate: toDateOnly(deadline.due_date) }))
      .filter((deadline) => deadline.parsedDate && String(deadline.status || "").toLowerCase() !== "completed")
      .sort((a, b) => a.parsedDate - b.parsedDate)
      .slice(0, 6);

    if (!sorted.length) {
      upcomingContainer.innerHTML = '<p style="color:var(--muted);">No upcoming deadlines.</p>';
    } else {
      sorted.forEach((deadline) => {
        const row = document.createElement("div");
        row.className = "project-row";
        row.innerHTML = `
          <span class="project-dot"></span>
          <strong>${deadline.title}</strong>
          <small style="color: white">${formatDueText(deadline.parsedDate, today)}</small>
        `;
        upcomingContainer.appendChild(row);
      });
    }
  }

  const bars = Array.from(document.querySelectorAll(".chart-bars span"));
  if (bars.length) {
    const dailyMinutes = {};
    sessions.forEach((session) => {
      const key = String(session.date || "").slice(0, 10);
      if (!key) return;
      dailyMinutes[key] = (dailyMinutes[key] || 0) + (session.duration_minutes || 0);
    });

    const weekKeys = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      weekKeys.push(d.toISOString().slice(0, 10));
    }

    const weekSeries = weekKeys.map((key) => dailyMinutes[key] || 0);
    const maxMinutes = Math.max(...weekSeries, 0);

    bars.forEach((bar, index) => {
      const value = weekSeries[index] || 0;
      const heightPct = maxMinutes ? Math.max(12, Math.round((value / maxMinutes) * 100)) : 12;
      bar.style.height = `${heightPct}%`;
      bar.title = `${Math.round((value / 60) * 10) / 10}h`;
    });

    updateDashboardBarHighlights(bars);
  }

  const weeklyHours = weekMinutes / 60;
  const weeklyTarget = 14;
  const progress = Math.round((weeklyHours / weeklyTarget) * 100);
  animateDashboardDonut(Math.max(0, Math.min(100, progress)));
}

function initTimer() {
  const timer = document.querySelector(".timer-card");
  if (!timer) return;

  const display = timer.querySelector(".timer-display");
  const startBtn = timer.querySelector(".btn-start-control");
  // const pauseBtn = timer.querySelector(".btn-light-control");
  const stopBtn = timer.querySelector(".btn-stop-control");
  if (!display || !startBtn || !stopBtn) return;

  let interval = null;

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateDisplay() {
    const startTime = localStorage.getItem("timerStart");
    if (!startTime) {
      display.innerText = "00:00:00";
      return;
    }

    const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
    display.innerText = formatTime(elapsed);
  }

  function runTimer() {
    clearInterval(interval);
    updateDisplay();
    interval = setInterval(updateDisplay, 1000);
  }

  function updateButtonStates() {
    const isRunning = localStorage.getItem("timerRunning") === "true";
    startBtn.disabled = isRunning;
    // pauseBtn.disabled = !isRunning;
    stopBtn.disabled = false;
  }

  updateButtonStates();

  if (localStorage.getItem("timerRunning") === "true") runTimer();
  else updateDisplay();

  startBtn.addEventListener("click", () => {
    if (localStorage.getItem("timerRunning") === "true") return;

    localStorage.setItem("timerStart", Date.now().toString());
    localStorage.setItem("timerRunning", "true");
    timer.classList.add("show");
    runTimer();
    updateButtonStates();
  });

  // pauseBtn.addEventListener("click", () => {
  //   clearInterval(interval);
  //   interval = null;
  //   localStorage.setItem("timerRunning", "false");
  //   updateButtonStates();
  // });

  stopBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = null;
    localStorage.removeItem("timerStart");
    localStorage.removeItem("timerRunning");
    display.innerText = "00:00:00";
    timer.classList.remove("show");
    updateButtonStates();
  });
}

function initDashboardUI() {
  const chip = document.getElementById("profileChip");
  const dropdown = document.getElementById("profileDropdown");
  if (chip && dropdown) {
    chip.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!chip.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();

  initTimer();
  initDashboardUI();

  if (page === "groups.html") loadGroups();
  if (page === "deadlines.html") loadDeadlines();
  if (page === "resources.html") loadResources();
  if (page === "sessions.html") loadSessions();
  if (page === "profile.html") loadProfile();
  if (page === "settings.html") loadSettings();
  if (page === "library.html") loadBooks();
  if (page === "dashboard.html") loadDashboardData();
  if (page === "bookmarks.html") {
    loadBookmarkResources();
    loadBookmarks();
  }
  if (page === "partners.html") {
    findPartners();
  }
});
