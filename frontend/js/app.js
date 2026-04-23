const API = "http://127.0.0.1:5001";

/**
 * LOGIN FUNCTION
 * TODO: Implement backend /login endpoint with:
 * - Email validation (check if user exists in database)
 * - Password validation (compare hashed password from database)
 * - Return user_id and name on success
 * - Return error message on failure
 * - Hash passwords using werkzeug.security (generate_password_hash)
 * CURRENT: Returns mock data for frontend testing
 */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  // Input validation
  if (!email || !password) {
    alert("Email and password are required");
    return;
  }

  const btn = document.querySelector('button[onclick="login()"]');
  btn.classList.add('loading');
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.name);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || "Login failed");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  } finally {
    btn.classList.remove('loading');
    btn.textContent = 'Login';
  }
}

/**
 * SIGNUP FUNCTION
 * TODO: Implement backend /signup endpoint with:
 * - Email validation (check if email already exists)
 * - Email format validation
 * - Password strength validation (min 8 chars, complexity)
 * - Store user in database with hashed password
 * - Return user_id on success
 * - Hash passwords using werkzeug.security
 * CURRENT: Returns mock data for frontend testing
 */
async function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirm").value;

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
  btn.classList.add('loading');
  btn.textContent = 'Creating account...';

  try {
    const res = await fetch(API + "/signup", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('user_name', data.name);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || "Signup failed");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  } finally {
    btn.classList.remove('loading');
    btn.textContent = 'Create Account';
  }
}

/**
 * CREATE GROUP FUNCTION
 * TODO: Implement backend /create-group endpoint with:
 * - Validate group name (not empty, length constraints)
 * - Store group in database with created_by user_id
 * - Return group_id on success
 * - Handle duplicate group names appropriately
 * - Add creator as group admin/member
 * CURRENT: Returns mock data for frontend testing
 */
async function createGroup() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('Please login first');
    return;
  }

  const name = document.getElementById("groupName").value;
  const description = document.getElementById("groupDesc").value;

  if (!name) {
    alert("Group name is required");
    return;
  }

  try {
    const res = await fetch(API + "/create-group", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name, description, created_by: user_id })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Group created successfully");
      document.getElementById("groupName").value = '';
      document.getElementById("groupDesc").value = '';
      loadGroups();
    } else {
      alert(data.message || "Failed to create group");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  }
}

/**
 * LOAD GROUPS FUNCTION
 * TODO: Implement backend /groups endpoint with:
 * - Retrieve all groups for current user from database
 * - Include group metadata (id, name, description, created_by, created_at)
 * - Handle pagination if many groups (optional)
 * - Return groups array
 * CURRENT: Returns mock data for frontend testing
 */
async function loadGroups() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  try {
    const res = await fetch(API + "/groups?user_id=" + user_id);
    const data = await res.json();

    if (res.ok && data.groups) {
      const list = document.getElementById("groupsList");
      list.innerHTML = '';

      if (data.groups.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No groups yet. Create one to get started!</p>';
        return;
      }

      data.groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'card';
        item.innerHTML = `
          <h3>${group.name}</h3>
          <p>${group.description || 'No description'}</p>
          <small>Created: ${new Date(group.created_at).toLocaleDateString()}</small>
        `;
        list.appendChild(item);
      });
    }
  } catch (error) {
    console.error("Error loading groups:", error);
  }
}

/**
 * ADD DEADLINE FUNCTION
 * TODO: Implement backend /add-deadline endpoint with:
 * - Validate deadline title (not empty)
 * - Validate date format (YYYY-MM-DD or similar)
 * - Store deadline in database with user_id and created_at
 * - Return deadline_id on success
 * - Check that deadline date is in future (optional validation)
 * CURRENT: Returns mock data for frontend testing
 */
