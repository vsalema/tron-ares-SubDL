(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var providerSelect = document.getElementById("subtitleSearchProviderSelect");
    var searchBtn = document.getElementById("subtitleSearchBtn");
    var resultsBox = document.getElementById("subtitleSearchResults");
    var statusBox = document.getElementById("subtitleSearchStatus");

    if (!providerSelect || !searchBtn) return;

    // Ajoute SubDL dans la liste (sans toucher au HTML d'origine)
    if (!providerSelect.querySelector('option[value="subdl"]')) {
      var opt = document.createElement("option");
      opt.value = "subdl";
      opt.textContent = "SubDL (API)";
      providerSelect.appendChild(opt);
    }

    // Mémorise le handler OpenSubtitles existant
    var originalClick = searchBtn.onclick;

    searchBtn.onclick = async function (e) {
      if (providerSelect.value !== "subdl") {
        if (typeof originalClick === "function") {
          return originalClick.call(this, e);
        }
        return;
      }

      e.preventDefault();

      var title = document.getElementById("subtitleSearchTitleInput").value.trim();
      var langs = document.getElementById("subtitleSearchLangInput").value.trim();

      if (!title) {
        statusBox.textContent = "Titre requis pour SubDL";
        return;
      }

      var apiKey = localStorage.getItem("subdlApiKey");
      if (!apiKey) {
        apiKey = prompt("Entre ta clé API SubDL :");
        if (!apiKey) return;
        localStorage.setItem("subdlApiKey", apiKey);
      }

      statusBox.textContent = "Recherche SubDL…";
      resultsBox.innerHTML = "";

      try {
        var url =
          "https://api.subdl.com/api/v1/subtitles" +
          "?api_key=" +
          encodeURIComponent(apiKey) +
          "&film_name=" +
          encodeURIComponent(title) +
          "&languages=" +
          encodeURIComponent(langs);

        var res = await fetch(url);
        var data = await res.json();

        if (!data || !data.subtitles || !data.subtitles.length) {
          statusBox.textContent = "Aucun résultat SubDL.";
          return;
        }

        statusBox.textContent = data.subtitles.length + " résultat(s) trouvés.";

        data.subtitles.forEach(function (sub) {
          var row = document.createElement("div");
          row.className = "subsearch-result-item";

          var info = document.createElement("div");
          info.textContent =
            sub.release_name + " [" + sub.language + "]";

          var btn = document.createElement("button");
          btn.textContent = "Télécharger";
          btn.className = "btn btn-ghost";

          btn.onclick = function () {
            window.open(sub.url, "_blank");
          };

          row.appendChild(info);
          row.appendChild(btn);
          resultsBox.appendChild(row);
        });
      } catch (err) {
        statusBox.textContent = "Erreur SubDL : " + err.message;
      }
    };
  });
})();
