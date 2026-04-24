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
  if (!user_id) { alert('Please login first'); return; }

  const name = document.getElementById("groupName").value;
  const description = document.getElementById("groupDesc").value;

  if (!name) { alert("Group name is required"); return; }

  try {
    const res = await fetch(API + "/groups", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ group_name: name, user_id: user_id })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Group created successfully");
      document.getElementById("groupName").value = '';
      document.getElementById("groupDesc").value = '';
      loadGroups();
    } else {
      alert(data.error || "Failed to create group");
    }
  } catch (error) {
    alert("Error connecting to server");
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
  try {
    const res = await fetch(API + "/groups");
    const data = await res.json();
    const list = document.getElementById("groupsList");
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No groups yet.</p>';
      return;
    }

    data.forEach(group => {
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <h3>${group.group_name}</h3>
        <p>Subject: ${group.subject || 'N/A'}</p>
        <small>Created by: ${group.created_by}</small>
      `;
      list.appendChild(item);
    });
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
  if (!user_id) { alert('Please login first'); return; }

  const title = document.getElementById("title").value;
  const date = document.getElementById("date").value;

  if (!title || !date) { alert("Title and date are required"); return; }

  try {
    const res = await fetch(API + "/deadlines", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ title, due_date: date, user_id: user_id })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Deadline added successfully");
      document.getElementById("title").value = '';
      document.getElementById("date").value = '';
      loadDeadlines();
    } else {
      alert(data.error || "Failed to add deadline");
    }
  } catch (error) {
    alert("Error connecting to server");
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
    const res = await fetch(API + "/deadlines/" + user_id);
    const data = await res.json();
    const list = document.getElementById("deadlinesList");
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No deadlines yet.</p>';
      return;
    }

    data.forEach(deadline => {
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <h3>${deadline.title}</h3>
        <p>Subject: ${deadline.subject || 'N/A'}</p>
        <p>Due: ${deadline.due_date}</p>
        <p>Priority: ${deadline.priority}</p>
        <button onclick="deleteDeadline(${deadline.deadline_id})" class="btn btn-danger">Delete</button>
      `;
      list.appendChild(item);
    });
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
  if (!confirm("Are you sure you want to delete this deadline?")) return;

  try {
    const res = await fetch(API + `/deadlines/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      alert("Deadline deleted");
      loadDeadlines();
    } else {
      alert(data.error || "Failed to delete deadline");
    }
  } catch (error) {
    alert("Error connecting to server");
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
  if (!user_id) { alert('Please login first'); return; }

  const title = document.getElementById("resourceTitle").value;
  const description = document.getElementById("resourceDesc").value;

  if (!title) { alert("Title is required"); return; }

  try {
    const res = await fetch(API + "/resources", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ title, user_id: user_id, type: "Notes", file_path: description })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Resource uploaded successfully");
      document.getElementById("resourceTitle").value = '';
      document.getElementById("resourceDesc").value = '';
      loadResources();
    } else {
      alert(data.error || "Failed to upload resource");
    }
  } catch (error) {
    alert("Error connecting to server");
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
  try {
    const res = await fetch(API + "/resources");
    const data = await res.json();
    const list = document.getElementById("resourcesList");
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--muted);">No resources yet.</p>';
      return;
    }

    data.forEach(resource => {
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <h3>${resource.title}</h3>
        <p>Subject: ${resource.subject || 'N/A'}</p>
        <p>Type: ${resource.type || 'N/A'}</p>
        <small>Uploaded by: ${resource.uploaded_by}</small>
      `;
      list.appendChild(item);
    });
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
//Timer
//------------------------------------------------------------

// let elapsedTime = 0; // starts from 0
// let interval = null;
// // if(document.getElementById("floatingTimer") || document.getElementById("not-float-timer"))
// const timer = document.getElementsByClassName("timer-card");
// console.log(timer);
// const display = timer.querySelector(".timer-card");

// const startBtn = timer.querySelector(".btn-start-control");
// const pauseBtn = timer.querySelector(".btn-light-control");
// const stopBtn = timer.querySelector(".btn-stop-control");

// // format time (hh:mm:ss)
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
// display.innerText = formatTime(elapsedTime);

// // START
// startBtn.addEventListener("click", () => {
//   if (interval !== null) return; // prevent multiple timers

//   timer.classList.add("show"); // show floating box

//   interval = setInterval(() => {
//     elapsedTime++;
//     display.innerText = formatTime(elapsedTime);
//   }, 1000);
// });

// // PAUSE
// pauseBtn.addEventListener("click", () => {
//   clearInterval(interval);
//   interval = null;
// });

// // STOP (reset)
// stopBtn.addEventListener("click", () => {
//   clearInterval(interval);
//   interval = null;

//   elapsedTime = 0;
//   display.innerText = formatTime(elapsedTime);

//   timer.classList.remove("show"); // hide (optional)
// });

// const timers = document.querySelectorAll(".timer-card");

// timers.forEach(timer => {
//   const display = timer.querySelector(".timer-display");
//   const startBtn = timer.querySelector(".btn-start-control");
//   const pauseBtn = timer.querySelector(".btn-light-control");
//   const stopBtn = timer.querySelector(".btn-stop-control");

//   let elapsedTime = 0;
//   let interval = null;

//   function formatTime(seconds) {
//     let h = Math.floor(seconds / 3600);
//     let m = Math.floor((seconds % 3600) / 60);
//     let s = seconds % 60;

//     return (
//       String(h).padStart(2, '0') + ":" +
//       String(m).padStart(2, '0') + ":" +
//       String(s).padStart(2, '0')
//     );
//   }

//   display.innerText = formatTime(elapsedTime);

//   startBtn.addEventListener("click", () => {
//     if (interval !== null) return;

//     timer.classList.add("show");

//     interval = setInterval(() => {
//       elapsedTime++;
//       display.innerText = formatTime(elapsedTime);
//     }, 1000);
//   });

//   pauseBtn.addEventListener("click", () => {
//     clearInterval(interval);
//     interval = null;
//   });

//   stopBtn.addEventListener("click", () => {
//     clearInterval(interval);
//     interval = null;

//     elapsedTime = 0;
//     display.innerText = formatTime(elapsedTime);

//     timer.classList.remove("show");
//   });
// });

let interval = null;

const timer = document.querySelector(".timer-card"); // ✅ fixed
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

// 🔥 run timer using shared start time
function runTimer() {
  clearInterval(interval);

  function updateDisplay() {
    const startTime = localStorage.getItem("timerStart");
    if (!startTime) return;

    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    display.innerText = formatTime(elapsedTime);
  }

  updateDisplay();

  interval = setInterval(updateDisplay, 1000);
}

// initial load sync
window.addEventListener("load", () => {
  const isRunning = localStorage.getItem("timerRunning");

  if (isRunning === "true") {
    runTimer();
  }
});

// START
startBtn.addEventListener("click", () => {
  if (interval !== null) return;

  const startTime = Date.now();

  localStorage.setItem("timerStart", startTime);
  localStorage.setItem("timerRunning", "true");

  timer.classList.add("show");

  runTimer();
});

// PAUSE
pauseBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;

  localStorage.setItem("timerRunning", "false");
});

