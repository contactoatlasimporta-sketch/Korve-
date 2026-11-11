/* Revisión móvil: geometría del mapa y de cada vista a 375, 390 y 430 px (vertical).
 * Comprueba texto dentro de su nodo, nodos sin superposición, tamaño mínimo de letra,
 * controles sin tapar, destinos de ancla visibles bajo el encabezado fijo y ausencia de desborde.
 * Se repite con una fuente de métricas tipo Helvetica (FreeSans) para aproximar iOS.
 * Uso: node tests/mobile.js [carpeta-capturas]   (KORVE_FILE=ruta.html para otra versión) */
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs"), assert = require("assert");
const URL = require("./target");
const shots = process.argv[2];
if (shots) fs.mkdirSync(shots, { recursive: true });
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const SIZES = [{ w: 375, h: 667 }, { w: 390, h: 844 }, { w: 430, h: 932 }];
const FONTS = [{ id: "sistema", css: "" }, { id: "helvetica", css: ':root{--font:"FreeSans","Helvetica Neue",Helvetica,Arial,sans-serif !important}' }];
const MAP_STATES = ["mapa", "mapa--POWER", "mapa--HYBRID--refs", "mapa--CONTROL--develop", "mapa--CONTROL--refs--hd-gravity-pro-2027"];
const VIEWS = ["mercado", "comparador", "muestras--mc005", "desarrollo--dev-eva", "desarrollo", "fabrica", "fuentes"];

