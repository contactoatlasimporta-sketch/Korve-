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
    var h = (location.hash || "#mapa").slice(1), i = h.indexOf("/");
    var view = i < 0 ? h : h.slice(0, i), sub = i < 0 ? "" : h.slice(i + 1);
    if (VIEWS.indexOf(view) < 0) view = "mapa";
    return { view: view, sub: decodeURIComponent(sub) };
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
      K.exportData(); toast("Exportación descargada.");
    } else if (a === "del-measure") {
      var sid = b.getAttribute("data-sample"), idx = +b.getAttribute("data-idx");
      if (!confirm("¿Borrar este registro local de medición?")) return;
      (s.measurements[sid] || []).splice(idx, 1); K.save(); render(true);
    } else if (a === "clear-local") {
      if (!confirm("¿Borrar todas las notas, estados y mediciones locales? Exportá antes si querés conservarlas.")) return;
      K.clearData(); render(true); toast("Datos locales borrados.");
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.matches('input[type=file][data-action="import"]')) {
      var f = t.files && t.files[0]; if (!f) return;
      if (!confirm("Importar reemplaza las notas, estados y mediciones locales actuales. ¿Continuar?")) { t.value = ""; return; }
      K.importData(f, function (err) {
        if (err) toast("No se pudo importar: " + err.message); else { render(true); toast("Datos importados."); }
      });
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
