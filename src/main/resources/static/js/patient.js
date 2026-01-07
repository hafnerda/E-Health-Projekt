const API = ""; // falls du schon API_BASE nutzt, setz hier z.B. "/api"

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

function setProgress(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById("progressText").textContent = `${done}/${total} erledigt (${pct}%)`;
  document.getElementById("progressBar").style.width = `${pct}%`;
}

function renderMeasurements(items) {
  const ul = document.getElementById("measurementList");
  const info = document.getElementById("listInfo");
  ul.innerHTML = "";

  if (!items || items.length === 0) {
    info.textContent = "Keine Messungen gefunden.";
    setProgress(0, 0);
    return;
  }

  info.textContent = `${items.length} Messungen gefunden.`;
  // Beispiel: Fortschritt = Anzahl Messungen mit "done" (falls du sowas hast)
  const done = items.filter(x => x.status === "DONE" || x.done === true).length;
  setProgress(done, items.length);

  for (const m of items) {
    const li = document.createElement("li");
    const title = m.name || m.filename || `Messung #${m.id}`;
    li.textContent = title;

    // Optional: wenn Backend dir PDF-URL gibt
    // if (m.pdfUrl) { ... }
    ul.appendChild(li);
  }
}

async function loadMyData() {
  const user = requireAuth();
  if (!user) return;

  // Sicherheitscheck: falls jemand direkt patient.html öffnet
  if (user.role !== "PATIENT") {
    window.location.href = "/dashboard.html";
    return;
  }

  // 1) PatientId holen
  const patient = await apiGet(`${API}/api/patients/by-user/${user.id}`);
  const patientId = patient.id ?? patient.patientId ?? patient;

  if (!patientId) throw new Error("Keine patientId aus /api/patients/by-user/... erhalten.");

  // 2) Messungen holen
  const measurements = await apiGet(`${API}/api/patients/${patientId}/measurements`);

  renderMeasurements(Array.isArray(measurements) ? measurements : (measurements.items || []));
}

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("auth_user");
  window.location.href = "/index.html";
});

// Platzhalter: Buttons erstmal nur “da”, Logik später an echte Endpoints hängen
document.getElementById("btnImport").addEventListener("click", () => alert("Import: kommt als nächstes"));
document.getElementById("btnExport").addEventListener("click", () => alert("Export: kommt als nächstes"));
document.getElementById("btnReport").addEventListener("click", () => alert("Report: kommt als nächstes"));

loadMyData().catch(err => {
  console.error(err);
  document.getElementById("listInfo").textContent = "Fehler beim Laden der Daten.";
});