/* Geometría del mapa medida en el navegador. */
function mapGeometry() {
  const nodes = [...document.querySelectorAll("#map .node")].map((g) => {
    const shape = g.querySelector(".shape").getBoundingClientRect();
    const texts = [...g.querySelectorAll("text")].map((t) => t.getBoundingClientRect());
    const k = parseFloat(getComputedStyle(g.querySelector("text")).fontSize);
    return { key: g.dataset.key, dim: g.classList.contains("dim"), shape, texts,
      minFont: Math.min(...[...g.querySelectorAll("text")].map((t) => +t.getAttribute("font-size"))) * (g.ownerSVGElement.getBoundingClientRect().width / g.ownerSVGElement.viewBox.baseVal.width) };
  });
  const problems = [];
  nodes.forEach((n) => {
    n.texts.forEach((t) => {
      if (t.left < n.shape.left - 0.5 || t.right > n.shape.right + 0.5 || t.top < n.shape.top - 0.5 || t.bottom > n.shape.bottom + 0.5)
        problems.push("texto fuera de su nodo: " + n.key);
    });
    if (n.minFont < 10.5) problems.push("letra de " + n.minFont.toFixed(1) + " px en " + n.key);
  });
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i].shape, b = nodes[j].shape;
    if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) problems.push("nodos superpuestos: " + nodes[i].key + " / " + nodes[j].key);
  }
  const svg = document.querySelector("#map svg").getBoundingClientRect();
  nodes.forEach((n) => { if (n.shape.left < svg.left - 1 || n.shape.right > svg.right + 1) problems.push("nodo cortado a los lados: " + n.key); });
  /* Controles: el punto central de cada uno debe ser el propio control (nada encima). */
  document.querySelectorAll("#map .map-controls button, #map .crumbs button").forEach((b) => {
    const r = b.getBoundingClientRect(); if (!r.width) return;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit && !b.contains(hit) && r.top > 0 && r.bottom < innerHeight) problems.push("control tapado: " + b.textContent);
  });
  return { problems, count: nodes.length };
}
function pageGeometry() {
  const problems = [];
  /* Se compara con el ancho real de pantalla: si algo desborda, el navegador agranda innerWidth y achica la página. */
  const W = screen.width;
  if (innerWidth > W + 1) problems.push("la página se ensanchó a " + innerWidth + " px (pantalla " + W + " px): hay contenido que desborda");
  const over = document.documentElement.scrollWidth - W;
  if (over > 1) problems.push("desborde horizontal de " + over + " px");
  /* Texto legible: ningún texto visible por debajo de 11 px. */
  const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  let n, small = new Set();
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (el.closest("svg")) continue;
    const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || !el.getClientRects().length) continue;
    if (parseFloat(cs.fontSize) < 11) small.add(el.tagName + "." + el.className + " " + cs.fontSize);
  }
  small.forEach((s) => problems.push("texto chico: " + s));
  /* Elementos más anchos que su contenedor (cortes). */
  document.querySelectorAll("main *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > W + 1 || r.left < -1) && !el.closest(".table-scroll,nav")) problems.push("fuera de pantalla: " + el.tagName + "." + el.className);
  });
  /* Campos táctiles de al menos 16 px (sin zoom automático de Safari). */
  document.querySelectorAll("main input:not([type=checkbox]):not([type=file]), main select, main textarea").forEach((el) => {
    if (el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 16) problems.push("campo con letra < 16 px: " + (el.name || el.id || el.tagName));
  });
  return [...new Set(problems)].slice(0, 12);
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  let total = 0;
  for (const font of FONTS) for (const size of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, screen: { width: size.w, height: size.h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: UA });
    if (font.css) await ctx.addInitScript((css) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, font.css);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const tag = font.id + "-" + size.w;
    await page.goto(URL + "#mapa");
    await page.evaluate(() => { localStorage.setItem("korve-explorador-v1", JSON.stringify({ version: 1, notes: {}, status: {}, results: {}, factoryNotes: {}, compare: ["w3", "mc005", "sx-obsidian-pro-2027"],
      measurements: { w3: [{ date: "2026-11-12", mass: "367,4", balance: "", who: "Gonza", config: "lista para jugar", note: "", overgrips: 2, strap: true, protector: null }] } })); });
    for (const st of MAP_STATES) {
      await page.goto(URL + "#" + st); await page.reload(); await page.waitForTimeout(250);
      assert.ok(await page.locator("#map.flow").count(), tag + ": disposición vertical en " + st);
      const g = await page.evaluate(mapGeometry);
      assert.deepStrictEqual(g.problems, [], tag + " " + st + ": " + g.problems.join(" | "));
      const pg = await page.evaluate(pageGeometry);
      assert.deepStrictEqual(pg, [], tag + " " + st + ": " + pg.join(" | "));
      if (shots && font.id === "helvetica") await page.locator("#map").screenshot({ path: path.join(shots, tag + "-" + st + ".png") });
      total++;
    }
    /* Interacción táctil: tocar rama → aspecto → ítem. */
    await page.goto(URL + "#mapa"); await page.reload();
    await page.tap('.node[data-branch="POWER"][data-kind="branch"]');
    await page.tap('.node[data-kind="aspect"][data-aspect="refs"]');
    await page.tap('.node[data-item="tf-bomba-max"]');
    assert.ok((await page.locator("#panel").textContent()).includes("Tecnifibre Bomba Max"), tag + ": selección táctil");
    assert.ok(page.url().endsWith("#mapa--POWER--refs--tf-bomba-max"));
    await page.tap('[data-cmd="back"]'); await page.tap('[data-cmd="back"]');
    assert.ok(page.url().endsWith("#mapa--POWER"));
    await page.tap('[data-cmd="in"]');
    const g2 = await page.evaluate(mapGeometry);
    assert.ok(!g2.problems.some((p) => p.startsWith("letra")), tag + ": el zoom no achica la letra");
    await page.tap('[data-cmd="out"]');
    assert.ok(await page.locator('[data-cmd="out"]').isDisabled(), tag + ": alejar se desactiva en la escala de lectura");
    const g3 = await page.evaluate(mapGeometry);
    assert.ok(!g3.problems.some((p) => p.startsWith("letra")), tag + ": alejar no baja de la letra mínima");
    await page.tap('[data-cmd="center"]');
    await page.tap('[data-cmd="detail"]'); await page.waitForTimeout(500);
    const panelTop = await page.evaluate(() => document.getElementById("panel").getBoundingClientRect().top);
    const headH = await page.evaluate(() => document.querySelector(".top").getBoundingClientRect().bottom);
    assert.ok(panelTop >= headH - 1, tag + ": el panel no queda bajo el encabezado (" + panelTop + " < " + headH + ")");

    for (const v of VIEWS) {
      await page.goto(URL + "#" + v); await page.reload(); await page.waitForTimeout(250);
      const pg = await page.evaluate(pageGeometry);
      assert.deepStrictEqual(pg, [], tag + " " + v + ": " + pg.join(" | "));
      if (v.includes("--")) {
        const id = v.startsWith("muestras") ? "sample-mc005" : "dev-dev-eva";
        const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, id);
        const hb = await page.evaluate(() => document.querySelector(".top").getBoundingClientRect().bottom);
        assert.ok(top >= hb - 1, tag + " " + v + ": el destino queda tapado por el encabezado (" + top + " < " + hb + ")");
      }
      if (shots && font.id === "helvetica" && size.w === 390) await page.screenshot({ path: path.join(shots, tag + "-" + v + ".png"), fullPage: true });
      total++;
    }
    /* Formularios y desplegables abiertos. */
    await page.goto(URL + "#muestras--w3"); await page.reload();
    await page.tap("#sample-w3 details:has(.measure-form) > summary");
    let pg = await page.evaluate(pageGeometry);
    assert.deepStrictEqual(pg, [], tag + " formulario: " + pg.join(" | "));
    if (shots && font.id === "helvetica" && size.w === 375) await page.locator("#sample-w3").screenshot({ path: path.join(shots, tag + "-formulario.png") });
    await page.tap('[data-action="export"]');
    const dlg = await page.locator(".dialog").boundingBox();
    assert.ok(dlg.x >= 0 && dlg.x + dlg.width <= size.w && dlg.y >= 0 && dlg.y + dlg.height <= size.h, tag + ": diálogo dentro de la pantalla");
    for (const b of await page.locator(".dialog button").all()) assert.ok(await b.isVisible(), tag + ": botón del diálogo visible");
    if (shots && font.id === "helvetica" && size.w === 375) await page.screenshot({ path: path.join(shots, tag + "-dialogo.png") });
    await ctx.close();
    console.log("✔ " + tag + ": mapa (5 estados), 6 vistas, toques, zoom, formulario y diálogo");
  }
  await browser.close();
  if (errors.length) { console.error("Errores de página:\n" + errors.join("\n")); process.exit(1); }
  console.log("\nRevisión móvil: " + total + " pantallas sin problemas geométricos.");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
