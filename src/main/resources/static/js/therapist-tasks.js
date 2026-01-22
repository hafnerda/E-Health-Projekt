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

function $(id){ return document.getElementById(id); }
function setMsg(t){ $("msg").textContent = t || ""; }

function pct(done, required){
  const r = Number(required || 0);
  const d = Number(done || 0);
  if (r <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((d / r) * 100)));
}

function isoToday(){
  return new Date().toISOString().slice(0,10);
}

function setDefaultDates(){
  const today = isoToday();
  $("startDate").value = today;
  $("dueDate").value = today;
}

function openAccountMenu(){
  const account = $("account");
  const btn = $("btnAccount");
  btn.addEventListener("click", () => account.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (!account.contains(e.target)) account.classList.remove("open");
  });
}

async function loadPatients(){
  // Erwartet: GET /api/patients -> Liste
  const patients = await apiGet(`${API}/api/patients`);

  const sel = $("patientSelect");
  sel.innerHTML = "";

  if (!Array.isArray(patients) || patients.length === 0){
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Keine Patienten vorhanden";
    sel.appendChild(opt);
    return;
  }

  for (const p of patients){
    const opt = document.createElement("option");
    opt.value = p.id;

    const fn = (p.firstName || "").trim();
    const ln = (p.lastName || "").trim();
    const name = `${fn} ${ln}`.trim() || `Patient #${p.id}`;

    const code = p.patientCode ? ` (${p.patientCode})` : "";
    opt.textContent = name + code;

    sel.appendChild(opt);
  }
}

function renderTasks(items){
  const list = $("taskList");
  list.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0){
    list.innerHTML = `<div style="text-align:center;opacity:.85;">Keine Aufgaben.</div>`;
    return;
  }

  for (const t of items){
    const required = Number(t.requiredTotal || 0);
    const done = Number(t.doneTotal || 0);
    const p = pct(done, required);

    const div = document.createElement("div");
    div.className = "item";

    const title = document.createElement("div");
    title.className = "t";
    title.textContent = t.title || "Aufgabe";

    const meta = document.createElement("div");
    meta.className = "m";
    meta.textContent = `${t.startDate} bis ${t.dueDate} · ${t.timesPerDay}x/Tag · aktiv: ${t.active ? "ja" : "nein"}`;

    const desc = document.createElement("div");
    desc.className = "p";
    desc.textContent = (t.description || "").trim() || "—";

    const prog = document.createElement("div");
    prog.className = "m";
    prog.style.marginTop = "8px";
    prog.textContent = `Gesamt: ${done}/${required} (${p}%)`;

    const barwrap = document.createElement("div");
    barwrap.className = "barwrap";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = `${p}%`;
    barwrap.appendChild(bar);

    div.appendChild(title);
    div.appendChild(meta);
    div.appendChild(desc);
    div.appendChild(prog);
    div.appendChild(barwrap);

    list.appendChild(div);
  }
}

async function refreshTasks(){
  const patientId = $("patientSelect").value;
  if (!patientId) return;

  const items = await apiGet(`${API}/api/patients/${patientId}/tasks`);
  renderTasks(items);
}

async function createTask(){
  const patientId = $("patientSelect").value;
  const title = $("title").value.trim();
  const description = $("description").value.trim();
  const startDate = $("startDate").value;
  const dueDate = $("dueDate").value;
  const timesPerDay = Number($("timesPerDay").value || 1);

  if (!patientId) { setMsg("Kein Patient ausgewählt."); return; }
  if (!title) { setMsg("Titel fehlt."); return; }
  if (!startDate || !dueDate) { setMsg("Startdatum und Fällig bis fehlen."); return; }
  if (timesPerDay < 1) { setMsg("Wiederholung muss >= 1 sein."); return; }

  $("btnCreate").disabled = true;
  setMsg("Speichere…");

  await apiPost(`${API}/api/patients/${patientId}/tasks`, {
    title,
    description,
    startDate,
    dueDate,
    timesPerDay
  });

  setMsg("Aufgabe angelegt.");
  $("btnCreate").disabled = false;

  // form optional leeren
  $("title").value = "";
  $("description").value = "";

  await refreshTasks();
}

async function init(){
  const user = requireAuth();
  if (!user) return;

  if (user.role !== "THERAPIST") {
    // falls falsch eingeloggt
    window.location.href = "/patient.html";
    return;
  }

  // Account
  openAccountMenu();

  $("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("auth_user");
    window.location.href = "/index.html";
  });

  $("btnBack").addEventListener("click", () => {
    window.location.href = "/dashboard.html";
  });

  setDefaultDates();

  await loadPatients();
  await refreshTasks();

  $("patientSelect").addEventListener("change", () => {
    refreshTasks().catch(e => setMsg(e.message || String(e)));
  });

  $("btnRefresh").addEventListener("click", () => {
    refreshTasks().catch(e => setMsg(e.message || String(e)));
  });

  $("btnCreate").addEventListener("click", () => {
    createTask().catch(e => {
      console.error(e);
      setMsg(e.message || String(e));
      $("btnCreate").disabled = false;
    });
  });
}

init().catch(e => {
  console.error(e);
  setMsg("Fehler beim Laden.");
});
