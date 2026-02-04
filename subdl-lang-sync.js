/*
  Ares Media Engine
  Copyright © Salema vitor
  All rights reserved
*/

/* subdl-lang-sync.js
   Objectif: auto-remplir le champ "Langues" selon le provider:
   - OpenSubtitles => fr,en,pt-pt,pt-br
   - SubDL        => FR,EN,PT,BR_PT
   Robuste: fonctionne même si l’overlay est recréé / modifié par tron-ares.js
*/
(function () {
  var OS_LANGS = "fr,en,pt-pt,pt-br";
  var SUBDL_LANGS = "FR,EN,PT,BR_PT";

  function $(id) { return document.getElementById(id); }

  function isOverlayOpen() {
    var ov = $("subtitleSearchOverlay");
    if (!ov) return false;
    return ov.className.indexOf("hidden") === -1;
  }

  function getProvider() {
    var sel = $("subtitleSearchProviderSelect");
    return sel ? sel.value : "";
  }

  function setLangsForProvider(force) {
    var sel = $("subtitleSearchProviderSelect");
    var inp = $("subtitleSearchLangInput");
    if (!sel || !inp) return;

    var provider = sel.value;
    var target = (provider === "subdl") ? SUBDL_LANGS : OS_LANGS;

    // Si force=true => on écrase toujours
    // Sinon => on n’écrase que si l'input est vide OU s'il contient exactement l'autre valeur
    if (force) {
      inp.value = target;
      return;
    }

    var v = (inp.value || "").trim();

    if (v === "") {
      inp.value = target;
      return;
    }

    if (provider === "subdl" && v === OS_LANGS) {
      inp.value = SUBDL_LANGS;
      return;
    }

    if (provider !== "subdl" && v === SUBDL_LANGS) {
      inp.value = OS_LANGS;
      return;
    }
  }

  function ensureSubdlOptionExists() {
    var sel = $("subtitleSearchProviderSelect");
    if (!sel) return;

    // Si SubDL n'est pas encore ajouté, on l’ajoute (OpenSubtitles reste par défaut car 1er option)
    var i, opt;
    for (i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === "subdl") return;
    }
    opt = document.createElement("option");
    opt.value = "subdl";
    opt.text = "SubDL (API)";
    sel.appendChild(opt);
  }

  function attachListenersOnce() {
    if (attachListenersOnce._done) return;
    attachListenersOnce._done = true;

    // 1) Quand on change le provider => on force la valeur correspondante
    document.addEventListener("change", function (e) {
      var t = e.target || e.srcElement;
      if (t && t.id === "subtitleSearchProviderSelect") {
        setLangsForProvider(true);
      }
    }, true);

    // 2) Quand on clique sur le bouton "Sous-titres" (ou quand l’overlay s’ouvre)
    // On ne dépend pas du bouton exact : on surveille l'ouverture de l'overlay via MutationObserver.
    var ov = $("subtitleSearchOverlay");
    if (!ov) return;

    var mo = new MutationObserver(function () {
      // Si l'overlay vient d'être affiché => on synchronise
      if (isOverlayOpen()) {
        ensureSubdlOptionExists();
        setLangsForProvider(false);
        // Petit "re-sync" différé (au cas où tron-ares.js réécrit après)
        setTimeout(function () { setLangsForProvider(false); }, 120);
        setTimeout(function () { setLangsForProvider(false); }, 350);
      }
    });

    mo.observe(ov, { attributes: true, attributeFilter: ["class"] });
  }

  function boot() {
    // Attendre que les éléments existent (tron-ares.js peut construire après)
    var tries = 0;
    var timer = setInterval(function () {
      tries++;

      var sel = $("subtitleSearchProviderSelect");
      var inp = $("subtitleSearchLangInput");
      var ov  = $("subtitleSearchOverlay");

      if (sel && inp && ov) {
        clearInterval(timer);
        ensureSubdlOptionExists();
        attachListenersOnce();
        // Sync initial
        setLangsForProvider(false);
        return;
      }

      // Stop sécurité après ~10s
      if (tries > 80) clearInterval(timer);
    }, 120);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
