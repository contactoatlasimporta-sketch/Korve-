/* Pruebas específicas: importación atómica, notas pendientes, escalas de dureza y
 * mediciones locales en las advertencias del comparador.
 * Uso: node tests/robustness.js   (KORVE_FILE=ruta.html para probar otra versión) */
const { chromium } = require("playwright");
const path = require("path"), assert = require("assert");
const URL = "file://" + (process.env.KORVE_FILE || path.join(__dirname, "..", "index.html"));
const KEY = "korve-explorador-v1";

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const step = (n) => console.log("✔ " + n);
  const raw = () => page.evaluate((k) => localStorage.getItem(k), KEY);
  const main = () => page.locator("main").textContent();

  /* ---------- Estado base ---------- */
  await page.goto(URL + "#desarrollo");
  await page.selectOption('select[data-status="dev-masa"]', "en-curso");
  await page.goto(URL + "#muestras--w3");
  await page.click("#sample-w3 details:has(.measure-form) > summary");
  await page.fill('#sample-w3 input[name="date"]', "2026-11-12");
  await page.fill('#sample-w3 input[name="mass"]', "367,4");
  await page.selectOption('#sample-w3 select[name="overgrips"]', "0");
  await page.selectOption('#sample-w3 select[name="strap"]', "si");
  await page.selectOption('#sample-w3 select[name="protector"]', "no");
  await page.fill('#sample-w3 input[name="config"]', "grip original + correa");
  await page.click('#sample-w3 .measure-form button[type="submit"]');
  const base = await raw();
  const baseObj = JSON.parse(base);
  assert.strictEqual(baseObj.measurements.w3[0].overgrips, 0);
  assert.strictEqual(baseObj.measurements.w3[0].strap, true);
  const valid = { app: "korve-explorador", formatVersion: 1, data: baseObj };

  /* ---------- 1. Validación completa antes de modificar ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function mut(fn) { const v = clone(valid); fn(v); return JSON.stringify(v); }
  const bad = {
    "JSON inválido": "{no es json",
    "lista en lugar de objeto": "[]",
    "otra app": mut((v) => { v.app = "otra"; }),
    "formatVersion incompatible": mut((v) => { v.formatVersion = 2; }),
    "versión de datos incompatible": mut((v) => { v.data.version = 99; }),
    "sin versión de datos": mut((v) => { delete v.data.version; }),
    "data no es objeto": mut((v) => { v.data = "x"; }),
    "sección desconocida": mut((v) => { v.data.extra = {}; }),
    "notes como lista": mut((v) => { v.data.notes = []; }),
    "nota numérica": mut((v) => { v.data.notes["dev-dev-masa"] = 5; }),
    "nota de id desconocido": mut((v) => { v.data.notes["dev-inventado"] = "x"; }),
    "estado inválido": mut((v) => { v.data.status["dev-masa"] = "realizado"; }),
    "estado de id desconocido": mut((v) => { v.data.status["x"] = "pendiente"; }),
    "estado de préstamo con opción de ensayo": mut((v) => { v.data.status["loan-viper"] = "en-curso"; }),
    "mediciones no son lista": mut((v) => { v.data.measurements.w3 = { a: 1 }; }),
    "muestra desconocida": mut((v) => { v.data.measurements.zz = []; }),
    "fecha inválida": mut((v) => { v.data.measurements.w3[0].date = "2026-02-30"; }),
    "masa no numérica": mut((v) => { v.data.measurements.w3[0].mass = "abc"; }),
    "masa como número": mut((v) => { v.data.measurements.w3[0].mass = 367.4; }),
    "sin masa ni balance": mut((v) => { v.data.measurements.w3[0].mass = ""; }),
    "sin configuración": mut((v) => { v.data.measurements.w3[0].config = " "; }),
    "campo extra en medición": mut((v) => { v.data.measurements.w3[0].foo = 1; }),
    "overgrips fuera de rango": mut((v) => { v.data.measurements.w3[0].overgrips = 7; }),
    "correa no booleana": mut((v) => { v.data.measurements.w3[0].strap = "si"; }),
    "medición nula": mut((v) => { v.data.measurements.w3.push(null); }),
    "results con contenido": mut((v) => { v.data.results = { "dev-masa": ["hecho"] }; }),
    "compare no es lista": mut((v) => { v.data.compare = "w3"; }),
    "compare con 4": mut((v) => { v.data.compare = ["w3", "amp22", "mc005", "ks01"]; }),
    "compare repetido": mut((v) => { v.data.compare = ["w3", "w3"]; }),
    "compare desconocido": mut((v) => { v.data.compare = ["pala-inventada"]; }),
    "nota de fábrica desconocida": mut((v) => { v.data.factoryNotes["x|nex"] = "a"; })
  };
  for (const [name, text] of Object.entries(bad)) {
    const r = await page.evaluate((t) => new Promise((res) => window.K.importText(t, (e) => res(e ? e.message : null))), text);
    assert.ok(r, "debe rechazar: " + name);
    assert.strictEqual(await raw(), base, "el estado no cambia al rechazar: " + name);
  }
  // Por la interfaz: muestra errores, no pide confirmación y no cambia nada.
  await page.goto(URL + "#fuentes");
  await page.click('[data-action="paste-import"]');
  await page.fill("#import-json", bad["fecha inválida"]);
  await page.click(".dialog [data-imp]");
  assert.ok((await page.locator("#import-errors").textContent()).includes("fecha inválida"));
  assert.strictEqual(await page.locator(".dialog [data-ok]").count(), 0);
  await page.click(".dialog [data-close]");
  assert.strictEqual(await raw(), base);
  // Una exportación válida (incluida una anterior sin formatVersion) sí se importa.
  const old = clone(valid); delete old.formatVersion; old.data.notes["dev-dev-eva"] = "nota importada";
  const ok = await page.evaluate((t) => new Promise((res) => window.K.importText(t, (e) => res(e ? e.message : "ok"))), JSON.stringify(old));
  assert.strictEqual(ok, "ok");
  assert.strictEqual(JSON.parse(await raw()).notes["dev-dev-eva"], "nota importada");
  // Estado local guardado corrupto: se respalda y no rompe la app.
  await page.evaluate((k) => localStorage.setItem(k, '{"version":1,"notes":[]}'), KEY);
  await page.reload();
  assert.ok((await page.evaluate((k) => localStorage.getItem(k + "-respaldo-incompatible"), KEY)).includes('"notes":[]'));
  await page.goto(URL + "#desarrollo");
  assert.ok((await main()).includes("no tenían un formato válido"));
  await page.evaluate(() => localStorage.clear());
  step("Importación: " + Object.keys(bad).length + " casos inválidos rechazados sin tocar el estado; válidos aceptados; estado corrupto respaldado");

  /* ---------- 2. Notas pendientes ---------- */
  await page.goto(URL + "#desarrollo");
  await page.click("#dev-dev-masa details.note-box > summary");
  await page.locator('textarea[data-note="dev-dev-masa"]').pressSequentially("recién escrita");
  await page.click('[data-action="export"]'); // sin esperar el guardado diferido
  const exp = JSON.parse(await page.locator("#export-json").inputValue());
  assert.strictEqual(exp.data.notes["dev-dev-masa"], "recién escrita", "la exportación incluye la nota pendiente");
  assert.strictEqual(exp.formatVersion, 1);
  await page.click(".dialog [data-close]");

  await page.click("#dev-dev-eva details.note-box > summary");
  await page.locator('textarea[data-note="dev-dev-eva"]').pressSequentially("antes de cambiar de vista");
  await page.click('nav a[data-view="fuentes"]');
  assert.strictEqual(JSON.parse(await raw()).notes["dev-dev-eva"], "antes de cambiar de vista");

  await page.goto(URL + "#fabrica");
  await page.locator('textarea[data-fnote="fm-rend|nex"]').pressSequentially("nota de fábrica");
  await page.goto(URL + "#mapa"); // navegación inmediata
  assert.strictEqual(JSON.parse(await raw()).factoryNotes["fm-rend|nex"], "nota de fábrica");

  await page.goto(URL + "#mapa--POWER");
  await page.click("#panel details.note-box > summary");
  await page.locator('textarea[data-note="branch-POWER"]').pressSequentially("nota del mapa");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('[data-cmd="back"]'); // vuelve a la raíz: el panel se redibuja
  assert.strictEqual(JSON.parse(await raw()).notes["branch-POWER"], "nota del mapa");

  await page.goto(URL + "#muestras");
  await page.click("#sample-ks01 details.note-box > summary");
  await page.locator('textarea[data-note="sample-ks01"]').pressSequentially("antes de cerrar");
  await page.reload(); // cierre / recarga inmediata (pagehide)
  assert.strictEqual(JSON.parse(await raw()).notes["sample-ks01"], "antes de cerrar");

  await page.goto(URL + "#desarrollo");
  await page.click("#dev-dev-aero details.note-box > summary");
  await page.locator('textarea[data-note="dev-dev-aero"]').pressSequentially("no debe revivir");
  await page.goto(URL + "#fuentes");
  await page.click('[data-action="clear-local"]'); await page.click(".dialog [data-ok]");
  await page.waitForTimeout(500);
  assert.deepStrictEqual(JSON.parse(await raw()).notes, {}, "borrar no deja notas pendientes que reaparezcan");
  step("Notas pendientes: incluidas al exportar y guardadas al cambiar de vista, de panel, recargar y borrar");

  /* ---------- 3. Escalas de dureza ---------- */
  async function compare(ids) {
    await page.evaluate(([k, ids]) => { const s = JSON.parse(localStorage.getItem(k) || "{}"); s.version = 1; s.notes = s.notes || {}; s.status = s.status || {}; s.measurements = s.measurements || {}; s.factoryNotes = s.factoryNotes || {}; s.results = {}; s.compare = ids; localStorage.setItem(k, JSON.stringify(s)); }, [KEY, ids]);
    await page.goto(URL + "#comparador"); await page.reload();
    return main();
  }
  let t = await compare(["w3", "amp22"]);
  assert.ok(!t.includes("Escalas de dureza distintas"), "W3 y AMP22 comparten Shore C");
  assert.ok(!t.includes("sin escala identificada en"), "W3/AMP22 tienen escala");
  assert.ok(t.includes("Misma escala de dureza (Shore C) en KORVE W3 y KORVE AMP22"));
  t = await compare(["w3", "sx-obsidian-pro-2027"]);
  assert.ok(t.includes("Escalas de dureza distintas") && t.includes("Shore C: KORVE W3") && t.includes("0–10"));
  t = await compare(["bb-technical-viper-30", "ox-ultimate-proplus"]);
  assert.ok(t.includes("Dureza sin escala identificada en Babolat Technical Viper 3.0, Oxdog Ultimate Pro+"));
  assert.ok(!t.includes("Escalas de dureza distintas") && !t.includes("Misma escala de dureza"));
  t = await compare(["w3", "amp22", "ks01"]);
  assert.ok(t.includes("Dureza sin escala identificada en KORVE KS-01") && !t.includes("Escalas de dureza distintas") && !t.includes("Misma escala"));
  step("Dureza: misma escala sin advertencia de escalas distintas; escalas distintas y sin escala detectadas");

  /* ---------- 4. Mediciones locales en las advertencias ---------- */
  t = await compare(["w3", "amp22"]);
  assert.ok(!t.includes("Overgrips distintos"), "objetivos W3 y AMP22 con la misma configuración");
  assert.ok(!t.includes("Medición interna)"), "sin mediciones aún");
  async function addMeasure(sid, date, mass, og, strap, config) {
    await page.goto(URL + "#muestras--" + sid);
    await page.click("#sample-" + sid + " details:has(.measure-form) > summary");
    await page.fill("#sample-" + sid + ' input[name="date"]', date);
    await page.fill("#sample-" + sid + ' input[name="mass"]', mass);
    await page.selectOption("#sample-" + sid + ' select[name="overgrips"]', og);
    await page.selectOption("#sample-" + sid + ' select[name="strap"]', strap);
    await page.fill("#sample-" + sid + ' input[name="config"]', config);
    await page.click("#sample-" + sid + ' .measure-form button[type="submit"]');
  }
  await addMeasure("w3", "2026-11-13", "369,8", "2", "si", "lista para jugar, dos overgrips");
  t = await compare(["w3", "amp22"]);
  assert.ok(t.includes("Overgrips distintos") && t.includes("KORVE W3 · registro local 2026-11-13 = 2 overgrips") && t.includes("KORVE AMP22 · Objetivo solicitado = 0 overgrips"), "la medición local entra en la advertencia");
  assert.ok(t.includes("Medición interna"), "la evidencia local entra en la mezcla de clases");
  assert.ok(t.includes("369,8 g") && t.includes("2 overgrips · con correa · protector: sin dato"), "la tabla muestra la configuración local");
  assert.ok(t.includes("Protector: sin dato en KORVE W3 · registro local 2026-11-13"));
  await addMeasure("w3", "2026-11-14", "367,9", "0", "si", "grip original + correa");
  t = await compare(["w3"]);
  assert.ok(t.includes("Los registros locales de KORVE W3 tienen configuraciones distintas"), "advierte con una sola pala");
  t = await compare(["gm-sterling", "w3"]);
  assert.ok(t.includes("Correa distintos") && t.includes("Gamma Sterling · Peso declarado = sin correa"));
  // Una medición local que coincide con el objetivo no genera conflicto.
  await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.measurements = {}; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload();
  await addMeasure("amp22", "2026-11-13", "356,5", "0", "si", "grip original + correa");
  t = await compare(["w3", "amp22"]);
  assert.ok(!t.includes("Overgrips distintos") && !t.includes("Correa distintos"));
  step("Mediciones locales: configuración en advertencias y tabla, con una o varias palas");

  await browser.close();
  if (errors.length) { console.error("Errores de página:\n" + errors.join("\n")); process.exit(1); }
  console.log("\nPruebas específicas: todas pasaron.");
})().catch((e) => { console.error(e); process.exit(1); });
