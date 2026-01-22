const API = ""; // same-origin

function requireAuth() {
  const raw = localStorage.getItem("auth_user");
  if (!raw) { window.location.href = "/index.html"; return null; }
  try { return JSON.parse(raw); }
  catch { localStorage.removeItem("auth_user"); window.location.href = "/index.html"; return null; }
}

async function apiGet(url) {
  const resp = await fetch(url, { method: "GET" });
  const ct = (resp.headers.get("content-type") || "").toLowerCase();
  const data = ct.includes("application/json") ? await resp.json() : await resp.text();
  if (!resp.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

function fmtISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isTaskActiveForDate(t, iso) {
  return !!t.active && iso >= t.startDate && iso <= t.dueDate;
}

// Backend: Patient per User holen
async function getPatientIdForUser(user) {
  const patient = await apiGet(`${API}/api/patients/by-user/${user.id}`);
  return patient.id ?? patient.patientId;
}

async function loadTasks(patientId) {
  const res = await apiGet(`${API}/api/patients/${patientId}/tasks`);
  return Array.isArray(res) ? res : [];
}

// ✅ Fortschritt serverseitig
async function loadProgress(taskId, isoDate) {
  const pr = await apiGet(`${API}/api/tasks/${taskId}/progress?date=${encodeURIComponent(isoDate)}`);
  return Number(pr?.doneCount ?? 0);
}

function setupAccount() {
  const account = document.getElementById("account");
  document.getElementById("btnAccount")?.addEventListener("click", () => {
    account?.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (account && !account.contains(e.target)) account.classList.remove("open");
  });

  document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.removeItem("auth_user");
    window.location.href = "/index.html";
  });
}

document.getElementById("btnBack")?.addEventListener("click", () => {
  window.location.href = "/patient-trainingplan.html";
});

async function render() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const iso = fmtISODate(today);

  const todaySummary = document.getElementById("todaySummary");
  const list = document.getElementById("progressList");

  todaySummary.textContent = "Lade...";
  list.innerHTML = "";

  const authUser = requireAuth();
  if (!authUser) return;

  if (authUser.role !== "PATIENT") {
    window.location.href = "/dashboard.html";
    return;
  }

  const patientId = await getPatientIdForUser(authUser);
  const tasks = await loadTasks(patientId);

  const active = tasks.filter(t => isTaskActiveForDate(t, iso));

  if (active.length === 0) {
    todaySummary.textContent = `Heute (${today.toLocaleDateString("de-DE")}): Keine Aufgaben.`;
    return;
  }

  // parallel laden
  const rows = await Promise.all(active.map(async (t) => {
    const times = Number(t.timesPerDay || 1);
    const done = await loadProgress(t.id, iso);
    const capped = Math.min(done, times);
    const pct = times > 0 ? Math.round((capped / times) * 100) : 0;
    return { t, times, done: capped, pct };
  }));

  const totalTimes = rows.reduce((a, r) => a + r.times, 0);
  const totalDone  = rows.reduce((a, r) => a + r.done, 0);
  const totalPct   = totalTimes > 0 ? Math.round((totalDone / totalTimes) * 100) : 0;

  todaySummary.textContent = `Heute gesamt (${today.toLocaleDateString("de-DE")}): ${totalDone}/${totalTimes} (${totalPct}%)`;

  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "progress-row";

    const left = document.createElement("div");
    left.className = "progress-left";

    const title = document.createElement("div");
    title.className = "progress-title";
    title.textContent = r.t.title || "Übung";

    const sub = document.createElement("div");
    sub.className = "progress-sub";
    const desc = (r.t.description || "").trim();
    sub.textContent = desc
      ? `${r.times}x pro Tag – ${desc}`
      : `${r.times}x pro Tag (bis ${r.t.dueDate})`;

    left.appendChild(title);
    left.appendChild(sub);

    const right = document.createElement("div");
    right.className = "progress-right";

    const nums = document.createElement("div");
    nums.className = "progress-numbers";
    nums.textContent = `${r.done}/${r.times} (${r.pct}%)`;

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max(0, Math.min(100, r.pct))}%`;

    bar.appendChild(fill);
    right.appendChild(nums);
    right.appendChild(bar);

    row.appendChild(left);
    row.appendChild(right);
    list.appendChild(row);
  }
}

(async function init(){
  try{
    setupAccount();
    await render();
  }catch(e){
    console.error(e);
    const todaySummary = document.getElementById("todaySummary");
    if (todaySummary) todaySummary.textContent = "Fehler beim Laden.";
  }
})();
