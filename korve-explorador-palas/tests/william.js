/* Actualización de William (13/11/2026): cada dato aparece con su clase de evidencia en las vistas.
 * Uso: node tests/william.js   (KORVE_FILE=ruta.html para otra versión) */
const { chromium } = require("playwright");
const assert = require("assert");
const URL = require("./target");
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const vp of [{ width: 1366, height: 860 }, { width: 375, height: 667 }]) {
    const page = await (await browser.newContext({ viewport: vp, screen: vp, isMobile: vp.width < 600, hasTouch: vp.width < 600 })).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const tag = vp.width + " px";
    await page.goto(URL + "#muestras--mc005");
    for (const [id, tomas, wMass, wBal] of [["mc005", "364,1", "357 g", "250 mm"], ["ks01", "366,6", "361 g", "257 mm"]]) {
      const card = page.locator("#sample-" + id);
      const real = await card.locator(".quad > div").nth(2).textContent();
      assert.ok(real.includes(tomas) && real.includes("Medición interna") && real.includes("En blanco"), tag + " " + id + ": la medición local de Tomás sigue en Medición real");
      assert.ok(!real.includes(wMass), tag + " " + id + ": la lectura de William no se muestra como medición real");
      const decl = await card.locator(".quad > div").nth(1).textContent();
      assert.ok(decl.includes(wMass) && decl.includes(wBal) && decl.includes("informada por William"), tag + " " + id + ": lecturas de William en construcción declarada");
      for (const label of ["Masa de la muestra informada por William", "Balance de la muestra informado por William"]) {
        const row = card.locator(".kv", { hasText: label });
        assert.ok((await row.textContent()).includes("Declaración de proveedor"), tag + " " + id + ": " + label + " con etiqueta de proveedor");
        assert.strictEqual(await row.locator(".ev-KM").count(), 0);
      }
    }
    const ksText = await page.locator("#sample-ks01").textContent();
    assert.ok(ksText.includes("19–22") && !/19–22[^.]*Shore C(?! ni)/.test(ksText.replace("No tratar como Shore C", "")), tag + ": 19–22 sin escala Shore");
    assert.ok(ksText.includes("no están garantizados simultáneamente"), tag + ": aviso de peso y balance no garantizados");
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("korve-explorador-v1") || "{}"); localStorage.setItem("korve-explorador-v1", JSON.stringify({ version: 1, notes: s.notes || {}, status: s.status || {}, results: {}, factoryNotes: s.factoryNotes || {}, measurements: s.measurements || {}, compare: ["mc005", "ks01", "w3"] })); });
    await page.goto(URL + "#comparador"); await page.reload();
    const cmp = await page.locator("main").textContent();
    assert.ok(cmp.includes("357 g") && cmp.includes("364,1 g") && cmp.includes("361 g") && cmp.includes("366,6 g"), tag + ": comparador muestra lecturas de William y mediciones de Tomás");
    assert.ok(cmp.includes("Dureza sin escala identificada en KORVE KS-01"), tag + ": 19–22 tratado como dureza sin escala");
    assert.ok(cmp.includes("Medición interna") && cmp.includes("Declaración de proveedor"), tag + ": evidencias separadas en el comparador");
    await page.goto(URL + "#fabrica");
    const fab = await page.locator("main").textContent();
    assert.ok(fab.includes("Prioriza peso sobre balance") && fab.includes("No se aceptó el envío automático en cajas separadas") && fab.includes("Sin ganador declarado"), tag + ": fábrica con limitaciones de control de calidad");
    await page.goto(URL + "#fuentes");
    const src = await page.locator("main").textContent();
    assert.ok(src.includes("19–22 fue llamado dureza y después densidad") && src.includes("no es una nueva revisión del mercado"), tag + ": fuentes con la actualización interna");
    console.log("✔ " + tag + ": Muestras, Comparador, Fábrica y Fuentes");
  }
  await browser.close();
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  console.log("Actualización de William: todo en orden.");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
