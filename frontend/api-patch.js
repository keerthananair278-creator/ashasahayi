/* ASHA-Sahayi: connects index.html to the FastAPI backend.
   Add this line in index.html right before </body>, AFTER the existing <script> block:
       <script src="api-patch.js"></script>
   Same-named functions below replace the demo (in-memory) versions. */

const API = "";            // same origin (FastAPI serves this page). Use "http://localhost:8000" if opened separately.
let TOKEN = null;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}), ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(trServer(data.detail)); err.status = res.status; throw err; }
  return data;
}

// ---------- login / role ----------
function selectRole(role) {
  currentRole = role;
  if (role === "asha") {
    api("/api/auth/asha", { method: "POST", body: JSON.stringify({}) })
      .then(d => { TOKEN = d.token; loggedInCitizenHouse = null; transitionToDashboard("asha"); })
      .catch(e => showToast(e.message, "error"));
  } else {
    document.getElementById("view-role-selection").classList.add("hidden");
    document.getElementById("view-citizen-login").classList.remove("hidden");
  }
}

async function handleCitizenAuth() {
  const houseNo = document.getElementById("citizen-login-house").value.trim();
  const pass = document.getElementById("citizen-login-pass").value.trim();
  if (!houseNo || !pass) return showToast(tr("enterCreds"), "error");
  try {
    const d = await api("/api/auth/citizen", { method: "POST", body: JSON.stringify({ house_no: houseNo, password: pass }) });
    TOKEN = d.token; loggedInCitizenHouse = houseNo;
    showToast(tr("loginOk"), "success");
    transitionToDashboard("citizen", houseNo);
  } catch (e) { showToast(e.message, "error"); }
}

async function transitionToDashboard(role, houseNo = null) {
  document.getElementById("view-role-selection").classList.add("hidden");
  document.getElementById("view-citizen-login").classList.add("hidden");
  document.getElementById("view-dashboard").classList.remove("hidden");
  const t = translations[sessionLang];
  const badge = document.getElementById("dashboard-role-badge");
  const title = document.getElementById("dashboard-user-name");
  const searchBox = document.getElementById("asha-search-section");
  const wardBox = document.getElementById("asha-ward-list-box");
  try {
    if (role === "asha") {
      badge.textContent = t.roleBadgeAsha;
      title.textContent = tr("ashaPortal");
      searchBox.classList.remove("hidden"); wardBox.classList.remove("hidden");
      await renderWardPresetList();
    } else {
      badge.textContent = t.roleBadgeCitizen;
      searchBox.classList.add("hidden"); wardBox.classList.add("hidden");
      const h = await api("/api/houses/" + encodeURIComponent(houseNo));
      title.textContent = `${tr("houseNoLbl")}: ${h.houseNo} (${h.houseName})`;
      activeHouseData = h;
      renderHouseDetails(h);
      document.getElementById("house-details-card").classList.remove("hidden");
    }
  } catch (e) { showToast(e.message, "error"); }
}

function logout() {
  TOKEN = null; currentRole = null; loggedInCitizenHouse = null; activeHouseData = null;
  ["view-dashboard", "view-form", "view-ai-summary"].forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById("house-details-card").classList.add("hidden");
  document.getElementById("view-role-selection").classList.remove("hidden");
  showToast(tr("logoutOk"), "info");
}

// ---------- ward list + search ----------
async function renderWardPresetList() {
  try {
    const list = await api("/api/houses");
    document.getElementById("ward-preset-list").innerHTML = list.map(h => {
      const badge = h.hasVaccineAlert && !h.taskCompleted ? `<span class="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold ml-1">${tr("alertBadge")}</span>` : "";
      const first = h.members[0] ? esc(trStatus(h.members[0].healthStatus)) : "";
      return `<div data-no="${esc(h.houseNo)}" onclick="document.getElementById('house-search-input').value=this.dataset.no; searchHouse();" class="p-3 bg-slate-50 hover:bg-tealLight/40 border border-slate-200 rounded-xl cursor-pointer transition flex items-center justify-between">
        <div><span class="font-bold text-xs text-tealDark">${esc(h.houseNo)} - ${esc(h.houseName)}</span> ${badge}
        <p class="text-[10px] text-slate-500">${h.members.length} ${tr("membersWord")} | ${first}</p></div>
        <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i></div>`;
    }).join("");
    const cnt = document.querySelector("#asha-ward-list-box > div:first-child > span");
    if (cnt) cnt.textContent = tr("houseCount", { n: list.length });
  } catch (e) { showToast(e.message, "error"); }
}

