const API = ""; // same-origin

function requireAuth() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) { window.location.href = "/index.html"; return null; }
  try { return JSON.parse(raw); }
  catch { localStorage.removeItem("auth_user"); window.location.href = "/index.html"; return null; }
}

async function apiGet(url) {
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) throw new Error(`GET ${url} -> ${resp.status}`);
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  return ct.includes("application/json") ? resp.json() : resp.text();
}

async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null
  });
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  const data = ct.includes("application/json") ? await resp.json() : await resp.text();
  if (!resp.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

// ===== Date helpers =====
function fmtISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=So
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthName(deMonthIdx) {
  const names = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  return names[deMonthIdx] || "";
}

/* =========================================================
   A) Übungs-Textliste (ist bei dir schon drin ✅)
   ========================================================= */
const EXERCISE_INFO = {
  1: `Knie kreisen:
Füße und Knie geschlossen halten.
Mit leicht gebeugten Knien möglichst große Kreise
mit den Knien über den Füßen bilden.
Richtung wechseln und wiederholen.`,
  2: `Hüfte kreisen:
Die Füße hüftbreit aufstellen und die Hüfte in möglichst
großen Kreisen über den Füßen bewegen.
Richtungswechsel nicht vergessen.`,
  3: `Oberkörperrotation:
Stellen Sie die Füße schulterbreit auseinander und drehen Sie
den Oberkörper langsam von einer Seite zur anderen.
Am Endpunkt halten Sie die Spannung für 1–2 Sekunden und
drehen sich langsam in die entgegengesetzte Richtung zurück.`,
  4: `Hüfte kippen:
Die Füße im Stehen oder Sitzen hüftbreit aufstellen und die
Knie leicht beugen. Nun die Hüfte vor und zurück kippen
(den unteren Rücken rund machen bzw. leicht ins Hohlkreuz gehen).`
};

/* =========================================================
   B) Toggle-Funktionen (HIER EINFÜGEN ✅)
   irgendwo nach EXERCISE_INFO, vor renderTasks()
   ========================================================= */
let exercisePanelOpen = false;

function openExercisePanelAll() {
  const panel = document.getElementById("exercisePanel");
  const title = document.getElementById("exercisePanelTitle");
  const text = document.getElementById("exercisePanelText");
  if (!panel || !title || !text) return;

  title.textContent = "Übungen 1–4";

  const fullText = [1,2,3,4]
    .map(n => `Übung ${n}\n${EXERCISE_INFO[n] || "Keine Beschreibung vorhanden."}`)
    .join("\n\n--------------------\n\n");

  text.textContent = fullText;

  panel.classList.remove("hidden");
  exercisePanelOpen = true;
}

function closeExercisePanel() {
  const panel = document.getElementById("exercisePanel");
  if (!panel) return;
  panel.classList.add("hidden");
  exercisePanelOpen = false;
}

function toggleExercisePanelAll() {
  if (exercisePanelOpen) closeExercisePanel();
  else openExercisePanelAll();
}


// Optional: Panel schließen wenn man ins Leere klickt
document.addEventListener("click", (e) => {
  const panel = document.getElementById("exercisePanel");
  const btn = e.target.closest?.(".info-btn");
  if (!panel) return;

  if (!panel.contains(e.target) && !btn) closeExercisePanel();
});

// ===== State =====
let authUser = null;
let patientId = null;

let tasks = [];
let selectedDate = new Date();
let weekStart = null;

// ===== Backend calls =====
async function getPatientIdForUser(user) {
  const patient = await apiGet(`${API}/api/patients/by-user/${user.id}`);
  return patient.id ?? patient.patientId;
}

async function loadTasks() {
  tasks = await apiGet(`${API}/api/patients/${patientId}/tasks`);
  if (!Array.isArray(tasks)) tasks = [];
}

// ✅ Fortschritt serverseitig laden
async function loadProgress(taskId, isoDate) {
  const pr = await apiGet(`${API}/api/tasks/${taskId}/progress?date=${isoDate}`);
  return Number(pr?.doneCount ?? 0);
}

// ===== UI: Kalender =====
function renderCalendarWeek() {
  const calDays = document.getElementById("calDays");
  const calMonth = document.getElementById("calMonth");
  calDays.innerHTML = "";

  if (!weekStart) weekStart = startOfWeekMonday(selectedDate);
  calMonth.textContent = monthName(selectedDate.getMonth());

  const selISO = fmtISODate(selectedDate);

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const iso = fmtISODate(d);

    const btn = document.createElement("div");
    btn.className = "day";
    btn.textContent = String(d.getDate());

    if (iso === selISO) btn.classList.add("selected");

    if (tasks.some(t => t.active && iso >= t.startDate && iso <= t.dueDate)) {
      btn.classList.add("hasTasks");
    }

    btn.addEventListener("click", async () => {
      selectedDate = d;
      weekStart = startOfWeekMonday(selectedDate);
      renderCalendarWeek();
      await renderTasks();
    });

    calDays.appendChild(btn);
  }
}

// ===== UI: Tasks =====
function getActiveTasksForDate(isoDate) {
  return tasks.filter(t => t.active && isoDate >= t.startDate && isoDate <= t.dueDate);
}

