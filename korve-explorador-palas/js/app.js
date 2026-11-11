/* KORVE Explorador — enrutador por hash y eventos globales. */
(function () {
  var DATA = window.KORVE_DATA, K = window.K, V = window.KViews;
  var app = document.getElementById("app");
  var cleanup = null, current = null;
  var VIEWS = ["mapa", "mercado", "comparador", "muestras", "desarrollo", "fabrica", "fuentes"];

  document.getElementById("cutoff").textContent = "Corte de la investigación: " + DATA.meta.cutoff + " · Propuestas, no especificaciones aprobadas";
  document.getElementById("footer").innerHTML = "Fuente inicial: informe “" + K.esc(DATA.meta.title) + "”, corte " + K.esc(DATA.meta.cutoff) +
    ". Aplicación local, sin cuentas ni servidor. Los datos están en la carpeta <code>data/</code>.";

  function parse() {
    /* Rutas: #vista o #vista--sub--sub (también acepta "/" de versiones anteriores). */
    var h = decodeURIComponent((location.hash || "#mapa").slice(1)), m = h.match(/--|\//);
    var view = m ? h.slice(0, m.index) : h, sub = m ? h.slice(m.index + m[0].length) : "";
    if (VIEWS.indexOf(view) < 0) view = "mapa";
    return { view: view, sub: sub };
  }

  function render(keepScroll) {
    var r = parse();
    var y = window.scrollY;
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    var v = V[r.view];
    app.innerHTML = v.html(r.sub);
    if (v.mount) cleanup = v.mount(r.sub) || null;
    document.querySelectorAll("nav.tabs a").forEach(function (a) {
      if (a.getAttribute("data-view") === r.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var act = document.querySelector('nav.tabs a[aria-current="page"]'), ul = document.querySelector("nav.tabs ul");
    if (act && ul) ul.scrollLeft = act.parentNode.offsetLeft - (ul.clientWidth - act.offsetWidth) / 2;
    document.title = "KORVE · " + document.querySelector('nav.tabs a[data-view="' + r.view + '"]').textContent;
    if (keepScroll) window.scrollTo(0, y);
    else if (r.view !== current) { window.scrollTo(0, 0); }
    current = r.view;
  }

  window.KApp = { rerender: function () { render(true); } };

  window.addEventListener("hashchange", function () {
    /* El mapa actualiza su hash con replaceState (no dispara hashchange): todo hashchange es navegación. */
    render(false);
  });

  function toast(msg) {
    var t = document.createElement("div");
    t.setAttribute("role", "status");
    t.style.cssText = "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#0d0d0d;color:#fff;padding:10px 14px;border-radius:8px;z-index:50;font-size:14px;max-width:90vw;border-left:4px solid #9c2a3d";
    t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  K.toast = toast;

  /* Diálogo propio (el visor de artifacts no muestra confirm()). */
  function dialog(inner, onMount) {
    var prev = document.activeElement;
    var o = document.createElement("div");
    o.className = "overlay";
    o.innerHTML = '<div class="dialog" role="dialog" aria-modal="true">' + inner + "</div>";
    document.body.appendChild(o);
    function close() { o.remove(); if (prev && prev.focus) prev.focus(); }
    o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-close]")) close(); });
    o.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    onMount(o.querySelector(".dialog"), close);
    var f = o.querySelector("[data-autofocus]") || o.querySelector("button"); if (f) f.focus();
  }
  K.ask = function (msg, okLabel, onYes) {
    dialog("<p>" + K.esc(msg) + '</p><div class="dialog-actions"><button class="btn" data-close data-autofocus>Cancelar</button><button class="btn primary" data-ok>' + K.esc(okLabel) + "</button></div>",
      function (d, close) { d.querySelector("[data-ok]").addEventListener("click", function () { close(); onYes(); }); });
  };
  K.confirmImport = function (text) {
    K.ask("Importar reemplaza las notas, estados y mediciones locales actuales. ¿Continuar?", "Importar", function () {
      K.importText(text, function (err) {
        if (err) toast("No se pudo importar: " + err.message); else { render(true); toast("Datos importados."); }
      });
    });
  };
  /* Dentro del visor del chat la página corre en un marco que no permite descargas: solo se ofrece copiar. */
  var inFrame = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  K.showExport = function () {
    var json = K.exportText();
    dialog('<h2>Exportar notas y estados</h2><p class="small">Guardá este JSON para no perder tus datos. Si la descarga no funciona (por ejemplo dentro del chat), copialo y pegalo en una nota o un archivo.</p>' +
      '<textarea id="export-json" readonly rows="10" aria-label="JSON exportado">' + K.esc(json) + "</textarea>" +
      '<div class="dialog-actions"><button class="btn" data-close>Cerrar</button>' + (inFrame ? "" : '<button class="btn" data-dl>Descargar archivo</button>') + '<button class="btn primary" data-copy data-autofocus>Copiar JSON</button></div>',
      function (d) {
        var ta = d.querySelector("textarea");
        d.querySelector("[data-copy]").addEventListener("click", function () {
          var done = function () { toast("JSON copiado."); };
          var fallback = function () { ta.focus(); ta.select(); toast("Seleccioné el texto: copialo con el menú del teléfono o Ctrl+C."); };
          try { navigator.clipboard.writeText(json).then(done, fallback); } catch (e) { fallback(); }
        });
        if (!inFrame) d.querySelector("[data-dl]").addEventListener("click", function () { K.downloadJSON(json); toast("Si no se descargó, usá Copiar JSON."); });
      });
  };
  K.showPasteImport = function () {
    dialog('<h2>Importar pegando el JSON</h2><textarea id="import-json" rows="10" data-autofocus aria-label="JSON a importar" placeholder="Pegá aquí el JSON exportado"></textarea>' +
      '<div class="dialog-actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-imp>Importar</button></div>',
      function (d, close) {
        d.querySelector("[data-imp]").addEventListener("click", function () {
          var t = d.querySelector("textarea").value.trim();
          if (!t) { toast("Pegá primero el JSON exportado."); return; }
          close(); K.confirmImport(t);
        });
      });
  };

  /* ----- Delegación de eventos ----- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]"); if (!b || b.tagName === "INPUT") return;
    var a = b.getAttribute("data-action"), s = K.state();
    if (a === "add-compare") {
      var id = b.getAttribute("data-id");
      if (s.compare.indexOf(id) >= 0) { toast("Ya está en el comparador."); return; }
      if (s.compare.length >= 3) { toast("El comparador admite hasta tres palas. Quitá una primero."); return; }
      s.compare.push(id); K.save();
      toast("Agregada al comparador (" + s.compare.length + "/3): " + K.itemName(id));
    } else if (a === "remove-compare") {
      s.compare = s.compare.filter(function (x) { return x !== b.getAttribute("data-id"); }); K.save(); render(true);
    } else if (a === "clear-compare") {
      s.compare = []; K.save(); render(true);
    } else if (a === "export") {
      K.showExport();
    } else if (a === "del-measure") {
      var sid = b.getAttribute("data-sample"), idx = +b.getAttribute("data-idx");
      K.ask("¿Borrar este registro local de medición?", "Borrar", function () { (s.measurements[sid] || []).splice(idx, 1); K.save(); render(true); });
    } else if (a === "clear-local") {
      K.ask("¿Borrar todas las notas, estados y mediciones locales? Exportá antes si querés conservarlas.", "Borrar todo", function () { K.clearData(); render(true); toast("Datos locales borrados."); });
    } else if (a === "paste-import") {
      K.showPasteImport();
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches('input[type=file][data-action="import"]')) {
      var f = t.files && t.files[0]; if (!f) return;
      t.value = "";
      var reader = new FileReader();
      reader.onload = function () { K.confirmImport(String(reader.result)); };
      reader.onerror = function () { toast("No se pudo leer el archivo."); };
      reader.readAsText(f);
    } else if (t.matches("select[data-status]")) {
      K.setStatus(t.getAttribute("data-status"), t.value); render(true);
      toast("Estado guardado localmente: " + t.options[t.selectedIndex].text);
    }
  });

  var timers = {};
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.matches("textarea[data-note]")) {
      var id = t.getAttribute("data-note");
      clearTimeout(timers[id]); timers[id] = setTimeout(function () { K.setNote(id, t.value.trim() ? t.value : ""); }, 300);
    } else if (t.matches("textarea[data-fnote]")) {
      var key = t.getAttribute("data-fnote");
      clearTimeout(timers[key]); timers[key] = setTimeout(function () {
        var s = K.state(); if (t.value.trim()) s.factoryNotes[key] = t.value; else delete s.factoryNotes[key]; K.save();
      }, 300);
    }
  });

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.matches(".measure-form")) return;
    e.preventDefault();
    var fd = new FormData(f), sid = f.getAttribute("data-sample");
    var rec = { date: fd.get("date"), mass: String(fd.get("mass") || "").trim(), balance: String(fd.get("balance") || "").trim(), who: String(fd.get("who") || "").trim(), config: String(fd.get("config") || "").trim(), note: String(fd.get("note") || "").trim() };
    var num = /^\d{2,4}([.,]\d{1,2})?$/;
    if (!rec.mass && !rec.balance) { toast("Ingresá al menos masa (g) o balance (mm)."); return; }
    if ((rec.mass && !num.test(rec.mass)) || (rec.balance && !num.test(rec.balance))) { toast("Usá números en g y mm, por ejemplo 364,1."); return; }
    if (!rec.config) { toast("La configuración de medición es obligatoria."); return; }
    var s = K.state(); (s.measurements[sid] = s.measurements[sid] || []).push(rec); K.save();
    render(true); toast("Medición guardada localmente.");
  });

  render(false);
})();
