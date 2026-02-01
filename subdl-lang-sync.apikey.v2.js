/* subdl-lang-sync.apikey.v2.js
   - Langues auto selon provider:
       OpenSubtitles => fr,en,pt-pt,pt-br
       SubDL        => FR,EN,PT,BR_PT
   - Deux champs API key dans la subsearch-card (toujours visibles):
       1) OpenSubtitles
       2) SubDL
     Le champ non utilisé est désactivé automatiquement.
   - Sauvegarde/restaure les clés via localStorage.
*/
(function () {
  var OS_LANGS = "fr,en,pt-pt,pt-br";
  var SUBDL_LANGS = "FR,EN,PT,BR_PT";

  var LS_OS_KEY = "opensubtitlesApiKey";
  var LS_SUBDL_KEY = "subdlApiKey";

  function $(id) { return document.getElementById(id); }

  function isOverlayOpen() {
    var ov = $("subtitleSearchOverlay");
    if (!ov) return false;
    return ov.className.indexOf("hidden") === -1;
  }

  function ensureSubdlOptionExists() {
    var sel = $("subtitleSearchProviderSelect");
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === "subdl") return;
    }
    var opt = document.createElement("option");
    opt.value = "subdl";
    opt.text = "SubDL (API)";
    sel.appendChild(opt);
  }

  function restoreKeysIfEmpty() {
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    try {
      if (osInp && !osInp.value) osInp.value = localStorage.getItem(LS_OS_KEY) || "";
      if (subInp && !subInp.value) subInp.value = localStorage.getItem(LS_SUBDL_KEY) || "";
    } catch(e) {}
  }

  function wireKeyPersistence() {
    if (wireKeyPersistence._done) return;
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    if (!osInp || !subInp) return;

    wireKeyPersistence._done = true;

    function saveOs() { try { localStorage.setItem(LS_OS_KEY, (osInp.value || "").trim()); } catch(e) {} }
    function saveSub() { try { localStorage.setItem(LS_SUBDL_KEY, (subInp.value || "").trim()); } catch(e) {} }

    function debounceSave(fn, key) {
      if (debounceSave._t && debounceSave._k === key) clearTimeout(debounceSave._t);
      debounceSave._k = key;
      debounceSave._t = setTimeout(fn, 350);
    }

    osInp.addEventListener("change", saveOs);
    osInp.addEventListener("blur", saveOs);
    osInp.addEventListener("input", function(){ debounceSave(saveOs, "os"); });

    subInp.addEventListener("change", saveSub);
    subInp.addEventListener("blur", saveSub);
    subInp.addEventListener("input", function(){ debounceSave(saveSub, "sub"); });
  }

  function setLangsForProvider(force) {
    var sel = $("subtitleSearchProviderSelect");
    var inp = $("subtitleSearchLangInput");
    if (!sel || !inp) return;

    var provider = sel.value;
    var target = (provider === "subdl") ? SUBDL_LANGS : OS_LANGS;

    if (force) { inp.value = target; return; }

    var v = (inp.value || "").trim();
    if (v === "") { inp.value = target; return; }
    if (provider === "subdl" && v === OS_LANGS) { inp.value = SUBDL_LANGS; return; }
    if (provider !== "subdl" && v === SUBDL_LANGS) { inp.value = OS_LANGS; return; }
  }

  function toggleKeyInputsByProvider() {
    var sel = $("subtitleSearchProviderSelect");
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    if (!sel || !osInp || !subInp) return;

    if (sel.value === "subdl") {
      osInp.disabled = true;
      subInp.disabled = false;
    } else {
      osInp.disabled = false;
      subInp.disabled = true;
    }
  }

  function syncAll(forceLangs) {
    ensureSubdlOptionExists();
    restoreKeysIfEmpty();
    wireKeyPersistence();
    setLangsForProvider(!!forceLangs);
    toggleKeyInputsByProvider();
  }

  function attachListenersOnce() {
    if (attachListenersOnce._done) return;
    attachListenersOnce._done = true;

    document.addEventListener("change", function (e) {
      var t = e.target || e.srcElement;
      if (t && t.id === "subtitleSearchProviderSelect") {
        syncAll(true);
      }
    }, true);

    var ov = $("subtitleSearchOverlay");
    if (!ov) return;

    var mo = new MutationObserver(function () {
      if (isOverlayOpen()) {
        syncAll(false);
        // re-sync différé si le JS principal réécrit ensuite
        setTimeout(function(){ syncAll(false); }, 120);
        setTimeout(function(){ syncAll(false); }, 350);
      }
    });

    mo.observe(ov, { attributes: true, attributeFilter: ["class"] });
  }

  function boot() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;

      var sel = $("subtitleSearchProviderSelect");
      var lang = $("subtitleSearchLangInput");
      var ov  = $("subtitleSearchOverlay");
      var osKey = $("openSubtitlesApiKeyInput");
      var subKey = $("subdlApiKeyInput");

      if (sel && lang && ov && osKey && subKey) {
        clearInterval(timer);
        attachListenersOnce();
        syncAll(false);
        return;
      }

      if (tries > 80) clearInterval(timer);
    }, 120);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();