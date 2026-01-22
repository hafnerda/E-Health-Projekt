const API = "";

function requireAuth() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) { window.location.href = "/index.html"; return null; }
  try { return JSON.parse(raw); } catch {
    localStorage.removeItem("auth_user");
    window.location.href = "/index.html";
    return null;
  }
}

async function apiGet(url) {
  const resp = await fetch(url, { method: "GET", headers: { "Content-Type":"application/json" }});
  if (!resp.ok) throw new Error(`GET ${url} -> ${resp.status}`);
  return await resp.json();
}

async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body ?? {})
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`POST ${url} -> ${resp.status} ${text}`);
  }
  return await resp.json().catch(() => ({}));
}

// ===== Account Dropdown =====
const account = document.getElementById("account");
const btnAccount = document.getElementById("btnAccount");
btnAccount.addEventListener("click", () => account.classList.toggle("open"));
document.addEventListener("click", (e) => { if (!account.contains(e.target)) account.classList.remove("open"); });

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("auth_user");
  window.location.href = "/index.html";
});

document.getElementById("btnHomework").addEventListener("click", () => {
  alert("Hausaufgaben: kommt als nächstes");
});

// ===== State =====
let user = null;
let patientId = null;
let appointments = [];          // SCHEDULED & CANCELLED
let selectedAppointmentId = null;
let currentMonth = new Date();  // Anzeige-Monat (startet auf heute)

// ===== Helpers =====
function pad2(n){ return String(n).padStart(2,"0"); }

