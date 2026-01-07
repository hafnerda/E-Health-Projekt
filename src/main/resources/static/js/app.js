const API_BASE = "/api/auth";

const formsDiv = document.getElementById("forms");
const messageDiv = document.getElementById("message");


// Wenn schon eingeloggt -> direkt passendes Dashboard
// Wenn schon eingeloggt -> nur auf der Login-Seite weiterleiten
document.addEventListener("DOMContentLoaded", () => {
  const isIndex = location.pathname === "/" || location.pathname.endsWith("/index.html");
  if (!isIndex) return;

  const raw = localStorage.getItem("auth_user");
  if (!raw) return;

  try {
    const user = JSON.parse(raw);
    if (user.role === "PATIENT") {
      window.location.href = "/patient.html";
    } else {
      window.location.href = "/dashboard.html";
    }
  } catch {
    localStorage.removeItem("auth_user");
  }
});


// Hilfsfunktion: Backend kann JSON oder Text zurückgeben
async function readJsonOrText(resp) {
    const ct = (resp.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) return await resp.json();
    return await resp.text();
}

function setMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.style.color = isError ? "darkred" : "darkgreen";
}

function renderRegisterTherapistForm() {
    formsDiv.innerHTML = `
      <h4>Registrierung Therapeut</h4>
      <form id="form-register-therapist">
        <label>Lizenzcode
          <input type="text" name="licenseCode" required>
        </label>
        <label>Name
          <input type="text" name="name" required>
        </label>
        <label>E-Mail
          <input type="email" name="email" required>
        </label>
        <label>Passwort
          <input type="password" name="password" required>
        </label>
        <button type="submit">Registrieren</button>
      </form>
    `;

    document
        .getElementById("form-register-therapist")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());

            try {
                const resp = await fetch(`${API_BASE}/register-therapist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await readJsonOrText(resp);
                if (!resp.ok) {
                    setMessage(typeof data === "string" ? data : JSON.stringify(data), true);
                } else {
                    setMessage(`Registrierung erfolgreich: ${data.name} (${data.email})`);
            }          

            } catch (err) {
                setMessage("Fehler bei der Registrierung.", true);
            }
        });
}

function renderLoginForm(role) {
    const title = role === "therapist" ? "Anmeldung Therapeut" : "Anmeldung Patient";
    const endpoint = role === "therapist" ? "login-therapist" : "login-patient";

    formsDiv.innerHTML = `
      <h4>${title}</h4>
      <form id="form-login">
        <label>E-Mail
          <input type="email" name="email" required>
        </label>
        <label>Passwort
          <input type="password" name="password" required>
        </label>
        <button type="submit">Anmelden</button>
      </form>
    `;

    document
        .getElementById("form-login")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());

            try {
                const resp = await fetch(`${API_BASE}/${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await readJsonOrText(resp);

                if (!resp.ok) {
                    setMessage(typeof data === "string" ? data : JSON.stringify(data), true);
                } else {
                    setMessage(`Login erfolgreich als ${data.role}: ${data.name}`);

                    // User speichern (solange du noch kein JWT/Session hast)
                    localStorage.setItem("auth_user", JSON.stringify(data));

                    // Redirect je nach Rolle
                    if (data.role === "PATIENT") {
                        window.location.href = "/patient.html";
                    } else {
                        window.location.href = "/dashboard.html";
                    }
                }           
            } catch (err) {
                setMessage("Fehler beim Login.", true);
            }
        });
}

// Buttons verdrahten
document.getElementById("btn-register-therapist")
    .addEventListener("click", () => {
        setMessage("");
        renderRegisterTherapistForm();
    });

document.getElementById("btn-login-therapist")
    .addEventListener("click", () => {
        setMessage("");
        renderLoginForm("therapist");
    });

document.getElementById("btn-login-patient")
    .addEventListener("click", () => {
        setMessage("");
        renderLoginForm("patient");
    });
