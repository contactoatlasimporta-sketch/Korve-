/* KORVE Explorador — experiencia "Entender KORVE": portada (#inicio) y ficha de pala (#pala--mc005).
 * Lee los datos existentes (korve.js, branches.js, meta.js) y la capa de lectura simple (guide.js).
 * Sin dependencias. El movimiento se desactiva con prefers-reduced-motion y nada queda oculto
 * esperando una animación: todo el texto está en el documento desde el primer cuadro. */
(function () {
  var DATA = window.KORVE_DATA, K = window.K, V = window.KViews, G = DATA.guide, esc = K.esc;
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /* ---------- Piezas reutilizables ---------- */
  var VOICE = {}; G.voices.forEach(function (v) { VOICE[v.ev] = v; });
  /* Voz de evidencia en palabras simples; el nombre formal queda en el título y para lectores de pantalla. */
  function voice(ev, extra) {
    var v = VOICE[ev], e = DATA.evidence[ev];
    if (!v) return K.ev(ev, extra);
    return '<span class="voice voice-' + ev + '" title="' + esc(e.code + " · " + e.label + ". " + e.desc) + '"><i aria-hidden="true">' + esc(e.code) + "</i>" + esc(v.plain) + (extra ? " · " + esc(extra) : "") + '<span class="sr-only"> (' + esc(e.label) + ")</span></span>";
  }
  /* Término explicable en el lugar donde aparece. */
  function term(key, label) {
    var g = G.glossary[key];
    return '<button type="button" class="term" data-term="' + key + '" aria-expanded="false">' + esc(label || g.term) + "</button>";
  }
  function src(text) { return '<p class="src"><span>Fuente</span> ' + esc(text) + "</p>"; }
  function glyph(id, cls) { return id ? K.branchIcon(id, cls) : '<svg class="ico-branch ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/><path d="M10 9.5a2.2 2.2 0 1 1 3 2.1c-.7.3-1 .8-1 1.5v.4M12 16.6v.1"/></svg>'; }
  function arrow() { return '<svg class="arr" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function section(id, num, label, title, body, cls) {
    return '<section class="xp-sec ' + (cls || "") + '" id="' + id + '" aria-labelledby="' + id + '-t"><div class="xp-in">' +
      '<p class="xp-kicker"><span class="num">' + num + "</span>" + esc(label) + "</p>" +
      '<h2 class="xp-h2" id="' + id + '-t" tabindex="-1">' + title + "</h2>" + body + "</div></section>";
  }
  /* Desplegable con animación de altura; el contenido existe siempre en el documento. */
  function disclose(title, body, open, cls) {
    return '<details class="smooth ' + (cls || "") + '"' + (open ? " open" : "") + '><summary><span>' + title + '</span><svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="details-body">' + body + "</div></details>";
  }

  /* Silueta esquemática de pala (vista frontal). No representa a ninguna muestra. */
  var RACKET = "M150 18C232 18 272 70 272 160c0 82-36 140-96 158l-6 22v124c0 5-4 8-9 8h-22c-5 0-9-3-9-8V340l-6-22C64 300 28 242 28 160 28 70 68 18 150 18z";
  function holes() {
    var out = "";
    for (var y = 64; y <= 268; y += 17) for (var x = 66; x <= 234; x += 17) {
      var dx = (x - 150) / 104, dy = (y - 162) / 118;
      if (dx * dx + dy * dy < 0.86) out += '<circle cx="' + x + '" cy="' + y + '" r="2.6"/>';
    }
    return out;
  }
  /* Con opts.dims ({len, thick} en mm) agrega cota de largo y perfil lateral: 1 unidad del dibujo = 1 mm
   * a lo largo de la pala (la silueta va de y=18 a y=472), así el espesor queda a la misma escala. */
  function racketArt(opts) {
    opts = opts || {};
    var side = "";
    if (opts.dims && opts.dims.thick) {
      var t = opts.dims.thick, sx = 336;
      side = '<g class="r-dim"><path d="M300 18v454M294 18h12M294 472h12"/><text x="314" y="245" transform="rotate(-90 314 245)">' + esc(opts.dims.len) + ' de largo</text></g>' +
        '<g class="r-side"><rect x="' + sx + '" y="18" width="' + t + '" height="454" rx="' + Math.min(14, t / 2.6) + '"/><text x="' + (sx + t / 2) + '" y="496">' + t + ' mm</text></g>';
    }
    return '<svg class="racket-art' + (side ? " with-side" : "") + '" viewBox="0 0 ' + (side ? 392 : 300) + ' ' + (side ? 506 : 490) + '" role="img" aria-label="' + esc(opts.label || "Esquema ilustrativo de una pala de pádel") + '">' + side +
      /* El corte diagonal verde retoma el gesto del logo; queda detrás de la pala. */
      (opts.slash ? '<path class="r-slash" d="M238 -10L270 -10L92 500L60 500Z"/>' : "") +
      '<path class="r-body" d="' + RACKET + '"/>' +
      '<g class="r-holes">' + holes() + "</g>" +
      '<ellipse class="r-heart" cx="150" cy="302" rx="13" ry="17"/>' +
      '<path class="r-grip" d="M132 352h36M132 372h36M132 392h36M132 412h36M132 432h36M132 452h36"/>' + "</svg>";
  }

  /* ---------- Movimiento e interacción (montaje común) ---------- */
  function animateDetails(root) {
    root.querySelectorAll("details.smooth").forEach(function (d) {
      var sum = d.querySelector("summary"), body = d.querySelector(".details-body");
      sum.addEventListener("click", function (e) {
        if (RM.matches || !body.animate) return; /* sin animación: comportamiento nativo */
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        if (!d.open) {
          d.open = true;
          var h = body.scrollHeight;
          d._anim = body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 280, easing: "cubic-bezier(.2,.7,.2,1)" });
        } else {
          var h2 = body.scrollHeight;
          d._anim = body.animate([{ height: h2 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 220, easing: "cubic-bezier(.4,0,.6,1)" });
          d._anim.onfinish = function () { d.open = false; };
        }
      });
    });
  }

  /* Términos: una explicación flotante (en celulares, hoja inferior). Escape o tocar afuera la cierra. */
  var tip = null, tipBtn = null;
  function closeTip(returnFocus) {
    if (!tip) return;
    tip.classList.remove("show");
    if (tipBtn) { tipBtn.setAttribute("aria-expanded", "false"); if (returnFocus) tipBtn.focus(); }
    var t = tip; setTimeout(function () { if (t.parentNode && !t.classList.contains("show")) t.remove(); }, RM.matches ? 0 : 180);
    tip = null; tipBtn = null;
  }
  function openTip(btn) {
    var g = G.glossary[btn.getAttribute("data-term")];
    if (!g) return;
    if (tipBtn === btn) { closeTip(); return; }
    closeTip();
    tip = document.createElement("div");
    tip.className = "termtip"; tip.id = "termtip"; tip.setAttribute("role", "status");
    tip.innerHTML = '<p class="termtip-t">' + esc(g.term) + '</p><p>' + esc(g.text) + '</p><button type="button" class="termtip-x" aria-label="Cerrar explicación">×</button>';
    document.body.appendChild(tip);
    btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-controls", "termtip");
    tipBtn = btn;
    var r = btn.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    if (window.innerWidth < 600) tip.classList.add("sheet");
    else {
      tip.style.width = w + "px";
      var left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
      var below = r.bottom + 10 + tip.offsetHeight < window.innerHeight;
      tip.style.left = (left + window.scrollX) + "px";
      tip.style.top = (below ? r.bottom + 10 + window.scrollY : r.top - tip.offsetHeight - 10 + window.scrollY) + "px";
    }
    tip.querySelector(".termtip-x").addEventListener("click", function () { closeTip(true); });
    requestAnimationFrame(function () { if (tip) tip.classList.add("show"); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".term");
    if (b) { e.preventDefault(); openTip(b); return; }
    if (tip && !e.target.closest(".termtip")) closeTip();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && tip) { e.stopPropagation(); closeTip(true); } }, true);
  window.addEventListener("hashchange", function () { closeTip(); });

  /* Desplazamiento a una sección sin cambiar de vista; mueve el foco al título (teclado y lectores). */
  function goTo(id) {
    var el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth", block: "start" });
    var h = el.querySelector("h2, h1"); if (h) h.focus({ preventScroll: true });
  }

  /* Diagramas paso a paso: la lista de pasos siempre visible; el dibujo resalta el paso activo. */
  function stepper(id, title, steps, svg, note) {
    return '<figure class="stepper" id="' + id + '" data-step="0">' +
      '<div class="stepper-art">' + svg + '<p class="art-note">' + esc(note) + "</p></div>" +
      '<figcaption class="stepper-side"><p class="stepper-title">' + esc(title) + '</p><ol class="steps">' +
      steps.map(function (s, i) {
        return '<li><button type="button" class="step' + (i === 0 ? " on" : "") + '" data-i="' + i + '" aria-pressed="' + (i === 0) + '"><span class="step-n">' + (i + 1) + '</span><span class="step-t">' + esc(s.title) + '</span><span class="step-d">' + esc(s.text) + "</span></button></li>";
      }).join("") + "</ol>" +
      '<div class="stepper-nav"><button type="button" class="btn small" data-step-prev aria-label="Paso anterior">' + "←" + '</button><span class="stepper-count" aria-live="polite">Paso 1 de ' + steps.length + '</span><button type="button" class="btn small primary" data-step-next aria-label="Paso siguiente">Siguiente ' + arrow() + "</button></div>" +
      "</figcaption></figure>";
  }
  function mountSteppers(root) {
    root.querySelectorAll(".stepper").forEach(function (f) {
      var btns = f.querySelectorAll(".step"), n = btns.length, count = f.querySelector(".stepper-count");
      function set(i) {
        i = Math.max(0, Math.min(n - 1, i));
        f.setAttribute("data-step", i);
        btns.forEach(function (b, j) { b.classList.toggle("on", j === i); b.classList.toggle("done", j < i); b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
        count.textContent = "Paso " + (i + 1) + " de " + n + ": " + btns[i].querySelector(".step-t").textContent;
        f.querySelector("[data-step-prev]").disabled = i === 0;
        var nx = f.querySelector("[data-step-next]"); nx.disabled = i === n - 1;
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { set(+b.getAttribute("data-i")); }); });
      f.querySelector("[data-step-prev]").addEventListener("click", function () { set(+f.getAttribute("data-step") - 1); });
      f.querySelector("[data-step-next]").addEventListener("click", function () { set(+f.getAttribute("data-step") + 1); });
      set(0);
    });
  }

  /* ======================================================================
     PORTADA
     ====================================================================== */
  var PROFILE_ORDER = ["POWER", "HYBRID", "CONTROL"];
  var SAMPLE_PROFILE = { w3: "POWER", amp22: "CONTROL", mc005: "HYBRID", ks01: null };
  /* Lenguaje gráfico propio de cada perfil: diagonales (impulso), campo partido (equilibrio), anillos (precisión). */
  function profileArt(id) {
    var g = "";
    if (id === "POWER") {
      for (var i = 0; i < 9; i++) g += '<path class="draw" style="--d:' + (i * 40) + 'ms" d="M' + (-40 + i * 34) + ' 230L' + (110 + i * 34) + ' 10"/>';
      g += '<path class="draw accent" style="--d:200ms" d="M40 200L190 50M140 50h50v50"/>';
    } else if (id === "HYBRID") {
      g += '<circle class="draw" cx="120" cy="120" r="92"/><circle class="draw" style="--d:80ms" cx="120" cy="120" r="64"/>';
      g += '<path class="fill-half" d="M120 28a92 92 0 0 1 0 184z"/><path class="draw accent" style="--d:200ms" d="M120 14v212"/>';
    } else {
      [96, 70, 44, 18].forEach(function (r, i) { g += '<circle class="draw" style="--d:' + (i * 70) + 'ms" cx="120" cy="120" r="' + r + '"/>'; });
      g += '<path class="draw accent" style="--d:260ms" d="M120 4v40M120 196v40M4 120h40M196 120h40"/><circle class="dot" cx="120" cy="120" r="5"/>';
    }
    return '<svg class="profile-art art-' + id + '" viewBox="0 0 240 240" aria-hidden="true">' + g + "</svg>";
  }
  function profilePanel(id) {
    var b = K.branchById[id], p = G.profiles[id], sid = b.sample.sampleIds[0], s = K.sampleById[sid];
    return '<div class="pf-panel" data-profile="' + id + '" id="pf-panel" role="tabpanel" aria-labelledby="pf-tab-' + id + '" tabindex="0">' +
      '<div class="pf-art">' + profileArt(id) + "</div>" +
      '<div class="pf-copy">' +
      '<p class="pf-status"><span class="dot-live"></span>Hipótesis de desarrollo · no aprobada</p>' +
      '<h3 class="pf-name">' + esc(id) + '<span>' + esc(p.verb) + "</span></h3>" +
      '<p class="pf-plain">' + esc(p.plain) + "</p>" +
      '<dl class="pf-facts"><div><dt>Para quién</dt><dd>' + esc(p.player) + "</dd></div>" +
      '<div><dt>El límite</dt><dd>' + esc(p.tradeoff) + "</dd></div>" +
      '<div><dt>Muestra que evaluamos</dt><dd><a class="pf-sample" href="' + (sid === "mc005" ? "#pala--mc005" : "#muestras--" + sid) + '">' + esc(s.name) + " · " + esc(s.factory) + " " + arrow() + "</a></dd></div></dl>" +
      disclose("Profundizar en " + esc(id), '<p>' + esc(b.behavior.summary) + "</p>" +
        '<p class="mini-h">Ventana de peso y balance para experimentar ' + voice("PR") + '</p><p class="mono-line">' + esc(b.window.mass) + " · " + esc(b.window.balance) + '</p><p class="muted small">' + esc(DATA.windowNote) + "</p>" +
        '<p class="mini-h">Cómo se decide</p><p>' + esc(b.tests.criterion.main) + " " + esc(b.tests.criterion.also) + "</p>" +
        '<p><a class="link-arrow" href="#mapa--' + id + '">Ver ' + esc(id) + " en el mapa " + arrow() + "</a></p>" + src(G.profilesSrc), false, "on-dark") +
      "</div></div>";
  }

  V.inicio = {
    html: function () {
      var h = G.hero, m = DATA.meta;
      var hero = '<section class="xp-hero" aria-labelledby="hero-t"><div class="hero-court" aria-hidden="true"></div><div class="xp-in hero-grid">' +
        '<div class="hero-copy">' +
        '<p class="hero-eyebrow">' + esc(h.eyebrow) + "</p>" +
        '<h1 class="hero-title" id="hero-t">' + esc(h.title) + "</h1>" +
        '<p class="hero-lead">' + esc(h.lead) + "</p>" +
        '<div class="hero-actions"><button type="button" class="cta" data-goto="s-que">Explorar el proyecto ' + arrow() + '</button><a class="cta ghost" href="#pala--mc005">Ver la ficha de MC-005</a></div>' +
        '<p class="hero-status"><span class="dot-live"></span>' + esc(h.status) + " Corte de la investigación: " + esc(m.cutoff) + ".</p></div>" +
        '<figure class="hero-art">' + racketArt({ slash: true, label: "Esquema ilustrativo de una pala, no representa a ninguna muestra" }) +
        '<div class="hero-glyphs" aria-hidden="true">' + PROFILE_ORDER.map(function (id) { return '<span class="hg hg-' + id + '">' + glyph(id) + '<b>' + id + "</b></span>"; }).join("") + "</div>" +
        '<figcaption>Esquema ilustrativo · no es una muestra</figcaption></figure></div>' +
        '<nav class="route xp-in" aria-label="Recorrido de la portada"><ol>' +
        [["s-que", "Qué queremos crear"], ["s-perfiles", "Tres perfiles"], ["s-muestras", "Cuatro muestras"], ["s-estado", "Dónde estamos"]].map(function (r, i) {
          return '<li><button type="button" data-goto="' + r[0] + '"><span class="num">0' + (i + 1) + "</span>" + esc(r[1]) + "</button></li>";
        }).join("") + "</ol></nav></section>";

      var que = section("s-que", "01", "Qué queremos crear", "Una línea de tres palas con propósito propio.",
        '<ol class="principles">' + G.principles.map(function (p, i) { return '<li><span class="pr-n">' + (i + 1) + '</span><p class="pr-t">' + esc(p.title) + '</p><p class="pr-d">' + esc(p.text) + "</p></li>"; }).join("") + "</ol>" +
        disclose("Por qué no hacemos un ranking de palas", "<p>" + esc(m.noBest) + "</p>" + src("Informe, sección 1")) + src(G.principlesSrc));

      var tabs = '<div class="pf-tabs" role="tablist" aria-label="Perfiles de KORVE">' + PROFILE_ORDER.map(function (id, i) {
        return '<button type="button" role="tab" class="pf-tab" id="pf-tab-' + id + '" data-profile="' + id + '" aria-selected="' + (i === 0) + '" aria-controls="pf-panel" tabindex="' + (i === 0 ? 0 : -1) + '">' + glyph(id) + '<span class="pf-tab-n">' + id + '</span><span class="pf-tab-v">' + esc(G.profiles[id].verb) + "</span></button>";
      }).join("") + '<span class="pf-ink" aria-hidden="true"></span></div>';
      var perfiles = section("s-perfiles", "02", "Tres perfiles", "Lo que buscamos que haga cada una.",
        '<p class="xp-lead">Elegí un perfil. Las descripciones son objetivos de desarrollo: todavía hay que demostrarlos en cancha y en laboratorio.</p>' +
        '<div class="pf">' + tabs + '<div class="pf-stage">' + profilePanel("POWER") + "</div></div>", "dark");

      var muestras = section("s-muestras", "03", "Cuatro muestras", "Qué papel estamos evaluando para cada una.",
        '<p class="xp-lead">Tenemos dos muestras de cada fábrica. Ninguna está aprobada: cada rol es una hipótesis que hay que comprobar.</p>' +
        '<ol class="samples">' + ["w3", "amp22", "mc005", "ks01"].map(function (id) {
          var s = K.sampleById[id], pid = SAMPLE_PROFILE[id], star = id === "mc005";
          return '<li class="sm' + (star ? " sm-ref" : "") + '"><div class="sm-id"><span class="sm-name">' + esc(s.name) + '</span><span class="sm-fab">' + esc(s.factory) + "</span></div>" +
            '<div class="sm-role">' + glyph(pid) + '<span><b>' + esc(s.role) + "</b>" + esc(s.roleStatus) + "</span></div>" +
            '<p class="sm-plain">' + esc(G.samplesPlain[id]) + "</p>" +
            '<a class="sm-go' + (star ? " primary" : "") + '" href="' + (star ? "#pala--mc005" : "#muestras--" + id) + '">' + (star ? "Abrir ficha" : "Ver datos") + " " + arrow() + "</a></li>";
        }).join("") + "</ol>" + src(G.samplesSrc));

      var stage = DATA.stages.filter(function (s) { return s.id === G.next.stageId; })[0];
      var st = K.getStatus(G.next.stageId);
      var estado = section("s-estado", "04", "Dónde estamos", "Lo que sabemos, lo que falta y el próximo paso.",
        '<div class="state">' +
        '<div class="st st-known"><h3><span class="st-ico" aria-hidden="true"></span>Lo que sabemos</h3><ul>' + G.known.map(function (k) { return "<li>" + esc(k.text) + '<span class="st-src">' + esc(k.src) + "</span></li>"; }).join("") + "</ul></div>" +
        '<div class="st st-missing"><h3><span class="st-ico" aria-hidden="true"></span>Lo que falta comprobar</h3><ul>' + G.missing.map(function (k) { return "<li>" + esc(k.text) + '<span class="st-src">' + esc(k.src) + "</span></li>"; }).join("") + "</ul></div>" +
        '<div class="st st-next"><p class="st-next-k">Próximo paso ' + voice("PR") + '</p><h3>' + esc(G.next.title) + "</h3><p>" + esc(G.next.text) + "</p>" +
        '<p class="st-state">Estado: <b>' + esc(K.statusLabel(st)) + "</b>" + (st !== "pendiente" ? ' <span class="muted">(editado en este navegador)</span>' : "") + "</p>" +
        '<a class="cta small" href="#desarrollo">Ver el plan completo ' + arrow() + "</a>" + src(stage ? stage.name : G.next.src) + "</div></div>");

      var leer = '<section class="xp-sec xp-read" aria-labelledby="leer-t"><div class="xp-in"><h2 class="xp-h3" id="leer-t">Cómo leer cada dato</h2><p class="xp-lead">Cada cifra dice de dónde viene. Estas son las cuatro voces que vas a ver.</p><ul class="voices">' +
        G.voices.map(function (v) { return "<li>" + voice(v.ev) + "<p>" + esc(v.hint) + "</p></li>"; }).join("") +
        '</ul><p class="muted small">Las mismas etiquetas, con su nombre técnico, aparecen en todas las vistas de “Profundizar”. ' + term("k12", "¿Y qué significa 12K?") + " " + term("balance", "¿Qué es el balance?") + "</p></div></section>";

      var deep = '<section class="xp-sec xp-deep" aria-labelledby="deep-t"><div class="xp-in"><h2 class="xp-h3" id="deep-t">Profundizar</h2><p class="xp-lead">Todo el detalle técnico de la investigación, para cuando quieras verificar o comparar.</p><ul class="deep">' +
        [["mapa", "Mapa de decisiones", "POWER, HYBRID y CONTROL con sus referencias, pruebas y datos faltantes."],
         ["muestras", "Nuestras muestras", "Las cuatro fichas completas, con notas y mediciones propias."],
         ["comparador", "Comparador", "Hasta tres palas lado a lado, con advertencias de lo que no se puede comparar."],
         ["mercado", "Mercado", "41 marcas revisadas, con sus fuentes."],
         ["desarrollo", "Desarrollo y pruebas", "Mejoras propuestas, plan de validación y estado de cada ensayo."],
         ["fabrica", "Decisión de fábrica", "NEX y William: qué podría aportar cada una y qué falta validar."],
         ["fuentes", "Fuentes y método", "Cómo se clasificó cada dato, inconsistencias y enlaces."]].map(function (d) {
          return '<li><a href="#' + d[0] + '"><b>' + esc(d[1]) + "</b><span>" + esc(d[2]) + "</span>" + arrow() + "</a></li>";
        }).join("") + "</ul></div></section>";

      return '<div class="xp xp-home">' + hero + que + perfiles + muestras + estado + leer + deep + "</div>";
    },
    mount: function (sub) {
      var root = document.querySelector(".xp-home");
      root.addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (b) goTo(b.getAttribute("data-goto")); });
      /* Selector de perfiles: patrón de pestañas (flechas, Inicio, Fin). */
      var tabs = [].slice.call(root.querySelectorAll(".pf-tab")), stage = root.querySelector(".pf-stage"), ink = root.querySelector(".pf-ink");
      function placeInk(t) { ink.style.transform = "translateX(" + t.offsetLeft + "px)"; ink.style.width = t.offsetWidth + "px"; }
      function select(t, focus) {
        tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
        if (focus) t.focus();
        placeInk(t);
        stage.innerHTML = profilePanel(t.getAttribute("data-profile"));
        var p = stage.firstChild; p.classList.add("enter");
        animateDetails(stage);
        setTimeout(function () { p.classList.remove("enter"); }, 700);
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t, false); });
        t.addEventListener("keydown", function (e) {
          var j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (j === undefined) return;
          e.preventDefault(); select(tabs[(j + tabs.length) % tabs.length], true);
        });
      });
      placeInk(tabs[0]);
      var ro = window.ResizeObserver ? new ResizeObserver(function () { placeInk(root.querySelector('.pf-tab[aria-selected="true"]')); }) : null;
      if (ro) ro.observe(root.querySelector(".pf-tabs"));
      animateDetails(root);
      if (sub) setTimeout(function () { goTo(sub); }, 0);
      return function () { if (ro) ro.disconnect(); closeTip(); };
    }
  };

  /* ======================================================================
     FICHA DE PALA (MC-005 como referencia de diseño)
     ====================================================================== */
  /* Largo y espesor declarados ("455 mm de largo; 38 mm de espesor"); si no están, no se dibuja cota. */
  function dimsOf(d) {
    if (!d) return null;
    var len = d.v.match(/(\d+)\s*mm de largo/), th = d.v.match(/(\d+)\s*mm de espesor/);
    return len && th ? { len: len[1] + " mm", thick: +th[1] } : null;
  }
  function decl(s, label) { return s.declared.filter(function (d) { return d.label === label; })[0] || null; }
  function meas(s, label) { return s.measured.filter(function (d) { return d.label === label; })[0] || null; }
  /* Cifra grande: separa número y unidad sin alterar el valor. */
  function big(v, u) {
    var m = String(v).match(/^(.*?)(?:\s*(g|mm))?$/), num = m[1], unit = u || m[2] || "";
    return '<span class="big"><span class="big-n">' + esc(num) + "</span>" + (unit ? '<span class="big-u">' + esc(unit) + "</span>" : "") + "</span>";
  }
  function chips(c) {
    var out = [];
    out.push(c.overgrips === null || c.overgrips === undefined ? "overgrips: sin dato" : c.overgrips + (c.overgrips === 1 ? " overgrip" : " overgrips"));
    out.push(c.strap === true ? "con correa" : c.strap === false ? "sin correa" : "correa: sin dato");
    out.push(c.protector === true ? "con protector" : c.protector === false ? "sin protector" : "protector: sin dato");
    return '<ul class="cfg">' + out.map(function (x) { return '<li class="' + (/sin dato/.test(x) ? "unk" : "") + '">' + esc(x) + "</li>"; }).join("") + "</ul>";
  }

  /* Diagrama de balance: largo a escala del dato declarado (455 mm); silueta ilustrativa.
   * Dos variantes: ancha (escritorio) y compacta (celular), para que el texto no quede diminuto al escalar. */
  function balanceArt(compact) {
    var L = 455, tgt = 255, tol = 7, wil = 250;
    var vw = compact ? 320 : 640, x0 = compact ? 26 : 40, W = compact ? 272 : 560, y = compact ? 74 : 96;
    var px = function (mm) { return x0 + mm / L * W; };
    var hw = compact ? 7 : 9, ht = compact ? 46 : 64;
    var racket = '<g class="bal-racket"><rect x="' + x0 + '" y="' + (y - hw) + '" width="' + (W * 0.36) + '" height="' + (2 * hw) + '" rx="' + (hw - 2) + '"/>' +
      '<path d="M' + (x0 + W * 0.33) + " " + (y - hw - 5) + "L" + (x0 + W * 0.42) + " " + (y - ht * .46) + "C" + (x0 + W * 0.56) + " " + (y - ht * 1.08) + " " + (x0 + W * 0.98) + " " + (y - ht) + " " + (x0 + W) + " " + y +
      "C" + (x0 + W * 0.98) + " " + (y + ht) + " " + (x0 + W * 0.56) + " " + (y + ht * 1.08) + " " + (x0 + W * 0.42) + " " + (y + ht * .46) + "L" + (x0 + W * 0.33) + " " + (y + hw + 5) + 'Z"/>' +
      '<rect class="cap" x="' + (x0 - 5) + '" y="' + (y - hw - 3) + '" width="7" height="' + (2 * hw + 6) + '" rx="2"/></g>';
    var fy = y + ht * .47 + 2;
    var fulcrum = '<g class="bal-fulcrum"><path d="M' + px(tgt) + " " + fy + "l-14 23h28z" + '"/><line x1="' + (px(tgt) - 50) + '" y1="' + (fy + 23) + '" x2="' + (px(tgt) + 50) + '" y2="' + (fy + 23) + '"/></g>';
    var dy = y - ht - 14;
    var dim = '<g class="bal-dim"><line x1="' + x0 + '" y1="' + dy + '" x2="' + px(tgt) + '" y2="' + dy + '"/><line x1="' + x0 + '" y1="' + (dy - 7) + '" x2="' + x0 + '" y2="' + (dy + 7) + '"/><line x1="' + px(tgt) + '" y1="' + (dy - 7) + '" x2="' + px(tgt) + '" y2="' + (dy + 7) + '"/>' +
      (compact ? '<text class="st" x="' + x0 + '" y="' + (dy - 12) + '">balance: desde el tapón, en mm</text>' : '<text x="' + ((x0 + px(tgt)) / 2) + '" y="' + (dy - 12) + '">balance: distancia desde el tapón (mm)</text>') +
      '<text class="lab" x="' + (compact ? x0 - 4 : x0 - 8) + '" y="' + (y + hw + 20) + '">tapón</text></g>';
    var sy = fy + 34;
    var shift = '<g class="bal-shift"><circle cx="' + px(180) + '" cy="' + (fy + 12) + '" r="5"/><circle cx="' + px(330) + '" cy="' + (fy + 12) + '" r="5"/>' +
      '<path d="M' + (px(180) + 12) + " " + (fy + 12) + "H" + (px(330) - 12) + '"/>' +
      (compact ? '<text x="' + px(180) + '" y="' + (sy + 6) + '">más rápida</text><text x="' + px(330) + '" y="' + (sy + 6) + '">más inercia</text>'
               : '<text x="' + px(180) + '" y="' + (sy + 6) + '">más bajo · más rápida</text><text x="' + px(330) + '" y="' + (sy + 6) + '">más alto · más inercia</text>') + "</g>";
    var my = sy + (compact ? 22 : 26);
    var mc = '<g class="bal-mc"><rect class="band" x="' + px(tgt - tol) + '" y="' + my + '" width="' + (px(tgt + tol) - px(tgt - tol)) + '" height="12" rx="3"/>' +
      '<line class="wil" x1="' + px(wil) + '" y1="' + (my - 5) + '" x2="' + px(wil) + '" y2="' + (my + 17) + '"/>' +
      (compact ? '<text class="st" x="' + x0 + '" y="' + (my + 34) + '">objetivo del proveedor: 255 ±7 mm</text><text class="st wil-c" x="' + x0 + '" y="' + (my + 52) + '">línea punteada: William informó 250 mm</text>'
               : '<text class="st" x="' + (px(tgt + tol) + 10) + '" y="' + (my + 10) + '">objetivo del proveedor: 255 ±7 mm</text><text class="wil-t" x="' + (px(wil) - 10) + '" y="' + (my + 32) + '">William informó 250 mm</text>') + "</g>";
    var vh = my + (compact ? 62 : 44);
    return '<svg class="bal-art ' + (compact ? "art-compact" : "art-wide") + '" viewBox="0 0 ' + vw + " " + vh + '" role="img" aria-label="Diagrama de balance: la pala apoyada en un punto de equilibrio medido desde el tapón">' + racket + fulcrum + dim + shift + mc + "</svg>";
  }
  /* Corte del núcleo: capas declaradas; espesores NO publicados, por eso las bandas son parejas. */
  function coreArt(compact) {
    var vw = compact ? 320 : 640, x = compact ? 34 : 70, w = compact ? 252 : 500, fw = compact ? 18 : 28, y = 30, g = "";
    var rows = [["c-12k", "Carbono 12K (cara exterior)", 30], ["c-glass", "Fibra de vidrio", 26], ["c-glass", "Fibra de vidrio", 26],
      ["c-h", "Núcleo · duro", 30], ["c-s", "Núcleo · blando", 30], ["c-h c-h2", "Núcleo · duro", 30]];
    rows.forEach(function (r) {
      g += '<g class="layer ' + r[0] + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (r[2] - 3) + '" rx="3"/><text x="' + (x + 12) + '" y="' + (y + (r[2] - 3) / 2) + '">' + esc(r[1]) + "</text></g>";
      y += r[2];
    });
    g += '<g class="layer c-other"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="34" rx="3"/><text x="' + (x + 12) + '" y="' + (y + 17) + '">' + (compact ? "Cara opuesta: sin detallar" : "Cara opuesta: composición no detallada por separado") + "</text></g>";
    g += '<g class="frame"><rect x="' + (x - fw - 6) + '" y="26" width="' + fw + '" height="' + (y + 42 - 26) + '" rx="7"/><rect x="' + (x + w + 6) + '" y="26" width="' + fw + '" height="' + (y + 42 - 26) + '" rx="7"/><text x="' + (x - fw / 2 - 6) + '" y="' + (y + 62) + '">marco</text><text x="' + (x + w + 6 + fw / 2) + '" y="' + (y + 62) + '">marco</text></g>';
    return '<svg class="core-art ' + (compact ? "art-compact" : "art-wide") + '" viewBox="0 0 ' + vw + " " + (y + 76) + '" role="img" aria-label="Corte esquemático: capas declaradas por William, con proporciones ilustrativas">' + g + "</svg>";
  }

  function numbersBlock(s) {
    var mT = decl(s, "Masa objetivo del proveedor"), bT = decl(s, "Balance objetivo del proveedor");
    var mW = decl(s, "Masa de la muestra informada por William"), bW = decl(s, "Balance de la muestra informado por William");
    var mM = meas(s, "Masa"), bM = meas(s, "Balance");
    var specs = s.compare.configSpecs, local = K.state().measurements[s.id] || [];
    function col(cls, kicker, ev, mv, bv, cfg, note) {
      return '<article class="num-col ' + cls + '"><p class="nc-k">' + esc(kicker) + "</p>" + voice(ev) +
        '<dl><div><dt>Peso</dt><dd>' + mv + "</dd></div><div><dt>" + term("balance") + " <span>desde el tapón</span></dt><dd>" + bv + "</dd></div></dl>" +
        '<p class="nc-cfg-t">Con qué se pesó</p>' + cfg + '<p class="nc-note">' + esc(note) + "</p></article>";
    }
    var missingBal = '<span class="big pending"><span class="big-n">Sin medir</span></span>';
    return '<div class="numbers">' +
      col("nc-target", "Lo que pide el proveedor", "KP", big(mT.v), big(bT.v), chips(specs[0]), "Objetivo de fabricación, no garantía por unidad. Se refiere a la pala sin overgrip.") +
      col("nc-william", "Lo que informó William", "KP", big(mW.v), big(bW.v), chips(specs[2]) + '<p class="cfg-x">Film de embalaje (≈1 g): no se sabe si estaba incluido.</p>', "Lectura de la muestra sin protocolo documentado: no se conoce el método, la resolución ni cuántas veces se midió.") +
      col("nc-ours", "Lo que medimos nosotros", "KM", big(mM.v, mM.u), bM && bM.missing ? missingBal : big(bM.v, bM.u), chips(specs[1]), "Medición de " + mM.who + ". Los dos overgrips suman peso: este número no se compara con los otros dos.") +
      "</div>" +
      (local.length ? '<div class="local-reg"><p class="mini-h">Registros cargados en este navegador ' + voice("KM", "registro local") + "</p><ul>" + local.map(function (m) {
        return "<li><b>" + esc(m.mass ? m.mass + " g" : "") + (m.mass && m.balance ? " · " : "") + esc(m.balance ? m.balance + " mm" : "") + "</b> " + esc(m.date) + " · " + esc(K.configSummary(m)) + " · " + esc(m.config) + "</li>";
      }).join("") + "</ul></div>" : "");
  }

  function provider(s) {
    var rows = [["Cara", "k12"], ["Núcleo", "nucleo"], ["Marco", null], ["Relleno", null], ["Acabado", null], ["Dimensiones", null]];
    return '<dl class="spec">' + rows.map(function (r) {
      var d = decl(s, r[0]); if (!d) return "";
      return '<div class="spec-row"><dt>' + esc(r[0]) + (r[1] ? " " + term(r[1], "?") : "") + "</dt><dd><b>" + esc(d.v) + "</b>" + (d.note ? '<span class="spec-note">' + esc(d.note) + "</span>" : "") + "</dd></div>";
    }).join("") + "</dl>";
  }

  V.pala = {
    html: function (sub) {
      var s = K.sampleById[sub || "mc005"];
      if (!s || s.id !== "mc005") {
        return '<div class="xp"><section class="xp-sec"><div class="xp-in"><p class="xp-kicker">Ficha de pala</p><h1 class="xp-h2">' + esc(s ? s.name : "Pala") + ': ficha en preparación</h1><p class="xp-lead">Por ahora la nueva ficha está disponible para MC-005, como referencia de diseño. Los datos de esta muestra siguen completos en “Nuestras muestras”.</p><p><a class="cta" href="#muestras' + (s ? "--" + s.id : "") + '">Ver los datos ' + arrow() + '</a> <a class="cta ghost dark-text" href="#pala--mc005">Abrir la ficha de MC-005</a></p></div></section></div>';
      }
      var x = G.mc005, b = K.branchById.HYBRID, dims = decl(s, "Dimensiones"), qc = decl(s, "Control de producción"), lab = decl(s, "Ensayos y densidad");
      var hero = '<section class="xp-hero pala-hero" aria-labelledby="pala-t"><div class="hero-court" aria-hidden="true"></div><div class="xp-in pala-grid">' +
        '<div class="pala-copy"><nav class="crumbs-x" aria-label="Ubicación"><a href="#inicio">Inicio</a><span>/</span><a href="#inicio--s-muestras">Muestras</a><span>/</span><span aria-current="page">' + esc(s.name) + "</span></nav>" +
        '<p class="hero-eyebrow">Muestra · fábrica ' + esc(s.factory) + "</p>" +
        '<h1 class="pala-title" id="pala-t">' + esc(s.name) + "</h1>" +
        '<p class="pala-role">' + glyph("HYBRID") + "<span>" + esc(x.headline) + "</span></p>" +
        '<p class="hero-lead">' + esc(x.summary) + "</p>" +
        '<p class="hero-status"><span class="dot-live"></span>' + esc(x.caveat) + "</p>" +
        '<div class="hero-actions"><a class="cta" href="#pala--mc005" data-goto="p-numeros">Ver los números ' + arrow() + '</a><button type="button" class="cta ghost" data-action="add-compare" data-id="mc005">Agregar al comparador</button></div></div>' +
        '<figure class="pala-art"><div class="pala-figure">' + racketArt({ label: "Esquema ilustrativo de pala con el largo y el espesor declarados por William", dims: dimsOf(dims) }) + "</div>" +
        '<figcaption><b>Esquema ilustrativo, no es una foto de MC-005.</b> Largo y espesor dibujados según lo declarado por William (' + esc(dims ? dims.v : "") + "); la forma y el ancho son genéricos. Se reemplaza cuando tengamos fotografías.</figcaption></figure></div>" +
        '<nav class="pala-nav xp-in" aria-label="Secciones de la ficha"><ul>' +
        [["p-numeros", "Números"], ["p-proveedor", "Proveedor"], ["p-medicion", "Medición"], ["p-tester", "Tester"], ["p-falta", "Falta"], ["p-proxima", "Próxima prueba"], ["p-tecnica", "Ficha técnica"]].map(function (n) {
          return '<li><button type="button" data-goto="' + n[0] + '">' + esc(n[1]) + "</button></li>";
        }).join("") + "</ul></nav></section>";

      var numeros = section("p-numeros", "01", "Peso y balance", esc(x.numbersTitle),
        '<p class="xp-lead">' + esc(x.numbersLead) + "</p>" + numbersBlock(s) +
        stepper("st-balance", "Qué es el balance, en cuatro pasos", G.balanceSteps, balanceArt(false) + balanceArt(true), "Largo a escala de lo declarado (455 mm). La silueta es ilustrativa; las marcas del último paso usan los valores declarados.") + src(x.src + "; actualización de William, 13/11/2026"));

      var prov = section("p-proveedor", "02", "Lo que declaró el proveedor", "Cómo está armada, según William.",
        '<p class="xp-lead">' + voice("KP") + " Todo este bloque lo informó la fábrica. Lo registramos tal cual, con las dudas que quedaron abiertas.</p>" +
        stepper("st-core", "De afuera hacia adentro", G.coreSteps, coreArt(false) + coreArt(true), "Proporciones ilustrativas: William no publicó el espesor de ninguna capa.") +
        provider(s) +
        '<div class="callouts"><div class="callout"><p class="mini-h">Control de producción</p><p>' + esc(qc.v) + '</p><p class="muted small">' + esc(qc.note) + "</p></div>" +
        '<div class="callout"><p class="mini-h">' + term("dureza", "Dureza") + " y ensayos</p><p>" + esc(lab.v) + '.</p><p class="muted small">' + esc(lab.note) + " " + esc(s.compare.hardness.note) + "</p></div></div>" +
        src("Actualización de William, 13/11/2026 · " + DATA.internalSource.split(". Actualización")[0]));

      var mM = meas(s, "Masa"), bM = meas(s, "Balance");
      var medicion = section("p-medicion", "03", "Lo que medimos nosotros", "Una medición propia, todavía incompleta.",
        '<div class="ours"><div class="ours-main">' + voice("KM") +
        '<p class="ours-n">' + big(mM.v, mM.u) + '</p><p>Pesada por ' + esc(mM.who) + ". " + esc(mM.config) + ". " + esc(mM.note) + "</p>" + chips(s.compare.configSpecs[1]) + "</div>" +
        '<div class="ours-gap"><p class="ours-gap-k">' + term("balance") + '</p><p class="ours-gap-v">Sin medir</p><p>' + esc(bM.note) + " La próxima ficha normalizada lo resuelve.</p></div></div>" +
        '<p><button type="button" class="cta small" data-goto="p-tecnica" data-open-tech>Registrar una medición ' + arrow() + "</button></p>" + src("Informe, sección 7 · " + esc(s.measuredNote)));

      /* Opiniones registradas en el informe: son resúmenes, no frases textuales, por eso no van entre comillas. */
      var tester = section("p-tester", "04", "Lo que opinó el tester", 'En cancha, <span class="nb">MC-005</span> convenció.',
        '<p class="xp-lead">Lo que quedó registrado de la opinión de quien la probó. Son resúmenes de su evaluación, no citas textuales.</p>' +
        '<div class="quotes">' + s.tester.map(function (t) {
          return '<div class="q"><p class="q-t">' + esc(t.text) + '</p><p class="q-by">' + esc(t.who) + " · " + voice(t.ev) + "</p>" + (t.note ? '<p class="q-note">' + esc(t.note) + "</p>" : "") + "</div>";
        }).join("") + "</div>" + '<p class="muted">' + esc(s.testerNote) + "</p>" + src("Informe, sección 7"));

      var falta = section("p-falta", "05", "Lo que falta comprobar", "Antes de usarla como estándar, hay que cerrar esto.",
        '<ul class="todo">' + s.compare.pending.map(function (p) { return '<li><span class="todo-box" aria-hidden="true"></span>' + esc(p) + "</li>"; }).join("") + "</ul>" +
        disclose("Advertencias registradas", '<ul class="clean">' + s.warnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>"));

      var st = K.getStatus("etapa-a");
      var proxima = section("p-proxima", "06", "Próxima prueba propuesta", "De la medición a la cancha.",
        '<p class="xp-lead">' + voice("PR") + " Es el orden que propone el plan. Nada de esto está hecho todavía.</p>" +
        '<ol class="timeline">' + x.nextSteps.map(function (n, i) { return '<li><span class="tl-n">' + (i + 1) + '</span><div><p class="tl-t">' + esc(n.title) + "</p><p>" + esc(n.text) + '</p><span class="st-src">' + esc(n.src) + "</span></div></li>"; }).join("") + "</ol>" +
        '<p class="st-state">Estado de la Etapa A: <b>' + esc(K.statusLabel(st)) + "</b>" + (st !== "pendiente" ? ' <span class="muted">(editado en este navegador)</span>' : "") + ' · <a href="#desarrollo">Ver el plan</a></p>' +
        disclose("Cómo se va a decidir si una HYBRID nueva la supera", "<p>" + esc(b.tests.criterion.main) + "</p><p>" + esc(b.tests.criterion.also) + "</p>" + src("Informe, sección 10, Etapa D")));

      var tecnica = section("p-tecnica", "07", "Profundizar", "Ficha técnica completa.",
        '<p class="xp-lead">El mismo registro del explorador, con todas las etiquetas formales, tus notas y el formulario de mediciones.</p>' +
        disclose("Abrir la ficha técnica de " + esc(s.name), '<div class="sample-grid">' + V.sampleCard(s) + "</div>", false, "tech") +
        '<p class="deep-links"><a class="link-arrow" href="#mapa--HYBRID--sample--mc005">Ver en el mapa ' + arrow() + '</a><a class="link-arrow" href="#comparador">Ir al comparador ' + arrow() + '</a><a class="link-arrow" href="#fuentes">Fuentes y método ' + arrow() + "</a></p>");

      return '<div class="xp xp-pala">' + hero + numeros + prov + medicion + tester + falta + proxima + tecnica + "</div>";
    },
    mount: function (sub) {
      var root = document.querySelector(".xp-pala"); if (!root) return null;
      root.addEventListener("click", function (e) {
        var b = e.target.closest("[data-goto]"); if (!b) return;
        e.preventDefault();
        if (b.hasAttribute("data-open-tech")) { var d = root.querySelector("details.tech"); if (d && !d.open) d.open = true; }
        goTo(b.getAttribute("data-goto"));
      });
      animateDetails(root);
      mountSteppers(root);
      /* Sección activa en la navegación interna, sin intervenir el desplazamiento. */
      var navBtns = root.querySelectorAll(".pala-nav button"), io = null;
      if (window.IntersectionObserver) {
        io = new IntersectionObserver(function (es) {
          es.forEach(function (en) {
            if (!en.isIntersecting) return;
            navBtns.forEach(function (n) { var on = n.getAttribute("data-goto") === en.target.id; n.classList.toggle("on", on); if (on) n.setAttribute("aria-current", "true"); else n.removeAttribute("aria-current"); });
          });
        }, { rootMargin: "-45% 0px -50% 0px" });
        root.querySelectorAll(".xp-sec").forEach(function (sct) { io.observe(sct); });
      }
      return function () { if (io) io.disconnect(); closeTip(); };
    }
  };

  window.KExperience = { voice: voice, term: term, closeTip: closeTip };
})();
