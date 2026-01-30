const list = document.getElementById("list");
const count = document.getElementById("count");
const btn = document.getElementById("refreshBtn");

function esc(s="") {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

async function load() {
  list.innerHTML = `<p class="muted">Loading…</p>`;
  const res = await fetch("/api/admin/feedback");
  const rows = await res.json();
  count.textContent = `${rows.length} total`;

  list.innerHTML = rows.map(r => {
    const pr = JSON.parse(r.priority || "[]");
    return `
      <div class="card" style="margin:10px 0;background:#fff">
        <div class="muted small">${esc(r.created_at)}</div>
        <div><b>${esc(r.stakeholder)}</b> — ${esc(r.org)} (${esc(r.country)})</div>
        <div class="muted small">Use case: ${esc(r.use_case)}</div>
        <div class="muted small">Ratings: overall ${r.rating_overall}/5 • usability ${r.rating_usability}/5 • trust ${r.rating_trust}/5</div>
        <div class="muted small">Priorities: ${pr.map(esc).join(", ")}</div>
        <hr />
        <div><b>Risks</b><br/>${esc(r.risks).replace(/\n/g,"<br/>")}</div>
        <div style="margin-top:10px"><b>Comments</b><br/>${esc(r.comments).replace(/\n/g,"<br/>")}</div>
      </div>
    `;
  }).join("");
}

btn.addEventListener("click", load);
load();
