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
  K.load = function () {
    if (mem) return mem;
    try {
      var raw = window.localStorage.getItem(KEY);
      mem = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch (e) { K.storageOk = false; mem = blank(); }
    return mem;
  };
  K.save = function () {
    try { window.localStorage.setItem(KEY, JSON.stringify(mem)); K.storageOk = true; }
    catch (e) { K.storageOk = false; }
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

  K.exportData = function () {
    var s = K.load();
    var payload = { app: "korve-explorador", exportedAt: new Date().toISOString(), researchCutoff: DATA.meta.cutoff, data: s };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "korve-notas-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  K.importData = function (file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        var d = obj && obj.app === "korve-explorador" ? obj.data : null;
        if (!d || typeof d !== "object") throw new Error("El archivo no es una exportación del Explorador KORVE.");
        var fresh = blank();
        ["notes", "status", "measurements", "results", "factoryNotes"].forEach(function (k) {
          if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) fresh[k] = d[k];
        });
        if (Array.isArray(d.compare)) fresh.compare = d.compare.filter(function (id) { return typeof id === "string"; }).slice(0, 3);
        mem = fresh; K.save();
        cb(null);
      } catch (e) { cb(e); }
    };
    reader.onerror = function () { cb(new Error("No se pudo leer el archivo.")); };
    reader.readAsText(file);
  };
  K.clearData = function () { mem = blank(); K.save(); };

  /* Barra de exportación/importación reutilizable. */
  K.storageBar = function () {
    return '<div class="storage-bar card small">' +
      "<span><b>Notas y estados locales.</b> Se guardan solo en este navegador" + (K.storageOk ? "" : " (almacenamiento no disponible: se perderán al cerrar)") + ".</span>" +
      '<button class="btn small" data-action="export">Exportar JSON</button>' +
      '<label class="btn small">Importar JSON<input type="file" accept="application/json,.json" data-action="import" class="sr-only"></label>' +
      "</div>";
  };

  /* Campo de nota reutilizable. */
  K.noteField = function (id, label) {
    return '<details class="note-box"><summary>' + esc(label || "Notas locales") + (K.getNote(id) ? " (con contenido)" : "") + "</summary>" +
      '<textarea data-note="' + esc(id) + '" aria-label="' + esc(label || "Notas locales") + '" placeholder="Escribí una nota. Se guarda en este navegador.">' + esc(K.getNote(id)) + "</textarea></details>";
  };

  /* Etiqueta del item comparable (referencia o muestra). */
  K.itemName = function (id) {
    if (K.refById[id]) return K.refById[id].name;
    if (K.sampleById[id]) return "KORVE " + K.sampleById[id].name + " (muestra " + K.sampleById[id].factory + ")";
    return id;
  };
})();
