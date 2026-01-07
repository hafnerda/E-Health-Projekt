const API_BASE = "/api";

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = getQueryParam("measurementId");
  if (!id) return;

  // PDF direkt einbetten
  const pdfUrl = `${API_BASE}/measurements/${id}/report-pdf/inline`;
  document.getElementById("pdfFrame").src = pdfUrl;

  // Meta oben optional:
  document.getElementById("title").textContent = `Report (Messung ${id})`;
});
