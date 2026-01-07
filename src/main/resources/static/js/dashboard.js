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
  const res = await fetch(`${API_BASE}/patients/${patientId}/measurements`);
  const measurements = await res.json();

  const tbody = document.getElementById("measurementsTbody");
  tbody.innerHTML = "";

  measurements.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.createdAt ?? ""}</td>
      <td>${m.type ?? ""}</td>
      <td>${m.description ?? ""}</td>
      <td>${m.attribute ?? ""}</td>
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

// --------- Modal: Neue Messung ----------
function initMeasurementModal() {
  const backdrop = document.getElementById("measurementModalBackdrop");
  const closeBtn = document.getElementById("measurementModalClose");
  const cancelBtn = document.getElementById("measurementModalCancel");
  const form = document.getElementById("measurementForm");
  const msg = document.getElementById("measurementFormMsg");

  function setMsg(text, isError=false) {
    msg.textContent = text || "";
    msg.style.color = isError ? "#b00020" : "#0b3d1a";
  }

  function open() {
    form.reset();
    setMsg("");
    backdrop.classList.remove("hidden");
  }

  function close() {
    backdrop.classList.add("hidden");
  }

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setMsg("Erst Patient auswählen.", true);
      return;
    }

    setMsg("Speichern...");
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const resp = await fetch(`${API_BASE}/patients/${selectedPatientId}/measurements`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });

      const data = await readJsonOrText(resp);
      if (!resp.ok) {
        setMsg(typeof data === "string" ? data : JSON.stringify(data), true);
        return;
      }

      close();
      await loadMeasurements(selectedPatientId);
    } catch (err) {
      setMsg("Netzwerkfehler: " + err.message, true);
    }
  });

  return { open, close };
}


// --------- Actions ----------
function bindActions(patientModal, measurementModal) {
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
    measurementModal.open();
  });

  document.getElementById("sbReport").addEventListener("click", () => {
  if (!selectedMeasurementId) {
    alert("Erst Messung auswählen.");
    return;
  }

  window.location.href = `/report.html?measurementId=${selectedMeasurementId}`;
});

document.getElementById("sbReport").addEventListener("click", () => {
  if (!selectedMeasurementId) return alert("Erst Messung auswählen.");
  window.open(`${API_BASE}/measurements/${selectedMeasurementId}/report-pdf/inline`, "_blank");
});

document.getElementById("sbExport").addEventListener("click", () => {
  if (!selectedMeasurementId) return alert("Erst Messung auswählen.");

  const input = document.getElementById("pdfFileInput");
  input.value = ""; // reset, damit gleiche Datei erneut gewählt werden kann
  input.click();
});

document.getElementById("pdfFileInput").addEventListener("change", async (e) => {
  if (!selectedMeasurementId) return;

  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.toLowerCase().includes("pdf")) {
    alert("Bitte eine PDF-Datei auswählen.");
    return;
  }

  const fd = new FormData();
  fd.append("file", file);

  try {
    const resp = await fetch(`${API_BASE}/measurements/${selectedMeasurementId}/report-pdf`, {
      method: "POST",
      body: fd
    });

    const data = await readJsonOrText(resp);
    if (!resp.ok) {
      alert(typeof data === "string" ? data : JSON.stringify(data));
      return;
    }

    alert("PDF wurde zur Messung gespeichert.");
  } catch (err) {
    alert("Netzwerkfehler: " + err.message);
  }
});

document.getElementById("sbImport").addEventListener("click", () => {
  if (!selectedMeasurementId) return alert("Erst Messung auswählen.");
  window.location.href = `${API_BASE}/measurements/${selectedMeasurementId}/report-pdf/download`;
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
    const measurementModal = initMeasurementModal();
    bindActions(patientModal, measurementModal);

  await loadPatients();
});