function formatDateDE(d){
  // d = Date
  return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${String(d.getFullYear()).slice(-2)}`;
}

function formatTimeDE(d){
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dowShort(d){
  // Mo/Di/Mi/Do/Fr/Sa/So
  const map = ["SO","MO","DI","MI","DO","FR","SA"];
  return map[d.getDay()];
}

function monthNameDE(m){
  const names = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  return names[m];
}

function parseIsoToDate(iso){
  // iso: "2026-01-07T12:30:00"
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function canCancel(iso){
  const d = parseIsoToDate(iso);
  if (!d) return false;
  const diffMs = d.getTime() - Date.now();
  return diffMs >= 24 * 60 * 60 * 1000; // >= 24h
}

function getScheduledAppointments(){
  return appointments
    .filter(a => (a.status || "SCHEDULED") === "SCHEDULED")
    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

function getDayKeyFromIso(iso){
  const d = parseIsoToDate(iso);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

// ===== UI render =====
function renderRightList() {
  const colDow = document.getElementById("colDow");
  const colDate = document.getElementById("colDate");
  const colTime = document.getElementById("colTime");

  colDow.innerHTML = "";
  colDate.innerHTML = "";
  colTime.innerHTML = "";

  const list = getScheduledAppointments();

  for (const a of list) {
    const d = parseIsoToDate(a.startTime);
    if (!d) continue;

    // Spalte DOW (Label)
    const dowDiv = document.createElement("div");
    dowDiv.className = "row";
    dowDiv.innerHTML = `<button data-id="${a.id}" class="${a.id===selectedAppointmentId ? "selected":""}">${dowShort(d)}</button>`;
    colDow.appendChild(dowDiv);

    // Spalte Date
    const dateDiv = document.createElement("div");
    dateDiv.className = "row";
    dateDiv.innerHTML = `<button data-id="${a.id}" class="${a.id===selectedAppointmentId ? "selected":""}">${formatDateDE(d)}</button>`;
    colDate.appendChild(dateDiv);

    // Spalte Time
    const timeDiv = document.createElement("div");
    timeDiv.className = "row";
    timeDiv.innerHTML = `<button data-id="${a.id}" class="${a.id===selectedAppointmentId ? "selected":""}">${formatTimeDE(d)}</button>`;
    colTime.appendChild(timeDiv);
  }

  // click handler für alle Buttons
  const buttons = document.querySelectorAll(".row button[data-id]");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedAppointmentId = Number(btn.dataset.id);
      updateCancelButtonState();
      renderRightList();
      renderCalendar(); // selected day highlight
    });
  });
}

function renderCalendar() {
  const monthLabel = document.getElementById("monthLabel");
  const grid = document.getElementById("calGrid");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  monthLabel.textContent = `${monthNameDE(month)} ${year}`;

  grid.innerHTML = "";

  // Termine im Monat markieren
  const scheduled = getScheduledAppointments();
  const hasDay = new Set(
    scheduled
      .filter(a => {
        const d = parseIsoToDate(a.startTime);
        return d && d.getFullYear()===year && d.getMonth()===month;
      })
      .map(a => getDayKeyFromIso(a.startTime))
  );

  // Montag als erster Tag
  const first = new Date(year, month, 1);
  const firstDay = (first.getDay() + 6) % 7; // So=0 -> 6, Mo=1 ->0

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date();

  // leere Felder
  for (let i=0;i<firstDay;i++){
    const el = document.createElement("div");
    el.className = "day empty";
    grid.appendChild(el);
  }

  for (let day=1; day<=daysInMonth; day++){
    const el = document.createElement("div");
    el.className = "day";
    el.textContent = String(day);

    const key = `${year}-${pad2(month+1)}-${pad2(day)}`;
    if (hasDay.has(key)) el.classList.add("has");

    // today marker
    if (today.getFullYear()===year && today.getMonth()===month && today.getDate()===day) el.classList.add("today");

    // selected marker = selectedAppointment day
    if (selectedAppointmentId != null) {
      const sel = scheduled.find(a => a.id === selectedAppointmentId);
      if (sel) {
        const dk = getDayKeyFromIso(sel.startTime);
        if (dk === key) el.classList.add("selected");
      }
    }

    el.addEventListener("click", () => {
      // nur Tage mit Termin klickbar (wie “dunkel markiert”)
      if (!hasDay.has(key)) return;

      // nimm den nächsten Termin an dem Tag
      const ap = scheduled.find(a => getDayKeyFromIso(a.startTime) === key);
      if (ap) {
        selectedAppointmentId = ap.id;
        updateCancelButtonState();
        renderRightList();
        renderCalendar();
      }
    });

    grid.appendChild(el);
  }
}

function updateCancelButtonState(){
  const btn = document.getElementById("btnCancelOpen");
  if (!selectedAppointmentId) { btn.disabled = true; return; }
  const ap = getScheduledAppointments().find(a => a.id === selectedAppointmentId);
  if (!ap) { btn.disabled = true; return; }
  btn.disabled = !canCancel(ap.startTime);
}

// ===== Absage Flow =====
const overlay = document.getElementById("overlay");
const overlaySuccess = document.getElementById("overlaySuccess");
const reasonBox = document.getElementById("cancelReason");

document.getElementById("btnCancelOpen").addEventListener("click", () => {
  if (!selectedAppointmentId) return;
  overlay.classList.add("open");
  reasonBox.value = "";
});

document.getElementById("btnModalBack").addEventListener("click", () => {
  overlay.classList.remove("open");
});

document.getElementById("btnSuccessBack").addEventListener("click", () => {
  overlaySuccess.classList.remove("open");
  // zurück zur Übersicht
});

document.getElementById("btnCancelConfirm").addEventListener("click", async () => {
  if (!selectedAppointmentId) return;

  const ap = getScheduledAppointments().find(a => a.id === selectedAppointmentId);
  if (!ap) return;

  if (!canCancel(ap.startTime)) {
    alert("Absage ist nur bis 24 Stunden vor dem Termin möglich.");
    return;
  }

  try {
    await apiPost(`${API}/api/appointments/${selectedAppointmentId}/cancel`, {
      reason: reasonBox.value?.trim() || null
    });

    overlay.classList.remove("open");
    overlaySuccess.classList.add("open");

    await loadData(); // neu laden
  } catch (e) {
    console.error(e);
    alert("Absage hat nicht geklappt.");
  }
});

// ===== Data Load =====
async function loadData(){
  user = requireAuth();
  if (!user) return;

  if (user.role !== "PATIENT") {
    window.location.href = "/dashboard.html";
    return;
  }

  const patient = await apiGet(`${API}/api/patients/by-user/${user.id}`);
  patientId = patient.id ?? patient.patientId;
  if (!patientId) throw new Error("Keine patientId erhalten");

  appointments = await apiGet(`${API}/api/patients/${patientId}/appointments`);
  if (!Array.isArray(appointments)) appointments = [];

  // default: nächster Termin auswählen
  const next = getScheduledAppointments()[0];
  selectedAppointmentId = next ? next.id : null;

  renderRightList();
  renderCalendar();
  updateCancelButtonState();
}

loadData().catch(err => {
  console.error(err);
  alert("Termine konnten nicht geladen werden.");
});
