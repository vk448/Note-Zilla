function toggleMenu(el){
  document.querySelector('nav').classList.toggle('active');
  el.classList.toggle('open');
}

const sheetURL = "https://script.google.com/macros/s/AKfycbx6Yi6nb-biO1Qw9pz3_1FvCwOQNLEQvi-TUIjdgsF7b9kf8FPgqsH9fIZ4n-neAVhn/exec";
const subjectName = "SST";
const subjectGrid = document.getElementById("subjectGrid");

// Show cached data instantly if available
const cached = localStorage.getItem(`notes_${subjectName}`);
if (cached) renderNotes(JSON.parse(cached));
fetchData(); // Then fetch fresh data

async function fetchData() {
  try {
    const res = await fetch(sheetURL);
    const data = await res.json();
    const filtered = data.filter(d => d.Subject === subjectName);
    localStorage.setItem(`notes_${subjectName}`, JSON.stringify(filtered));
    renderNotes(filtered);
  } catch (err) {
    console.error("Failed to load:", err);
    subjectGrid.innerHTML = `<p style="text-align:center;color:red;">⚠️ Failed to load notes. Try again later.</p>`;
  }
}

function renderNotes(notes) {
  subjectGrid.innerHTML = "";
  if (!notes.length) {
    subjectGrid.innerHTML = `<p style="text-align:center;color:gray;">No chapters available.</p>`;
    return;
  }

  notes.forEach(chap => {
    let formattedDate = "";

    // ✅ Fix NaN/NaN/NaN issue
    if (chap.Date && chap.Date.trim() !== "") {
      let date;
      // Try to parse automatically
      if (!isNaN(Date.parse(chap.Date))) {
        date = new Date(chap.Date);
      } else {
        // Try manual split (handles 22/10/2025 or 22-10-2025)
        const parts = chap.Date.split(/[-/]/);
        if (parts.length === 3) {
          const [d, m, y] = parts;
          date = new Date(`${y}-${m}-${d}`);
        }
      }

      if (date && !isNaN(date)) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
    }

    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `<h2>${chap["Chapter Name"]}</h2><p>${formattedDate || "—"}</p>`;
    card.addEventListener("click", () => {
      if (chap.Link?.trim()) window.open(chap.Link, "_blank");
      else alert("Link not available for this chapter.");
    });
    subjectGrid.appendChild(card);
  });
}

// 🔍 Search Functionality
const searchBar = document.getElementById("searchBar");
searchBar.addEventListener("keyup", () => {
  const value = searchBar.value.toLowerCase();
  document.querySelectorAll(".subject-card").forEach(card => {
    const text = card.querySelector("h2")?.innerText.toLowerCase() || "";
    card.style.display = text.includes(value) ? "flex" : "none";
  });
});
 /* paste this line in verbatim */
  window.formbutton=window.formbutton||function(){(formbutton.q=formbutton.q||[]).push(arguments)};
  /* customize formbutton below*/     
  formbutton("create", {
    action: "https://formspree.io/f/xeokweek",
    title: "How can we help?",
    fields: [
      { 
        type: "email", 
        label: "Email:", 
        name: "email",
        required: true,
        placeholder: "your@email.com"
      },
      {
        type: "textarea",
        label: "Message:",
        name: "message",
        placeholder: "What's on your mind?",
      },
      { type: "submit" }      
    ],
    styles: {
      title: {
        backgroundColor: "gray"
      },
      button: {
        backgroundColor: "gray"
      }
    }
  });
  // --- Universal NoteZilla Login Display System ---
  (function() {
    const fullName = localStorage.getItem("fullName");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("userRole");

    // 1️⃣ Replace Login Button Text with Name (if logged in)
    const loginBtn = document.querySelector(".login-btn");
    if (loginBtn && fullName) {
      loginBtn.textContent = fullName;
      loginBtn.style.background = "linear-gradient(135deg,#203a43,#2c5364)";
      loginBtn.style.color = "#fff";
      loginBtn.style.fontWeight = "600";

      // Logout on click
      loginBtn.onclick = () => {
        const confirmLogout = confirm(`Logout from ${fullName}?`);
        if (confirmLogout) {
          localStorage.removeItem("fullName");
          localStorage.removeItem("username");
          localStorage.removeItem("userRole");
          window.location.reload();
        }
      };
    }

    // 2️⃣ Show Name on Header (if element exists)
    const userDisplay = document.getElementById("userNameDisplay");
    if (userDisplay && fullName) {
      userDisplay.textContent = `👋 ${fullName}`;
      userDisplay.style.fontWeight = "600";
    }

    // 3️⃣ If Not Logged In
    if (!fullName && loginBtn) {
      loginBtn.textContent = "Login";
      loginBtn.onclick = () => window.location.href = "login.html";
    }

    // 4️⃣ Optional: Restrict admin-only pages
    if (document.body.classList.contains("admin-page") && !role) {
      alert("⚠️ You must log in first!");
      window.location.href = "login.html";
    }
  })();