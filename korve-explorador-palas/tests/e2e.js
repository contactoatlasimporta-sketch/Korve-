/* Prueba de punta a punta con Playwright. Uso: node tests/e2e.js [carpeta-capturas] */
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs"), assert = require("assert");
const URL = require("./target");
const shots = process.argv[2];
if (shots) fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const step = (n) => console.log("✔ " + n);

  /* ---------- Mapa ---------- */
  await page.goto(URL + "#mapa");
  await page.waitForSelector(".node");
  assert.strictEqual(await page.locator(".node").count(), 4, "raíz + 3 ramas");
  assert.ok(await page.locator("#panel").textContent().then((t) => t.includes("Cómo usar el mapa")));
  if (shots) await page.screenshot({ path: path.join(shots, "1-mapa.png") });
  step("Mapa inicial: KORVE + 3 ramas y ayuda de navegación");

  await page.click('.node[data-branch="POWER"][data-kind="branch"]');
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('.node[data-kind="aspect"]').count(), 7);
  for (const t of ["Comportamiento", "Jugador", "Muestra candidata", "Referencias", "Desarrollar", "Pruebas que deciden", "Información faltante", "Ventana exploratoria"])
    assert.ok((await page.locator("#panel").textContent()).includes(t), "panel POWER incluye " + t);
  assert.ok(page.url().endsWith("#mapa--POWER"));
  step("Rama POWER: 7 aspectos en mapa y panel, ventana marcada como propuesta");

  const vb1 = await page.locator("#map svg").getAttribute("viewBox");
  await page.click('[data-cmd="in"]');
  const vb2 = await page.locator("#map svg").getAttribute("viewBox");
  assert.notStrictEqual(vb1, vb2, "acercar cambia el encuadre");
  await page.click('[data-cmd="out"]'); await page.click('[data-cmd="out"]');
  await page.click('[data-cmd="center"]'); await page.waitForTimeout(450);
  step("Acercar / alejar / centrar");

  await page.click('.node[data-kind="aspect"][data-aspect="refs"]');
  await page.waitForTimeout(450);
  assert.strictEqual(await page.locator('.node[data-kind="item"]').count(), 5);
  await page.click('.node[data-item="bb-technical-viper-30"]');
  await page.waitForTimeout(300);
  const pt = await page.locator("#panel").textContent();
  assert.ok(pt.includes("Babolat Technical Viper 3.0") && pt.includes("370 ±10") && pt.includes("cualitativo, sin mm"));
  assert.ok(pt.includes("Declaración del fabricante") && pt.includes("Medición externa"));
  if (shots) await page.screenshot({ path: path.join(shots, "2-mapa-ficha.png") });
  step("Tercer nivel: referencias y ficha con etiquetas de evidencia");

  await page.click('[data-cmd="back"]'); await page.waitForTimeout(100);
  assert.ok(page.url().endsWith("#mapa--POWER--refs"));
  await page.locator("#map").press("Escape");
  await page.waitForTimeout(100);
  assert.ok(page.url().endsWith("#mapa--POWER"), "Esc vuelve un nivel: " + page.url());
  await page.click('[data-cmd="back"]'); await page.waitForTimeout(100);
  assert.strictEqual(await page.locator('.node[data-kind="aspect"]').count(), 0);
  step("Volver al nivel anterior con botón y Esc");

  await page.goto(URL + "#mapa--HYBRID--sample");
  await page.waitForTimeout(400);
  assert.ok((await page.locator("#panel").textContent()).includes("MC-005"));
  await page.focus('.node[data-item="mc005"]'); await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  assert.ok((await page.locator("#panel").textContent()).includes("364,1"));
  step("Enlace profundo y activación por teclado (HYBRID → MC-005)");

  /* ---------- Explorador ---------- */
  await page.click('nav a[data-view="mercado"]');
  await page.waitForSelector(".brand-card");
  assert.strictEqual(await page.locator(".brand-card").count(), 41);
  assert.ok((await page.locator("#count").textContent()).includes("41 de 41"));
  await page.fill("#f-q", "genius");
  const g = await page.locator(".brand-card h3").allTextContents();
  assert.ok(g.some((t) => t.startsWith("NOX")) && g.some((t) => t.startsWith("Enebe")), "búsqueda genius: " + g);
  await page.fill("#f-q", "");
  await page.selectOption("#f-coverage", "parcial");
  const parc = await page.locator(".brand-card").count();
  assert.ok(parc > 0 && parc < 41);
  assert.strictEqual(await page.locator(".cov-completa").count(), 0);
  await page.selectOption("#f-coverage", "");
  await page.selectOption("#f-season", "2027");
  const s27 = await page.locator(".brand-card h3").allTextContents();
  assert.ok(s27.some((t) => t.startsWith("NOX")) && !s27.some((t) => t.startsWith("Gamma")));
  await page.selectOption("#f-season", "");
  await page.selectOption("#f-brand", "tecnifibre");
  const famOpts = await page.locator("#f-family option").allTextContents();
  assert.ok(famOpts.includes("Bomba") && famOpts.length === 4, "familias de Tecnifibre: " + famOpts);
  await page.selectOption("#f-family", "tecnifibre|Curva");
  assert.strictEqual(await page.locator(".fam.match").count(), 1);
  await page.click("#f-clear");
  await page.check('input[name="feat"][value="polietileno"]');
  assert.strictEqual(await page.locator(".brand-card").count(), 1);
  await page.fill("#f-q", "zzzz");
  assert.ok((await page.locator(".empty").textContent()).includes("Sin resultados"));
  if (shots) await page.screenshot({ path: path.join(shots, "3-mercado-vacio.png") });
  await page.click("#f-clear-2");
  assert.strictEqual(await page.locator(".brand-card").count(), 41);
  step("Explorador: 41 marcas, búsqueda, marca, familia, temporada, cobertura, características y estado vacío");

  /* ---------- Comparador ---------- */
  await page.click('nav a[data-view="comparador"]');
  assert.ok((await page.locator(".empty").textContent()).includes("No hay palas seleccionadas"));
  step("Comparador vacío");
  await page.click('nav a[data-view="mercado"]');
  await page.selectOption("#f-brand", "gamma");
  await page.click('[data-action="add-compare"][data-id="gm-sterling"]');
  await page.goto(URL + "#muestras");
  await page.click('#sample-mc005 [data-action="add-compare"]');
  await page.goto(URL + "#comparador");
  await page.selectOption('select[data-slot="2"]', "sx-obsidian-pro-2027");
  await page.waitForSelector("table.cmp");
  const ct = await page.locator("main").textContent();
  for (const t of ["Masa (g)", "Balance (mm)", "Configuración de medición", "Datos pendientes", "sin correa", "dos overgrips", "18K no es mejor que 12K", "no se convierten en milímetros", "En blanco (no medido)", "Medición interna", "Declaración de proveedor"])
    assert.ok(ct.includes(t), "comparador incluye: " + t);
  assert.strictEqual(await page.locator("table.cmp thead th").count(), 4);
  if (shots) await page.screenshot({ path: path.join(shots, "4-comparador.png"), fullPage: true });
  await page.selectOption('select[data-slot="0"]', "w3");
  await page.waitForTimeout(100);
  assert.ok((await page.locator("main").textContent()).includes("no equipararlas"), "advertencia de escalas de dureza");
  step("Comparador: 3 palas, advertencias de configuración, escalas, K y balance cualitativo");

  /* ---------- Muestras: medición local ---------- */
  await page.goto(URL + "#muestras--w3");
  for (const t of ["Objetivo solicitado", "Construcción declarada", "Medición real", "Opinión de tester", "Candidata POWER", "Referencia de comportamiento HYBRID"])
    assert.ok((await page.locator("main").textContent()).includes(t));
  await page.click("#sample-w3 details:has(.measure-form) > summary");
  await page.fill('#sample-w3 input[name="date"]', "2026-11-12");
  await page.fill('#sample-w3 input[name="mass"]', "367,4");
  await page.fill('#sample-w3 input[name="config"]', "grip original + correa, sin overgrip");
  await page.click('#sample-w3 .measure-form button[type="submit"]');
  await page.waitForTimeout(100);
  assert.ok((await page.locator("#sample-w3").textContent()).includes("367,4 g"));
  step("Muestras: cuatro tipos de dato y registro de medición local");

  /* ---------- Desarrollo ---------- */
  await page.goto(URL + "#desarrollo");
  const sts = await page.locator("select[data-status]").evaluateAll((els) => els.map((e) => e.value));
  assert.ok(sts.length >= 9 + 4 + 6 && sts.every((v) => v === "pendiente"), "todo pendiente al inicio");
  assert.ok(!(await page.locator("main").textContent()).includes("Realizado"));
  await page.selectOption('select[data-status="dev-masa"]', "planificado");
  await page.reload();
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "planificado");
  await page.fill('textarea[data-note="dev-dev-nucleo"]', "Nota de prueba").catch(async () => {
    await page.click("#dev-dev-nucleo details > summary"); await page.fill('textarea[data-note="dev-dev-nucleo"]', "Nota de prueba");
  });
  await page.waitForTimeout(400);
  step("Desarrollo: ensayos pendientes por defecto, estado y nota persistentes");

  /* ---------- Exportar / importar ---------- */
  await page.click('[data-action="export"]');
  const expText = await page.locator("#export-json").inputValue();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click(".dialog [data-dl]")]);
  const file = await dl.path();
  const exp = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.deepStrictEqual(JSON.parse(expText).data, exp.data, "texto copiable = archivo descargado");
  assert.strictEqual(exp.app, "korve-explorador");
  assert.strictEqual(exp.data.status["dev-masa"], "planificado");
  assert.ok(exp.data.measurements.w3.length === 1 && exp.data.notes["dev-dev-nucleo"]);
  await page.click(".dialog [data-close]");
  await page.goto(URL + "#fuentes");
  await page.click('[data-action="clear-local"]');
  await page.click(".dialog [data-close]");
  await page.goto(URL + "#desarrollo");
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "planificado", "cancelar no borra");
  await page.goto(URL + "#fuentes");
  await page.click('[data-action="clear-local"]');
  await page.click(".dialog [data-ok]");
  await page.goto(URL + "#desarrollo");
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "pendiente");
  await page.setInputFiles('input[data-action="import"]', file);
  await page.click(".dialog [data-ok]");
  await page.waitForTimeout(200);
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "planificado");
  const bad = path.join(path.dirname(file), "bad.json"); fs.writeFileSync(bad, '{"x":1}');
  await page.setInputFiles('input[data-action="import"]', bad);
  assert.ok((await page.locator("#import-errors").textContent()).length > 0, "muestra los errores");
  assert.strictEqual(await page.locator(".dialog [data-ok]").count(), 0, "no pide confirmación para un archivo inválido");
  await page.click(".dialog [data-close]");
  await page.waitForTimeout(200);
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "planificado", "importación inválida no borra datos");
  await page.goto(URL + "#fuentes");
  await page.click('[data-action="clear-local"]'); await page.click(".dialog [data-ok]");
  await page.click('[data-action="paste-import"]');
  await page.fill("#import-json", expText);
  await page.click(".dialog [data-imp]"); await page.click(".dialog [data-ok]");
  await page.goto(URL + "#desarrollo");
  assert.strictEqual(await page.locator('select[data-status="dev-masa"]').inputValue(), "planificado", "importación pegada");
  step("Exportar (copiar y descargar), confirmar dentro de la página, importar archivo o texto y rechazar inválido");

  /* ---------- Fábrica y fuentes ---------- */
  await page.goto(URL + "#fabrica");
  const ft = await page.locator("main").textContent();
  assert.ok(ft.includes("Sin ganador declarado") && ft.includes("NEX") && ft.includes("William") && ft.includes("40%"));
  if (shots) await page.screenshot({ path: path.join(shots, "5-fabrica.png") });
  await page.goto(URL + "#fuentes");
  const links = await page.locator('main a[href^="http"]').count();
  assert.ok(links >= 41 + 19 + 5 + 1, "enlaces de fuentes: " + links);
  const fsrc = await page.locator("main").textContent();
  assert.ok(fsrc.includes("11/11/2026") && !/\bTomi\b/.test(fsrc));
  assert.ok(await page.locator('a[href="https://twu.tennis-warehouse.com/learning_center/padel/padelspecs.php"]').count() >= 2, "enlace Padel University");
  step("Fábrica sin ganador; fuentes con " + links + " enlaces y fecha de corte");

  /* ---------- Móvil ---------- */
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  mp.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
  for (const v of ["mapa--CONTROL", "mercado", "comparador", "muestras", "desarrollo", "fabrica", "fuentes"]) {
    await mp.goto(URL + "#" + v); await mp.waitForTimeout(450);
    const over = await mp.evaluate(() => Math.max(document.documentElement.scrollWidth, window.innerWidth) - 390); /* innerWidth crece si algo desborda */
    assert.ok(over <= 1, v + ": desborde horizontal de " + over + "px");
    if (shots) await mp.screenshot({ path: path.join(shots, "m-" + v.replace("--", "-") + ".png") });
  }
  await mp.goto(URL + "#mapa");
  await mp.tap('.node[data-branch="CONTROL"][data-kind="branch"]');
  await mp.waitForTimeout(450);
  assert.strictEqual(await mp.locator('.node[data-kind="aspect"]').count(), 7);
  step("Móvil 390 px: sin desborde horizontal en todas las vistas y mapa táctil");

  await browser.close();
  if (errors.length) { console.error("Errores de página:\n" + errors.join("\n")); process.exit(1); }
  console.log("\nTodas las pruebas pasaron.");
})().catch((e) => { console.error(e); process.exit(1); });
