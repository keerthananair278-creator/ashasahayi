/* ASHA-Sahayi full trilingual UI (Malayalam / English / Hindi).
   Load order in index.html, right before </body>, AFTER the original <script> block:
       <script src="i18n.js"></script>
       <script src="api-patch.js"></script>
   Tap the language badge in the header at any time to switch language (choice is remembered). */

const I18N = {
  en: {
    searchPlaceholder: "e.g. 101, 45C", houseNamePh: "e.g. Anand Bhavan", notesPh: "Type vaccine status, chronic illnesses, etc. here...",
    passKeepPh: "(leave blank to keep current)", ashaPortal: "Field Staff Management Portal",
    houseNoLbl: "House No", edit: "Edit", undo: "Undo", alertTitle: "Urgent Vaccine / Health Alert",
    alertText: "Notice: a vaccination or health follow-up is pending for this household. Please check the members below.",
    familyMembers: "Family Members", relationLbl: "Relation", statusLbl: "Status", notesLbl: "Notes", yrs: "yrs",
    membersWord: "members", alertBadge: "Alert", houseCount: "{n} Houses", aiBtn: "AI Analysis & Summary",
    formNew: "New Household Registration", formUpdate: "Update Household ({no})", memberN: "Member #{n}",
    lblName: "Name *", lblAge: "Age *", lblRelation: "Relation", lblHealth: "Health / Vaccine Status",
    phName: "Full Name", phAge: "Age", phRel: "e.g. Spouse / Child", phHealth: "Normal / Pending",
    taskDone: "Task marked as completed successfully!", taskReset: "Task status reset.",
    houseExists: "House number {no} exists in the system!", houseMissing: "Error: House number ({no}) does not exist in the system.",
    houseDup: "House number {no} already exists", passReq: "Password (at least 4 characters) is required for a new household",
    registerNew: "Register as New House", analysing: "Analysing...",
    aiReview: "AI draft - the ASHA worker must review it before relying on it.",
    aiFallback: "AI unavailable - showing a rule-based template summary.", pendingActions: "Pending actions", houseLbl: "House",
    scanning: "Scanning card...", scanDone: "Card read. Please verify the details (ID number is not stored).",
    recording: "Recording for 8 seconds... speak now", micDenied: "Microphone permission denied",
    micNA: "Microphone not available in this browser", voiceAdded: "Voice text added successfully!",
    enterHouse: "Please enter a house number", enterCreds: "Please enter House Number and Password",
    loginOk: "Login successful!", logoutOk: "Logged out successfully", saved: "Household data saved successfully!",
    reqFields: "House Number and House Name are required!", memberNameReq: "Member #{n} name is required",
    helpMsg: "Help: enter a house number to look up a household, or register a new one as an ASHA worker.",
    needHouse: "Please view or select a household first",
    statusNormal: "Normal", statusPending: "Pending", statusHighRisk: "High-risk pregnancy - refer to PHC immediately",
    statusVerify: "Verify records", more: "more",
    flagOverdue: "overdue - catch-up recommended", flagDueNow: "due now",
    flagVerify: "verify with MCP card (not recorded or conflicting dates)",
    invalidLogin: "Invalid House Number or Password", loginRequired: "Please log in again",
    ashaOnly: "ASHA worker access only", ownOnly: "You can only view your own household", requestFailed: "Request failed",
    switchLang: "Tap to change language",
    reportTitle: "ASHA-Sahayi Health Report", reportHouseNo: "House No", reportHouseName: "House Name",
    reportAlert: "Vaccine Alert Active", yes: "Yes", no: "No", reportNotes: "Notes", reportDate: "Date",
    downloaded: "Summary report downloaded successfully!",
  },
  ml: {
    searchPlaceholder: "ഉദാ: 101, 45C", houseNamePh: "ഉദാ: ആനന്ദ ഭവൻ",
    notesPh: "വാക്സിൻ സ്റ്റാറ്റസ്, വിട്ടുമാറാത്ത രോഗങ്ങൾ തുടങ്ങിയ വിവരങ്ങൾ ഇവിടെ ടൈപ്പ് ചെയ്യാം...",
    passKeepPh: "(നിലവിലുള്ളത് നിലനിർത്താൻ ഒഴിച്ചിടുക)", ashaPortal: "ഫീൽഡ് മാനേജ്മെന്റ് പോർട്ടൽ",
    houseNoLbl: "വീട്ടുനമ്പർ", edit: "തിരുത്തുക", undo: "പഴയപടിയാക്കുക", alertTitle: "അടിയന്തര വാക്സിൻ / ആരോഗ്യ മുന്നറിയിപ്പ്",
    alertText: "ശ്രദ്ധിക്കുക: ഈ വീട്ടിൽ ഒരു വാക്സിനേഷൻ അല്ലെങ്കിൽ ആരോഗ്യ തുടർനടപടി ബാക്കിയുണ്ട്. താഴെയുള്ള അംഗങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കുക.",
    familyMembers: "കുടുംബാംഗങ്ങൾ", relationLbl: "ബന്ധം", statusLbl: "സ്ഥിതി", notesLbl: "കുറിപ്പുകൾ", yrs: "വയസ്സ്",
    membersWord: "അംഗങ്ങൾ", alertBadge: "മുന്നറിയിപ്പ്", houseCount: "{n} വീടുകൾ", aiBtn: "എഐ വിശകലനം & സംഗ്രഹം",
    formNew: "പുതിയ വീട് രജിസ്ട്രേഷൻ", formUpdate: "വീടിന്റെ വിവരങ്ങൾ പുതുക്കുക ({no})", memberN: "അംഗം #{n}",
    lblName: "പേര് *", lblAge: "വയസ്സ് *", lblRelation: "ബന്ധം", lblHealth: "ആരോഗ്യ / വാക്സിൻ സ്ഥിതി",
    phName: "മുഴുവൻ പേര്", phAge: "വയസ്സ്", phRel: "ഉദാ: ഭാര്യ / കുട്ടി", phHealth: "സാധാരണ / ബാക്കി",
    taskDone: "ടാസ്ക് പൂർത്തിയായതായി രേഖപ്പെടുത്തി!", taskReset: "ടാസ്ക് നില പുനഃസജ്ജമാക്കി.",
    houseExists: "വീട്ടുനമ്പർ {no} സിസ്റ്റത്തിൽ ഉണ്ട്!", houseMissing: "പിശക്: വീട്ടുനമ്പർ ({no}) സിസ്റ്റത്തിൽ ഇല്ല.",
    houseDup: "വീട്ടുനമ്പർ {no} ഇതിനകം നിലവിലുണ്ട്", passReq: "പുതിയ വീടിന് പാസ്‌വേഡ് (കുറഞ്ഞത് 4 അക്ഷരം) ആവശ്യമാണ്",
    registerNew: "പുതിയ വീടായി രജിസ്റ്റർ ചെയ്യുക", analysing: "വിശകലനം ചെയ്യുന്നു...",
    aiReview: "എഐ തയ്യാറാക്കിയ കരട് - ആശാ വർക്കർ പരിശോധിച്ച ശേഷം മാത്രം ആശ്രയിക്കുക.",
    aiFallback: "എഐ ലഭ്യമല്ല - നിയമാധിഷ്ഠിത ടെംപ്ലേറ്റ് സംഗ്രഹമാണ് കാണിക്കുന്നത്.", pendingActions: "ബാക്കിയുള്ള നടപടികൾ", houseLbl: "വീട്",
    scanning: "കാർഡ് സ്കാൻ ചെയ്യുന്നു...", scanDone: "കാർഡ് വായിച്ചു. വിവരങ്ങൾ ശരിയാണോ എന്ന് പരിശോധിക്കുക (ഐഡി നമ്പർ സൂക്ഷിക്കുന്നില്ല).",
    recording: "8 സെക്കൻഡ് റെക്കോർഡ് ചെയ്യുന്നു... ഇപ്പോൾ സംസാരിക്കുക", micDenied: "മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു",
    micNA: "ഈ ബ്രൗസറിൽ മൈക്രോഫോൺ ലഭ്യമല്ല", voiceAdded: "ശബ്ദത്തിൽ നിന്നുള്ള വാചകം ചേർത്തു!",
    enterHouse: "ദയവായി വീട്ടുനമ്പർ നൽകുക", enterCreds: "ദയവായി വീട്ടുനമ്പറും പാസ്‌വേഡും നൽകുക",
    loginOk: "ലോഗിൻ വിജയകരം!", logoutOk: "വിജയകരമായി ലോഗൗട്ട് ചെയ്തു", saved: "വീടിന്റെ വിവരങ്ങൾ സേവ് ചെയ്തു!",
    reqFields: "വീട്ടുനമ്പറും വീട്ടുപേരും നിർബന്ധമാണ്!", memberNameReq: "അംഗം #{n}-ന്റെ പേര് നിർബന്ധമാണ്",
    helpMsg: "സഹായം: വീട് തിരയാൻ വീട്ടുനമ്പർ നൽകുക, അല്ലെങ്കിൽ ആശാ വർക്കറായി പുതിയ വീട് രജിസ്റ്റർ ചെയ്യുക.",
    needHouse: "ആദ്യം ഒരു വീട് തിരഞ്ഞെടുക്കുക",
    statusNormal: "സാധാരണ", statusPending: "ബാക്കി", statusHighRisk: "ഉയർന്ന അപകടസാധ്യതയുള്ള ഗർഭം - ഉടൻ PHC-യിലേക്ക് റഫർ ചെയ്യുക",
    statusVerify: "രേഖകൾ പരിശോധിക്കുക", more: "കൂടി",
    flagOverdue: "വൈകി - എത്രയും വേഗം എടുക്കാൻ ശുപാർശ", flagDueNow: "ഇപ്പോൾ എടുക്കേണ്ടതാണ്",
    flagVerify: "എംസിപി കാർഡുമായി പരിശോധിക്കുക (രേഖപ്പെടുത്തിയിട്ടില്ല / തീയതികൾ പൊരുത്തപ്പെടുന്നില്ല)",
    invalidLogin: "വീട്ടുനമ്പറോ പാസ്‌വേഡോ തെറ്റാണ്", loginRequired: "ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക",
    ashaOnly: "ആശാ വർക്കർക്ക് മാത്രം", ownOnly: "നിങ്ങളുടെ സ്വന്തം വീട് മാത്രമേ കാണാനാകൂ", requestFailed: "അഭ്യർത്ഥന പരാജയപ്പെട്ടു",
    switchLang: "ഭാഷ മാറ്റാൻ തൊടുക",
    reportTitle: "ആശാ-സഹായി ആരോഗ്യ റിപ്പോർട്ട്", reportHouseNo: "വീട്ടുനമ്പർ", reportHouseName: "വീട്ടുപേര്",
    reportAlert: "വാക്സിൻ മുന്നറിയിപ്പ് സജീവം", yes: "അതെ", no: "ഇല്ല", reportNotes: "കുറിപ്പുകൾ", reportDate: "തീയതി",
    downloaded: "സംഗ്രഹ റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്തു!",
  },
  hi: {
    searchPlaceholder: "उदा: 101, 45C", houseNamePh: "उदा: आनंद भवन", notesPh: "वैक्सीन स्थिति, पुरानी बीमारियाँ आदि यहाँ लिखें...",
    passKeepPh: "(मौजूदा रखने के लिए खाली छोड़ें)", ashaPortal: "फ़ील्ड प्रबंधन पोर्टल",
    houseNoLbl: "हाउस नंबर", edit: "संपादित करें", undo: "पूर्ववत करें", alertTitle: "तत्काल वैक्सीन / स्वास्थ्य अलर्ट",
    alertText: "ध्यान दें: इस घर में टीकाकरण या स्वास्थ्य फॉलो-अप बाकी है। कृपया नीचे सदस्यों का विवरण देखें।",
    familyMembers: "परिवार के सदस्य", relationLbl: "संबंध", statusLbl: "स्थिति", notesLbl: "नोट्स", yrs: "वर्ष",
    membersWord: "सदस्य", alertBadge: "अलर्ट", houseCount: "{n} घर", aiBtn: "एआई विश्लेषण और सारांश",
    formNew: "नया घर पंजीकरण", formUpdate: "घर का विवरण अपडेट करें ({no})", memberN: "सदस्य #{n}",
    lblName: "नाम *", lblAge: "आयु *", lblRelation: "संबंध", lblHealth: "स्वास्थ्य / वैक्सीन स्थिति",
    phName: "पूरा नाम", phAge: "आयु", phRel: "उदा: पत्नी / बच्चा", phHealth: "सामान्य / बाकी",
    taskDone: "कार्य पूर्ण के रूप में दर्ज किया गया!", taskReset: "कार्य की स्थिति रीसेट की गई।",
    houseExists: "हाउस नंबर {no} सिस्टम में मौजूद है!", houseMissing: "त्रुटि: हाउस नंबर ({no}) सिस्टम में मौजूद नहीं है।",
    houseDup: "हाउस नंबर {no} पहले से मौजूद है", passReq: "नए घर के लिए पासवर्ड (कम से कम 4 अक्षर) आवश्यक है",
    registerNew: "नए घर के रूप में पंजीकृत करें", analysing: "विश्लेषण हो रहा है...",
    aiReview: "एआई द्वारा तैयार मसौदा - उपयोग से पहले आशा वर्कर इसकी जाँच करें।",
    aiFallback: "एआई उपलब्ध नहीं - नियम-आधारित टेम्पलेट सारांश दिखाया जा रहा है।", pendingActions: "बाकी कार्य", houseLbl: "घर",
    scanning: "कार्ड स्कैन हो रहा है...", scanDone: "कार्ड पढ़ लिया गया। कृपया विवरण जाँच लें (आईडी नंबर सहेजा नहीं जाता)।",
    recording: "8 सेकंड रिकॉर्डिंग... अभी बोलें", micDenied: "माइक्रोफ़ोन की अनुमति नहीं मिली",
    micNA: "इस ब्राउज़र में माइक्रोफ़ोन उपलब्ध नहीं है", voiceAdded: "बोले गए शब्द जोड़ दिए गए!",
    enterHouse: "कृपया हाउस नंबर दर्ज करें", enterCreds: "कृपया हाउस नंबर और पासवर्ड दर्ज करें",
    loginOk: "लॉगिन सफल!", logoutOk: "सफलतापूर्वक लॉग आउट हुए", saved: "घर का विवरण सेव हो गया!",
    reqFields: "हाउस नंबर और घर का नाम आवश्यक हैं!", memberNameReq: "सदस्य #{n} का नाम आवश्यक है",
    helpMsg: "मदद: घर खोजने के लिए हाउस नंबर दर्ज करें, या आशा वर्कर के रूप में नया घर पंजीकृत करें।",
    needHouse: "पहले कोई घर चुनें",
    statusNormal: "सामान्य", statusPending: "बाकी", statusHighRisk: "उच्च जोखिम गर्भावस्था - तुरंत PHC रेफर करें",
    statusVerify: "रिकॉर्ड जाँचें", more: "और",
    flagOverdue: "देर हो चुकी - कैच-अप टीकाकरण सुझाया गया", flagDueNow: "अभी देय है",
    flagVerify: "MCP कार्ड से जाँचें (दर्ज नहीं या तारीखें असंगत)",
    invalidLogin: "हाउस नंबर या पासवर्ड गलत है", loginRequired: "कृपया फिर से लॉगिन करें",
    ashaOnly: "केवल आशा वर्कर के लिए", ownOnly: "आप केवल अपना घर देख सकते हैं", requestFailed: "अनुरोध विफल रहा",
    switchLang: "भाषा बदलने के लिए टैप करें",
    reportTitle: "आशा-सहायक स्वास्थ्य रिपोर्ट", reportHouseNo: "हाउस नंबर", reportHouseName: "घर का नाम",
    reportAlert: "वैक्सीन अलर्ट सक्रिय", yes: "हाँ", no: "नहीं", reportNotes: "नोट्स", reportDate: "तारीख",
    downloaded: "सारांश रिपोर्ट डाउनलोड हो गई!",
  },
};
/*END_DICT*/