async function searchHouse() {
  const q = document.getElementById("house-search-input").value.trim();
  const feedback = document.getElementById("search-feedback");
  const card = document.getElementById("house-details-card");
  if (!q) return showToast(tr("enterHouse"), "error");
  feedback.classList.remove("hidden");
  try {
    const h = await api("/api/houses/" + encodeURIComponent(q));
    activeHouseData = h;
    feedback.className = "p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200";
    feedback.innerHTML = `<i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> ${esc(tr("houseExists", { no: q }))}`;
    renderHouseDetails(h);
    card.classList.remove("hidden");
  } catch (e) {
    activeHouseData = null; card.classList.add("hidden");
    feedback.className = "p-3 rounded-xl text-xs font-medium bg-red-50 text-red-800 border border-red-200 flex flex-col space-y-2";
    const notFound = e.status === 404;
    feedback.innerHTML = `<div><i class="fa-solid fa-triangle-exclamation mr-1 text-red-600"></i> ${notFound ? esc(tr("houseMissing", { no: q })) : esc(e.message)}</div>` +
      (notFound ? `<button data-no="${esc(q)}" onclick="openNewHouseRegistrationWithNo(this.dataset.no)" class="mt-1 px-3 py-1.5 bg-tealBrand text-white rounded-lg text-xs font-semibold self-start shadow hover:bg-tealDark transition"><i class="fa-solid fa-plus mr-1"></i> ${tr("registerNew")}</button>` : "");
  }
}

// ---------- task checkbox ----------
async function toggleTaskCompletion(houseNo) {
  const done = !(activeHouseData && activeHouseData.taskCompleted);
  try {
    const h = await api(`/api/houses/${encodeURIComponent(houseNo)}/task`, { method: "POST", body: JSON.stringify({ completed: done }) });
    activeHouseData = h; renderHouseDetails(h);
    showToast(done ? tr("taskDone") : tr("taskReset"), "success");
    if (currentRole === "asha") renderWardPresetList();
  } catch (e) { showToast(e.message, "error"); }
}

// ---------- edit / save ----------
function openEditHousehold(houseNo) {
  const house = activeHouseData;
  if (!house) return;
  document.getElementById("form-mode-title").textContent = tr("formUpdate", { no: houseNo });
  document.getElementById("reg-house-no").value = house.houseNo;
  document.getElementById("reg-house-no").disabled = true;
  document.getElementById("reg-house-name").value = house.houseName;
  document.getElementById("reg-house-pass").value = "";
  document.getElementById("reg-house-pass").placeholder = tr("passKeepPh");
  document.getElementById("reg-member-count").value = house.members.length;
  document.getElementById("reg-notes").value = house.notes;
  generateMemberInputs();
  house.members.forEach((m, i) => {
    document.getElementById(`member-name-${i}`).value = m.name;
    document.getElementById(`member-age-${i}`).value = m.age ?? "";
    document.getElementById(`member-rel-${i}`).value = m.relation;
    document.getElementById(`member-health-${i}`).value = m.healthNote ?? "";
  });
  document.getElementById("view-dashboard").classList.add("hidden");
  document.getElementById("view-form").classList.remove("hidden");
}

