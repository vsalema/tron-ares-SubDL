/*
  Ares Media Engine
  Copyright © Salema vitor
  All rights reserved
*/

/* subdl-lang-sync.apikey.v4.js
   - Auto-langues selon provider:
       OpenSubtitles => fr,en,pt-pt,pt-br
       SubDL        => FR,EN,PT,BR_PT
   - Champs API key dans la subsearch-card + bouton "Enregistrer"
       1) OpenSubtitles
       2) SubDL
     Les champs restent visibles; celui du provider non sélectionné est désactivé.
   - Sauvegarde/restaure via localStorage
   - Désactive les prompts de demande de clé (si le code principal en ouvre encore)
   - Checkbox dans l'entête: rend le bouton "Réglages OpenSubtitles" invisible par défaut; coché => visible
*/
(function () {
  var OS_LANGS = "fr,en,pt-pt,pt-br";
  var SUBDL_LANGS = "FR,EN,PT,BR_PT";

  // clés localStorage (compat)
  var LS_OS_KEYS = ["opensubtitlesApiKey", "openSubtitlesApiKey", "tronAresOpenSubtitlesApiKey"];
  var LS_SUBDL_KEYS = ["subdlApiKey", "SubDLApiKey", "tronAresSubdlApiKey", "tronAresSubDLApiKey"];

  function $(id){ return document.getElementById(id); }

  function isOverlayOpen(){
    var ov = $("subtitleSearchOverlay");
    if(!ov) return false;
    return ov.className.indexOf("hidden") === -1;
  }

  function ensureSubdlOptionExists(){
    var sel = $("subtitleSearchProviderSelect");
    if(!sel) return;
    for(var i=0;i<sel.options.length;i++){
      if(sel.options[i].value === "subdl") return;
    }
    var opt = document.createElement("option");
    opt.value = "subdl";
    opt.text = "SubDL (API)";
    sel.appendChild(opt);
  }

  function lsGetAny(keys){
    for(var i=0;i<keys.length;i++){
      try{
        var v = localStorage.getItem(keys[i]);
        if(v && (v+"").trim()) return (v+"").trim();
      }catch(e){}
    }
    return "";
  }

  function lsSetAll(keys, value){
    for(var i=0;i<keys.length;i++){
      try{ localStorage.setItem(keys[i], value); }catch(e){}
    }
  }

  function restoreKeysIfEmpty(){
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    if(osInp && !osInp.value) osInp.value = lsGetAny(LS_OS_KEYS);
    if(subInp && !subInp.value) subInp.value = lsGetAny(LS_SUBDL_KEYS);
  }

  function setLangsForProvider(force){
    var sel = $("subtitleSearchProviderSelect");
    var inp = $("subtitleSearchLangInput");
    if(!sel || !inp) return;

    var target = (sel.value === "subdl") ? SUBDL_LANGS : OS_LANGS;

    if(force){ inp.value = target; return; }

    var v = (inp.value || "").trim();
    if(v === ""){ inp.value = target; return; }
    if(sel.value === "subdl" && v === OS_LANGS){ inp.value = SUBDL_LANGS; return; }
    if(sel.value !== "subdl" && v === SUBDL_LANGS){ inp.value = OS_LANGS; return; }
  }

  function toggleKeyInputsByProvider(){
    var sel = $("subtitleSearchProviderSelect");
    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    if(!sel || !osInp || !subInp) return;

    if(sel.value === "subdl"){
      osInp.disabled = true;
      subInp.disabled = false;
    }else{
      osInp.disabled = false;
      subInp.disabled = true;
    }
  }

  function showSaveStatus(msg){
    var box = $("subtitleApiKeysSaveStatus");
    if(!box) return;
    box.textContent = msg || "";
    if(msg){
      setTimeout(function(){ box.textContent = ""; }, 2000);
    }
  }

  function wireSaveButton(){
    // v7: auto-enregistrement + bouton optionnel
    if(wireSaveButton._done) return;

    var osInp = $("openSubtitlesApiKeyInput");
    var subInp = $("subdlApiKeyInput");
    var btn = $("subtitleApiKeysSaveBtn");

    if(!osInp || !subInp) return;

    wireSaveButton._done = true;

    function doSave(showOk){
      var osVal = (osInp.value || "").trim();
      var subVal = (subInp.value || "").trim();

      if(osVal) lsSetAll(LS_OS_KEYS, osVal);
      if(subVal) lsSetAll(LS_SUBDL_KEYS, subVal);

      if(showOk) showSaveStatus("✅ Enregistré");
    }

    // Auto-save (debounce)
    function debounceSave(){
      if(wireSaveButton._t) clearTimeout(wireSaveButton._t);
      wireSaveButton._t = setTimeout(function(){ doSave(true); }, 450);
    }

    osInp.addEventListener("input", debounceSave);
    subInp.addEventListener("input", debounceSave);

    osInp.addEventListener("blur", function(){ doSave(true); });
    subInp.addEventListener("blur", function(){ doSave(true); });

    osInp.addEventListener("change", function(){ doSave(true); });
    subInp.addEventListener("change", function(){ doSave(true); });

    // Le bouton reste utile si tu veux forcer un save immédiat
    if(btn){
      btn.addEventListener("click", function(){
        doSave(true);
      });
    }
  }

  function disableApiPrompts(){
    if(disableApiPrompts._done) return;
    disableApiPrompts._done = true;

    var originalPrompt = window.prompt;
    window.prompt = function(message, def){
      var msg = (message || "").toString().toLowerCase();

      if(msg.indexOf("subdl") !== -1){
        return lsGetAny(LS_SUBDL_KEYS) || "";
      }
      if(msg.indexOf("opensub") !== -1 || msg.indexOf("open subtitles") !== -1){
        return lsGetAny(LS_OS_KEYS) || "";
      }
      return originalPrompt ? originalPrompt.call(window, message, def) : "";
    };
  }

  
  function syncAll(forceLangs){
    ensureSubdlOptionExists();
    restoreKeysIfEmpty();
    wireSaveButton();
    disableApiPrompts();
    wireOsSettingsToggle();

    setLangsForProvider(!!forceLangs);
    toggleKeyInputsByProvider();

    var cb = $("toggleOsSettingsBtnCheckbox");
    if(cb) setOsSettingsButtonsVisible(!!cb.checked);
  }

  function attachListenersOnce(){
    if(attachListenersOnce._done) return;
    attachListenersOnce._done = true;

    document.addEventListener("change", function(e){
      var t = e.target || e.srcElement;
      if(t && t.id === "subtitleSearchProviderSelect"){
        syncAll(true);
      }
    }, true);

    var ov = $("subtitleSearchOverlay");
    if(!ov) return;

    var mo = new MutationObserver(function(){
      if(isOverlayOpen()){
        syncAll(false);
        setTimeout(function(){ syncAll(false); }, 120);
        setTimeout(function(){ syncAll(false); }, 350);
      }
    });

    mo.observe(ov, { attributes:true, attributeFilter:["class"] });
  }

  function boot(){
    var tries = 0;
    var timer = setInterval(function(){
      tries++;

      var sel = $("subtitleSearchProviderSelect");
      var lang = $("subtitleSearchLangInput");
      var ov = $("subtitleSearchOverlay");
      var osKey = $("openSubtitlesApiKeyInput");
      var subKey = $("subdlApiKeyInput");
      var saveBtn = $("subtitleApiKeysSaveBtn");
      var cb = $("toggleOsSettingsBtnCheckbox");

      if(sel && lang && ov && osKey && subKey && saveBtn && cb){
        clearInterval(timer);
        attachListenersOnce();
        syncAll(false);
        return;
      }
      if(tries > 120) clearInterval(timer);
    }, 120);
  }

  if(document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();