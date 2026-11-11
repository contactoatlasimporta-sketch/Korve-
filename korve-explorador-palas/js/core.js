/* KORVE Explorador — utilidades, almacenamiento local y renderizado de evidencia. */
(function () {
  var DATA = window.KORVE_DATA;
  var K = (window.K = {});

  /* ---------- HTML helpers ---------- */
  K.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  var esc = K.esc;

  K.link = function (url, text) {
    if (!url) return '<span class="miss">Enlace no incluido en el informe</span>';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(text || url) + "</a>";
  };

  /* ---------- Lookups ---------- */
  K.brandById = {}; DATA.brands.forEach(function (b) { K.brandById[b.id] = b; });
  K.refById = {}; DATA.references.forEach(function (r) { K.refById[r.id] = r; });
  K.sampleById = {}; DATA.samples.forEach(function (s) { K.sampleById[s.id] = s; });
  K.devById = {}; DATA.devItems.forEach(function (d) { K.devById[d.id] = d; });
  K.branchById = {}; DATA.branches.forEach(function (b) { K.branchById[b.id] = b; });

  /* ---------- Evidence ---------- */
  K.ev = function (code, extra) {
    var e = DATA.evidence[code];
    if (!e) return "";
    var title = e.label + ". " + e.desc;
    return '<span class="ev ev-' + esc(code) + '" title="' + esc(title) + '"><span class="code">' + esc(e.code) + "</span> · " + esc(e.label) + (extra ? " · " + esc(extra) : "") + "</span>";
  };
  K.missing = function (key, note) {
    var label = DATA.missingStates[key] || key;
    return '<span class="miss">' + esc(label) + "</span>" + (note ? '<span class="note">' + esc(note) + "</span>" : "");
  };

  /* Renderiza un valor o un arreglo de valores con su clase de evidencia. */
  K.value = function (val) {
    if (val == null) return '<div class="val">' + K.missing("NI") + "</div>";
    if (Array.isArray(val)) return val.map(K.value).join("");
    if (typeof val === "string") return '<div class="val"><span>' + esc(val) + "</span></div>";
    if (val.missing) return '<div class="val">' + K.missing(val.missing, val.note) + "</div>";
    var main;
    if (val.qual) main = '<span class="num">' + esc(val.qual) + '</span> <span class="miss">cualitativo, sin mm</span>';
    else main = '<span class="num">' + esc(val.v) + (val.u ? " " + esc(val.u) : "") + "</span>";
    return '<div class="val">' + main + " " + K.ev(val.ev) + (val.note ? '<span class="note">' + esc(val.note) + "</span>" : "") + "</div>";
  };

  /* ---------- Local storage (con respaldo en memoria) ---------- */
  var KEY = "korve-explorador-v1";
  var mem = null;
  function blank() { return { version: 1, notes: {}, status: {}, measurements: {}, results: {}, factoryNotes: {}, compare: [] }; }
  K.storageOk = true;
  /* Si el almacenamiento ya no funcionaba al cargar, se trabaja en memoria. */
  try { var probe = "korve-probe"; window.localStorage.setItem(probe, "1"); window.localStorage.removeItem(probe); K.storageWasOk = true; } catch (e) { K.storageWasOk = false; }
  K.load = function () {
    if (mem) return mem;
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { K.storageOk = false; }
    mem = blank();
    if (raw) {
      var parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) {}
      var res = parsed ? K.validateState(parsed) : { ok: false };
      if (res.ok) mem = res.state;
      else {
        /* Estado guardado incompatible: se conserva una copia y se arranca vacío, sin borrar el original. */
        try { window.localStorage.setItem(KEY + "-respaldo-incompatible", raw); } catch (e) {}
        K.loadWarning = "Los datos locales guardados no tenían un formato válido. Se guardó una copia de respaldo y se empezó vacío.";
      }
    }
    return mem;
  };
  /* Guarda; devuelve false si el navegador no permite guardar. */
  K.save = function () {
    try { window.localStorage.setItem(KEY, JSON.stringify(mem)); K.storageOk = true; return true; }
    catch (e) { K.storageOk = false; return false; }
  };

  /* ---------- Guardado diferido de notas ----------
   * Las notas se guardan 300 ms después de escribir. flushPending() guarda todo lo
   * pendiente: se llama al exportar, cambiar de vista, cerrar u ocultar la página. */
  var pending = {};
  K.queueSave = function (key, fn) {
    if (pending[key]) clearTimeout(pending[key].t);
    pending[key] = { fn: fn, t: setTimeout(function () { var p = pending[key]; delete pending[key]; if (p) p.fn(); }, 300) };
  };
  K.flushPending = function () {
    Object.keys(pending).forEach(function (k) { var p = pending[k]; clearTimeout(p.t); delete pending[k]; p.fn(); });
  };
  K.hasPending = function () { return Object.keys(pending).length > 0; };

  /* ---------- Validación de datos locales e importación ---------- */
  K.loanStatusOptions = [{ id: "pendiente", label: "Pendiente de conseguir" }, { id: "solicitada", label: "Solicitada" }, { id: "conseguida", label: "Conseguida" }, { id: "descartada", label: "Descartada" }];
  K.FORMAT_VERSION = 1;
  K.NUM_RE = /^\d{2,4}([.,]\d{1,2})?$/;
  var MEAS_FIELDS = ["date", "mass", "balance", "who", "config", "note", "overgrips", "strap", "protector"];

  function knownIds() {
    var ids = { notes: {}, status: {}, fnotes: {}, compare: {} };
    DATA.branches.forEach(function (b) { ids.notes["branch-" + b.id] = 1; });
    DATA.samples.forEach(function (s) { ids.notes["sample-" + s.id] = 1; ids.compare[s.id] = 1; });
    DATA.devItems.forEach(function (d) { ids.notes["dev-" + d.id] = 1; ids.status[d.id] = DATA.statusOptions; });
    DATA.stages.forEach(function (s) { ids.notes["stage-" + s.id] = 1; ids.status[s.id] = DATA.statusOptions; });
    DATA.loanRefs.forEach(function (l) { ids.status[l.id] = K.loanStatusOptions; });
    DATA.factories.forEach(function (f) { ids.notes["factory-" + f.id] = 1; DATA.factoryMatrix.forEach(function (m) { ids.fnotes[m.id + "|" + f.id] = 1; }); });
    DATA.references.forEach(function (r) { ids.compare[r.id] = 1; });
    return ids;
  }
  function isPlain(o) { return o !== null && typeof o === "object" && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype; }
  function validDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + "T00:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;
  }
  /* Valida una medición local. Devuelve una lista de errores (vacía si es válida). */
  K.measurementErrors = function (m) {
    var e = [];
    if (!isPlain(m)) return ["no es un objeto"];
    Object.keys(m).forEach(function (k) { if (MEAS_FIELDS.indexOf(k) < 0) e.push("campo desconocido “" + k + "”"); });
    if (!validDate(m.date)) e.push("fecha inválida (formato AAAA-MM-DD)");
    ["mass", "balance", "who", "config", "note"].forEach(function (k) { if (m[k] !== undefined && typeof m[k] !== "string") e.push("“" + k + "” debe ser texto"); });
    if (typeof m.mass === "string" && m.mass && !K.NUM_RE.test(m.mass)) e.push("masa no numérica en g");
    if (typeof m.balance === "string" && m.balance && !K.NUM_RE.test(m.balance)) e.push("balance no numérico en mm");
    if (!m.mass && !m.balance) e.push("falta masa o balance");
    if (typeof m.config !== "string" || !m.config.trim()) e.push("falta la configuración de medición");
    if (m.overgrips !== undefined && m.overgrips !== null && [0, 1, 2, 3].indexOf(m.overgrips) < 0) e.push("overgrips debe ser 0 a 3 o null");
    ["strap", "protector"].forEach(function (k) { if (m[k] !== undefined && m[k] !== null && typeof m[k] !== "boolean") e.push("“" + k + "” debe ser true, false o null"); });
    return e;
  };
  /* Valida el estado completo. No modifica nada: devuelve { ok, errors, state, summary }. */
  K.validateState = function (d) {
    var errors = [], ids = knownIds(), MAXTXT = 20000;
    function err(m) { if (errors.length < 50) errors.push(m); }
    if (!isPlain(d)) return { ok: false, errors: ["“data” debe ser un objeto"] };
    if (d.version !== K.FORMAT_VERSION) err("versión de datos " + JSON.stringify(d.version) + " no compatible (se espera " + K.FORMAT_VERSION + ")");
    var allowed = ["version", "notes", "status", "measurements", "results", "factoryNotes", "compare"];
    Object.keys(d).forEach(function (k) { if (allowed.indexOf(k) < 0) err("sección desconocida “" + k + "”"); });
    ["notes", "status", "measurements", "factoryNotes"].forEach(function (k) { if (!isPlain(d[k])) err("“" + k + "” debe ser un objeto"); });
    if (d.results !== undefined && !(isPlain(d.results) && Object.keys(d.results).length === 0)) err("“results” no se admite en este formato (debe estar vacío)");
    if (!Array.isArray(d.compare)) err("“compare” debe ser una lista");
    if (errors.length) return { ok: false, errors: errors };
    Object.keys(d.notes).forEach(function (k) {
      if (!ids.notes[k]) err("nota con identificador desconocido “" + k + "”");
      else if (typeof d.notes[k] !== "string") err("la nota “" + k + "” debe ser texto");
      else if (d.notes[k].length > MAXTXT) err("la nota “" + k + "” es demasiado larga");
    });
    Object.keys(d.status).forEach(function (k) {
      var opts = ids.status[k];
      if (!opts) err("estado con identificador desconocido “" + k + "”");
      else if (!opts.some(function (o) { return o.id === d.status[k]; })) err("estado inválido para “" + k + "”: " + JSON.stringify(d.status[k]));
    });
    Object.keys(d.factoryNotes).forEach(function (k) {
      if (!ids.fnotes[k]) err("nota de fábrica con identificador desconocido “" + k + "”");
      else if (typeof d.factoryNotes[k] !== "string" || d.factoryNotes[k].length > MAXTXT) err("la nota de fábrica “" + k + "” debe ser texto");
    });
    var nMeas = 0;
    Object.keys(d.measurements).forEach(function (k) {
      if (!K.sampleById[k]) { err("mediciones de una muestra desconocida “" + k + "”"); return; }
      if (!Array.isArray(d.measurements[k])) { err("las mediciones de “" + k + "” deben ser una lista"); return; }
      d.measurements[k].forEach(function (m, i) {
        K.measurementErrors(m).forEach(function (x) { err("medición " + (i + 1) + " de " + K.sampleById[k].name + ": " + x); });
        nMeas++;
      });
    });
    if (d.compare.length > 3) err("el comparador admite hasta 3 palas");
    d.compare.forEach(function (id, i) {
      if (typeof id !== "string" || !ids.compare[id]) err("pala desconocida en el comparador: " + JSON.stringify(id));
      else if (d.compare.indexOf(id) !== i) err("pala repetida en el comparador: " + id);
    });
    if (errors.length) return { ok: false, errors: errors };
    var state = JSON.parse(JSON.stringify(d));
    state.results = {};
    return { ok: true, errors: [], state: state,
      summary: Object.keys(d.notes).length + " notas, " + Object.keys(d.status).length + " estados, " + nMeas + " mediciones, " + Object.keys(d.factoryNotes).length + " notas de fábrica" };
  };
  /* Valida el texto de una exportación completa. */
  K.validateImportText = function (text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, errors: ["el JSON no es válido"] }; }
    if (!isPlain(obj)) return { ok: false, errors: ["el archivo no contiene un objeto JSON"] };
    if (obj.app !== "korve-explorador") return { ok: false, errors: ["no es una exportación del Explorador KORVE"] };
    if (obj.formatVersion !== undefined && obj.formatVersion !== K.FORMAT_VERSION) return { ok: false, errors: ["formato " + JSON.stringify(obj.formatVersion) + " no compatible"] };
    return K.validateState(obj.data);
  };
  K.state = function () { return K.load(); };
  K.setNote = function (id, text) { var s = K.load(); if (text) s.notes[id] = text; else delete s.notes[id]; K.save(); };
  K.getNote = function (id) { return K.load().notes[id] || ""; };
  K.getStatus = function (id) { return K.load().status[id] || "pendiente"; };
  K.setStatus = function (id, st) { var s = K.load(); if (st === "pendiente") delete s.status[id]; else s.status[id] = st; K.save(); };
  K.statusLabel = function (id) {
    var o = DATA.statusOptions.filter(function (x) { return x.id === id; })[0];
    return o ? o.label : id;
  };

  K.exportText = function () {
    K.flushPending();
    return JSON.stringify({ app: "korve-explorador", formatVersion: K.FORMAT_VERSION, exportedAt: new Date().toISOString(), researchCutoff: DATA.meta.cutoff, data: K.load() }, null, 2);
  };
  K.downloadJSON = function (json) {
    try {
      var blob = new Blob([json], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "korve-notas-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) {}
  };
  /* Importación atómica: valida todo primero; si algo falla, el estado actual queda intacto. */
  K.importText = function (text, cb) {
    var res = K.validateImportText(text);
    if (!res.ok) return cb(new Error(res.errors.slice(0, 5).join("; ") + (res.errors.length > 5 ? " (y " + (res.errors.length - 5) + " más)" : "")));
    K.flushPending();
    var prev = mem;
    mem = res.state;
    if (!K.save() && K.storageWasOk !== false) {
      mem = prev;
      return cb(new Error("el navegador no permitió guardar; no se cambió nada"));
    }
    cb(null, res.summary);
  };
  K.clearData = function () { K.flushPending(); mem = blank(); K.save(); };

  /* Barra de exportación/importación reutilizable. */
  K.storageBar = function () {
    return '<div class="storage-bar card small">' +
      "<span><b>Notas y estados locales.</b> Se guardan solo en este navegador" + (K.storageOk ? "" : " (almacenamiento no disponible: se perderán al cerrar)") + ".</span>" +
      (K.loadWarning ? '<span class="miss">' + esc(K.loadWarning) + "</span>" : "") +
      '<button class="btn small" data-action="export">Exportar JSON</button>' +
      '<label class="btn small">Importar archivo<input type="file" accept="application/json,.json" data-action="import" class="sr-only"></label>' +
      '<button class="btn small" data-action="paste-import">Importar pegando JSON</button>' +
      "</div>";
  };

  /* Campo de nota reutilizable. */
  K.noteField = function (id, label) {
    return '<details class="note-box"><summary>' + esc(label || "Notas locales") + (K.getNote(id) ? " (con contenido)" : "") + "</summary>" +
      '<textarea data-note="' + esc(id) + '" aria-label="' + esc(label || "Notas locales") + '" placeholder="Escribí una nota. Se guarda en este navegador.">' + esc(K.getNote(id)) + "</textarea></details>";
  };

  /* Resumen legible de una configuración estructurada (null = sin dato). */
  K.configSummary = function (c) {
    function tri(v, yes, no) { return v === true ? yes : v === false ? no : null; }
    var og = c.overgrips === null || c.overgrips === undefined ? "overgrips: sin dato" : c.overgrips + (c.overgrips === 1 ? " overgrip" : " overgrips");
    return [og, tri(c.strap, "con correa", "sin correa") || "correa: sin dato", tri(c.protector, "con protector", "sin protector") || "protector: sin dato"].join(" · ");
  };

  /* Símbolos de perfil, en trazo fino sobre una grilla de 24: POWER (diagonal ascendente, como el
   * corte del logo), HYBRID (mitad llena: equilibrio), CONTROL (mira: precisión). Son los mismos en
   * el mapa y en las vistas; diferencian sin agregar colores. */
  var ICONS = {
    POWER: '<path d="M5 19L19 5"/><path d="M9.5 5H19v9.5"/>',
    HYBRID: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
    CONTROL: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>'
  };
  K.branchIconPaths = function (id) { return ICONS[id] || ""; };
  K.branchIcon = function (id, cls) {
    return '<svg class="ico-branch' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[id] || "") + "</svg>";
  };

  /* Etiqueta del item comparable (referencia o muestra). */
  K.itemName = function (id) {
    if (K.refById[id]) return K.refById[id].name;
    if (K.sampleById[id]) return "KORVE " + K.sampleById[id].name + " (muestra " + K.sampleById[id].factory + ")";
    return id;
  };
})();