async function saveHouseholdEntry() {
  const houseNo = document.getElementById("reg-house-no").value.trim();
  const houseName = document.getElementById("reg-house-name").value.trim();
  const password = document.getElementById("reg-house-pass").value.trim();
  const notes = document.getElementById("reg-notes").value.trim();
  const count = parseInt(document.getElementById("reg-member-count").value) || 1;
  if (!houseNo || !houseName) return showToast(tr("reqFields"), "error");
  const members = [];
  for (let i = 0; i < count; i++) {
    const name = document.getElementById(`member-name-${i}`).value.trim();
    if (!name) return showToast(tr("memberNameReq", { n: i + 1 }), "error");
    const age = parseFloat(document.getElementById(`member-age-${i}`).value);
    members.push({
      name, age: isNaN(age) ? null : age,
      relation: document.getElementById(`member-rel-${i}`).value.trim() || null,
      health_status: document.getElementById(`member-health-${i}`).value.trim() || null,
    });
  }
  const editing = document.getElementById("reg-house-no").disabled;
  try {
    await api(editing ? `/api/houses/${encodeURIComponent(houseNo)}` : "/api/houses", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify({ house_no: houseNo, house_name: houseName, password: password || null, notes, members }),
    });
    showToast(tr("saved"), "success");
    document.getElementById("house-search-input").value = houseNo;
    document.getElementById("reg-house-no").disabled = false;
    backToDashboard(); searchHouse(); renderWardPresetList();
  } catch (e) { showToast(e.message, "error"); }
}

// ---------- AI summary ----------
async function openAiSummary(house) {
  activeHouseData = house;
  document.getElementById("view-dashboard").classList.add("hidden");
  document.getElementById("view-form").classList.add("hidden");
  document.getElementById("view-ai-summary").classList.remove("hidden");
  const box = document.getElementById("ai-report-content");
  box.innerHTML = `<p>${tr("analysing")}</p>`;
  try {
    const d = await api(`/api/houses/${encodeURIComponent(house.houseNo)}/summary?lang=${sessionLang}`);
    const s = d.summary;
    const text = sessionLang === "ml" ? s.summary_ml : sessionLang === "hi" ? (s.summary_hi || s.summary_en) : s.summary_en;
    const actions = (house.flags || []).map(f => "• " + esc(flagLine(f))).join("<br>");
    box.innerHTML = `<p><strong>${tr("houseLbl")}:</strong> ${esc(house.houseNo)} - ${esc(house.houseName)}</p>
      <p class="mt-1">${esc(text)}</p>
      ${actions ? `<p class="mt-1"><strong>${tr("pendingActions")}:</strong><br>${actions}</p>` : ""}
      ${d.is_fallback ? `<p class="text-[10px] text-amber-200 mt-2">${tr("aiFallback")}</p>` : ""}
      <p class="text-[10px] text-teal-200 mt-2">${tr("aiReview")}</p>`;
  } catch (e) { box.innerHTML = `<p>${esc(e.message)}</p>`; }
}

// ---------- Aadhaar scan (photo -> name/age only; ID number is never returned) ----------
function triggerAadhaarScan() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = "image/*"; input.capture = "environment";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    showToast(tr("scanning"), "info");
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch(API + "/api/aadhaar/scan", { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Scan failed");
      const count = parseInt(document.getElementById("reg-member-count").value) || 1;
      let slot = 0;
      for (let i = 0; i < count; i++) { if (!document.getElementById(`member-name-${i}`).value.trim()) { slot = i; break; } }
      document.getElementById(`member-name-${slot}`).value = d.name || "";
      if (d.age != null) document.getElementById(`member-age-${slot}`).value = d.age;
      showToast(tr("scanDone"), "success");
    } catch (e) { showToast(e.message, "error"); }
  };
  input.click();
}

// ---------- Voice notes (Sarvam speech-to-text, records 8 seconds) ----------
async function startVoiceToText() {
  if (!navigator.mediaDevices || !window.MediaRecorder) return showToast(tr("micNA"), "error");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream), chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const fd = new FormData();
      fd.append("file", new Blob(chunks, { type: rec.mimeType }), "note.webm");
      fd.append("lang", sessionLang);
      try {
        const res = await fetch(API + "/api/voice/transcribe", { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: fd });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || "Transcription failed");
        const area = document.getElementById("reg-notes");
        area.value += (area.value ? " " : "") + d.text;
        showToast(tr("voiceAdded"), "success");
      } catch (e) { showToast(e.message, "error"); }
    };
    rec.start();
    showToast(tr("recording"), "info");
    setTimeout(() => rec.state === "recording" && rec.stop(), 8000);
  } catch { showToast(tr("micDenied"), "error"); }
}
