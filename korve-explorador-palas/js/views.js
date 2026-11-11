/* KORVE Explorador — vistas. Cada vista devuelve HTML y, si hace falta, una función mount(). */
(function () {
  var DATA = window.KORVE_DATA, K = window.K, esc = K.esc;
  var V = (window.KViews = {});

  function evLegendInline() {
    return Object.keys(DATA.evidence).map(function (k) { return K.ev(k); }).join(" ");
  }
  function list(items) { return items && items.length ? '<ul class="clean">' + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : ""; }
  function propBadge() { return K.ev("PR"); }

  /* ---------- Fichas reutilizables ---------- */
  V.refCard = function (r, opts) {
    opts = opts || {};
    var b = K.brandById[r.brandId];
    return '<div class="card ref-card" data-ref="' + esc(r.id) + '">' +
      "<h3>" + esc(r.name) + "</h3>" +
      '<div class="small muted">Temporada: ' + (r.season ? esc(r.season) + " (nombre comercial)" : K.missing("NP")) + " · Marca: " + esc(b ? b.name : "") + "</div>" +
      '<div class="kv"><span class="k">Masa</span>' + K.value(r.mass) + "</div>" +
      '<div class="kv"><span class="k">Balance</span>' + K.value(r.balance) + "</div>" +
      '<div class="kv"><span class="k">Cara</span>' + K.value(r.face) + "</div>" +
      '<div class="kv"><span class="k">Núcleo</span>' + K.value(r.core) + "</div>" +
      '<div class="kv"><span class="k">Acabado</span>' + K.value(r.finish) + "</div>" +
      '<div class="kv"><span class="k">Otros datos declarados</span>' + K.value(r.other) + "</div>" +
      '<div class="kv"><span class="k">Configuración de medición</span>' + esc(r.config) + "</div>" +
      '<div class="kv"><span class="k">Fricción estática</span>' + K.value(r.friction) + "</div>" +
      '<div class="kv"><span class="k">Uso como referencia</span>' + esc(r.use) + " " + K.ev("A") + "</div>" +
      (r.pending && r.pending.length ? '<div class="kv"><span class="k">Datos pendientes</span>' + r.pending.map(function (p) { return '<span class="chip">' + esc(p) + "</span>"; }).join("") + "</div>" : "") +
      '<div class="kv"><span class="k">Fuente</span>' + K.link(r.url, "Ficha oficial / catálogo") + " · consultada " + esc(DATA.meta.cutoff) + "</div>" +
      (opts.noCompare ? "" : '<p><button class="btn small primary" data-action="add-compare" data-id="' + esc(r.id) + '">Agregar al comparador</button></p>') +
      "</div>";
  };

  V.sampleMini = function (s) {
    return '<div class="card">' +
      "<h3>" + esc(s.name) + ' <span class="role">' + esc(s.role) + "</span></h3>" +
      '<div class="small muted">Fábrica: ' + esc(s.factory) + " · " + esc(s.roleStatus) + "</div>" +
      '<div class="kv"><span class="k">Estado</span>' + esc(s.status) + "</div>" +
      (s.requested.length ? '<div class="kv"><span class="k">Objetivo solicitado</span>' + s.requested.filter(function (x) { return x.u; }).map(function (x) { return K.value(x); }).join("") + "</div>" : "") +
      '<div class="kv"><span class="k">Medición real</span>' + (s.measured.length ? s.measured.map(function (m) { return m.missing ? '<div class="val"><b>' + esc(m.label) + ":</b> " + K.missing(m.missing, m.note) + "</div>" : '<div class="val"><b>' + esc(m.label) + ":</b> " + K.value(m) + '<span class="note">' + esc(m.config || "") + "</span></div>"; }).join("") : K.missing("PEND", s.measuredNote)) + "</div>" +
      '<p><a class="btn small" href="#muestras--' + esc(s.id) + '">Ver ficha completa</a> <button class="btn small primary" data-action="add-compare" data-id="' + esc(s.id) + '">Agregar al comparador</button></p>' +
      "</div>";
  };

  V.devMini = function (d) {
    var st = K.getStatus(d.id);
    return '<div class="card">' +
      '<h3><span class="prio" title="Prioridad">P' + d.priority + "</span> " + esc(d.change) + "</h3>" +
      '<div class="kv"><span class="k">Beneficio esperado</span>' + esc(d.benefit) + " " + K.ev("PR", "hipótesis") + "</div>" +
      '<div class="kv"><span class="k">Prueba que decide</span>' + esc(d.test) + "</div>" +
      '<div class="kv"><span class="k">Estado</span><span class="status-pill">' + esc(K.statusLabel(st)) + "</span>" + (st !== "pendiente" ? ' <span class="status-local">(editado localmente)</span>' : "") + "</div>" +
      '<p><a class="btn small" href="#desarrollo--' + esc(d.id) + '">Ver en Desarrollo y pruebas</a></p></div>';
  };

  /* ---------- MAPA ---------- */
  V.mapa = {
    html: function () {
      return '<h1 class="sr-only">Mapa conceptual</h1><div class="map-layout"><div class="map-wrap" id="map"></div><aside class="panel" id="panel" aria-live="polite"></aside></div>';
    },
    mount: function (sub) {
      var panel = document.getElementById("panel");
      var map = new window.KMap.MapView(document.getElementById("map"), function (path) {
        K.flushPending();
        panel.innerHTML = V.mapPanel(path);
        var hl = path.aspect && panel.querySelector("#aspect-" + path.aspect);
        if (path.item) panel.scrollTop = 0;
        else if (hl) panel.scrollTop = hl.offsetTop - panel.offsetTop - 8;
        else panel.scrollTop = 0;
        var h = "#mapa" + (path.branch ? "--" + path.branch : "") + (path.aspect ? "--" + path.aspect : "") + (path.item ? "--" + path.item : "");
        if (location.hash !== h) { try { history.replaceState(null, "", h); } catch (err) {} }
      });
      var parts = (sub || "").split(/--|\//).filter(Boolean), p = {};
      if (parts[0] && K.branchById[parts[0]]) { p.branch = parts[0]; if (parts[1]) { p.aspect = parts[1]; if (parts[2]) p.item = parts[2]; } }
      map.render(); map.focus(false); map.select(p);
      panel.addEventListener("click", function (e) {
        var b = e.target.closest("[data-map-go]"); if (!b) return;
        var t = b.getAttribute("data-map-go").split("/"), np = {};
        if (t[0]) np.branch = t[0]; if (t[1]) np.aspect = t[1]; if (t[2]) np.item = t[2];
        map.select(np);
      });
      return function () { map.destroy(); };
    }
  };

  V.mapPanel = function (path) {
    if (!path.branch) return V.rootPanel();
    var b = K.branchById[path.branch];
    var top = "";
    if (path.item) top = V.itemPanel(b, path.aspect, path.item);
    var asp = DATA.aspects.map(function (a) {
      var c = b[a.id], hl = path.aspect === a.id;
      var body = '<p>' + esc(c.summary) + "</p>";
      var more = "";
      if (a.id === "sample") more += c.sampleIds.map(function (sid) { return '<button class="btn small" data-map-go="' + b.id + '/sample/' + sid + '">Ver ' + esc(K.sampleById[sid].name) + "</button> "; }).join("");
      if (a.id === "refs") more += '<ul class="clean">' + c.items.map(function (it, i) {
        var label = it.refId ? K.refById[it.refId].name : it.name;
        return "<li><b>" + esc(label) + "</b> <span class=\"chip\">" + esc(it.tier) + "</span> — " + esc(it.why) + " " +
          (it.refId ? '<button class="btn small" data-map-go="' + b.id + '/refs/' + it.refId + '">Ficha</button>' : '<span class="miss">Sin ficha técnica en el informe</span>') + "</li>";
      }).join("") + "</ul>";
      if (a.id === "develop") more += '<ul class="clean">' + c.devIds.map(function (id) { var d = K.devById[id]; return '<li><span class="prio">P' + d.priority + "</span> " + esc(d.change) + ' — <span class="status-pill">' + esc(K.statusLabel(K.getStatus(id))) + "</span></li>"; }).join("") + "</ul>";
      if (a.id === "tests") more += '<div class="kv"><span class="k">Métrica principal (criterio Etapa D)</span>' + esc(c.criterion.main) + " " + propBadge() + '</div><div class="kv"><span class="k">También debe cumplir</span>' + esc(c.criterion.also) + '</div><p class="small">Todas las pruebas figuran como <b>pendientes</b>. <a href="#desarrollo">Ver plan y estados</a></p>';
      var det = c.details && c.details.length ? "<details" + (hl ? " open" : "") + "><summary>Más detalle</summary>" + list(c.details) + "</details>" : "";
      return '<section class="aspect' + (hl ? " highlight" : "") + '" id="aspect-' + a.id + '"><h3>' + esc(a.label) +
        ' <button class="btn small" data-map-go="' + b.id + "/" + a.id + '" aria-label="Seleccionar ' + esc(a.label) + ' en el mapa">◎</button></h3>' + body + more + det + "</section>";
    }).join("");
    var w = b.window;
    return top +
      "<h2>" + esc(b.name) + ' <span class="muted small">' + esc(b.tagline) + "</span></h2>" +
      '<div class="banner"><b>Ventana exploratoria</b> ' + propBadge() + "<br>Masa " + esc(w.mass) + " · Balance " + esc(w.balance) +
      '<br><span class="small">Decisión pendiente: ' + esc(w.pending) + '</span><br><span class="small muted">' + esc(DATA.windowNote) + "</span></div>" +
      asp + K.noteField("branch-" + b.id, "Notas locales sobre " + b.name);
  };

  V.itemPanel = function (b, aspectId, itemId) {
    var head = '<p class="small"><button class="btn small" data-map-go="' + b.id + "/" + aspectId + '">← Volver a ' + esc(b.name) + "</button></p>";
    if (aspectId === "refs") {
      if (K.refById[itemId]) {
        var it = b.refs.items.filter(function (x) { return x.refId === itemId; })[0];
        return head + '<div class="banner neutral small">Por qué es referencia para ' + esc(b.name) + ": " + esc(it.why) + " " + K.ev("A") + "</div>" + V.refCard(K.refById[itemId]);
      }
      var idx = +String(itemId).replace("noref-", ""), nr = b.refs.items[idx];
      if (nr) return head + '<div class="card"><h3>' + esc(nr.name) + '</h3><p>' + esc(nr.why) + " " + K.ev("A") + '</p><p>' + K.missing("NI", "El informe no publica una ficha técnica de este modelo. No se genera una ficha.") + "</p></div>";
    }
    if (aspectId === "sample" && K.sampleById[itemId]) return head + V.sampleMini(K.sampleById[itemId]);
    if (aspectId === "develop" && K.devById[itemId]) return head + V.devMini(K.devById[itemId]);
    return "";
  };

  V.rootPanel = function () {
    var m = DATA.meta;
    return "<h2>Cómo usar el mapa</h2>" +
      '<ul class="clean help">' +
      "<li><b>Seleccioná</b> POWER, HYBRID o CONTROL (clic, toque o Enter) para ver sus siete aspectos.</li>" +
      "<li>Seleccioná un aspecto para resaltarlo; <b>Muestra</b>, <b>Referencias</b> y <b>Desarrollar</b> despliegan un tercer nivel.</li>" +
      "<li><b>+ / −</b> acercan y alejan (también rueda o pellizco), <b>◎</b> centra la selección, <b>↩</b> o <b>Esc</b> vuelven al nivel anterior. Arrastrá para desplazarte.</li>" +
      "<li>Cada dato lleva una etiqueta de evidencia con texto, por ejemplo " + K.ev("D") + " o " + K.ev("KM") + ".</li>" +
      "</ul>" +
      '<div class="banner small">' + esc(m.status) + " La cercanía en el mapa no indica equivalencia técnica.</div>" +
      "<h2>Conclusión del informe</h2><p>" + esc(m.conclusion) + "</p>" +
      "<details><summary>Por qué no hay ranking</summary><p>" + esc(m.noBest) + "</p></details>" +
      "<h3>Recomendación " + K.ev("A") + "</h3><p>" + esc(m.recommendation) + "</p>" +
      '<div class="grid">' + DATA.branches.map(function (b) {
        return '<button class="btn" data-map-go="' + b.id + '"><b>' + esc(b.name) + "</b> — " + esc(b.tagline) + "</button>";
      }).join("") + "</div>" +
      "<h3>Decisiones recomendadas ahora " + K.ev("PR") + "</h3>" + list(DATA.recommendedDecisions) +
      "<details><summary>Tendencias que sí importan</summary>" + DATA.trends.map(function (t) { return "<h4>" + esc(t.title) + "</h4><p class=\"small\">" + esc(t.summary) + " " + esc(t.detail) + "</p>"; }).join("") + "</details>";
  };

  /* ---------- EXPLORADOR DEL MERCADO ---------- */
  var F = { q: "", brand: "", family: "", season: "", coverage: "", features: [], onlyRefs: false };
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function seasonKey(s) { return s || "sin"; }
  function brandRefs(b) { return DATA.references.filter(function (r) { return r.brandId === b.id; }); }

  V.mercado = {
    html: function () {
      var seasons = ["2027", "2026", "2025", "Ambigua", "sin"];
      var seasonLabel = { "2027": "2027", "2026": "2026", "2025": "2025", "Ambigua": "Ambigua (2027/2026)", "sin": "Sin temporada indicada" };
      return "<h1>Explorador del mercado</h1>" +
        '<p class="lead">' + esc(DATA.brands.length) + " marcas revisadas al " + esc(DATA.meta.cutoff) + ". Las familias son <b>modelos enumerados</b> en la fuente; solo los modelos de la comparativa técnica tienen ficha. Un material no publicado no equivale a material ausente.</p>" +
        '<form class="filters" id="filters" onsubmit="return false">' +
        '<label>Buscar<input type="search" id="f-q" placeholder="Marca, familia, variante…" value="' + esc(F.q) + '"></label>' +
        '<label>Marca<select id="f-brand"><option value="">Todas</option>' + DATA.brands.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (b) { return '<option value="' + b.id + '"' + (F.brand === b.id ? " selected" : "") + ">" + esc(b.name) + "</option>"; }).join("") + "</select></label>" +
        '<label>Familia<select id="f-family"></select></label>' +
        '<label>Temporada<select id="f-season"><option value="">Todas</option>' + seasons.map(function (s) { return '<option value="' + s + '"' + (F.season === s ? " selected" : "") + ">" + seasonLabel[s] + "</option>"; }).join("") + "</select></label>" +
        '<label>Cobertura<select id="f-coverage"><option value="">Todas</option><option value="completa"' + (F.coverage === "completa" ? " selected" : "") + '>Completa de la página revisada</option><option value="parcial"' + (F.coverage === "parcial" ? " selected" : "") + ">Parcial</option></select></label>" +
        '<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" id="f-refs"' + (F.onlyRefs ? " checked" : "") + "> Solo con ficha técnica en el informe</label>" +
        '<div class="feature-filter"><fieldset><legend>Características documentadas en el informe (se combinan con “y”)</legend>' +
        Object.keys(DATA.featureTags).map(function (k) { return '<label><input type="checkbox" name="feat" value="' + k + '"' + (F.features.indexOf(k) >= 0 ? " checked" : "") + "> " + esc(DATA.featureTags[k]) + "</label>"; }).join("") +
        '</fieldset></div><div><button type="button" class="btn small" id="f-clear">Limpiar filtros</button></div></form>' +
        '<p class="small muted">Temporada = año de colección o nombre comercial indicado en la fuente; no demuestra fecha de venta. Las familias sin año en el informe figuran como “sin temporada indicada”.</p>' +
        '<div class="result-count" id="count" aria-live="polite"></div><div class="grid grid-2" id="results"></div>' +
        '<h2>Huecos explícitos</h2><div class="card small"><p>' + DATA.gaps.brands.map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join("") + "</p><p>" + esc(DATA.gaps.text) + "</p></div>";
    },
    mount: function () {
      var $ = function (id) { return document.getElementById(id); };
      function fillFamilies() {
        var opts = ['<option value="">Todas</option>'];
        DATA.brands.forEach(function (b) {
          if (F.brand && b.id !== F.brand) return;
          b.families.forEach(function (f) {
            var key = b.id + "|" + f.name;
            opts.push('<option value="' + esc(key) + '"' + (F.family === key ? " selected" : "") + ">" + (F.brand ? "" : esc(b.name) + " — ") + esc(f.name) + "</option>");
          });
        });
        $("f-family").innerHTML = opts.join("");
        if (F.family && F.family.split("|")[0] !== F.brand && F.brand) { F.family = ""; }
      }
      function update() {
        var q = norm(F.q), out = [], shown = 0;
        DATA.brands.forEach(function (b) {
          if (F.brand && b.id !== F.brand) return;
          if (F.coverage && b.coverage !== F.coverage) return;
          if (F.features.some(function (f) { return b.features.indexOf(f) < 0; })) return;
          var refs = brandRefs(b);
          if (F.onlyRefs && !refs.length) return;
          var brandHit = !q || norm(b.name + " " + b.note + " " + b.coverageBasis).indexOf(q) >= 0;
          var famFiltersActive = !!(F.family || F.season || q);
          var famMatches = b.families.map(function (f) {
            if (F.family && F.family !== b.id + "|" + f.name) return false;
            if (F.season && seasonKey(f.season) !== F.season) return false;
            if (q && !brandHit && norm(f.name + " " + f.detail).indexOf(q) < 0) return false;
            return true;
          });
          var refMatches = refs.filter(function (r) {
            if (F.family) return false;
            if (F.season && seasonKey(r.season) !== F.season) return false;
            if (q && !brandHit && norm(r.name).indexOf(q) < 0) return false;
            return true;
          });
          var anyFam = famMatches.some(Boolean);
          if (famFiltersActive && !anyFam && !refMatches.length) return;
          shown++;
          out.push(V.brandCard(b, famFiltersActive ? famMatches : null, refs, F.family ? [] : (famFiltersActive ? refMatches : refs)));
        });
        $("count").innerHTML = "<b>" + shown + "</b> de " + DATA.brands.length + " marcas";
        $("results").innerHTML = out.length ? out.join("") : '<div class="empty" style="grid-column:1/-1"><p><b>Sin resultados</b> para estos filtros.</p><p class="small">Que una marca no aparezca no significa que no tenga esa característica: solo se filtra lo documentado en el informe.</p><button class="btn small" id="f-clear-2">Limpiar filtros</button></div>';
        var c2 = $("f-clear-2"); if (c2) c2.onclick = clear;
      }
      function clear() { F = { q: "", brand: "", family: "", season: "", coverage: "", features: [], onlyRefs: false }; $("app").innerHTML = V.mercado.html(); V.mercado.mount(); }
      $("f-q").addEventListener("input", function (e) { F.q = e.target.value; update(); });
      $("f-brand").addEventListener("change", function (e) { F.brand = e.target.value; F.family = ""; fillFamilies(); update(); });
      $("f-family").addEventListener("change", function (e) { F.family = e.target.value; update(); });
      $("f-season").addEventListener("change", function (e) { F.season = e.target.value; update(); });
      $("f-coverage").addEventListener("change", function (e) { F.coverage = e.target.value; update(); });
      $("f-refs").addEventListener("change", function (e) { F.onlyRefs = e.target.checked; update(); });
      $("filters").addEventListener("change", function (e) {
        if (e.target.name === "feat") { F.features = [].slice.call(document.querySelectorAll('input[name="feat"]:checked')).map(function (x) { return x.value; }); update(); }
      });
      $("f-clear").addEventListener("click", clear);
      fillFamilies(); update();
    }
  };

  V.brandCard = function (b, famMatches, allRefs, refsToShow) {
    var fams = b.families.map(function (f, i) { return { f: f, hit: famMatches ? famMatches[i] : true }; });
    var hits = fams.filter(function (x) { return x.hit; }), rest = fams.filter(function (x) { return !x.hit; });
    function famRow(x) {
      return '<div class="fam' + (famMatches && x.hit ? " match" : "") + '"><b>' + esc(x.f.name) + "</b><span>" + esc(x.f.detail) + '</span><span class="enum-tag">' + (x.f.season ? esc(x.f.season) : "sin temporada") + " · enumerado</span></div>";
    }
    var covLabel = b.coverage === "completa" ? "Cobertura completa de la página revisada" : "Cobertura parcial";
    return '<article class="card brand-card">' +
      "<h3>" + esc(b.name) + ' <span class="cov cov-' + b.coverage + '">' + covLabel + "</span></h3>" +
      '<p class="small muted">' + esc(b.coverageBasis) + "</p>" +
      hits.map(famRow).join("") +
      (rest.length ? "<details><summary>Ver " + rest.length + " familia(s) que no coinciden con el filtro</summary>" + rest.map(famRow).join("") + "</details>" : "") +
      '<p class="small"><b>Qué aporta a KORVE / límite:</b> ' + esc(b.note) + " " + K.ev("A") + "</p>" +
      (b.features.length ? '<p class="small">' + b.features.map(function (f) { return '<span class="chip">' + esc(DATA.featureTags[f]) + "</span>"; }).join("") + "</p>" : "") +
      (allRefs.length ? '<div class="refs-list small"><b>Con ficha técnica en el informe' + (refsToShow.length < allRefs.length ? " (" + refsToShow.length + " de " + allRefs.length + " coinciden)" : "") + ":</b> " +
        (refsToShow.length ? refsToShow.map(function (r) { return '<button class="btn small" data-action="add-compare" data-id="' + esc(r.id) + '">+ ' + esc(r.name) + "</button>"; }).join(" ") : '<span class="muted">ninguna con este filtro</span>') + "</div>"
        : '<p class="small muted">Sin ficha técnica en el informe: solo modelos enumerados.</p>') +
      '<p class="small">Fuente: ' + K.link(b.url, "catálogo / página oficial") + " · consultada " + esc(DATA.meta.cutoff) + "</p>" +
      "</article>";
  };

  /* ---------- COMPARADOR ---------- */
  var ROWS = [
    { k: "origin", label: "Tipo de ítem" },
    { k: "season", label: "Temporada" },
    { k: "mass", label: "Masa (g)" },
    { k: "balance", label: "Balance (mm)" },
    { k: "face", label: "Cara" },
    { k: "core", label: "Núcleo" },
    { k: "hardness", label: "Dureza declarada y escala" },
    { k: "finish", label: "Acabado" },
    { k: "other", label: "Otros datos declarados" },
    { k: "config", label: "Configuración de medición" },
    { k: "friction", label: "Fricción estática (L)" },
    { k: "pending", label: "Datos pendientes" },
    { k: "use", label: "Uso como referencia" },
    { k: "source", label: "Fuente" }
  ];
  function cmpItem(id) {
    var r = K.refById[id];
    if (r) return { id: id, name: r.name, isSample: false, season: r.season, mass: r.mass, balance: r.balance, face: r.face, core: r.core, hardness: r.hardness, finish: r.finish, other: r.other, config: r.config, configSpecs: r.configSpecs || null, friction: r.friction, pending: r.pending, use: r.use, url: r.url, brand: K.brandById[r.brandId].name, local: [] };
    var s = K.sampleById[id];
    if (s) { var c = s.compare; return { id: id, name: "KORVE " + s.name, isSample: true, season: null, mass: c.mass, balance: c.balance, face: c.face, core: c.core, hardness: c.hardness, finish: c.finish, other: c.other, config: c.config, configSpecs: c.configSpecs, friction: c.friction, pending: c.pending, use: s.role + " — " + s.roleStatus, factory: s.factory, local: (K.state().measurements[id] || []) }; }
    return null;
  }
  function cell(it, k) {
    if (k === "origin") return it.isSample ? K.ev("KP", "muestra " + it.factory) + '<div class="small muted">Objetivo, declaración de proveedor y medición interna se muestran por separado.</div>' : K.ev("D") + '<div class="small muted">Ficha comercial de ' + esc(it.brand) + "; no es medición de nuestras unidades.</div>";
    if (k === "season") return it.isSample ? '<span class="miss">No aplica (muestra)</span>' : (it.season ? esc(it.season) + ' <span class="small muted">(nombre comercial)</span>' : K.missing("NP"));
    if (k === "hardness") return K.value(it.hardness || { missing: "NP", note: "Sin dureza con escala en la ficha." });
    if (k === "config") return esc(it.config) + '<ul class="clean small">' + configEntries(it).map(function (e) {
      return "<li><b>" + esc(e.who.replace(it.name + " · ", "")) + ":</b> " + esc(K.configSummary(e)) + (e.text ? " — " + esc(e.text) : "") + "</li>";
    }).join("") + "</ul>";
    if (k === "pending") return it.pending && it.pending.length ? it.pending.map(function (p) { return '<span class="chip">' + esc(p) + "</span>"; }).join("") : '<span class="muted">—</span>';
    if (k === "use") return esc(it.use) + " " + K.ev("A");
    if (k === "source") return it.isSample ? esc(DATA.internalSource) : K.link(it.url, "Ficha oficial") + '<div class="small muted">Consultada ' + esc(DATA.meta.cutoff) + "</div>";
    var html = K.value(it[k]);
    if ((k === "mass" || k === "balance") && it.isSample && it.local.length) {
      html += it.local.map(function (m) {
        var v = k === "mass" ? m.mass : m.balance;
        if (!v) return "";
        return '<div class="val"><span class="num">' + esc(v) + " " + (k === "mass" ? "g" : "mm") + "</span> " + K.ev("KM", "registro local") + '<span class="note">' + esc(m.date) + " · " + esc(K.configSummary(m)) + " · " + esc(m.config) + "</span></div>";
      }).join("");
    }
    return html;
  }
  /* Configuraciones de medición de un ítem: las de los datos + cada registro local. */
  function configEntries(it) {
    var out = [];
    var specs = it.configSpecs || [{ label: "ficha", overgrips: null, strap: null, protector: null }];
    specs.forEach(function (c) { out.push({ who: it.name + " · " + c.label, overgrips: c.overgrips, strap: c.strap, protector: c.protector, local: false }); });
    (it.local || []).forEach(function (m) {
      out.push({ who: it.name + " · registro local " + m.date, overgrips: m.overgrips == null ? null : m.overgrips, strap: m.strap == null ? null : m.strap, protector: m.protector == null ? null : m.protector, local: true, text: m.config, sample: it.name });
    });
    return out;
  }
  var CFG_FIELDS = [
    { k: "overgrips", label: "Overgrips", fmt: function (v) { return v + (v === 1 ? " overgrip" : " overgrips"); } },
    { k: "strap", label: "Correa", fmt: function (v) { return v ? "con correa" : "sin correa"; } },
    { k: "protector", label: "Protector", fmt: function (v) { return v ? "con protector" : "sin protector"; } }
  ];
  function warnings(items) {
    var w = [];
    if (!items.length) return w;
    var multi = items.length > 1;
    if (multi) w.push("Las fichas no especifican simultáneamente grip, overgrip, protector, correa, incertidumbre ni tamaño de muestra: no permiten comparar diferencias pequeñas con rigor.");

    /* Clases de evidencia de masa, incluidas las mediciones locales. */
    var evs = {};
    items.forEach(function (it) {
      [].concat(it.mass || []).forEach(function (v) { if (v && v.ev) evs[v.ev] = 1; });
      if ((it.local || []).some(function (m) { return m.mass; })) evs.KM = 1;
    });
    if (multi && Object.keys(evs).length > 1) w.push("Se mezclan clases de evidencia en masa (" + Object.keys(evs).map(function (e) { return DATA.evidence[e].label; }).join(", ") + "): un objetivo o una declaración no es una medición.");

    /* Configuraciones: datos + registros locales, campo por campo. */
    var entries = [].concat.apply([], items.map(configEntries));
    CFG_FIELDS.forEach(function (f) {
      var known = entries.filter(function (e) { return e[f.k] !== null; });
      var vals = {}; known.forEach(function (e) { vals[String(e[f.k])] = 1; });
      if (Object.keys(vals).length > 1) {
        w.push(f.label + " distintos entre los valores mostrados: " + known.map(function (e) { return e.who + " = " + f.fmt(e[f.k]); }).join("; ") + ". No compares masa ni balance entre configuraciones distintas.");
      }
      var unknownLocal = entries.filter(function (e) { return e.local && e[f.k] === null; });
      if (known.length && unknownLocal.length) w.push(f.label + ": sin dato en " + unknownLocal.map(function (e) { return e.who; }).join(", ") + ". Completalo para poder comparar esa medición.");
    });
    /* Registros locales de una misma muestra con textos de configuración distintos. */
    items.forEach(function (it) {
      var texts = {}; (it.local || []).forEach(function (m) { texts[norm(m.config).replace(/\s+/g, " ").trim()] = 1; });
      if (Object.keys(texts).length > 1) w.push("Los registros locales de " + it.name + " tienen configuraciones distintas: no promediarlos ni compararlos entre sí sin normalizar.");
    });

    var seasons = {}; items.forEach(function (it) { if (it.season) seasons[it.season] = 1; });
    if (Object.keys(seasons).length > 1) w.push("Temporadas distintas (" + Object.keys(seasons).join(", ") + "): no trasladar datos de una temporada a otra.");

    /* Dureza: se compara la escala declarada de cada ítem. */
    var hs = items.filter(function (it) { return it.hardness && !it.hardness.missing; });
    if (hs.length > 1) {
      var noScale = hs.filter(function (it) { return it.hardness.scale === "sin-escala"; });
      var byScale = {};
      hs.forEach(function (it) { if (it.hardness.scale !== "sin-escala") (byScale[it.hardness.scale] = byScale[it.hardness.scale] || []).push(it.name); });
      var scales = Object.keys(byScale);
      if (scales.length > 1) w.push("Escalas de dureza distintas (" + scales.map(function (sc) { return DATA.hardnessScales[sc] + ": " + byScale[sc].join(", "); }).join("; ") + "): no equipararlas.");
      if (noScale.length) w.push("Dureza sin escala identificada en " + noScale.map(function (it) { return it.name; }).join(", ") + ": no se puede equiparar con otras durezas.");
      if (scales.length === 1 && !noScale.length) w.push("Misma escala de dureza (" + DATA.hardnessScales[scales[0]] + ") en " + byScale[scales[0]].join(" y ") + ": comparable como declaración, no como medición propia.");
    }
    if (items.some(function (it) { return [].concat(it.balance || []).some(function (b) { return b && b.qual; }); })) w.push("Hay balances cualitativos: no se convierten en milímetros.");
    var faces = items.map(function (it) { return JSON.stringify(it.face || ""); }).join(" ");
    if (multi && (/\d+K/.test(faces) || /T700/.test(faces))) w.push("12K/16K/18K describen haces de filamentos, no calidad: 18K no es mejor que 12K. T700 no equivale a un número K.");
    return w;
  }

  V.comparador = {
    html: function () {
      var sel = K.state().compare.filter(function (id) { return cmpItem(id); });
      var opts = function (cur) {
        return '<option value="">— Elegir —</option><optgroup label="Muestras KORVE">' + DATA.samples.map(function (s) { return '<option value="' + s.id + '"' + (cur === s.id ? " selected" : "") + ">" + esc(K.itemName(s.id)) + "</option>"; }).join("") + "</optgroup>" +
          '<optgroup label="Referencias con ficha (sección 4)">' + DATA.references.map(function (r) { return '<option value="' + r.id + '"' + (cur === r.id ? " selected" : "") + ">" + esc(r.name) + "</option>"; }).join("") + "</optgroup>";
      };
      var pickers = [0, 1, 2].map(function (i) {
        return '<label>Pala ' + (i + 1) + '<select data-slot="' + i + '">' + opts(sel[i] || "") + "</select></label>";
      }).join("");
      var items = sel.map(cmpItem);
      var table;
      if (!items.length) table = '<div class="empty"><p><b>No hay palas seleccionadas.</b></p><p class="small">Elegí hasta tres arriba, o usá “Agregar al comparador” desde el mapa, el explorador o las muestras.</p></div>';
      else {
        var ws = warnings(items);
        table = (ws.length ? '<div class="banner"><b>Antes de comparar</b>' + list(ws) + "</div>" : "") +
          '<div class="table-scroll"><table class="cmp"><thead><tr><th scope="col">Dato</th>' +
          items.map(function (it) { return '<th scope="col">' + esc(it.name) + ' <button class="btn small" data-action="remove-compare" data-id="' + esc(it.id) + '" aria-label="Quitar ' + esc(it.name) + '">Quitar</button></th>'; }).join("") +
          "</tr></thead><tbody>" +
          ROWS.map(function (r) { return '<tr><th scope="row">' + esc(r.label) + "</th>" + items.map(function (it) { return "<td>" + cell(it, r.k) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>";
      }
      return "<h1>Comparador</h1>" +
        '<p class="lead">Hasta tres palas lado a lado. Masa en g y balance en mm. Los balances cualitativos no se convierten en números. Esta tabla no es un ranking.</p>' +
        '<div class="card cmp-picker">' + pickers + '<button class="btn small" data-action="clear-compare">Vaciar</button></div><div style="height:12px"></div>' + table +
        '<p class="small muted">Los valores “K · Medición interna · registro local” provienen de lo que cargues en “Nuestras muestras”.</p>';
    },
    mount: function () {
      document.querySelectorAll("select[data-slot]").forEach(function (s) {
        s.addEventListener("change", function () {
          var vals = [].slice.call(document.querySelectorAll("select[data-slot]")).map(function (x) { return x.value; }).filter(Boolean);
          var uniq = vals.filter(function (v, i) { return vals.indexOf(v) === i; });
          K.state().compare = uniq.slice(0, 3); K.save(); window.KApp.rerender();
        });
      });
    }
  };

  /* ---------- MUESTRAS ---------- */
  V.muestras = {
    html: function (sub) {
      return "<h1>Nuestras muestras</h1>" +
        '<p class="lead">Fuente interna: ' + esc(DATA.internalSource) + " Se separan cuatro tipos de dato: objetivo solicitado, construcción declarada por el proveedor, medición real y opinión de tester.</p>" +
        '<div class="banner small">MC-005 es referencia de comportamiento HYBRID. W3 y AMP22 son candidatas POWER y CONTROL, todavía sin validación definitiva. KS-01 no se asigna a CONTROL solo para completar la línea.</div>' +
        K.storageBar() +
        '<div style="height:10px"></div><div class="sample-grid">' + DATA.samples.map(V.sampleCard).join("") + "</div>" +
        '<h2>Unidad comercial de Tomás Sánchez</h2><div class="card"><b>' + esc(DATA.tomiReference.name) + "</b><p>" + esc(DATA.tomiReference.text) + "</p></div>";
    },
    mount: function (sub) {
      if (sub) { var e = document.getElementById("sample-" + sub); if (e) { e.scrollIntoView({ block: "start" }); e.classList.add("highlight"); } }
    }
  };

  V.sampleCard = function (s) {
    var local = K.state().measurements[s.id] || [];
    function rows(arr) {
      return arr.map(function (x) {
        if (x.missing) return '<div class="kv"><span class="k">' + esc(x.label) + "</span>" + K.missing(x.missing, x.note) + "</div>";
        return '<div class="kv"><span class="k">' + esc(x.label) + (x.who ? " · " + esc(x.who) : "") + "</span>" + K.value(x) + (x.config ? '<span class="small">Configuración: ' + esc(x.config) + "</span>" : "") + "</div>";
      }).join("");
    }
    return '<article class="card aspect" id="sample-' + esc(s.id) + '">' +
      "<h2 style=\"margin-top:0\">" + esc(s.name) + ' <span class="role">' + esc(s.role) + "</span></h2>" +
      '<p class="small muted">Fábrica: <b>' + esc(s.factory) + "</b> · " + esc(s.roleStatus) + "</p>" +
      '<div class="quad">' +
      "<div><h4>Objetivo solicitado</h4>" + (s.requested.length ? rows(s.requested) : K.missing("NI", s.requestedNote)) + "</div>" +
      "<div><h4>Construcción declarada</h4>" + rows(s.declared) + "</div>" +
      "<div><h4>Medición real</h4>" + (s.measured.length ? rows(s.measured) : K.missing("PEND", s.measuredNote)) +
        (local.length ? '<div class="kv"><span class="k">Registros locales</span>' + local.map(function (m, i) {
          return '<div class="val">' + (m.mass ? '<span class="num">' + esc(m.mass) + " g</span>" : "") + (m.balance ? ' <span class="num">' + esc(m.balance) + " mm</span>" : "") + " " + K.ev("KM", "registro local") +
            '<span class="note">' + esc(m.date) + " · " + esc(m.who || "sin responsable") + " · " + esc(K.configSummary(m)) + " · " + esc(m.config) + (m.note ? " · " + esc(m.note) : "") +
            ' <button class="btn small" data-action="del-measure" data-sample="' + esc(s.id) + '" data-idx="' + i + '">Borrar</button></span></div>';
        }).join("") + "</div>" : "") + "</div>" +
      "<div><h4>Opinión de tester</h4>" + (s.tester.length ? s.tester.map(function (t) { return '<div class="kv"><span class="k">' + esc(t.who) + "</span>" + esc(t.text) + " " + K.ev("KT") + (t.note ? '<div class="small muted">' + esc(t.note) + "</div>" : "") + "</div>"; }).join("") : K.missing("PEND", s.testerNote)) +
        (s.tester.length && s.testerNote ? '<p class="small muted">' + esc(s.testerNote) + "</p>" : "") + "</div>" +
      "</div>" +
      '<div class="kv"><span class="k">Estado real</span>' + esc(s.status) + "</div>" +
      (s.warnings.length ? '<div class="banner small">' + list(s.warnings) + "</div>" : "") +
      "<details><summary>Registrar medición local</summary>" +
      '<form class="measure-form" data-sample="' + esc(s.id) + '">' +
      '<div class="form-row"><label>Fecha<input type="date" name="date" required></label><label>Masa (g)<input name="mass" inputmode="decimal" placeholder="ej. 364,1"></label><label>Balance (mm)<input name="balance" inputmode="decimal" placeholder="ej. 258"></label><label>Responsable<input name="who"></label></div>' +
      '<div class="form-row"><label>Overgrips<select name="overgrips"><option value="">Sin dato</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>' +
      '<label>Correa<select name="strap"><option value="">Sin dato</option><option value="si">Con correa</option><option value="no">Sin correa</option></select></label>' +
      '<label>Protector<select name="protector"><option value="">Sin dato</option><option value="si">Con protector</option><option value="no">Sin protector</option></select></label></div>' +
      '<div class="form-row"><label>Configuración (obligatoria)<input name="config" required placeholder="grip, film, accesorios, cómo se apoyó"></label><label>Nota<input name="note" placeholder="lecturas, incertidumbre…"></label></div>' +
      '<button class="btn small primary" type="submit">Guardar medición</button> <span class="small muted">Se guarda como “K · Medición interna” en este navegador.</span></form></details>' +
      K.noteField("sample-" + s.id, "Notas y opiniones locales") +
      '<p><button class="btn small primary" data-action="add-compare" data-id="' + esc(s.id) + '">Agregar al comparador</button></p>' +
      "</article>";
  };

  /* ---------- DESARROLLO Y PRUEBAS ---------- */
  var LOAN_STATUS = K.loanStatusOptions;
  function statusSelect(id, opts) {
    var cur = K.getStatus(id);
    return '<select data-status="' + esc(id) + '" aria-label="Estado">' + opts.map(function (o) { return '<option value="' + o.id + '"' + (cur === o.id ? " selected" : "") + ">" + esc(o.label) + "</option>"; }).join("") + "</select>" +
      (cur !== "pendiente" ? ' <span class="status-local">Editado localmente</span>' : "");
  }

  V.desarrollo = {
    html: function () {
      var dev = DATA.devItems.map(function (d) {
        var res = (d.results || []);
        return '<article class="card aspect" id="dev-' + esc(d.id) + '"><div class="dev-card"><div><span class="prio" title="Prioridad ' + d.priority + '">P' + d.priority + "</span></div><div>" +
          "<h3>" + esc(d.change) + "</h3>" +
          '<p class="small">' + d.models.map(function (m) { return '<span class="chip">' + esc(m) + "</span>"; }).join("") + "</p>" +
          '<div class="kv"><span class="k">Beneficio esperado</span>' + esc(d.benefit) + " " + K.ev("PR", "hipótesis") + "</div>" +
          '<div class="kv"><span class="k">Prueba que decide</span>' + esc(d.test) + " " + K.ev("PR") + "</div>" +
          '<div class="kv"><span class="k">Estado</span>' + statusSelect(d.id, DATA.statusOptions) + "</div>" +
          '<div class="kv"><span class="k">Resultados en los datos</span>' + (res.length ? res.map(function (r) { return K.value(r); }).join("") : K.missing("PEND", "Sin resultados registrados. El ensayo no se realizó según el informe.")) + "</div>" +
          K.noteField("dev-" + d.id, "Resultado o notas locales") + "</div></div></article>";
      }).join("");
      var stages = DATA.stages.map(function (s) {
        return '<article class="card aspect"><h3>' + esc(s.name) + "</h3><p>" + esc(s.summary) + " " + K.ev("PR") + "</p>" +
          '<div class="kv"><span class="k">Estado</span>' + statusSelect(s.id, DATA.statusOptions) + "</div>" +
          "<details><summary>Pasos propuestos</summary>" + list(s.steps) + "</details>" +
          (s.id === "etapa-d" ? '<table class="simple"><thead><tr><th>Modelo</th><th>Métrica principal</th><th>También debe cumplir</th></tr></thead><tbody>' + DATA.branches.map(function (b) { return "<tr><td><b>" + esc(b.name) + "</b></td><td>" + esc(b.tests.criterion.main) + "</td><td>" + esc(b.tests.criterion.also) + "</td></tr>"; }).join("") + "</tbody></table>" : "") +
          K.noteField("stage-" + s.id, "Notas locales") + "</article>";
      }).join("");
      var loans = '<table class="simple"><thead><tr><th>#</th><th>Referencia</th><th>Para qué</th><th>Estado</th></tr></thead><tbody>' +
        DATA.loanRefs.map(function (l) {
          return "<tr><td>" + l.order + "</td><td><b>" + esc(l.name) + "</b>" + (l.refId ? ' <button class="btn small" data-action="add-compare" data-id="' + esc(l.refId) + '">+ comparar</button>' : ' <span class="miss">Sin ficha en el informe</span>') + "</td><td>" + esc(l.why) + "</td><td>" + statusSelect(l.id, LOAN_STATUS) + "</td></tr>";
        }).join("") + "</tbody></table>";
      return "<h1>Desarrollo y pruebas</h1>" +
        '<p class="lead">Mejoras propuestas por orden de prioridad. Todos los beneficios son hipótesis y todos los ensayos figuran como <b>pendientes</b> hasta que registres un resultado.</p>' +
        K.storageBar() + '<div class="banner small">' + esc(DATA.devNote) + "</div>" +
        "<h2>Mejoras a probar</h2>" + dev +
        "<h2>Plan de validación</h2>" + stages +
        '<h2>Referencias a conseguir prestadas</h2><div class="card">' + loans + '<p class="small muted">' + esc(DATA.loanSecondRound) + "</p></div>";
    },
    mount: function (sub) {
      if (sub) { var e = document.getElementById("dev-" + sub); if (e) { e.scrollIntoView({ block: "start" }); e.classList.add("highlight"); } }
    }
  };

  /* ---------- DECISIÓN DE FÁBRICA ---------- */
  V.fabrica = {
    html: function () {
      var cols = DATA.factories.map(function (f) {
        return '<article class="card"><h2 style="margin-top:0">' + esc(f.name) + "</h2>" +
          '<div class="kv"><span class="k">Muestras propias</span>' + f.samples.map(function (id) { var s = K.sampleById[id]; return '<a class="chip" href="#muestras--' + id + '">' + esc(s.name) + " · " + esc(s.role) + "</a>"; }).join(" ") + "</div>" +
          "<h3>Qué podría aportar a la línea</h3>" +
          '<table class="simple"><thead><tr><th>Perfil</th><th>Escenario si se elige</th><th>Estado</th></tr></thead><tbody>' +
          f.contributes.map(function (c) { return "<tr><td><b>" + esc(c.profile) + "</b></td><td>" + esc(c.text) + " " + K.ev("PR") + '</td><td><span class="status-pill">' + esc(c.status) + "</span></td></tr>"; }).join("") + "</tbody></table>" +
          "<h3>Declarado por la fábrica " + K.ev("KP") + "</h3>" + list(f.declared) +
          "<h3>Qué falta validar</h3>" + '<ul class="clean">' + f.toValidate.map(function (t) { return "<li>" + esc(t) + ' <span class="status-pill">Pendiente</span></li>'; }).join("") + "</ul>" +
          K.noteField("factory-" + f.id, "Notas locales sobre " + f.name) + "</article>";
      }).join("");
      var fn = K.state().factoryNotes;
      var matrix = '<div class="table-scroll"><table class="cmp"><thead><tr><th>Criterio</th><th>Peso propuesto</th>' + DATA.factories.map(function (f) { return "<th>Evidencia " + esc(f.name) + " (nota local)</th>"; }).join("") + "</tr></thead><tbody>" +
        DATA.factoryMatrix.map(function (m) {
          return '<tr><th scope="row">' + esc(m.criterion) + "</th><td>" + esc(m.weight) + "<br>" + K.ev("PR") + "</td>" +
            DATA.factories.map(function (f) { var key = m.id + "|" + f.id; return '<td><textarea data-fnote="' + esc(key) + '" aria-label="' + esc(m.criterion + " — " + f.name) + '" placeholder="Sin evidencia registrada">' + esc(fn[key] || "") + "</textarea></td>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
      return "<h1>Decisión de fábrica</h1>" +
        '<p class="lead">Elegir una sola fábrica por su capacidad para conseguir los tres perfiles y repetirlos en serie, no por la suma de nombres de tecnologías.</p>' +
        '<div class="banner"><b>Sin ganador declarado.</b> La app no suma puntajes ni elige proveedor: la matriz es una propuesta y la decisión depende de pruebas pendientes.</div>' +
        K.storageBar() + '<div style="height:10px"></div><div class="fact-grid">' + cols + "</div>" +
        "<h2>Requisitos antes de sumar</h2>" + '<div class="card">' + list(DATA.factoryGates) + "</div>" +
        "<h2>Matriz propuesta de proveedor</h2>" + '<p class="small muted">Pesos propuestos, no aprobados. Las celdas son notas locales de evidencia, no puntuaciones.</p>' + matrix;
    }
  };

  /* ---------- FUENTES Y MÉTODO ---------- */
  V.fuentes = {
    html: function () {
      var m = DATA.meta, f = DATA.frictionData;
      return "<h1>Fuentes y método</h1>" +
        '<div class="banner"><b>Fecha de corte:</b> ' + esc(m.cutoff) + ". " + esc(m.cutoffNote) + "</div>" +
        "<p>" + esc(m.scope) + "</p>" +
        "<h2>Clases de evidencia</h2>" + '<div class="card"><table class="simple"><tbody>' + Object.keys(DATA.evidence).map(function (k) { return "<tr><td>" + K.ev(k) + "</td><td>" + esc(DATA.evidence[k].desc) + "</td></tr>"; }).join("") +
        Object.keys(DATA.missingStates).map(function (k) { return "<tr><td>" + K.missing(k) + "</td><td>Dato ausente. Un dato no publicado no equivale a dato inexistente.</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<h2>Reglas de lectura</h2><div class="card">' + list(DATA.rules) + "</div>" +
        "<h2>Mediciones externas disponibles " + K.ev("L") + "</h2>" +
        '<div class="card"><p class="small">Coeficiente de fricción estática, sin unidad. Fuente: ' + esc(f.source) + " " + K.link(f.sourceUrl) + "</p>" +
        '<table class="simple"><thead><tr><th>Unidad medida</th><th>Valor</th><th>Nota</th></tr></thead><tbody>' + f.rows.map(function (r) { return "<tr><td>" + esc(r.model) + "</td><td>" + esc(r.value) + "</td><td class=\"small\">" + esc(r.note || "") + "</td></tr>"; }).join("") + "</tbody></table>" +
        '<p class="small muted">' + esc(f.caveat) + " El orden de la tabla no es un ranking.</p></div>" +
        '<h2>Bases para el protocolo propio</h2><div class="grid grid-2">' + DATA.measurementSources.map(function (s) { return '<div class="card"><h3>' + K.link(s.url, s.name) + '</h3><p class="small"><b>Documenta:</b> ' + esc(s.documents) + '</p><p class="small"><b>Uso y límites:</b> ' + esc(s.limits) + "</p></div>"; }).join("") + "</div>" +
        '<h2>Inconsistencias que no conviene tapar</h2><div class="card">' + list(DATA.inconsistencies) + "</div>" +
        "<h2>Tendencias que sí importan</h2>" + DATA.trends.map(function (t) { return "<details><summary>" + esc(t.title) + "</summary><p>" + esc(t.summary) + "</p><p class=\"small\">" + esc(t.detail) + "</p></details>"; }).join("") +
        '<h2>Fuentes de marcas (41)</h2><div class="card small"><ul class="clean" style="columns:2 260px">' + DATA.brands.map(function (b) { return "<li>" + K.link(b.url, b.name) + "</li>"; }).join("") + "</ul></div>" +
        '<h2>Fichas técnicas citadas (' + DATA.references.length + ')</h2><div class="card small"><ul class="clean" style="columns:2 260px">' + DATA.references.map(function (r) { return "<li>" + K.link(r.url, r.name) + "</li>"; }).join("") + "</ul></div>" +
        '<h2>Fuente interna</h2><div class="card small">' + esc(DATA.internalSource) + "</div>" +
        "<h2>Datos locales</h2>" + K.storageBar() + '<p><button class="btn small" data-action="clear-local">Borrar notas y estados locales</button></p>' +
        '<p class="small muted">' + esc(m.finalResult) + "</p>";
    }
  };
})();