async function renderTasks() {
  const iso = fmtISODate(selectedDate);
  const list = document.getElementById("taskList");
  const hint = document.getElementById("tasksHint");

  list.innerHTML = "";

  const active = getActiveTasksForDate(iso);



  if (active.length === 0) {
    hint.textContent = "Keine Aufgaben für diesen Tag.";
    return;
  }

  hint.textContent = `Aufgaben für ${selectedDate.toLocaleDateString("de-DE")}:`;



  // ✅ Progress für alle Tasks parallel holen
  const doneCounts = await Promise.all(active.map(t => loadProgress(t.id, iso)));

  for (let idx = 0; idx < active.length; idx++) {
    const t = active[idx];

    // WICHTIG: wenn du KEIN exerciseNo im Backend hast -> Reihenfolge 1..4
    const exNo = idx + 1; // 1..4

    const times = Number(t.timesPerDay || 1);
    const doneCount = Math.min(Number(doneCounts[idx] || 0), times);

    const row = document.createElement("div");
    row.className = "task-row";

    const left = document.createElement("div");
    left.className = "task-left";

    const textWrap = document.createElement("div");

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = t.title || "Übung";

    const sub = document.createElement("div");
    sub.className = "task-sub";
    const desc = (t.description || "").trim();
    sub.textContent = desc
      ? `${times}x pro Tag – ${desc}`
      : `${times}x pro Tag (bis ${t.dueDate})`;

    // 🟢 Fortschrittstext
    const prog = document.createElement("div");
    prog.className = "task-progress";
    const pct = times > 0 ? Math.round((doneCount / times) * 100) : 0;
    prog.textContent = `Fortschritt: ${doneCount}/${times} (${pct}%)`;

    /* =========================================================
       C) Info-Button Block (HIER ERSETZEN ✅)
       Ersetzt: textWrap.appendChild(title); textWrap.appendChild(sub);
       ========================================================= */

    // ===== linke Seite (Titel + Sub + Info-Button) =====
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.gap = "12px";

    const titleWrap = document.createElement("div");
    titleWrap.appendChild(title);
    titleWrap.appendChild(sub);

    const infoBtn = document.createElement("button");
    infoBtn.type = "button";
    infoBtn.className = "info-btn";
    infoBtn.textContent = "i";
    infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleExercisePanelAll();
        });


    headerRow.appendChild(titleWrap);
    headerRow.appendChild(infoBtn);

    textWrap.appendChild(headerRow);
    textWrap.appendChild(prog);
    left.appendChild(textWrap);

    const checks = document.createElement("div");
    checks.className = "checks";

    // 1..times Checkboxen
    for (let i = 1; i <= times; i++) {
      const box = document.createElement("input");
      box.type = "checkbox";
      box.className = "chkInput";

      // Zustand setzen: die ersten doneCount sind checked
      box.checked = (i <= doneCount);
      box.title = `Heute: ${doneCount}/${times}`;

      box.addEventListener("change", async () => {
        try {
          const isoDate = iso;

          if (box.checked) {
            await apiPost(`${API}/api/tasks/${t.id}/done`, { date: isoDate });
          } else {
            await apiPost(`${API}/api/tasks/${t.id}/undo`, { date: isoDate });
          }

          // ✅ danach alles neu vom Server laden
          await renderTasks();
          renderCalendarWeek();
        } catch (e) {
          console.error(e);
          alert("Aktion fehlgeschlagen.");
          box.checked = !box.checked;
        }
      });

      checks.appendChild(box);
    }

    row.appendChild(left);
    row.appendChild(checks);
    list.appendChild(row);
  }
}

// ===== Buttons / Account =====
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("auth_user");
  window.location.href = "/index.html";
});

document.getElementById("btnPlan").addEventListener("click", () => {
  // du bist schon hier
});

// ✅ Button soll auf neue Seite gehen
document.getElementById("btnProgress").addEventListener("click", () => {
  window.location.href = "/patient-progress.html";
});

document.getElementById("btnAppointments").addEventListener("click", () => {
  window.location.href = "/patient-appointments.html";
});

const account = document.getElementById("account");
const btnAccount = document.getElementById("btnAccount");
btnAccount.addEventListener("click", () => account.classList.toggle("open"));
document.addEventListener("click", (e) => {
  if (!account.contains(e.target)) account.classList.remove("open");
});

// ===== Start =====
(async function init() {
  try {
    authUser = requireAuth();
    if (!authUser) return;

    if (authUser.role !== "PATIENT") {
      window.location.href = "/dashboard.html";
      return;
    }

    patientId = await getPatientIdForUser(authUser);
    if (!patientId) throw new Error("Keine patientId gefunden.");

    await loadTasks();

    selectedDate = new Date();
    selectedDate.setHours(0,0,0,0);
    weekStart = startOfWeekMonday(selectedDate);

    renderCalendarWeek();
    await renderTasks();
  } catch (err) {
    console.error(err);
    document.getElementById("tasksHint").textContent = "Fehler beim Laden.";
  }
})();