async function addDeadline() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('Please login first');
    return;
  }

  const title = document.getElementById("title").value;
  const date = document.getElementById("date").value;

  if (!title || !date) {
    alert("Title and date are required");
    return;
  }

  try {
    const res = await fetch(API + "/add-deadline", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ title, date, user_id })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Deadline added successfully");
      document.getElementById("title").value = '';
      document.getElementById("date").value = '';
      loadDeadlines();
    } else {
      alert(data.message || "Failed to add deadline");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  }
}

/**
 * LOAD DEADLINES FUNCTION
 * TODO: Implement backend /get-deadlines endpoint with:
 * - Retrieve deadlines for current user from database
 * - Include deadline metadata (id, title, date, user_id, created_at)
 * - Sort by date (upcoming first)
 * - Return deadlines array
 * CURRENT: Returns mock data for frontend testing
 */
async function loadDeadlines() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  try {
    const res = await fetch(API + "/get-deadlines?user_id=" + user_id);
    const data = await res.json();

    if (res.ok && data.deadlines) {
      const list = document.getElementById("deadlinesList");
      list.innerHTML = '';

      if (data.deadlines.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No deadlines yet.</p>';
        return;
      }

      data.deadlines.forEach(deadline => {
        const item = document.createElement('div');
        item.className = 'card';
        const deadlineDate = new Date(deadline.date);
        item.innerHTML = `
          <h3>${deadline.title}</h3>
          <p>Due: ${deadlineDate.toLocaleDateString()}</p>
          <button onclick="deleteDeadline(${deadline.id})" class="btn btn-danger">Delete</button>
        `;
        list.appendChild(item);
      });
    }
  } catch (error) {
    console.error("Error loading deadlines:", error);
  }
}

/**
 * DELETE DEADLINE FUNCTION
 * TODO: Implement backend /delete-deadline/{id} endpoint with:
 * - Validate that user owns the deadline (user_id matches)
 * - Delete deadline from database
 * - Return success message
 * - Handle not found / unauthorized errors
 * CURRENT: Returns mock data for frontend testing
 */
