// BACKEND URL
const BACKEND_API =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3001/api/check"
    : "/api/check";

const MAX_DRUGS = 5;

const drugInputsContainer = document.getElementById("drugInputs");
const addDrugBtn = document.getElementById("addDrugBtn");
const checkBtn = document.getElementById("checkBtn");
const resultBody = document.getElementById("resultBody");
const overallRiskBadge = document.getElementById("overallRiskBadge");
const errorBox = document.getElementById("error");

const clearAllBtn = document.getElementById("clearAllBtn");
const printBtn = document.getElementById("printBtn");
const exportBtn = document.getElementById("exportBtn");
const uploadMedList = document.getElementById("uploadMedList");

const sidebar = document.getElementById("historyPanel");
const sidebarToggle = document.getElementById("sidebarToggle");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyList = document.getElementById("historyList");

let drugsList = []; // for autocomplete if you have one

// ============ DOM helpers ============
function createDrugRow(index, value = "") {
  const row = document.createElement("div");
  row.className = "drug-row";

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = `Drug ${index + 1}`;
  row.appendChild(label);

  const input = document.createElement("input");
  input.className = "input";
  input.placeholder = "e.g. Paracetamol";
  input.value = value;
  row.appendChild(input);

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-ghost";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => {
    if (drugInputsContainer.children.length > 1) {
      row.remove();
      updateLabels();
      saveDrugsToStorage();
    }
  };
  row.appendChild(removeBtn);

  return row;
}

function updateLabels() {
  [...drugInputsContainer.children].forEach((row, i) => {
    const lbl = row.querySelector(".label");
    if (lbl) lbl.textContent = `Drug ${i + 1}`;
  });
}

function addDrugField(value = "") {
  if (drugInputsContainer.children.length >= MAX_DRUGS) {
    return showError(`Max ${MAX_DRUGS} drugs allowed`);
  }
  const row = createDrugRow(drugInputsContainer.children.length, value);
  drugInputsContainer.appendChild(row);
  updateLabels();
  saveDrugsToStorage();
}

function getDrugsFromUI() {
  return [...document.querySelectorAll(".input")]
    .map((i) => i.value.trim())
    .filter(Boolean);
}

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg || "";
  errorBox.classList.toggle("hidden", !msg);
}

function setLoading(state) {
  checkBtn.disabled = state;
  addDrugBtn.disabled = state;
  document.querySelectorAll(".input").forEach((i) => (i.disabled = state));
  if (state) {
    resultBody.innerHTML = `<p class="secondary-text">Checking interactions…</p>`;
  }
}

// ============ BACKEND CALL ============
async function callBackend(drugs) {
  const res = await fetch(BACKEND_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drugs }),
  });
  // return both response and parsed JSON/text for better error messages
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave json null
  }
  return { ok: res.ok, status: res.status, json, text };
}

// ============ RENDER ============
function renderResults(data, drugs) {
  overallRiskBadge.textContent = `Overall: ${data.overall_risk || "unknown"}`;
  overallRiskBadge.classList.remove("hidden");

  resultBody.innerHTML = "";

  const pills = document.createElement("div");
  pills.className = "pill-list";
  drugs.forEach((d) => {
    const el = document.createElement("span");
    el.className = "pill";
    el.textContent = d;
    pills.appendChild(el);
  });
  resultBody.appendChild(pills);

  const summary = document.createElement("p");
  summary.className = "secondary-text";
  summary.textContent = data.summary || "";
  resultBody.appendChild(summary);

  const list = document.createElement("div");
  list.className = "interaction-list";

  (data.interactions || []).forEach((intx) => {
    const item = document.createElement("div");
    item.className = "interaction-item";
    item.innerHTML = `
      <div class="interaction-drugs">${intx.drug1} + ${intx.drug2}</div>
      <div class="interaction-desc">${intx.description}</div>
    `;
    list.appendChild(item);
  });

  resultBody.appendChild(list);
}

