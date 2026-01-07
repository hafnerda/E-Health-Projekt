// resources/static/js/dashboard.js
const API_BASE = "/api"; // gleiche Domain/Port wie Spring Boot

let selectedPatientId = null;
let selectedMeasurementId = null;

// Cache, damit wir beim Bearbeiten die Daten direkt haben
let patientsById = new Map();

// Modal-State
let patientModalMode = "create"; // "create" | "edit"

// --------- Auth ----------
function requireAuth() {
  const userJson = localStorage.getItem("auth_user");
  if (!userJson) {
    window.location.href = "/index.html";
    return null;
  }
  return JSON.parse(userJson);
}

// --------- Helpers ----------
function setSelectedRow(tbody, rowEl) {
  [...tbody.querySelectorAll("tr")].forEach(tr => tr.classList.remove("selected"));
  rowEl.classList.add("selected");
}

// Backend kann bei Fehlern auch Text zurückgeben (ex.getMessage())
async function readJsonOrText(resp) {
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await resp.json();
  return await resp.text();
}

function toNumberOrDelete(payload, key) {
  if (payload[key] === "") {
    delete payload[key];
    return;
  }
  payload[key] = Number(payload[key]);
}

function deleteIfEmpty(payload, key) {
  if (payload[key] === "") delete payload[key];
}

// --------- Data loading ----------
async function loadPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  const patients = await res.json();

  // Cache aktualisieren
  patientsById = new Map(patients.map(p => [p.id, p]));

  const tbody = document.getElementById("patientsTbody");
  tbody.innerHTML = "";

  patients.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.gender ?? ""}</td>
      <td>${p.firstName ?? ""}</td>
      <td>${p.lastName ?? ""}</td>
      <td>${p.birthDate ?? ""}</td>
      <td>${p.lastMeasurementDate ?? ""}</td>
      <td>${p.patientCode ?? ""}</td>
      <td>${p.weightKg ?? ""}</td>
      <td>${p.heightCm ?? ""}</td>
    `;

    tr.addEventListener("click", async () => {
      selectedPatientId = p.id;
      selectedMeasurementId = null;
      setSelectedRow(tbody, tr);
      await loadMeasurements(p.id); // kommt später
    });

    tbody.appendChild(tr);
  });
}

async function loadMeasurements(patientId) {
  // TODO später: GET /api/patients/{id}/measurements
  const measurements = [
    { id: 11, created: "2026-01-01", type: "Gangbild", description: "Treadmill", attribute: "UWB" },
    { id: 12, created: "2025-12-20", type: "Balance", description: "Standing", attribute: "IMU" }
  ];

  const tbody = document.getElementById("measurementsTbody");
  tbody.innerHTML = "";

  measurements.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.created}</td>
      <td>${m.type}</td>
      <td>${m.description}</td>
      <td>${m.attribute}</td>
    `;

    tr.addEventListener("click", () => {
      selectedMeasurementId = m.id;
      setSelectedRow(tbody, tr);
    });

    tbody.appendChild(tr);
  });
}

