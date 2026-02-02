/* subdl-lang-sync.apikey.v3.js
   - Auto-langues selon provider:
       OpenSubtitles => fr,en,pt-pt,pt-br
       SubDL        => FR,EN,PT,BR_PT
   - Deux champs API key dans la subsearch-card + bouton "Enregistrer"
       1) OpenSubtitles
       2) SubDL
   - Stockage localStorage (plusieurs clés pour compatibilité)
   - Désactive les popups prompt() pour les clés: on utilise les champs + storage.
*/
(function () {
  var OS_LANGS = "fr,en,pt-pt,pt-br";
  var SUBDL_LANGS = "FR,EN,PT,BR_PT";

  // clés localStorage (on écrit dans plusieurs pour compatibilité)
  var LS_OS_KEYS = ["opensubtitlesApiKey", "openSubtitlesApiKey", "tronAresOpenSubtitlesApiKey"];
  var LS_SUBDL_KEYS = ["subdlApiKey", "SubDLApiKey", "tronAresSubdlApiKey", "tronAresSubDLApiKey"];

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

  function lsGetAny(keys) {
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = localStorage.getItem(keys[i]);
        if (v && (v + "").trim()) return (v + "").trim();
      } catch (e) {}
    }
    return "";
  }

  function lsSetAll(keys, value) {
    for (var i = 0; i < keys.length; i++) {
      try { localStorage.setItem(keys[i], value); } catch (e) {}
    }
  }

  function restoreFieldsIfEmpty() {
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    if (osInp && !osInp.value) osInp.value = lsGetAny(LS_OS_KEYS);
    if (subInp && !subInp.value) subInp.value = lsGetAny(LS_SUBDL_KEYS);
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
    // optionnel: on désactive le champ non utilisé
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

  function showSaveStatus(msg) {
    var box = $("subtitleApiKeysSaveStatus");
    if (!box) return;
    box.textContent = msg || "";
    if (msg) {
      setTimeout(function () { box.textContent = ""; }, 2000);
    }
  }

  function wireSaveButton() {
    if (wireSaveButton._done) return;
    var btn = $("subtitleApiKeysSaveBtn");
    if (!btn) return;
    wireSaveButton._done = true;

    btn.addEventListener("click", function () {
      var osInp = $("openSubtitlesApiKeyInput");
      var subInp = $("subdlApiKeyInput");
      var osVal = osInp ? (osInp.value || "").trim() : "";
      var subVal = subInp ? (subInp.value || "").trim() : "";

      if (osVal) lsSetAll(LS_OS_KEYS, osVal);
      if (subVal) lsSetAll(LS_SUBDL_KEYS, subVal);

      showSaveStatus("✅ Enregistré");
    });
  }

  function disableApiPrompts() {
    if (disableApiPrompts._done) return;
    disableApiPrompts._done = true;

    var originalPrompt = window.prompt;
    window.prompt = function (message, def) {
      var msg = (message || "").toString().toLowerCase();

      // si le code appelle un prompt pour demander la clé, on renvoie celle du storage
      if (msg.indexOf("subdl") !== -1) {
        return lsGetAny(LS_SUBDL_KEYS) || "";
      }
      if (msg.indexOf("opensub") !== -1 || msg.indexOf("open subtitles") !== -1) {
        return lsGetAny(LS_OS_KEYS) || "";
      }
      return originalPrompt ? originalPrompt.call(window, message, def) : "";
    };
  }

  function syncAll(forceLangs) {
    ensureSubdlOptionExists();
    restoreFieldsIfEmpty();
    wireSaveButton();
    disableApiPrompts();
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
      var saveBtn = $("subtitleApiKeysSaveBtn");

      if (sel && lang && ov && osKey && subKey && saveBtn) {
        clearInterval(timer);
        attachListenersOnce();
        syncAll(false);
        return;
      }

      if (tries > 120) clearInterval(timer);
    }, 120);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();