// STOP
stopBtn.addEventListener("click", () => {
  clearInterval(interval);
  interval = null;

  localStorage.removeItem("timerStart");
  localStorage.removeItem("timerRunning");

  display.innerText = "00:00:00";

  timer.classList.remove("show");
});

// 🔥 Sync across tabs/pages instantly
window.addEventListener("storage", () => {
  const isRunning = localStorage.getItem("timerRunning");

  if (isRunning === "true") {
    runTimer();
  } else {
    clearInterval(interval);
  }
});

//Dragable Timer on dashboard
const el = document.getElementById("floatingTimer");
const parent = document.getElementById("mainContainer");

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;
let rafId = null;

el.addEventListener("mousedown", (e) => {
  isDragging = true;
  el.style.cursor = "grabbing";

  // Initial offset calculation
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onStop);
});

function onMove(e) {
  if (!isDragging) return;

  const parentRect = parent.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  // Calculate target position relative to parent
  let targetX = e.clientX - startX;
  let targetY = e.clientY - startY;

  // CONSTRAINTS: Prevent moving outside parent boundaries
  const maxX = parentRect.width - elRect.width;
  const maxY = parentRect.height - elRect.height;

  currentX = Math.max(0, Math.min(targetX, maxX));
  currentY = Math.max(0, Math.min(targetY, maxY));

  if (!rafId) {
    rafId = requestAnimationFrame(updatePosition);
  }
}

function updatePosition() {
  el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  rafId = null;
}

function onStop() {
  isDragging = false;
  el.style.cursor = "grab";
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onStop);
}

//----------------------------------------------
//Profile chip on Dashboard
//----------------------------------------------
const chip = document.getElementById("profileChip");
const dropdown = document.getElementById("profileDropdown");

chip.addEventListener("click", () => {
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
});

// optional: close when clicking outside
document.addEventListener("click", (e) => {
  if (!chip.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});


//------------------------------------------------------
//Bar chart on dashboard
//------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const bars = document.querySelectorAll(".chart-bars span");
  
  console.log("Bars found:", bars.length);
  
  let barData = Array.from(bars).map((bar, index) => {
    let height = parseFloat(bar.style.height);
    console.log("Bar", index, "height:", height);
    return { index, height };
  });
  
  barData.sort((a, b) => b.height - a.height);

  console.log("Sorted:", barData);

  if (barData[0]) {
    console.log("Top 1:", barData[0]);
    bars[barData[0].index].classList.add("bar-1");
  }
  
  if (barData[1]) {
    console.log("Top 2:", barData[1]);
    bars[barData[1].index].classList.add("bar-2");
  }
  
  if (barData[2]) {
    console.log("Top 3:", barData[2]);
    bars[barData[2].index].classList.add("bar-3");
  }
});


//------------------------------------------------------
//Donut Shell on Dashboard
//------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const donut = document.querySelector(".donut-shell");
  const text = document.querySelector(".donut-center strong");

  let target = 78;   // final value
  let current = 0;

  let interval = setInterval(() => {
    if (current >= target) {
      clearInterval(interval);
      return;
    }

    current++;
    donut.style.setProperty("--progress", current + "%");
    text.innerText = current + "%";

  }, 10);
});