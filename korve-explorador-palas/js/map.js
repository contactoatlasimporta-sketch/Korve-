/* KORVE Explorador — mapa conceptual interactivo (SVG, sin dependencias). */
(function () {
  var DATA = window.KORVE_DATA, K = window.K, esc = K.esc;
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var BRANCH_ANGLE = { HYBRID: -90, POWER: 150, CONTROL: 30 };
  var BR_DIST = 230, AS_DIST = 200;

  function rad(a) { return a * Math.PI / 180; }
  function polar(cx, cy, r, a) { return { x: cx + r * Math.cos(rad(a)), y: cy + r * Math.sin(rad(a)) }; }

  /* Ítems de tercer nivel según aspecto. */
  function itemsFor(branch, aspectId) {
    if (aspectId === "refs") return branch.refs.items.map(function (it, i) {
      return { id: it.refId || ("noref-" + i), label: it.refId ? K.refById[it.refId].name : it.name, kind: it.refId ? "ref" : "noref", data: it };
    });
    if (aspectId === "sample") return branch.sample.sampleIds.map(function (sid) {
      return { id: sid, label: K.sampleById[sid].name + " · " + K.sampleById[sid].factory, kind: "sample" };
    });
    if (aspectId === "develop") return branch.develop.devIds.map(function (did) {
      return { id: did, label: "P" + K.devById[did].priority + " · " + K.devById[did].change, kind: "dev" };
    });
    return [];
  }

  function layout(path) {
    var nodes = [], edges = [];
    nodes.push({ key: "root", level: 0, x: 0, y: 0, label: "KORVE", sub: "3 palas", kind: "root" });
    DATA.branches.forEach(function (b) {
      var p = polar(0, 0, BR_DIST, BRANCH_ANGLE[b.id]);
      var sel = path.branch === b.id;
      nodes.push({ key: "b:" + b.id, level: 1, x: p.x, y: p.y, label: b.name, sub: b.tagline, kind: "branch", branch: b.id, selected: sel && !path.aspect, dim: path.branch && !sel });
      edges.push({ a: { x: 0, y: 0 }, b: p, strong: sel });
      if (!sel) return;
      var base = BRANCH_ANGLE[b.id], n = DATA.aspects.length, spread = 230;
      DATA.aspects.forEach(function (as, i) {
        var ang = base - spread / 2 + (spread * i) / (n - 1);
        var q = polar(p.x, p.y, AS_DIST, ang);
        var items = itemsFor(b, as.id);
        var aSel = path.aspect === as.id;
        nodes.push({ key: "a:" + b.id + ":" + as.id, level: 2, x: q.x, y: q.y, label: as.label, sub: items.length ? items.length + " ítems" : "", kind: "aspect", branch: b.id, aspect: as.id, selected: aSel && !path.item, dim: path.aspect && !aSel, angle: ang });
        edges.push({ a: p, b: q, strong: aSel });
        if (!aSel || !items.length) return;
        /* Tercer nivel en columna hacia afuera: legible y sin superposiciones. */
        var m = items.length, cosA = Math.cos(rad(ang));
        var side = Math.abs(cosA) > 0.2 ? (cosA > 0 ? 1 : -1) : (q.x >= 0 ? 1 : -1);
        items.forEach(function (it, j) {
          var w = { x: q.x + side * 200, y: q.y + (j - (m - 1) / 2) * 52 };
          nodes.push({ key: "i:" + it.id, level: 3, x: w.x, y: w.y, label: it.label, kind: "item", itemKind: it.kind, branch: b.id, aspect: as.id, item: it.id, selected: path.item === it.id });
          edges.push({ a: q, b: w, strong: path.item === it.id });
        });
      });
    });
    return { nodes: nodes, edges: edges };
  }

  function wrap(text, max) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) {
      if ((cur + " " + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    if (lines.length > 3) { lines = lines.slice(0, 3); lines[2] = lines[2].replace(/.{0,2}$/, "…"); }
    return lines;
  }

  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function MapView(host, onSelect) {
    this.host = host; this.onSelect = onSelect;
    this.path = {};
    this.cam = { x: 0, y: 0, s: 1 };
    this.build();
  }

  MapView.prototype.build = function () {
    var self = this;
    this.host.innerHTML =
      '<div class="map-controls" role="toolbar" aria-label="Controles del mapa">' +
      '<button type="button" data-cmd="in" title="Acercar" aria-label="Acercar">+</button>' +
      '<button type="button" data-cmd="out" title="Alejar" aria-label="Alejar">−</button>' +
      '<button type="button" data-cmd="center" title="Centrar en la selección" aria-label="Centrar en la selección">◎</button>' +
      '<button type="button" data-cmd="back" title="Volver al nivel anterior (Esc)" aria-label="Volver al nivel anterior">↩</button>' +
      "</div>" +
      '<div class="crumbs" aria-live="polite"></div>' +
      '<div class="map-note">La distancia o cercanía en el mapa no indica equivalencia técnica.</div>';
    this.svg = el("svg", { role: "group", "aria-label": "Mapa conceptual KORVE" });
    this.gEdges = el("g", {}); this.gNodes = el("g", {});
    this.svg.appendChild(this.gEdges); this.svg.appendChild(this.gNodes);
    this.host.appendChild(this.svg);

    this.host.querySelector(".map-controls").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var c = b.getAttribute("data-cmd");
      if (c === "in") self.zoomBy(1.25);
      else if (c === "out") self.zoomBy(0.8);
      else if (c === "center") self.focus(true);
      else if (c === "back") self.back();
    });
    this.host.querySelector(".crumbs").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-level]"); if (!b) return;
      var lvl = +b.getAttribute("data-level"), p = self.path, np = {};
      if (lvl >= 1) np.branch = p.branch;
      if (lvl >= 2) np.aspect = p.aspect;
      self.select(np);
    });

    /* Selección de nodos */
    this.gNodes.addEventListener("click", function (e) {
      if (self.dragMoved) return;
      var g = e.target.closest(".node"); if (g) self.activate(g);
    });
    this.gNodes.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { var g = e.target.closest(".node"); if (g) { e.preventDefault(); self.activate(g); } }
    });
    this.host.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); self.back(); }
      else if (e.key === "+" || e.key === "=") self.zoomBy(1.25);
      else if (e.key === "-") self.zoomBy(0.8);
    });

    /* Zoom con rueda y arrastre / pellizco */
    this.svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var pt = self.toWorld(e.clientX, e.clientY);
      self.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, pt);
    }, { passive: false });
    var pointers = {}, start = null, pinch = null;
    this.svg.addEventListener("pointerdown", function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      self.dragMoved = false;
      if (ids.length === 1) start = { x: e.clientX, y: e.clientY, cx: self.cam.x, cy: self.cam.y };
      else if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: self.cam.s };
      }
    });
    this.svg.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinch) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        self.cam.s = clamp(pinch.s * d / pinch.d); self.dragMoved = true; self.apply();
      } else if (ids.length === 1 && start) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!self.dragMoved && Math.hypot(dx, dy) < 6) return;
        if (!self.dragMoved) { try { self.svg.setPointerCapture(e.pointerId); } catch (err) {} }
        self.dragMoved = true; self.svg.classList.add("dragging");
        var r = self.ratio();
        self.cam.x = start.cx - dx * r; self.cam.y = start.cy - dy * r; self.apply();
      }
    });
    function end(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch = null;
      if (!Object.keys(pointers).length) { start = null; self.svg.classList.remove("dragging"); setTimeout(function () { self.dragMoved = false; }, 0); }
    }
    this.svg.addEventListener("pointerup", end);
    this.svg.addEventListener("pointercancel", end);
    this.resizeObs = new ResizeObserver(function () { self.apply(); });
    this.resizeObs.observe(this.host);
  };

  function clamp(s) { return Math.max(0.35, Math.min(3.5, s)); }

  MapView.prototype.ratio = function () {
    return 1 / (this.baseScale() * this.cam.s);
  };
  /* Escala base: cuántos px por unidad de mundo para que el mapa raíz quepa. */
  MapView.prototype.baseScale = function () {
    var w = this.host.clientWidth || 600, h = this.host.clientHeight || 500;
    return Math.min(w, h) / 720;
  };
  MapView.prototype.toWorld = function (cx, cy) {
    var r = this.svg.getBoundingClientRect(), k = this.baseScale() * this.cam.s;
    return { x: this.cam.x + (cx - r.left - r.width / 2) / k, y: this.cam.y + (cy - r.top - r.height / 2) / k };
  };
  MapView.prototype.apply = function () {
    var w = this.host.clientWidth || 600, h = this.host.clientHeight || 500, k = this.baseScale() * this.cam.s;
    var vw = w / k, vh = h / k;
    this.svg.setAttribute("viewBox", (this.cam.x - vw / 2) + " " + (this.cam.y - vh / 2) + " " + vw + " " + vh);
  };
  MapView.prototype.zoomBy = function (f, pt) {
    var ns = clamp(this.cam.s * f), real = ns / this.cam.s;
    if (pt) { this.cam.x = pt.x - (pt.x - this.cam.x) / real; this.cam.y = pt.y - (pt.y - this.cam.y) / real; }
    this.cam.s = ns; this.apply();
  };
  MapView.prototype.animateTo = function (t) {
    var self = this, from = { x: this.cam.x, y: this.cam.y, s: this.cam.s }, t0 = null, dur = 380;
    if (reduceMotion) { this.cam = t; this.apply(); return; }
    cancelAnimationFrame(this.raf);
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      self.cam = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, s: from.s + (t.s - from.s) * e };
      self.apply();
      if (p < 1) self.raf = requestAnimationFrame(step);
    }
    this.raf = requestAnimationFrame(step);
  };

  /* Encuadre automático: ajusta el zoom a los nodos relevantes del nivel actual. */
  MapView.prototype.focus = function (animate) {
    var p = this.path, L = layout(p);
    var rel = L.nodes.filter(function (n) {
      if (!p.branch) return true;
      if (!p.aspect) return n.branch === p.branch && n.level >= 1;
      return n.branch === p.branch && (n.aspect === p.aspect || n.level === 1);
    });
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    rel.forEach(function (n) {
      var hw = n.level === 0 ? 64 : n.level === 1 ? 56 : 80, hh = n.level <= 1 ? 58 : 30;
      x0 = Math.min(x0, n.x - hw); x1 = Math.max(x1, n.x + hw); y0 = Math.min(y0, n.y - hh); y1 = Math.max(y1, n.y + hh);
    });
    var w = this.host.clientWidth || 600, h = this.host.clientHeight || 500, pad = 24;
    var k = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad - 50) / (y1 - y0));
    var t = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - 18 / k, s: Math.min(2.4, clamp(k / this.baseScale())) };
    if (animate) this.animateTo(t); else { this.cam = t; this.apply(); }
  };

  MapView.prototype.activate = function (g) {
    var d = g.dataset, np = {};
    if (d.kind === "root") np = {};
    else if (d.kind === "branch") np = { branch: d.branch };
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
    if (fromMap) {
      var key = this.path.item ? "i:" + this.path.item : this.path.aspect ? "a:" + this.path.branch + ":" + this.path.aspect : this.path.branch ? "b:" + this.path.branch : "root";
      var n = this.gNodes.querySelector('[data-key="' + key + '"]');
      if (n) n.focus({ preventScroll: true });
    }
  };

  MapView.prototype.back = function () {
    var p = this.path;
    if (p.item) this.select({ branch: p.branch, aspect: p.aspect });
    else if (p.aspect) this.select({ branch: p.branch });
    else if (p.branch) this.select({});
    else this.focus(true);
  };

  MapView.prototype.render = function () {
    var L = layout(this.path), self = this;
    this.gEdges.innerHTML = ""; this.gNodes.innerHTML = "";
    L.edges.forEach(function (e) {
      self.gEdges.appendChild(el("line", { x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y, "class": "edge" + (e.strong ? " strong" : "") }));
    });
    /* Los nodos atenuados se dibujan primero para que la selección quede encima. */
    L.nodes.sort(function (a, b) { return (a.dim ? 0 : 1) - (b.dim ? 0 : 1); });
    L.nodes.forEach(function (n) {
      var g = el("g", { "class": "node" + (n.dim ? " dim" : "") + (n.selected ? " selected" : ""), tabindex: "0", role: "button",
        transform: "translate(" + n.x + "," + n.y + ")", "data-key": n.key, "data-kind": n.kind });
      if (n.branch) g.setAttribute("data-branch", n.branch);
      if (n.aspect) g.setAttribute("data-aspect", n.aspect);
      if (n.item) g.setAttribute("data-item", n.item);
      var aria = n.label + (n.sub ? ", " + n.sub : "") + (n.selected ? ", seleccionado" : "");
      g.setAttribute("aria-label", aria);
      var title = el("title", {}); title.textContent = n.label; g.appendChild(title);
      if (n.kind === "root") {
        g.appendChild(el("circle", { r: 62, "class": "shape", fill: "#ffffff", stroke: "#7a1f2e", "stroke-width": 4 }));
        var t1 = el("text", { "text-anchor": "middle", y: 4, "font-size": 22, "font-weight": 800, "letter-spacing": 5, style: "fill:#0d0d0d" }); t1.textContent = "KORVE"; g.appendChild(t1);
        var t2 = el("text", { "text-anchor": "middle", y: 26, "font-size": 11, style: "fill:#7a1f2e" }); t2.textContent = "POWER · HYBRID · CONTROL"; g.appendChild(t2);
      } else if (n.kind === "branch") {
        g.appendChild(el("circle", { r: 54, "class": "shape", fill: n.selected || self.path.branch === n.branch ? "#7a1f2e" : "#1e1e1e", stroke: "#9c2a3d", "stroke-width": 2 }));
        var tb = el("text", { "text-anchor": "middle", y: -2, "font-size": 17, "font-weight": 800, "letter-spacing": 2 }); tb.textContent = n.label; g.appendChild(tb);
        wrap(n.sub, 16).forEach(function (ln, i) { var s = el("text", { "text-anchor": "middle", y: 16 + i * 12, "font-size": 10, style: "fill:#e7d9db" }); s.textContent = ln; g.appendChild(s); });
      } else if (n.kind === "aspect") {
        var al = wrap(n.label, 13), W = 122, H = 14 + al.length * 15 + (n.sub ? 12 : 0);
        g.appendChild(el("rect", { x: -W / 2, y: -H / 2, width: W, height: H, rx: 8, "class": "shape", fill: n.selected || self.path.aspect === n.aspect ? "#9c2a3d" : "#2a2a2a", stroke: "#9c2a3d", "stroke-width": 1.5 }));
        al.forEach(function (ln, i) { var ta = el("text", { "text-anchor": "middle", y: -H / 2 + 19 + i * 15, "font-size": 14, "font-weight": 600 }); ta.textContent = ln; g.appendChild(ta); });
        if (n.sub) { var ts = el("text", { "text-anchor": "middle", y: H / 2 - 8, "font-size": 10.5, style: "fill:#e0cfd2" }); ts.textContent = n.sub + " ▸"; g.appendChild(ts); }
      } else {
        var lines = wrap(n.label, 24), Wi = 170, Hi = 16 + lines.length * 13;
        g.appendChild(el("rect", { x: -Wi / 2, y: -Hi / 2, width: Wi, height: Hi, rx: 6, "class": "shape", fill: n.selected ? "#ffffff" : "#141414", stroke: n.itemKind === "noref" ? "#888" : "#ffffff", "stroke-dasharray": n.itemKind === "noref" ? "4 3" : "", "stroke-width": 1.2 }));
        lines.forEach(function (ln, i) {
          var tt = el("text", { "text-anchor": "middle", y: -Hi / 2 + 18 + i * 13, "font-size": 12, style: n.selected ? "fill:#0d0d0d" : "" }); tt.textContent = ln; g.appendChild(tt);
        });
      }
      self.gNodes.appendChild(g);
    });
    this.renderCrumbs();
    this.host.querySelector('[data-cmd="back"]').disabled = !this.path.branch;
  };

  MapView.prototype.renderCrumbs = function () {
    var p = this.path, parts = ['<button type="button" data-level="0">KORVE</button>'];
    if (p.branch) parts.push('<span class="sep">›</span><button type="button" data-level="1">' + esc(p.branch) + "</button>");
    if (p.aspect) parts.push('<span class="sep">›</span><button type="button" data-level="2">' + esc(DATA.aspects.filter(function (a) { return a.id === p.aspect; })[0].label) + "</button>");
    if (p.item) parts.push('<span class="sep">›</span><span>' + esc(itemLabel(p)) + "</span>");
    this.host.querySelector(".crumbs").innerHTML = parts.join(" ");
  };
  function itemLabel(p) {
    var it = itemsFor(K.branchById[p.branch], p.aspect).filter(function (x) { return x.id === p.item; })[0];
    return it ? it.label : p.item;
  }

  MapView.prototype.destroy = function () { if (this.resizeObs) this.resizeObs.disconnect(); cancelAnimationFrame(this.raf); };

  window.KMap = { MapView: MapView, itemsFor: itemsFor };
})();
