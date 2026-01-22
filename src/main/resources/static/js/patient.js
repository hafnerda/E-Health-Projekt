const API = ""; // falls später eine Base-URL brauchst

function requireAuth() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) {
    window.location.href = "/index.html";
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("auth_user");
    window.location.href = "/index.html";
    return null;
  }
}

async function apiGet(url) {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`GET ${url} -> ${resp.status}`);
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  return ct.includes("application/json") ? resp.json() : resp.text();
}

/* ===== UI helpers für das neue Design ===== */

function setHello(fullName) {
  const first = (fullName || "").trim().split(" ")[0] || "";
  document.getElementById("hello").textContent = `Hallo ${first},`;
}

function setPercent(p) {
  const pct = Math.max(0, Math.min(100, Math.round(p)));
  document.getElementById("ring").style.setProperty("--p", pct);
  document.getElementById("pctText").textContent = `${pct}%`;
}

function setHint(text) {
  document.getElementById("hintText").textContent = text;
}

function computeProgress(measurements) {
  const total = measurements.length;
  if (total === 0) return 0;

  const done = measurements.filter(m =>
    m?.status === "DONE" ||
    m?.status === "COMPLETED" ||
    m?.done === true ||
    m?.completed === true
  ).length;

  return (done / total) * 100;
}

/* ===== Daten laden ===== */

async function loadMyData() {
  const user = requireAuth();
  if (!user) return;

  // Falls jemand als Therapeut hier landet
  if (user.role !== "PATIENT") {
    window.location.href = "/dashboard.html";
    return;
  }

  // Name anzeigen
  setHello(user.name);

  // 1) PatientId holen
  const patient = await apiGet(`${API}/api/patients/by-user/${user.id}`);
  const patientId = patient.id ?? patient.patientId;

  if (!patientId) throw new Error("Keine patientId erhalten.");

  // 2) Messungen holen
  const measurements = await apiGet(`${API}/api/patients/${patientId}/measurements`);
  const list = Array.isArray(measurements) ? measurements : (measurements.items || []);

  // 3) Fortschritt anzeigen
  const pct = computeProgress(list);
  setPercent(pct);
  setHint(`Super, du hast ${Math.round(pct)}% deines Wochenziels erreicht.`);
}

/* ===== Buttons ===== */

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("auth_user");
  window.location.href = "/index.html";
});

document.getElementById("btnPlan").addEventListener("click", () => {
  window.location.href = "/patient-trainingplan.html";
});

document.getElementById("btnProgress")?.addEventListener("click", () => {
  window.location.href = "/patient-progress.html";
});

document.getElementById("btnReminders").addEventListener("click", () => {
  window.location.href = "/patient-appointments.html";
});

/* ===== Start ===== */

loadMyData().catch(err => {
  console.error(err);
  setPercent(0);
  setHint("Daten konnten nicht geladen werden.");
});

// Account-Dropdown
const account = document.getElementById("account");
const btnAccount = document.getElementById("btnAccount");

btnAccount.addEventListener("click", () => {
  account.classList.toggle("open");
});

// Klick außerhalb schließt Menü
document.addEventListener("click", (e) => {
  if (!account.contains(e.target)) {
    account.classList.remove("open");
  }
});