// --------- Modal: Neuer Patient / Bearbeiten ----------
function initPatientModal() {
  const modalBackdrop = document.getElementById("patientModalBackdrop");
  const modalClose = document.getElementById("patientModalClose");
  const modalCancel = document.getElementById("patientModalCancel");
  const modalTitle = document.getElementById("patientModalTitle");
  const patientForm = document.getElementById("patientForm");
  const patientFormMsg = document.getElementById("patientFormMsg");

  if (!modalBackdrop || !modalClose || !modalCancel || !patientForm || !patientFormMsg) {
    return {
      openCreate: () => alert("Modal fehlt in dashboard.html (patientModalBackdrop/patientForm...)."),
      openEdit: () => alert("Modal fehlt in dashboard.html (patientModalBackdrop/patientForm...)."),
      close: () => {}
    };
  }

  function setMsg(text, isError = false) {
    patientFormMsg.textContent = text || "";
    patientFormMsg.style.color = isError ? "#b00020" : "#0b3d1a";
  }

  function openCreate() {
    patientModalMode = "create";
    if (modalTitle) modalTitle.textContent = "Neuer Patient";
    patientForm.reset();
    setMsg("");
    modalBackdrop.classList.remove("hidden");
  }

  function openEdit(patient) {
    patientModalMode = "edit";
    if (modalTitle) modalTitle.textContent = "Patient bearbeiten";
    setMsg("");

    // Felder befüllen (Names müssen exakt zu deinen input/select names passen)
    patientForm.elements["gender"].value = patient.gender ?? "d";
    patientForm.elements["firstName"].value = patient.firstName ?? "";
    patientForm.elements["lastName"].value = patient.lastName ?? "";
    patientForm.elements["birthDate"].value = patient.birthDate ?? "";
    patientForm.elements["patientCode"].value = patient.patientCode ?? "";
    patientForm.elements["weightKg"].value = patient.weightKg ?? "";
    patientForm.elements["heightCm"].value = patient.heightCm ?? "";
    patientForm.elements["lastMeasurementDate"].value = patient.lastMeasurementDate ?? "";

    modalBackdrop.classList.remove("hidden");
  }

  function close() {
    modalBackdrop.classList.add("hidden");
  }

  // Close Aktionen
  modalClose.addEventListener("click", close);
  modalCancel.addEventListener("click", close);

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.classList.contains("hidden")) close();
  });

  // Submit -> POST oder PUT -> reload
  patientForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("Speichern...");

    const formData = new FormData(patientForm);
    const payload = Object.fromEntries(formData.entries());

    // Typen/Leere Werte bereinigen
    toNumberOrDelete(payload, "weightKg");
    toNumberOrDelete(payload, "heightCm");
    deleteIfEmpty(payload, "birthDate");
    deleteIfEmpty(payload, "lastMeasurementDate");

    try {
      let url = `${API_BASE}/patients`;
      let method = "POST";

      if (patientModalMode === "edit") {
        if (!selectedPatientId) {
          setMsg("Kein Patient ausgewählt.", true);
          return;
        }
        url = `${API_BASE}/patients/${selectedPatientId}`;
        method = "PUT";
      }

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await readJsonOrText(resp);

      if (!resp.ok) {
        setMsg(typeof data === "string" ? data : JSON.stringify(data), true);
        return;
      }

      close();
      await loadPatients();
    } catch (err) {
      setMsg("Netzwerkfehler: " + err.message, true);
    }
  });

  return { openCreate, openEdit, close };
}

// --------- Actions ----------
function bindActions(patientModal) {
  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("auth_user");
    window.location.href = "/index.html";
  });

  // Neuer Patient -> Modal (create)
  document.getElementById("sbNewPatient").addEventListener("click", () => {
    patientModal.openCreate();
  });

  // Patient bearbeiten -> Modal (edit)
  document.getElementById("btnEditPatient").addEventListener("click", () => {
    if (!selectedPatientId) return alert("Erst Patient auswählen.");

    const patient = patientsById.get(selectedPatientId);
    if (!patient) return alert("Patientdaten nicht gefunden. Bitte Seite neu laden.");

    patientModal.openEdit(patient);
  });

  document.getElementById("sbMeasure").addEventListener("click", () => {
    if (!selectedPatientId) return alert("Erst Patient auswählen.");
    alert("Messung starten (kommt später)");
  });

  // Entfernen -> Patient löschen (Messungen später)
  document.getElementById("btnDelete").addEventListener("click", async () => {
    if (!selectedPatientId) {
      alert("Erst Patient auswählen.");
      return;
    }

    const ok = confirm("Patient wirklich löschen?");
    if (!ok) return;

    try {
      const resp = await fetch(`${API_BASE}/patients/${selectedPatientId}`, { method: "DELETE" });
      const data = await readJsonOrText(resp);

      if (!resp.ok) {
        alert(typeof data === "string" ? data : JSON.stringify(data));
        return;
      }

      selectedPatientId = null;
      selectedMeasurementId = null;

      const mtbody = document.getElementById("measurementsTbody");
      if (mtbody) mtbody.innerHTML = "";

      await loadPatients();
      alert("Patient gelöscht.");
    } catch (err) {
      alert("Netzwerkfehler: " + err.message);
    }
  });

  // Settings/Account placeholders:
  document.getElementById("btnSettings").addEventListener("click", () => alert("Einstellungen (später)"));
  document.getElementById("btnAccount").addEventListener("click", () => alert("Account (später)"));
}

// --------- Boot ----------
document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const patientModal = initPatientModal();
  bindActions(patientModal);

  await loadPatients();
});