// ---------- helpers ----------
const LANG_NAMES = { ml: "മലയാളം", en: "English", hi: "हिंदी" };

function tr(key, vars) {
  const d = I18N[sessionLang] || I18N.en;
  let s = d[key] ?? I18N.en[key] ?? key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

// Backend status text is English; translate its fixed phrases (member-typed notes stay as typed).
function trStatus(s) {
  return String(s ?? "")
    .replace(/^Normal$/, tr("statusNormal"))
    .replace(/Pending:/g, tr("statusPending") + ":")
    .replace(/High-risk pregnancy - refer to PHC/g, tr("statusHighRisk"))
    .replace(/Verify records:/g, tr("statusVerify") + ":")
    .replace(/\+(\d+) more/g, (_, n) => "+" + n + " " + tr("more"));
}

function trServer(detail) {
  if (typeof detail !== "string") return tr("requestFailed");
  const map = { "Invalid House Number or Password": "invalidLogin", "Login required": "loginRequired",
    "ASHA worker access only": "ashaOnly", "You can only view your own household": "ownOnly" };
  if (map[detail]) return tr(map[detail]);
  let m = detail.match(/^House number (.+) not found$/);
  if (m) return tr("houseMissing", { no: m[1] });
  m = detail.match(/^House number (.+) already exists$/);
  if (m) return tr("houseDup", { no: m[1] });
  if (/password .* required for a new household/i.test(detail)) return tr("passReq");
  return detail;
}

function flagLine(f) {
  const code = ((f.reason || "").match(/^([A-Za-z0-9\-]+)/) || [])[1] || "";
  const who = f.member ? f.member + ": " : "";
  if (f.flag_type === "HIGH_RISK_ANC") return who + tr("statusHighRisk");
  if (f.flag_type === "NEEDS_VERIFICATION") return who + code + " - " + tr("flagVerify");
  return who + code + " - " + (f.priority === "HIGH" ? tr("flagOverdue") : tr("flagDueNow"));
}

// ---------- fonts for Malayalam + Devanagari ----------
(function () {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&display=swap";
  document.head.appendChild(l);
  document.body.style.fontFamily = "'Inter','Noto Sans Malayalam','Noto Sans Devanagari','Manjari',sans-serif";
})();

// ---------- replaced renderers (all user text escaped; all labels translated) ----------
const _esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BAD_STATUS = /Pending:|High-risk|Verify records:|pending|missed|overdue|വാക്സിൻ/i;

function renderHouseDetails(house) {
  activeHouseData = house;
  const card = document.getElementById("house-details-card");
  const members = house.members.map(m => `
    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
      <h5 class="font-bold text-slate-800 text-xs">${_esc(m.name)} (${_esc(m.age ?? "?")} ${tr("yrs")})</h5>
      <p class="text-[11px] text-slate-500">${tr("relationLbl")}: ${_esc(m.relation)} | ${tr("statusLbl")}:
        <span class="${BAD_STATUS.test(m.healthStatus) ? "text-red-600 font-bold" : "text-tealDark font-semibold"}">${_esc(trStatus(m.healthStatus))}</span></p>
    </div>`).join("");

  let alertHtml = "";
  if (house.hasVaccineAlert) {
    const no = _esc(house.houseNo);
    alertHtml = house.taskCompleted
      ? `<div class="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
           <div class="flex items-center space-x-2"><i class="fa-solid fa-circle-check text-emerald-600 text-lg"></i><span>${translations[sessionLang].taskCompletedBadge}</span></div>
           <button onclick="toggleTaskCompletion('${no}')" class="text-[10px] text-slate-600 underline hover:text-slate-800">${tr("undo")}</button></div>`
      : `<div class="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3">
           <div class="flex items-center space-x-2 text-red-700"><i class="fa-solid fa-triangle-exclamation text-lg animate-pulse"></i>
             <h4 class="font-bold text-xs uppercase">${tr("alertTitle")}</h4></div>
           <p class="text-xs text-red-900 leading-relaxed">${tr("alertText")}</p>
           <label class="flex items-center space-x-2.5 cursor-pointer bg-white p-2.5 rounded-lg border border-red-200 shadow-sm hover:bg-red-50 transition">
             <input type="checkbox" onchange="toggleTaskCompletion('${no}')" class="w-4 h-4 text-tealBrand rounded border-slate-300 focus:ring-tealBrand">
             <span class="text-xs font-bold text-red-800">${translations[sessionLang].taskCompletedBtn}</span></label></div>`;
  }
  card.innerHTML = `
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <div><span class="text-[10px] bg-tealLight text-tealDark px-2 py-0.5 rounded font-bold">${tr("houseNoLbl")}: ${_esc(house.houseNo)}</span>
        <h4 class="font-bold text-slate-800 text-sm mt-1">${_esc(house.houseName)}</h4></div>
      ${currentRole === "asha" ? `<button onclick="openEditHousehold('${_esc(house.houseNo)}')" class="px-3 py-1.5 bg-teal-50 border border-tealBrand/30 text-tealBrand hover:bg-tealBrand hover:text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1"><i class="fa-solid fa-pen-to-square"></i><span>${tr("edit")}</span></button>` : ""}
    </div>
    ${alertHtml}
    <div class="space-y-2"><h5 class="text-[11px] font-bold text-slate-500 uppercase">${tr("familyMembers")}</h5>${members}</div>
    <div class="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl"><strong>${tr("notesLbl")}:</strong> ${_esc(house.notes)}</div>
    <div class="pt-2 flex space-x-2"><button onclick="openAiSummary(activeHouseData)" class="flex-1 py-2 bg-tealBrand text-white font-semibold rounded-xl text-xs hover:bg-tealDark transition flex items-center justify-center space-x-1.5"><i class="fa-solid fa-robot"></i><span>${tr("aiBtn")}</span></button></div>`;
}

function generateMemberInputs() {
  const count = parseInt(document.getElementById("reg-member-count").value) || 1;
  const box = document.getElementById("dynamic-members-container");
  let html = "";
  const field = (id, k, ph, type = "text", extra = "") => `<div><label class="block text-[10px] text-slate-600 mb-0.5" data-k="${k}">${tr(k)}</label>
    <input type="${type}" ${extra} id="${id}" data-ph="${ph}" placeholder="${_esc(tr(ph))}" class="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-tealBrand"></div>`;
  for (let i = 0; i < count; i++) {
    html += `<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
      <span class="text-xs font-bold text-tealDark" data-k="memberN" data-n="${i + 1}">${tr("memberN", { n: i + 1 })}</span>
      <div class="grid grid-cols-2 gap-2">${field(`member-name-${i}`, "lblName", "phName")}${field(`member-age-${i}`, "lblAge", "phAge", "number", 'step="0.5"')}</div>
      <div class="grid grid-cols-2 gap-2">${field(`member-rel-${i}`, "lblRelation", "phRel")}${field(`member-health-${i}`, "lblHealth", "phHealth")}</div></div>`;
  }
  box.innerHTML = html;
}

function refreshDynamicLabels() {
  document.querySelectorAll("[data-k]").forEach(el => { el.textContent = tr(el.dataset.k, { n: el.dataset.n }); });
  document.querySelectorAll("[data-ph]").forEach(el => { el.placeholder = tr(el.dataset.ph); });
}

// ---------- wrap original functions ----------
const _applyTranslations = applyTranslations;
applyTranslations = function () {
  _applyTranslations();
  document.getElementById("house-search-input").placeholder = tr("searchPlaceholder");
  document.getElementById("reg-house-name").placeholder = tr("houseNamePh");
  document.getElementById("reg-notes").placeholder = tr("notesPh");
  const badge = document.getElementById("session-lang-badge");
  badge.textContent = LANG_NAMES[sessionLang]; badge.title = tr("switchLang");
  refreshDynamicLabels();
};

const _openNew = openNewHouseRegistrationWithNo;
openNewHouseRegistrationWithNo = function (no = "") {
  _openNew(no);
  document.getElementById("form-mode-title").textContent = tr("formNew");
  document.getElementById("reg-house-pass").placeholder = "1234";
};

function showHelpModal() { showToast(tr("helpMsg"), "info"); }

function navigateNotesTab() {
  if (!activeHouseData) return showToast(tr("needHouse"), "error");
  openAiSummary(activeHouseData);
}

function downloadSummaryReport() {
  const h = activeHouseData;
  if (!h) return;
  const alertOn = h.hasVaccineAlert && !h.taskCompleted;
  const lines = [tr("reportTitle"), `${tr("reportHouseNo")}: ${h.houseNo}`, `${tr("reportHouseName")}: ${h.houseName}`,
    `${tr("reportAlert")}: ${alertOn ? tr("yes") : tr("no")}`, ...(h.flags || []).map(f => "- " + flagLine(f)),
    `${tr("reportNotes")}: ${h.notes}`, `${tr("reportDate")}: ${h.lastUpdated}`];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `ASHA_Report_${h.houseNo}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast(tr("downloaded"), "success");
}

// Fix stray characters in the original dictionaries
translations.hi.aiTitle = "स्वचालित क्लिनिकल एआई विश्लेषण";

// ---------- language switching (badge tap) + persistence ----------
const _setSessionLanguage = setSessionLanguage;
setSessionLanguage = function (lang) {
  try { localStorage.setItem("asha_lang", lang); } catch (e) {}
  _setSessionLanguage(lang);
};

function switchLanguage(lang) {
  sessionLang = lang;
  try { localStorage.setItem("asha_lang", lang); } catch (e) {}
  document.getElementById("html-root").setAttribute("lang", lang);
  applyTranslations();
  const shown = id => !document.getElementById(id).classList.contains("hidden");
  if (shown("view-dashboard")) {
    const t = translations[lang];
    document.getElementById("dashboard-role-badge").textContent = currentRole === "asha" ? t.roleBadgeAsha : t.roleBadgeCitizen;
    document.getElementById("dashboard-user-name").textContent = currentRole === "asha" || !activeHouseData
      ? tr("ashaPortal") : `${tr("houseNoLbl")}: ${activeHouseData.houseNo} (${activeHouseData.houseName})`;
    if (activeHouseData && shown("house-details-card")) renderHouseDetails(activeHouseData);
    if (currentRole === "asha" && typeof renderWardPresetList === "function") renderWardPresetList();
  }
  if (shown("view-ai-summary") && activeHouseData) openAiSummary(activeHouseData);
  if (shown("view-form")) {
    const editing = document.getElementById("reg-house-no").disabled;
    document.getElementById("form-mode-title").textContent = editing
      ? tr("formUpdate", { no: document.getElementById("reg-house-no").value }) : tr("formNew");
  }
}

(function initLanguage() {
  const badge = document.getElementById("session-lang-badge");
  badge.style.cursor = "pointer";
  badge.onclick = () => { const o = ["ml", "en", "hi"]; switchLanguage(o[(o.indexOf(sessionLang) + 1) % 3]); };
  let saved = null;
  try { saved = localStorage.getItem("asha_lang"); } catch (e) {}
  if (saved && I18N[saved]) {   // returning user: skip the language screen
    switchLanguage(saved);
    document.getElementById("view-language").classList.add("hidden");
    document.getElementById("view-role-selection").classList.remove("hidden");
  } else {
    applyTranslations();
  }
})();
