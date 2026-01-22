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
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GET ${url} -> ${resp.status}`);
  return await resp.json();
}

async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body ?? {})
  });
  if (!resp.ok) throw new Error(`POST ${url} -> ${resp.status}`);
  return await resp.json().catch(() => ({}));
}

function pad2(n){ return String(n).padStart(2,"0"); }
function parseIsoToDate(iso){ const d = new Date(iso); return isNaN(d.getTime()) ? null : d; }
function formatDateDE(d){ return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${String(d.getFullYear()).slice(-2)}`; }
function formatTimeDE(d){ return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function dowShort(d){ const map=["SO","MO","DI","MI","DO","FR","SA"]; return map[d.getDay()]; }

function canCancel(iso){
  const d = parseIsoToDate(iso);
  if (!d) return false;
  return (d.getTime() - Date.now()) >= 24*60*60*1000;
}

// ===== State =====
let user = null;
let patients = [];
let appointments = [];
let selectedAppointmentId = null;

const patientSelect = document.getElementById("patientSelect");
const hint = document.getElementById("hint");

function setHint(t){ hint.textContent = t; }

// ===== Render Termine rechts =====
function renderAppointmentsList(){
  const colDow = document.getElementById("colDow");
  const colDate = document.getElementById("colDate");
  const colTime = document.getElementById("colTime");

  colDow.innerHTML = "";
  colDate.innerHTML = "";
  colTime.innerHTML = "";

  const list = appointments
    .filter(a => (a.status || "SCHEDULED") === "SCHEDULED")
    .sort((a,b) => new Date(a.startTime) - new Date(b.startTime));

  for (const a of list){
    const d = parseIsoToDate(a.startTime);
    if (!d) continue;

    const mkBtn = (txt) => {
      const b = document.createElement("button");
      b.textContent = txt;
      b.className = (a.id === selectedAppointmentId) ? "selected" : "";
      b.addEventListener("click", () => {
        selectedAppointmentId = a.id;
        updateCancelState();
        renderAppointmentsList();
      });
      return b;
    };

    const r1 = document.createElement("div"); r1.className="row"; r1.appendChild(mkBtn(dowShort(d))); colDow.appendChild(r1);
    const r2 = document.createElement("div"); r2.className="row"; r2.appendChild(mkBtn(formatDateDE(d))); colDate.appendChild(r2);
    const r3 = document.createElement("div"); r3.className="row"; r3.appendChild(mkBtn(formatTimeDE(d))); colTime.appendChild(r3);
  }
}

function updateCancelState(){
  const btn = document.getElementById("btnCancel");
  if (!selectedAppointmentId) { btn.disabled = true; return; }
  const ap = appointments.find(a => a.id === selectedAppointmentId);
  if (!ap) { btn.disabled = true; return; }
  btn.disabled = !canCancel(ap.startTime);
}

// ===== Data =====
async function loadPatients(){
  // Du hast noch keinen Endpoint dafür, deshalb pragmatisch:
  // wenn du bereits /api/patients hast => nehmen wir den.
  patients = await apiGet(`${API}/api/patients`);
  if (!Array.isArray(patients)) patients = [];

  patientSelect.innerHTML = "";
  for (const p of patients){
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.firstName} ${p.lastName} (${p.patientCode})`;
    patientSelect.appendChild(opt);
  }
}

async function loadAppointmentsForSelectedPatient(){
  const pid = Number(patientSelect.value);
  appointments = await apiGet(`${API}/api/patients/${pid}/appointments`);
  if (!Array.isArray(appointments)) appointments = [];

  const next = appointments
    .filter(a => (a.status||"SCHEDULED")==="SCHEDULED")
    .sort((a,b)=> new Date(a.startTime)-new Date(b.startTime))[0];

  selectedAppointmentId = next ? next.id : null;

  renderAppointmentsList();
  updateCancelState();
}

patientSelect.addEventListener("change", async () => {
  await loadAppointmentsForSelectedPatient();
  setHint("Terminliste aktualisiert.");
});

// ===== Create =====
document.getElementById("btnCreate").addEventListener("click", async () => {
  const pid = Number(patientSelect.value);
  const date = document.getElementById("dateInput").value; // yyyy-mm-dd
  const time = document.getElementById("timeInput").value; // hh:mm

  if (!pid) { alert("Bitte Patient wählen."); return; }
  if (!date || !time) { alert("Bitte Datum und Uhrzeit wählen."); return; }

  // ISO für Backend LocalDateTime.parse
  const startTime = `${date}T${time}`;

  try {
    await apiPost(`${API}/api/patients/${pid}/appointments`, { startTime });
    await loadAppointmentsForSelectedPatient();
    setHint("Termin angelegt.");
  } catch(e){
    console.error(e);
    alert("Termin konnte nicht angelegt werden.");
  }
});

// ===== Cancel =====
document.getElementById("btnCancel").addEventListener("click", async () => {
  if (!selectedAppointmentId) return;

  const reason = prompt("Grund der Absage (optional):") || null;

  try {
    await apiPost(`${API}/api/appointments/${selectedAppointmentId}/cancel`, { reason });
    await loadAppointmentsForSelectedPatient();
    setHint("Termin abgesagt.");
  } catch(e){
    console.error(e);
    alert("Absage hat nicht geklappt (evtl. 24h-Regel).");
  }
});

// ===== Start =====
(async function init(){
  user = requireAuth();
  if (!user) return;

  if (user.role !== "THERAPIST") {
    window.location.href = "/patient.html";
    return;
  }

  await loadPatients();
  if (patients.length === 0) {
    setHint("Keine Patienten gefunden.");
    return;
  }

  // Default datum/uhrzeit = heute + 1 tag
  const d = new Date(Date.now() + 24*60*60*1000);
  document.getElementById("dateInput").value = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  document.getElementById("timeInput").value = "12:00";

  await loadAppointmentsForSelectedPatient();
  setHint("Bereit.");
})().catch(err => {
  console.error(err);
  alert("Seite konnte nicht initialisiert werden.");
});
