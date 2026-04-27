const API = "http://127.0.0.1:5001";

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

  try {
    const endpoint = query ? `/groups?q=${encodeURIComponent(query)}` : "/groups";
    const res = await fetch(API + endpoint);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No groups yet.</p>';
      return;
    }

    data.forEach((group) => {
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
        </div>
      `;
      list.appendChild(item);
    });

    if (userId) {
      loadJoinedGroups(userId);
    }
  } catch (err) {
    console.error("Error loading groups:", err);
  }
}

function searchGroups() {
  const searchEl = document.getElementById("groupSearch");
  loadGroups(searchEl ? searchEl.value.trim() : "");
}

async function joinGroup(groupId) {
  const userId = ensureLoggedIn();
  if (!userId) return;

  try {
    const res = await fetch(API + `/groups/${groupId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to join group");
      return;
    }

    alert("Joined group successfully");
    loadGroups((document.getElementById("groupSearch") || { value: "" }).value.trim());
    loadJoinedGroups(userId);
  } catch (err) {
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
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${group.group_name || "Untitled Group"}</h3>
        <p>${group.subject || "General"}</p>
        <small>Members: ${group.member_count || 0}</small>
        <span class="badge-status completed">Joined</span>
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

async function addDeadline() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const titleEl = document.getElementById("title");
  const dateEl = document.getElementById("date");
  if (!titleEl || !dateEl) return;

  const title = titleEl.value.trim();
  const due_date = dateEl.value;
  if (!title || !due_date) {
    alert("Title and date are required");
    return;
  }

  try {
    const res = await fetch(API + "/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_date, user_id: userId, priority: "Medium" }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add deadline");
      return;
    }

    alert("Deadline added successfully");
    titleEl.value = "";
    dateEl.value = "";
    loadDeadlines();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadDeadlines() {
  const userId = getUserId();
  const list = document.getElementById("deadlinesList");
  if (!userId || !list) return;

  try {
    const res = await fetch(API + "/deadlines/" + userId);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">No deadlines yet.</p>';
      return;
    }

    data.forEach((deadline) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${deadline.title}</h3>
        <p>Due: ${deadline.due_date}</p>
        <p>Priority: ${deadline.priority || "Medium"}</p>
        <button onclick="deleteDeadline(${deadline.deadline_id})" class="btn btn-danger">Delete</button>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading deadlines:", err);
  }
}

async function deleteDeadline(id) {
  if (!confirm("Are you sure you want to delete this deadline?")) return;

  try {
    const res = await fetch(API + `/deadlines/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete deadline");
      return;
    }

    alert("Deadline deleted");
    loadDeadlines();
  } catch (err) {
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
    const res = await fetch(API + `/resources/user/${userId}`);
    const data = await res.json();
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
        ${resource.file_path ? `<a href="${resource.file_path}" target="_blank" rel="noopener noreferrer" class="btn">Open</a>` : ""}
        <small>Uploaded by: ${resource.uploaded_by || "Unknown"}</small>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading resources:", err);
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
    const res = await fetch(API + "/sessions/" + userId);
    const data = await res.json();
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

  const payload = {
    name: nameEl.value.trim(),
    university: availabilityEl ? availabilityEl.value.trim() : "",
  };

  try {
    const res = await fetch(API + "/profile/" + userId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

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
    loadProfile();
  } catch (err) {
    alert("Error connecting to server");
    console.error(err);
  }
}

async function loadProfile() {
  const userId = getUserId();
  if (!userId) return;

  try {
    const [profileRes, subjectRes] = await Promise.all([
      fetch(API + "/profile/" + userId),
      fetch(API + "/subjects/" + userId),
    ]);

    const profileData = await profileRes.json();
    const subjectData = await subjectRes.json();
    const [sessions, deadlines, resources, bookmarks, groups] = await Promise.all([
      fetchArray(`/sessions/${userId}`),
      fetchArray(`/deadlines/${userId}`),
      fetchArray(`/resources/user/${userId}`),
      fetchArray(`/bookmarks/${userId}`),
      fetchArray("/groups"),
    ]);

    if (profileRes.ok) {
      const nameEl = document.getElementById("name");
      const availabilityEl = document.getElementById("availability");
      const displayName = document.getElementById("profileDisplayName");
      const displayEmail = document.getElementById("profileDisplayEmail");
      const displayRole = document.getElementById("profileDisplayRole");

      if (nameEl) nameEl.value = profileData.name || "";
      if (availabilityEl) availabilityEl.value = profileData.university || "";
      if (displayName) displayName.textContent = profileData.name || "Saathi User";
      if (displayEmail) displayEmail.textContent = profileData.email || "";
      if (displayRole) displayRole.textContent = profileData.role || "Student";
    }

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
  if (!nameEl || !emailEl) return;

  const payload = {
    name: nameEl.value.trim(),
    email: emailEl.value.trim(),
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
    alert("Settings saved");
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
    if (nameEl) nameEl.value = data.name || "";
    if (emailEl) emailEl.value = data.email || "";
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
    const res = await fetch(API + endpoint);
    const data = await res.json();
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

  const subjectFilter = (document.getElementById("subject") || { value: "" }).value.trim();
  const universityFilter = (document.getElementById("university") || { value: "" }).value.trim();
  const availabilityDate = (document.getElementById("availabilityDate") || { value: "" }).value.trim();
  const availabilityTime = (document.getElementById("availabilityTime") || { value: "" }).value.trim();
  const list = document.getElementById("results");
  if (!list) return;

  try {
    const params = new URLSearchParams();
    const query = [subjectFilter, universityFilter, availabilityDate, availabilityTime].filter(Boolean).join(" ");
    if (query) params.set("q", query);
    if (subjectFilter) params.set("subject", subjectFilter);
    if (universityFilter) params.set("university", universityFilter);
    if (availabilityDate) params.set("availability_date", availabilityDate);
    if (availabilityTime) params.set("availability_time", availabilityTime);

    const res = await fetch(API + `/partners/${userId}${params.toString() ? `?${params.toString()}` : ""}`);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No partners found yet.</p>';
      return;
    }

    const normalizedSubject = subjectFilter.toLowerCase();
    const filtered = data.filter((partner) => {
      const subjectMatch = !normalizedSubject || (partner.subject || "").toLowerCase().includes(normalizedSubject);
      return subjectMatch;
    });

    if (filtered.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No matches for current filters.</p>';
      return;
    }

    filtered.forEach((partner) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${partner.name}</h3>
        <p>University: ${partner.university || "N/A"}</p>
        <p>Subjects: ${partner.subject || "General"}</p>
        <p>Availability Date: ${partner.availability_date || availabilityDate || "Flexible"}</p>
        <p>Availability Time: ${partner.availability_time || availabilityTime || "Flexible"}</p>
        <button class="btn btn-secondary" onclick="connectPartner(${partner.user_id})">Add Partner</button>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error finding partners:", err);
  }
}

async function connectPartner(partnerId) {
  const userId = ensureLoggedIn();
  if (!userId) return;

  try {
    const res = await fetch(API + "/partners/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, partner_id: partnerId }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to connect partner");
      return;
    }

    alert("Partner added to current partners");
    loadCurrentPartners();
  } catch (err) {
    console.error("Error connecting partner:", err);
  }
}

async function loadCurrentPartners() {
  const userId = getUserId();
  const list = document.getElementById("currentPartners");
  if (!userId || !list) return;

  try {
    const res = await fetch(API + `/partners/${userId}/current`);
    const data = await res.json();
    list.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);">No current partners yet.</p>';
      return;
    }

    data.forEach((partner) => {
      const item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
        <h3>${partner.name}</h3>
        <p>University: ${partner.university || "N/A"}</p>
        <p>Subjects: ${partner.subject || "General"}</p>
        <small>Connected On: ${partner.connected_on || "-"}</small>
      `;
      list.appendChild(item);
    });
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
    const res = await fetch(API + "/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, resource_id, saved_topic }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add bookmark");
      return;
    }

    alert("Bookmark added");
    if (topicEl) topicEl.value = "";
    loadBookmarks();
  } catch (err) {
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

  try {
    const res = await fetch(API + `/bookmarks/${bookmarkId}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete bookmark");
      return;
    }

    loadBookmarks();
  } catch (err) {
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
  if (el) el.textContent = value;
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

async function fetchArray(endpoint) {
  try {
    const res = await fetch(API + endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Error loading ${endpoint}:`, err);
    return [];
  }
}

async function fetchObject(endpoint) {
  try {
    const res = await fetch(API + endpoint);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error loading ${endpoint}:`, err);
    return null;
  }
}

async function loadDashboardData() {
  const userId = ensureLoggedIn();
  if (!userId) return;

  const [sessions, groups, deadlines, resources, bookmarks, profile] = await Promise.all([
    fetchArray(`/sessions/${userId}`),
    fetchArray("/groups"),
    fetchArray(`/deadlines/${userId}`),
    fetchArray(`/resources/user/${userId}`),
    fetchArray(`/bookmarks/${userId}`),
    fetchObject(`/profile/${userId}`),
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
    return due && due >= today && due <= weekEnd;
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
      .filter((deadline) => deadline.parsedDate)
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
  const pauseBtn = timer.querySelector(".btn-light-control");
  const stopBtn = timer.querySelector(".btn-stop-control");
  if (!display || !startBtn || !pauseBtn || !stopBtn) return;

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

  if (localStorage.getItem("timerRunning") === "true") runTimer();
  else updateDisplay();

  startBtn.addEventListener("click", () => {
    if (localStorage.getItem("timerRunning") === "true") return;

    localStorage.setItem("timerStart", Date.now().toString());
    localStorage.setItem("timerRunning", "true");
    timer.classList.add("show");
    runTimer();
  });

  pauseBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = null;
    localStorage.setItem("timerRunning", "false");
  });

  stopBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = null;
    localStorage.removeItem("timerStart");
    localStorage.removeItem("timerRunning");
    display.innerText = "00:00:00";
    timer.classList.remove("show");
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
    loadCurrentPartners();
  }
});
