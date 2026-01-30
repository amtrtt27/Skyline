const form = document.getElementById("feedbackForm");
const statusEl = document.getElementById("status");

/* ---------- OTHER TOGGLE LOGIC ---------- */

const priorityOther = document.getElementById("priorityOther");
const otherWrap = document.getElementById("otherWrap");
const otherText = document.getElementById("otherText");

function syncOtherVisibility() {
  const checked = !!priorityOther?.checked;
  if (otherWrap) otherWrap.style.display = checked ? "block" : "none";
  if (!checked && otherText) otherText.value = "";
}

priorityOther?.addEventListener("change", syncOtherVisibility);
syncOtherVisibility();

/* ---------- PRIORITY COLLECTION ---------- */

function getSelectedPriorities() {
  const selected = Array.from(
    document.querySelectorAll('input[name="priority"]:checked')
  ).map(x => x.value);

  // Attach user-written text if "Other" is checked
  if (selected.includes("Other")) {
    const text = (otherText?.value || "").trim();
    if (text) selected.push(`Other: ${text}`);
  }

  return selected;
}

/* ---------- FORM SUBMISSION ---------- */

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
    email: fd.get("email")
  };

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const msg =
        (await res.json().catch(() => null))?.error || "Submit failed";
      statusEl.textContent = msg;
      return;
    }

    statusEl.textContent = "Thanks! Your feedback was saved.";
    form.reset();
    syncOtherVisibility();
  } catch {
    statusEl.textContent = "Network error. Try again.";
  }
});