async function deleteDeadline(id) {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  if (!confirm("Are you sure you want to delete this deadline?")) {
    return;
  }

  try {
    const res = await fetch(API + `/delete-deadline/${id}?user_id=${user_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (res.ok) {
      alert("Deadline deleted");
      loadDeadlines();
    } else {
      alert(data.message || "Failed to delete deadline");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  }
}

/**
 * UPLOAD RESOURCE FUNCTION
 * TODO: Implement backend /upload-resource endpoint with:
 * - Handle file upload (multipart/form-data)
 * - Store file path in database
 * - Validate file type (PDF, DOC, etc.)
 * - Validate file size (max size?)
 * - Store resource metadata (title, description, uploaded_by, file_path)
 * - Return resource_id on success
 * CURRENT: Returns mock data for frontend testing
 */
async function uploadResource() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('Please login first');
    return;
  }

  const title = document.getElementById("resourceTitle").value;
  const description = document.getElementById("resourceDesc").value;
  const fileInput = document.getElementById("resourceFile");

  if (!title || !fileInput.files.length) {
    alert("Title and file are required");
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('file', fileInput.files[0]);
  formData.append('uploaded_by', user_id);

  try {
    const res = await fetch(API + "/upload-resource", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert("Resource uploaded successfully");
      document.getElementById("resourceTitle").value = '';
      document.getElementById("resourceDesc").value = '';
      fileInput.value = '';
      loadResources();
    } else {
      alert(data.message || "Failed to upload resource");
    }
  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  }
}

/**
 * LOAD RESOURCES FUNCTION
 * TODO: Implement backend /resources endpoint with:
 * - Retrieve resources for current user from database
 * - Include resource metadata (id, title, description, file_path, uploaded_by, created_at)
 * - Return resources array
 * CURRENT: Returns mock data for frontend testing
 */
async function loadResources() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  try {
    const res = await fetch(API + "/resources?user_id=" + user_id);
    const data = await res.json();

    if (res.ok && data.resources) {
      const list = document.getElementById("resourcesList");
      list.innerHTML = '';

      if (data.resources.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No resources yet.</p>';
        return;
      }

      data.resources.forEach(resource => {
        const item = document.createElement('div');
        item.className = 'card';
        item.innerHTML = `
          <h3>${resource.title}</h3>
          <p>${resource.description || 'No description'}</p>
          ${resource.file_path ? `<a href="${resource.file_path}" target="_blank" class="btn">Download</a>` : ''}
          <small>Uploaded: ${new Date(resource.created_at).toLocaleDateString()}</small>
        `;
        list.appendChild(item);
      });
    }
  } catch (error) {
    console.error("Error loading resources:", error);
  }
}

/**
 * LOGOUT FUNCTION
 * Clears user session and redirects to login page
 */
function logout() {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  window.location.href = 'index.html';
}

/**
 * HELPER FUNCTIONS
 */

function showSignup() {
  document.getElementById("loginForm").style.display = 'none';
  document.getElementById("signupForm").style.display = 'block';
}

function showLogin() {
  document.getElementById("signupForm").style.display = 'none';
  document.getElementById("loginForm").style.display = 'block';
}

//------------------------------------------------------------

// let totalTime = 60 * 60; // 1 hour (change if needed)
// let remainingTime = totalTime;
// let interval = null;

// const timer = document.getElementById("floatingTimer");
// const display = timer.querySelector(".timer-display");

// const startBtn = timer.querySelector(".btn-start-control");
// const pauseBtn = timer.querySelector(".btn-light-control");
// const stopBtn = timer.querySelector(".btn-stop-control");

// // format hh:mm:ss
// function formatTime(seconds) {
//   let h = Math.floor(seconds / 3600);
//   let m = Math.floor((seconds % 3600) / 60);
//   let s = seconds % 60;

//   return (
//     String(h).padStart(2, '0') + ":" +
//     String(m).padStart(2, '0') + ":" +
//     String(s).padStart(2, '0')
//   );
// }

// // initial display
// display.innerText = formatTime(remainingTime);

// startBtn.addEventListener("click", () => {
//   if (interval !== null) return;

//   timer.classList.add("show"); // show floating box

//   interval = setInterval(() => {
//     if (remainingTime > 0) {
//       remainingTime--;
//       display.innerText = formatTime(remainingTime);
//     } else {
//       clearInterval(interval);
//       interval = null;
//       alert("Time's up!");
//     }
//   }, 1000);
// });

// pauseBtn.addEventListener("click", () => {
//   clearInterval(interval);
//   interval = null;
// });

// stopBtn.addEventListener("click", () => {
//   clearInterval(interval);
//   interval = null;

//   remainingTime = totalTime;
//   display.innerText = formatTime(remainingTime);

//   timer.classList.remove("show"); // hide again
// });

let elapsedTime = 0; // starts from 0
let interval = null;

const timer = document.getElementById("floatingTimer");
const display = timer.querySelector(".timer-display");

const startBtn = timer.querySelector(".btn-start-control");
const pauseBtn = timer.querySelector(".btn-light-control");
const stopBtn = timer.querySelector(".btn-stop-control");

// format time (hh:mm:ss)
function formatTime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = seconds % 60;

  return (
    String(h).padStart(2, '0') + ":" +
    String(m).padStart(2, '0') + ":" +
    String(s).padStart(2, '0')
  );
}

// initial display
display.innerText = formatTime(elapsedTime);

// START
startBtn.addEventListener("click", () => {
  if (interval !== null) return; // prevent multiple timers

  timer.classList.add("show"); // show floating box

  interval = setInterval(() => {
    elapsedTime++;
    display.innerText = formatTime(elapsedTime);
  }, 1000);
});

// PAUSE
pauseBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;
});

// STOP (reset)
stopBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;

  elapsedTime = 0;
  display.innerText = formatTime(elapsedTime);

  timer.classList.remove("show"); // hide (optional)
});