/* KORVE Explorador — mapa conceptual interactivo (SVG, sin dependencias).
 *
 * Dos disposiciones con la misma interacción:
 *  - "radial" (contenedor ancho): KORVE al centro, ramas alrededor; pan y zoom dentro del marco.
 *  - "vertical" (contenedor angosto, celulares): árbol de arriba hacia abajo a escala 1:1,
 *    el mapa crece en alto y la página se desplaza normalmente; el zoom no achica el texto
 *    por debajo de su tamaño de lectura.
 *
 * El texto se mide con la fuente real del dispositivo (canvas.measureText) y se centra con
 * dominant-baseline="central"; las cajas se dimensionan a partir de esa medida. Así el resultado
 * no depende de las métricas de una fuente concreta (Helvetica en iOS, otra en Android/Linux).
 */
(function () {
  var DATA = window.KORVE_DATA, K = window.K, esc = K.esc;
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FLOW_MAX = 640; /* ancho de contenedor por debajo del cual se usa la disposición vertical */

  var BRANCH_ANGLE = { HYBRID: -90, POWER: 150, CONTROL: 30 };
  var BR_DIST = 250;
  var C = { root: "#ffffff", rootText: "#0d0d0d", accent: "#7a1f2e", accent2: "#9c2a3d", dark: "#1e1e1e", dark2: "#2a2a2a", item: "#141414", soft: "#e7d9db", white: "#ffffff" };

  function rad(a) { return a * Math.PI / 180; }
  function polar(cx, cy, r, a) { return { x: cx + r * Math.cos(rad(a)), y: cy + r * Math.sin(rad(a)) }; }

  /* ---------- Medición de texto ---------- */
  var ctx = null, family = null;
  function fontFamily(host) {
    if (!family) {
      var f = host ? getComputedStyle(host).fontFamily : "";
      family = f || "Helvetica Neue, Helvetica, Arial, sans-serif";
    }
    return family;
  }
  function measure(text, size, weight) {
    if (!ctx) ctx = document.createElement("canvas").getContext("2d");
    ctx.font = (weight || 400) + " " + size + "px " + family;
    return ctx.measureText(text).width;
  }
  /* Corta en líneas según el ancho medido. Una palabra más larga que el máximo ocupa su propia línea. */
  function wrap(text, size, weight, maxW) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (cur && measure(test, size, weight) > maxW) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  /* Bloque de texto: líneas con estilo. Devuelve { lines:[{t,size,weight,fill}], w, h }. */
  function block(parts, maxW) {
    var lines = [], w = 0, h = 0;
    parts.forEach(function (p) {
      if (!p.text) return;
      wrap(p.text, p.size, p.weight, maxW).forEach(function (t) {
        var lw = measure(t, p.size, p.weight);
        w = Math.max(w, lw); h += p.size * 1.28;
        lines.push({ t: t, size: p.size, weight: p.weight || 400, fill: p.fill, w: lw });
      });
    });
    return { lines: lines, w: w, h: h };
  }

  /* Ítems de tercer nivel según aspecto. */
  function itemsFor(branch, aspectId) {
    if (aspectId === "refs") return branch.refs.items.map(function (it, i) {
      return { id: it.refId || ("noref-" + i), label: it.refId ? K.refById[it.refId].name : it.name, kind: it.refId ? "ref" : "noref" };
    });
    if (aspectId === "sample") return branch.sample.sampleIds.map(function (sid) {
      return { id: sid, label: K.sampleById[sid].name + " · " + K.sampleById[sid].factory, kind: "sample" };
    });
    if (aspectId === "develop") return branch.develop.devIds.map(function (did) {
      return { id: did, label: "P" + K.devById[did].priority + " · " + K.devById[did].change, kind: "dev" };
    });
    return [];
  }
  function subLabel(n) { return n === 1 ? "1 ítem ▸" : n + " ítems ▸"; }

  /* ---------- Disposición radial (pantallas anchas) ---------- */
  function overlap(a, b, m) {
    return Math.abs(a.x - b.x) * 2 < a.w + b.w + 2 * m && Math.abs(a.y - b.y) * 2 < a.h + b.h + 2 * m;
  }
  function layoutRadial(path) {
    var nodes = [], edges = [];
    var rb = block([{ text: "KORVE", size: 22, weight: 800, fill: C.rootText }, { text: "POWER · HYBRID · CONTROL", size: 11, weight: 400, fill: C.accent }], 120);
    var rr = Math.max(62, Math.hypot(rb.w / 2, rb.h / 2) + 12);
    nodes.push({ key: "root", level: 0, kind: "root", x: 0, y: 0, shape: "circle", r: rr, w: 2 * rr, h: 2 * rr, text: rb, label: "KORVE", sub: "3 palas" });
    /* Las tres ramas comparten radio (el que necesite la más larga): el tamaño no sugiere jerarquía. */
    var bText = {}, bR = 56;
    DATA.branches.forEach(function (b) {
      var tb = block([{ text: b.name, size: 17, weight: 800, fill: C.white }, { text: b.tagline, size: 11, weight: 400, fill: C.soft }], 92);
      bText[b.id] = tb; bR = Math.max(bR, Math.hypot(tb.w / 2, tb.h / 2) + 10);
    });
    DATA.branches.forEach(function (b) {
      var p = polar(0, 0, BR_DIST, BRANCH_ANGLE[b.id]);
      var sel = path.branch === b.id;
      var tb = bText[b.id], r = bR;
      var bn = { key: "b:" + b.id, level: 1, kind: "branch", branch: b.id, x: p.x, y: p.y, shape: "circle", r: r, w: 2 * r, h: 2 * r, text: tb, label: b.name, sub: b.tagline, selected: sel && !path.aspect, active: sel, dim: path.branch && !sel };
      nodes.push(bn);
      edges.push({ a: { x: 0, y: 0 }, b: p, strong: sel });
      if (!sel) return;

      /* Aspectos en abanico; el radio crece hasta que ninguna caja se superpone. */
      var base = BRANCH_ANGLE[b.id], n = DATA.aspects.length, spread = 230;
      var asp = DATA.aspects.map(function (as, i) {
        var items = itemsFor(b, as.id);
        var t = block([{ text: as.label, size: 14, weight: 600, fill: C.white }, { text: items.length ? subLabel(items.length) : "", size: 11, weight: 400, fill: C.soft }], 124);
        return { as: as, items: items, text: t, w: Math.max(96, t.w + 26), h: t.h + 16, ang: base - spread / 2 + (spread * i) / (n - 1) };
      });
      var obstacles = nodes.slice(); /* raíz y ramas */
      var dist = 190;
      for (var guard = 0; guard < 40; guard++) {
        asp.forEach(function (a) { var q = polar(p.x, p.y, dist, a.ang); a.x = q.x; a.y = q.y; });
        var clash = asp.some(function (a, i) {
          return asp.some(function (o, j) { return j > i && overlap(a, o, 6); }) || obstacles.some(function (o) { return overlap(a, o, 10); });
        });
        if (!clash) break;
        dist += 12;
      }
      asp.forEach(function (a) {
        var aSel = path.aspect === a.as.id;
        var an = { key: "a:" + b.id + ":" + a.as.id, level: 2, kind: "aspect", branch: b.id, aspect: a.as.id, x: a.x, y: a.y, shape: "rect", w: a.w, h: a.h, text: a.text,
          label: a.as.label, sub: a.items.length ? subLabel(a.items.length) : "", selected: aSel && !path.item, active: aSel, dim: path.aspect && !aSel };
        nodes.push(an);
        edges.push({ a: p, b: { x: a.x, y: a.y }, strong: aSel });
        if (!aSel || !a.items.length) return;
        /* Tercer nivel: columna hacia afuera, con separación según la altura real de cada caja. */
        var cosA = Math.cos(rad(a.ang));
        var side = Math.abs(cosA) > 0.2 ? (cosA > 0 ? 1 : -1) : (a.x >= 0 ? 1 : -1);
        var its = a.items.map(function (it) {
          var t = block([{ text: it.label, size: 12.5, weight: 500, fill: C.white }], 176);
          return { it: it, text: t, w: Math.max(150, t.w + 24), h: t.h + 14 };
        });
        var colW = Math.max.apply(null, its.map(function (x) { return x.w; }));
        var total = its.reduce(function (s, x) { return s + x.h; }, 0) + 10 * (its.length - 1);
        var y = a.y - total / 2, cx = a.x + side * (a.w / 2 + 56 + colW / 2);
        its.forEach(function (x) {
          var cy = y + x.h / 2; y += x.h + 10;
          var isSel = path.item === x.it.id;
          nodes.push({ key: "i:" + x.it.id, level: 3, kind: "item", itemKind: x.it.kind, branch: b.id, aspect: a.as.id, item: x.it.id, x: cx, y: cy, shape: "rect", w: colW, h: x.h, text: x.text, label: x.it.label, selected: isSel });
          edges.push({ a: { x: a.x + side * a.w / 2, y: a.y }, b: { x: cx - side * colW / 2, y: cy }, strong: isSel });
        });
      });
    });
    return { nodes: nodes, edges: edges };
  }

  /* ---------- Disposición vertical (celulares) ---------- */
  function layoutVertical(path, W) {
    var nodes = [], edges = [], pad = 12, gap = 8;
    var rb = block([{ text: "KORVE", size: 20, weight: 800, fill: C.rootText }, { text: "POWER · HYBRID · CONTROL", size: 11.5, weight: 400, fill: C.accent }], W - 2 * pad - 28);
    var root = { key: "root", level: 0, kind: "root", shape: "rect", w: rb.w + 36, h: rb.h + 20, x: W / 2, text: rb, label: "KORVE", sub: "3 palas" };
    root.y = 14 + root.h / 2;
    nodes.push(root);

    var bw = (W - 2 * pad - 2 * gap) / 3, rowTop = root.y + root.h / 2 + 30;
    var order = ["POWER", "HYBRID", "CONTROL"];
    var bt = order.map(function (id) {
      var b = K.branchById[id];
      return block([{ text: b.name, size: 15, weight: 800, fill: C.white }, { text: b.tagline, size: 11.5, weight: 400, fill: C.soft }], bw - 14);
    });
    var bh = Math.max.apply(null, bt.map(function (t) { return t.h; })) + 18;
    var y = rowTop + bh;
    order.forEach(function (id, i) {
      var b = K.branchById[id], sel = path.branch === id;
      var bn = { key: "b:" + id, level: 1, kind: "branch", branch: id, shape: "rect", w: bw, h: bh, x: pad + bw / 2 + i * (bw + gap), y: rowTop + bh / 2, text: bt[i], label: b.name, sub: b.tagline, selected: sel && !path.aspect, active: sel, dim: path.branch && !sel };
      nodes.push(bn);
      edges.push({ d: "M" + root.x + "," + (root.y + root.h / 2) + " V" + (rowTop - 14) + " H" + bn.x + " V" + rowTop, strong: sel });
    });
    if (path.branch) {
      var b = K.branchById[path.branch], bnode = nodes.filter(function (n) { return n.branch === path.branch; })[0];
      var spine = pad + 10, x0 = pad + 28, aw = W - pad - x0, top = y + 26, ys = [];
      y = top;
      DATA.aspects.forEach(function (as) {
        var items = itemsFor(b, as.id), aSel = path.aspect === as.id;
        var t = block([{ text: as.label, size: 15, weight: 600, fill: C.white }, { text: items.length ? subLabel(items.length) : "", size: 12, weight: 400, fill: C.soft }], aw - 28);
        var h = t.h + 18;
        var an = { key: "a:" + b.id + ":" + as.id, level: 2, kind: "aspect", branch: b.id, aspect: as.id, shape: "rect", align: "start", w: aw, h: h, x: x0 + aw / 2, y: y + h / 2, text: t,
          label: as.label, sub: items.length ? subLabel(items.length) : "", selected: aSel && !path.item, active: aSel, dim: path.aspect && !aSel };
        nodes.push(an); ys.push(an.y);
        edges.push({ d: "M" + spine + "," + an.y + " H" + x0, strong: aSel });
        y += h + 10;
        if (aSel && items.length) {
          var ispine = x0 + 14, xi = x0 + 30, iw = W - pad - xi, iys = [], yStart = y - 10 + 0;
          items.forEach(function (it) {
            var tt = block([{ text: it.label, size: 13.5, weight: 500, fill: C.white }], iw - 26);
            var ih = tt.h + 16, isSel = path.item === it.id;
            nodes.push({ key: "i:" + it.id, level: 3, kind: "item", itemKind: it.kind, branch: b.id, aspect: as.id, item: it.id, shape: "rect", align: "start", w: iw, h: ih, x: xi + iw / 2, y: y + ih / 2, text: tt, label: it.label, selected: isSel });
            iys.push(y + ih / 2);
            edges.push({ d: "M" + ispine + "," + (y + ih / 2) + " H" + xi, strong: isSel });
            y += ih + 8;
          });
          edges.push({ d: "M" + ispine + "," + yStart + " V" + iys[iys.length - 1], strong: true });
          y += 6;
        }
      });
      edges.push({ d: "M" + bnode.x + "," + (bnode.y + bnode.h / 2) + " V" + (top - 12) + " H" + spine + " V" + ys[ys.length - 1], strong: true });
      y -= 10;
    }
    return { nodes: nodes, edges: edges, height: y + 22 };
  }

  /* ---------- SVG ---------- */
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    return e;
  }
  /* Dibuja las líneas centradas verticalmente en la caja, sin depender de las métricas de la fuente. */
  function drawText(g, n) {
    var t = n.text, y = -t.h / 2, start = n.align === "start";
    t.lines.forEach(function (ln) {
      var lh = ln.size * 1.28;
      var tx = el("text", { x: start ? -n.w / 2 + 14 : 0, y: y + lh / 2, "text-anchor": start ? "start" : "middle", "dominant-baseline": "central",
        "font-size": ln.size, "font-weight": ln.weight, fill: n.selected && n.kind === "item" ? C.rootText : ln.fill });
      tx.textContent = ln.t;
      g.appendChild(tx);
      y += lh;
    });
  }

  function MapView(host, onSelect) {
    this.host = host; this.onSelect = onSelect;
    this.path = {};
    this.cam = { x: 0, y: 0, s: 1 };
    fontFamily(host);
    this.build();
  }

  MapView.prototype.isFlow = function () { return (this.host.clientWidth || 800) < FLOW_MAX; };

  MapView.prototype.build = function () {
    var self = this;
    this.host.innerHTML =
      '<div class="map-bar">' +
      '<nav class="crumbs" aria-label="Nivel del mapa" aria-live="polite"></nav>' +
      '<div class="map-controls" role="toolbar" aria-label="Controles del mapa">' +
      '<button type="button" data-cmd="out" title="Alejar" aria-label="Alejar">−</button>' +
      '<button type="button" data-cmd="in" title="Acercar" aria-label="Acercar">+</button>' +
      '<button type="button" data-cmd="center" title="Centrar en la selección" aria-label="Centrar en la selección">◎</button>' +
      '<button type="button" data-cmd="back" title="Volver al nivel anterior (Esc)" aria-label="Volver al nivel anterior">↩</button>' +
      '<button type="button" data-cmd="detail" class="only-flow" title="Ver el detalle debajo del mapa" aria-label="Ver el detalle">Detalle ↓</button>' +
      "</div></div>" +
      '<div class="map-canvas"></div>' +
      '<p class="map-note">La cercanía en el mapa no indica equivalencia técnica.<span class="only-flow"> El detalle de cada selección aparece debajo.</span></p>';
    this.canvas = this.host.querySelector(".map-canvas");
    this.svg = el("svg", { role: "group", "aria-label": "Mapa conceptual KORVE" });
    this.gEdges = el("g", {}); this.gNodes = el("g", {});
    this.svg.appendChild(this.gEdges); this.svg.appendChild(this.gNodes);
    this.canvas.appendChild(this.svg);

    this.host.querySelector(".map-controls").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var c = b.getAttribute("data-cmd");
      if (c === "in") self.zoomBy(1.25);
      else if (c === "out") self.zoomBy(0.8);
      else if (c === "center") self.focus(true, true);
      else if (c === "back") self.back();
      else if (c === "detail") { var p = document.getElementById("panel"); if (p) p.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }); }
    });
    this.host.querySelector(".crumbs").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-level]"); if (!b) return;
      var lvl = +b.getAttribute("data-level"), p = self.path, np = {};
      if (lvl >= 1) np.branch = p.branch;
      if (lvl >= 2) np.aspect = p.aspect;
      self.select(np);
    });

    this.gNodes.addEventListener("click", function (e) {
      if (self.dragMoved) return;
      var g = e.target.closest(".node"); if (g) self.activate(g);
    });
    this.gNodes.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { var g = e.target.closest(".node"); if (g) { e.preventDefault(); self.activate(g); } }
    });
    this.host.addEventListener("keydown", function (e) {
      if (e.target.closest && e.target.closest("input,textarea,select")) return;
      if (e.key === "Escape") { e.preventDefault(); self.back(); }
      else if (e.key === "+" || e.key === "=") self.zoomBy(1.25);
      else if (e.key === "-") self.zoomBy(0.8);
    });

    /* Rueda: zoom en el marco radial; en vertical solo con Ctrl (pellizco del trackpad), para no bloquear el desplazamiento de la página. */
    this.svg.addEventListener("wheel", function (e) {
      if (self.flow && !e.ctrlKey) return;
      e.preventDefault();
      self.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, self.toWorld(e.clientX, e.clientY));
    }, { passive: false });
    var pointers = {}, start = null, pinch = null;
    this.svg.addEventListener("pointerdown", function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      self.dragMoved = false;
      if (ids.length === 1) start = { x: e.clientX, y: e.clientY, cx: self.cam.x, cy: self.cam.y };
      else if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: self.cam.s }; }
    });
    this.svg.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinch) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        self.cam.s = self.clampS(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); self.dragMoved = true; self.apply();
      } else if (ids.length === 1 && start) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!self.dragMoved && Math.hypot(dx, dy) < 6) return;
        if (self.flow && Math.abs(dy) > Math.abs(dx) && !self.dragMoved) return; /* gesto vertical: lo maneja la página */
        if (!self.dragMoved) { try { self.svg.setPointerCapture(e.pointerId); } catch (err) {} }
        self.dragMoved = true; self.svg.classList.add("dragging");
        var r = 1 / self.k();
        self.cam.x = start.cx - dx * r;
        if (!self.flow) self.cam.y = start.cy - dy * r;
        self.apply();
      }
    });
    function end(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch = null;
      if (!Object.keys(pointers).length) { start = null; self.svg.classList.remove("dragging"); setTimeout(function () { self.dragMoved = false; }, 0); }
    }
    this.svg.addEventListener("pointerup", end);
    this.svg.addEventListener("pointercancel", end);

    this.lastW = this.host.clientWidth;
    this.resizeObs = new ResizeObserver(function () {
      var w = self.host.clientWidth;
      if (Math.abs(w - self.lastW) < 1) { self.apply(); return; }
      self.lastW = w;
      self.render(); self.focus(false);
    });
    this.resizeObs.observe(this.host);
  };

  /* Escala: en radial se ajusta a la pantalla; en vertical 1 unidad = 1 px y alejar no baja de ese
   * tamaño de lectura (la disposición vertical ya entra a lo ancho). */
  MapView.prototype.minS = function () { return this.flow ? 1 : 0.35; };
  MapView.prototype.clampS = function (s) { return this.flow ? Math.max(1, Math.min(2, s)) : Math.max(0.35, Math.min(3.5, s)); };
  MapView.prototype.baseScale = function () {
    if (this.flow) return 1;
    var w = this.canvas.clientWidth || 600, h = this.canvas.clientHeight || 500;
    return Math.min(w, h) / 720;
  };
  MapView.prototype.k = function () { return this.baseScale() * this.cam.s; };
  MapView.prototype.toWorld = function (cx, cy) {
    var r = this.svg.getBoundingClientRect(), k = this.k();
    if (this.flow) return { x: this.cam.x + (cx - r.left - r.width / 2) / k, y: (cy - r.top) / k };
    return { x: this.cam.x + (cx - r.left - r.width / 2) / k, y: this.cam.y + (cy - r.top - r.height / 2) / k };
  };
  MapView.prototype.apply = function () {
    var w = this.canvas.clientWidth || 600, k = this.k(), vw = w / k;
    var out = this.host.querySelector('[data-cmd="out"]');
    if (out) out.disabled = this.cam.s <= this.minS() + 1e-6;
    if (this.flow) {
      /* El SVG ocupa todo el alto del contenido; solo se desplaza en horizontal si hay zoom. */
      var W = this.layoutW, half = vw / 2;
      this.cam.x = vw >= W ? W / 2 : Math.max(half, Math.min(W - half, this.cam.x));
      this.svg.style.height = Math.ceil(this.contentH * k) + "px";
      this.svg.setAttribute("viewBox", (this.cam.x - half) + " 0 " + vw + " " + this.contentH);
      return;
    }
    this.svg.style.height = "";
    var h = this.canvas.clientHeight || 500, vh = h / k;
    this.svg.setAttribute("viewBox", (this.cam.x - vw / 2) + " " + (this.cam.y - vh / 2) + " " + vw + " " + vh);
  };
  MapView.prototype.zoomBy = function (f, pt) {
    var ns = this.clampS(this.cam.s * f), real = ns / this.cam.s;
    if (pt) { this.cam.x = pt.x - (pt.x - this.cam.x) / real; if (!this.flow) this.cam.y = pt.y - (pt.y - this.cam.y) / real; }
    this.cam.s = ns; this.apply();
  };
  MapView.prototype.animateTo = function (t) {
    var self = this, from = { x: this.cam.x, y: this.cam.y, s: this.cam.s }, t0 = null, dur = 380;
    cancelAnimationFrame(this.raf);
    if (reduceMotion || this.flow) { this.cam = t; this.apply(); return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      self.cam = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, s: from.s + (t.s - from.s) * e };
      self.apply();
      if (p < 1) self.raf = requestAnimationFrame(step);
    }
    this.raf = requestAnimationFrame(step);
  };

  /* Encuadre: en radial ajusta el zoom a los nodos del nivel; en vertical vuelve a escala 1
   * y, si se pide, desplaza la página hasta la selección. */
  MapView.prototype.focus = function (animate, scrollPage) {
    if (this.flow) {
      this.cam = { x: this.layoutW / 2, y: 0, s: 1 }; this.apply();
      if (scrollPage) this.reveal(true);
      return;
    }
    var p = this.path, L = this.L;
    var rel = L.nodes.filter(function (n) {
      if (!p.branch) return true;
      if (!p.aspect) return n.branch === p.branch && n.level >= 1;
      return n.branch === p.branch && (n.aspect === p.aspect || n.level === 1);
    });
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    rel.forEach(function (n) { x0 = Math.min(x0, n.x - n.w / 2); x1 = Math.max(x1, n.x + n.w / 2); y0 = Math.min(y0, n.y - n.h / 2); y1 = Math.max(y1, n.y + n.h / 2); });
    var w = this.canvas.clientWidth || 600, h = this.canvas.clientHeight || 500, pad = 20;
    var k = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0));
    var t = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, s: this.clampS(Math.min(2.2, k / this.baseScale())) };
    if (animate) this.animateTo(t); else { this.cam = t; this.apply(); }
  };

  /* En vertical: si el nodo seleccionado quedó fuera de la pantalla, lo trae a la vista. */
  MapView.prototype.reveal = function (force) {
    var key = this.selKey(), n = this.gNodes.querySelector('[data-key="' + key + '"]');
    if (!n) return;
    var r = n.getBoundingClientRect(), head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    var topLimit = head + 12, bottomLimit = window.innerHeight - 12;
    if (force || r.top < topLimit || r.bottom > bottomLimit) {
      window.scrollBy({ top: r.top - topLimit - 48, behavior: reduceMotion ? "auto" : "smooth" });
    }
  };
  MapView.prototype.selKey = function () {
    var p = this.path;
    return p.item ? "i:" + p.item : p.aspect ? "a:" + p.branch + ":" + p.aspect : p.branch ? "b:" + p.branch : "root";
  };

  MapView.prototype.activate = function (g) {
    var d = g.dataset, np = {};
    if (d.kind === "branch") np = { branch: d.branch };
    else if (d.kind === "aspect") np = { branch: d.branch, aspect: d.aspect };
    else if (d.kind === "item") np = { branch: d.branch, aspect: d.aspect, item: d.item };
    this.select(np, true);
  };

  MapView.prototype.select = function (np, fromMap) {
    var prevKey = (this.path.branch || "") + "|" + (this.path.aspect || "");
    this.path = np || {};
    this.render();
    var newKey = (this.path.branch || "") + "|" + (this.path.aspect || "");
    if (prevKey !== newKey || !fromMap) this.focus(true);
    this.onSelect(this.path);
    var n = this.gNodes.querySelector('[data-key="' + this.selKey() + '"]');
    if (fromMap && n) n.focus({ preventScroll: true });
    if (this.flow && fromMap) this.reveal(false);
  };

  MapView.prototype.back = function () {
    var p = this.path;
    if (p.item) this.select({ branch: p.branch, aspect: p.aspect });
    else if (p.aspect) this.select({ branch: p.branch });
    else if (p.branch) this.select({});
    else this.focus(true);
  };

  MapView.prototype.render = function () {
    var self = this;
    this.flow = this.isFlow();
    this.host.classList.toggle("flow", this.flow);
    if (this.flow) {
      this.layoutW = this.canvas.clientWidth || this.host.clientWidth || 360;
      this.L = layoutVertical(this.path, this.layoutW);
      this.contentH = this.L.height;
    } else this.L = layoutRadial(this.path);
    var L = this.L;
    this.gEdges.innerHTML = ""; this.gNodes.innerHTML = "";
    L.edges.forEach(function (e) {
      var cls = "edge" + (e.strong ? " strong" : "");
      self.gEdges.appendChild(e.d ? el("path", { d: e.d, "class": cls, fill: "none" }) : el("line", { x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y, "class": cls }));
    });
    /* Los nodos atenuados se dibujan primero para que la selección quede encima. */
    L.nodes.slice().sort(function (a, b) { return (a.dim ? 0 : 1) - (b.dim ? 0 : 1); }).forEach(function (n) {
      var g = el("g", { "class": "node" + (n.dim ? " dim" : "") + (n.selected ? " selected" : ""), tabindex: "0", role: "button",
        transform: "translate(" + n.x + "," + n.y + ")", "data-key": n.key, "data-kind": n.kind,
        "data-branch": n.branch, "data-aspect": n.aspect, "data-item": n.item });
      g.setAttribute("aria-label", n.label + (n.sub ? ", " + n.sub : "") + (n.selected ? ", seleccionado" : ""));
      var title = el("title", {}); title.textContent = n.label; g.appendChild(title);
      var fill, stroke = C.accent2, sw = 1.5, dash = null;
      if (n.kind === "root") { fill = C.root; stroke = C.accent; sw = 3; }
      else if (n.kind === "branch") fill = n.active ? C.accent : C.dark;
      else if (n.kind === "aspect") fill = n.active ? C.accent2 : C.dark2;
      else { fill = n.selected ? C.white : C.item; stroke = n.itemKind === "noref" ? "#8a8a8a" : C.white; sw = 1.2; dash = n.itemKind === "noref" ? "4 3" : null; }
      if (n.shape === "circle") g.appendChild(el("circle", { r: n.r, "class": "shape", fill: fill, stroke: stroke, "stroke-width": sw }));
      else g.appendChild(el("rect", { x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h, rx: n.kind === "item" ? 7 : 10, "class": "shape", fill: fill, stroke: stroke, "stroke-width": sw, "stroke-dasharray": dash }));
      drawText(g, n);
      self.gNodes.appendChild(g);
    });
    this.renderCrumbs();
    this.host.querySelector('[data-cmd="back"]').disabled = !this.path.branch;
    this.apply();
  };

  MapView.prototype.renderCrumbs = function () {
    /* Cada nivel lleva su separador pegado, para que "›" nunca quede suelto al final de una línea. */
    var p = this.path, sep = '<span class="sep" aria-hidden="true">›</span>', parts = ['<span class="crumb"><button type="button" data-level="0">KORVE</button></span>'];
    if (p.branch) parts.push('<span class="crumb">' + sep + '<button type="button" data-level="1">' + esc(p.branch) + "</button></span>");
    if (p.aspect) parts.push('<span class="crumb">' + sep + '<button type="button" data-level="2">' + esc(DATA.aspects.filter(function (a) { return a.id === p.aspect; })[0].label) + "</button></span>");
    if (p.item) parts.push('<span class="crumb">' + sep + '<span class="crumb-item">' + esc(itemLabel(p)) + "</span></span>");
    this.host.querySelector(".crumbs").innerHTML = parts.join("");
  };
  function itemLabel(p) {
    var it = itemsFor(K.branchById[p.branch], p.aspect).filter(function (x) { return x.id === p.item; })[0];
    return it ? it.label : p.item;
  }

  MapView.prototype.destroy = function () { if (this.resizeObs) this.resizeObs.disconnect(); cancelAnimationFrame(this.raf); };

  window.KMap = { MapView: MapView, itemsFor: itemsFor, FLOW_MAX: FLOW_MAX };
})();