// ============ HISTORY SYSTEM ============
function saveHistory(drugs, results) {
  const entry = {
    id: Date.now(),
    title: drugs.join(", "),
    drugs,
    results,
    timestamp: new Date().toLocaleString(),
  };

  const history = JSON.parse(localStorage.getItem("ddi_history") || "[]");
  history.unshift(entry);
  localStorage.setItem("ddi_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const items = JSON.parse(localStorage.getItem("ddi_history") || "[]");
  historyList.innerHTML = "";
  items.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = `${e.title}`;
    li.onclick = () => restoreHistory(e);
    historyList.appendChild(li);
  });
}

function restoreHistory(entry) {
  drugInputsContainer.innerHTML = "";
  entry.drugs.forEach((d) => addDrugField(d));
  renderResults(entry.results, entry.drugs);
}

// ============ UI HOOKS ============
sidebarToggle && (sidebarToggle.onclick = () => {
  sidebar.classList.toggle("open");
  document.getElementById("app").classList.toggle("shifted");
});

clearHistoryBtn && (clearHistoryBtn.onclick = () => {
  localStorage.removeItem("ddi_history");
  renderHistory();
});

addDrugBtn && (addDrugBtn.onclick = () => addDrugField());

clearAllBtn && (clearAllBtn.onclick = () => {
  drugInputsContainer.innerHTML = "";
  addDrugField();
  addDrugField();
  saveDrugsToStorage();
});

checkBtn && (checkBtn.onclick = async () => {
  showError("");
  const drugs = getDrugsFromUI();
  if (drugs.length < 2) {
    return showError("Enter at least two drugs.");
  }

  setLoading(true);

  try {
    const result = await callBackend(drugs);

    if (!result.ok) {
      // Prefer server JSON error if available
      if (result.json && result.json.error) {
        showError(result.json.error + (result.json.invalid_items ? `: ${result.json.invalid_items.join(", ")}` : ""));
      } else if (result.text) {
        showError(`Backend error ${result.status}: ${result.text}`);
      } else {
        showError(`Backend error ${result.status}`);
      }
      return;
    }

    const data = result.json;
    renderResults(data, drugs);
    saveHistory(drugs, data);

  } catch (err) {
    console.error("Frontend error:", err);
    showError("Failed to contact backend.");
  } finally {
    setLoading(false);
    saveDrugsToStorage();
  }
});

// export & print
printBtn && (printBtn.onclick = () => window.print());

exportBtn && (exportBtn.onclick = () => {
  const blob = new Blob(
    [
      JSON.stringify(
        { drugs: getDrugsFromUI(), result: resultBody.textContent },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ddi_summary.json";
  a.click();
  URL.revokeObjectURL(url);
});

// upload
uploadMedList && (uploadMedList.onchange = (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, MAX_DRUGS);

    drugInputsContainer.innerHTML = "";
    lines.forEach((l) => addDrugField(l));
    saveDrugsToStorage();
  };
  reader.readAsText(file);
});

// save inputs
document.addEventListener("input", (ev) => {
  if (ev.target.matches(".input")) saveDrugsToStorage();
});

// local storage
function saveDrugsToStorage() {
  localStorage.setItem("ddi_drugs", JSON.stringify(getDrugsFromUI()));
}
function loadDrugsFromStorage() {
  const saved = JSON.parse(localStorage.getItem("ddi_drugs") || "[]");
  if (saved.length) saved.forEach((s) => addDrugField(s));
  else {
    addDrugField();
    addDrugField();
  }
}

// init
(async function init() {
  // try to fetch local drugs.json for autocomplete (optional)
  try {
    const r = await fetch("drugs.json");
    if (r.ok) {
      drugsList = await r.json();
    }
  } catch (e) { /* ignore */ }

  loadDrugsFromStorage();
  renderHistory();
})();
