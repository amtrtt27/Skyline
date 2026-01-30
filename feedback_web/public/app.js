const form = document.getElementById("feedbackForm");
const statusEl = document.getElementById("status");
const recoBox = document.getElementById("recoBox");

function getSelectedPriorities() {
  return Array.from(document.querySelectorAll('input[name="priority"]:checked')).map(x => x.value);
}

function buildRecommendations(priorities) {
  const recos = [];

  for (const p of priorities) {
    if (p.includes("AI damage")) {
      recos.push("Add a confidence score + ‘human-in-the-loop’ review step for damage classification and debris estimates.");
      recos.push("Support multiple image sources (satellite/drone/ground) with clear input guidelines.");
    }
    if (p.includes("Geospatial")) {
      recos.push("Make the map the ‘home screen’: layers for damage severity, debris volume, and planned rebuild phases.");
      recos.push("Include an exportable geo-report (PDF + GeoJSON) for agencies/NGOs.");
    }
    if (p.includes("Ontology")) {
      recos.push("Start with a minimal material taxonomy (concrete/steel/wood) + condition tags to prove reuse matching quickly.");
      recos.push("Show a ‘match explanation’ panel: why the system suggests reuse for a given rebuild step.");
    }
    if (p.includes("Procurement")) {
      recos.push("Use transparent scoring (cost, timeline, sustainability, capacity) and show the breakdown to users.");
      recos.push("Include audit logs for bid changes and decision points.");
    }
    if (p.includes("Approval")) {
      recos.push("Implement role-based views (agency/NGO/contractor/community) + a simple workflow timeline.");
      recos.push("Add an approvals checklist template that can be customized per region.");
    }
  }

  // De-duplicate
  return Array.from(new Set(recos));
}

function renderReco(priorities) {
  if (priorities.length === 0) {
    recoBox.innerHTML = `<p class="muted">Pick at least one priority area to get recommendations.</p>`;
    return;
  }
  const recos = buildRecommendations(priorities);
  recoBox.innerHTML = `
    <ol>
      ${recos.map(r => `<li>${r}</li>`).join("")}
    </ol>
  `;
}

// Live update recommendations when checkboxes change
document.querySelectorAll('input[name="priority"]').forEach(cb => {
  cb.addEventListener("change", () => renderReco(getSelectedPriorities()));
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "Submitting…";

  const fd = new FormData(form);
  const priorities = getSelectedPriorities();

  const payload = {
    stakeholder: fd.get("stakeholder"),
    org: fd.get("org"),
    country: fd.get("country"),
    use_case: fd.get("use_case"),
    rating_overall: Number(fd.get("rating_overall")),
    rating_usability: Number(fd.get("rating_usability")),
    rating_trust: Number(fd.get("rating_trust")),
    priority: priorities,
    risks: fd.get("risks"),
    comments: fd.get("comments"),
    recommendations: buildRecommendations(priorities).join("\n"),
    email: fd.get("email")
  };

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error || "Submit failed";
      statusEl.textContent = msg;
      return;
    }

    statusEl.textContent = "Thanks! Your feedback was saved.";
    form.reset();
    renderReco([]);
  } catch {
    statusEl.textContent = "Network error. Try again.";
  }
});
