/* Experiencia "Entender KORVE": portada (#inicio) y ficha de MC-005 (#pala--mc005).
 * Uso: node tests/experience.js   (KORVE_FILE=ruta.html para otra versión) */
const { chromium } = require("playwright");
const assert = require("assert");
const URL = require("./target");

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const step = (n) => console.log("✔ " + n);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  /* ---------- Portada ---------- */
  await page.goto(URL);
  await page.waitForSelector(".xp-home");
  assert.strictEqual(await page.locator("main").getAttribute("data-view"), "inicio", "la entrada por defecto es la portada");
  assert.strictEqual(await page.locator('nav.tabs a[aria-current="page"]').getAttribute("data-view"), "inicio");
  const home = await page.locator("main").textContent();
  for (const t of ["Tres palas con un carácter propio cada una.", "Qué queremos crear", "Tres perfiles", "Cuatro muestras", "Dónde estamos", "Próximo paso", "Cómo leer cada dato", "Profundizar", "ninguna pala está aprobada"])
    assert.ok(home.includes(t), "portada incluye: " + t);
  assert.strictEqual(await page.locator(".sm").count(), 4, "cuatro muestras");
  step("Portada: apertura, cuatro bloques del recorrido, lectura de datos y acceso a Profundizar");

  await page.click('.hero-actions [data-goto="s-que"]');
  await page.waitForTimeout(700);
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), "s-que-t", "Explorar el proyecto lleva el foco a la primera sección");
  const top = await page.evaluate(() => document.getElementById("s-que").getBoundingClientRect().top);
  const hb = await page.evaluate(() => document.querySelector(".top").getBoundingClientRect().bottom);
  assert.ok(top >= hb - 2 && top < hb + 40, "la sección queda visible bajo el encabezado (" + top + " / " + hb + ")");
  step("Acción principal: desplaza a la sección y mueve el foco al título");

  /* Perfiles: clic y teclado (patrón de pestañas) */
  await page.click("#pf-tab-HYBRID");
  assert.strictEqual(await page.getAttribute("#pf-tab-HYBRID", "aria-selected"), "true");
  assert.ok((await page.locator(".pf-panel").textContent()).includes("Una sola pala para todo el partido"));
  assert.strictEqual(await page.locator(".pf-panel").getAttribute("data-profile"), "HYBRID");
  await page.keyboard.press("ArrowRight");
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), "pf-tab-CONTROL");
  assert.strictEqual(await page.locator(".pf-panel").getAttribute("data-profile"), "CONTROL");
  await page.keyboard.press("Home");
  assert.strictEqual(await page.locator(".pf-panel").getAttribute("data-profile"), "POWER");
  await page.keyboard.press("ArrowLeft");
  assert.strictEqual(await page.locator(".pf-panel").getAttribute("data-profile"), "CONTROL", "las flechas recorren en círculo");
  assert.strictEqual(await page.locator('.pf-tab[tabindex="0"]').count(), 1, "una sola pestaña en el orden de tabulación");
  assert.ok((await page.locator(".pf-panel").textContent()).includes("Hipótesis de desarrollo"), "cada perfil se presenta como hipótesis");
  step("Perfiles: selección con clic, flechas, Inicio; una pestaña tabulable y estado de hipótesis");

  /* Desplegable animado: abre, conserva contenido y cierra */
  const det = page.locator(".pf-panel details.smooth");
  await det.locator("summary").click(); await page.waitForTimeout(400);
  assert.ok(await det.evaluate((d) => d.open), "el desplegable abre");
  assert.ok((await det.textContent()).includes("Ventana de peso y balance"), "muestra el detalle técnico");
  await det.locator("summary").click(); await page.waitForTimeout(400);
  assert.ok(!(await det.evaluate((d) => d.open)), "el desplegable cierra");
  step("Desplegables: apertura y cierre animados sin perder el contenido");

  /* Términos explicables */
  const term = page.locator('.xp-read .term[data-term="balance"]');
  await term.click();
  await page.waitForSelector("#termtip.show");
  assert.ok((await page.locator("#termtip").textContent()).includes("desde el tapón"));
  assert.strictEqual(await term.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  assert.strictEqual(await page.locator("#termtip").count(), 0, "Escape cierra la explicación");
  assert.strictEqual(await page.evaluate(() => document.activeElement.getAttribute("data-term")), "balance", "el foco vuelve al término");
  step("Términos: explicación en el lugar, Escape la cierra y devuelve el foco");

  /* Estabilidad de diseño al cargar (sin saltos que no provoque el usuario) */
  const cls = await page.evaluate(() => new Promise((res) => {
    let v = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) v += e.value; })).observe({ type: "layout-shift", buffered: true });
    setTimeout(() => res(v), 500);
  }));
  assert.ok(cls < 0.05, "desplazamiento de diseño acumulado bajo al cargar: " + cls.toFixed(3));
  step("Estabilidad: CLS " + cls.toFixed(3));

  /* ---------- Ficha MC-005 ---------- */
  await page.click('.sm-ref a.sm-go');
  await page.waitForSelector(".xp-pala");
  assert.ok(page.url().endsWith("#pala--mc005"));
  assert.strictEqual(await page.locator('nav.tabs a[aria-current="page"]').getAttribute("data-view"), "muestras", "la ficha se ubica en Muestras");
  const cols = page.locator(".num-col");
  assert.strictEqual(await cols.count(), 3);
  const [ct, cw, co] = [await cols.nth(0).textContent(), await cols.nth(1).textContent(), await cols.nth(2).textContent()];
  assert.ok(ct.includes("360 ±5") && ct.includes("255 ±7") && ct.includes("Lo declara el proveedor") && ct.includes("no tolerancia contractual garantizada") && ct.includes("Configuración de referencia") && !ct.includes("Con qué se pesó"), "objetivo del proveedor (nota y rótulo desde los datos; un objetivo no se pesa)");
  assert.ok(cw.includes("357") && cw.includes("250") && cw.includes("Lo declara el proveedor") && cw.includes("no aportados") && cw.includes("Film de embalaje") && cw.includes("Condiciones informadas"), "lectura de William como declaración, con sus condiciones conocidas y pendientes");
  assert.ok(co.includes("364,1") && co.includes("Lo medimos nosotros") && co.includes("Sin medir") && co.includes("2 overgrips"), "medición propia con balance sin medir");
  assert.ok(!/357|250 mm|360 ±5/.test(co), "la medición propia no mezcla cifras de otras fuentes");
  assert.strictEqual(await cols.nth(1).locator(".voice-KM").count(), 0, "la lectura de William no lleva la etiqueta de medición propia");
  step("Ficha: objetivo del proveedor, lectura de William y medición de Tomás separados, con su voz y configuración");

  /* Diagramas paso a paso */
  const bal = page.locator("#st-balance");
  assert.strictEqual(await bal.getAttribute("data-step"), "0");
  assert.ok(await bal.locator("[data-step-prev]").isDisabled());
  await bal.locator("[data-step-next]").click();
  assert.strictEqual(await bal.getAttribute("data-step"), "1");
  await bal.locator('.step[data-i="3"]').click();
  assert.strictEqual(await bal.getAttribute("data-step"), "3");
  assert.ok(await bal.locator("[data-step-next]").isDisabled(), "último paso");
  assert.strictEqual(await bal.locator('.step[aria-pressed="true"]').count(), 1);
  assert.ok((await bal.locator(".stepper-count").textContent()).includes("Paso 4 de 4"));
  assert.ok((await bal.textContent()).includes("Nuestro propio balance todavía no se midió"));
  assert.ok((await page.locator("#st-core").textContent()).includes("Proporciones ilustrativas"), "el corte aclara que es ilustrativo");
  assert.ok((await page.locator(".pala-art figcaption").textContent()).includes("no es una foto de MC-005"), "el esquema de la pala aclara que no es una foto");
  step("Diagramas: pasos con anterior/siguiente, selección directa, lectura del paso y aclaración de esquemas");

  /* El diagrama y el texto del balance siguen a los datos de MC-005 (no hay cifras escritas a mano). */
  const svgOf = () => page.evaluate(() => { const s = [...document.querySelectorAll("#st-balance svg")].find((x) => getComputedStyle(x).display !== "none"); const band = s.querySelector(".band"), wil = s.querySelector(".wil");
    return { text: s.textContent, band: band ? [+band.getAttribute("x"), +band.getAttribute("width")] : null, wil: wil ? +wil.getAttribute("x1") : null, vb: s.viewBox.baseVal.width }; });
  const orig = await svgOf();
  assert.ok(orig.text.includes("255 ±7 mm") && orig.text.includes("250 mm") && orig.text.includes("nuestra medición: pendiente"), "valores actuales de la ficha en el dibujo");
  assert.ok(!/más rápida|más inercia/.test(orig.text), "el dibujo no asocia balance con rapidez o inercia");
  await page.evaluate(() => {
    const s = window.K.sampleById.mc005, row = (l) => s.declared.find((d) => d.label === l);
    row("Balance objetivo del proveedor").v = "262 ±5 mm"; row("Balance de la muestra informado por William").v = "248 mm"; row("Dimensiones").v = "460 mm de largo; 38 mm de espesor";
    window.KApp.rerender();
  });
  const chg = await svgOf();
  assert.ok(chg.text.includes("262 ±5 mm") && chg.text.includes("248 mm") && !chg.text.includes("255 ±7"), "el dibujo toma los valores nuevos");
  const k = (x) => 40 + x / 460 * 560; /* misma escala que el dibujo ancho */
  assert.ok(Math.abs(chg.band[0] - k(257)) < 0.5 && Math.abs(chg.band[1] - (k(267) - k(257))) < 0.5 && Math.abs(chg.wil - k(248)) < 0.5, "las marcas se ubican a escala de los datos nuevos");
  assert.ok((await page.locator("#st-balance").textContent()).includes("El proveedor pide 262 ±5 mm y William informó 248 mm"), "el texto del paso también");
  assert.ok((await page.locator("#st-balance .art-note").textContent()).includes("460 mm"), "la nota de escala usa el largo declarado");
  await page.evaluate(() => { const s = window.K.sampleById.mc005; s.declared = s.declared.filter((d) => d.label !== "Balance de la muestra informado por William"); window.KApp.rerender(); });
  const sinW = await svgOf();
  assert.ok(sinW.wil === null && !/William informó/.test(sinW.text), "sin dato de William, no se dibuja su marca ni su etiqueta");
  await page.goto(URL + "#inicio"); await page.reload(); await page.goto(URL + "#pala--mc005");
  step("Balance ligado a los datos: valores, escala y texto cambian con la ficha; sin dato no hay marca");

  /* Tester: resúmenes, no citas */
  const q = await page.locator(".q-t").allTextContents();
  assert.ok(q.length === 2 && q.every((t) => !/[“”"]/.test(t)), "las opiniones no se presentan como citas textuales");
  assert.ok((await page.locator("#p-tester").textContent()).includes("no citas textuales"));
  step("Tester: opiniones registradas sin comillas de cita");

  /* Profundizar: ficha técnica completa con formulario y notas existentes */
  await page.click('[data-open-tech]'); await page.waitForTimeout(700);
  assert.ok(await page.locator("details.tech").evaluate((d) => d.open));
  assert.strictEqual(await page.locator("#sample-mc005").count(), 1);
  await page.click("#sample-mc005 details:has(.measure-form) > summary");
  await page.fill('#sample-mc005 input[name="date"]', "2026-11-14");
  await page.fill('#sample-mc005 input[name="mass"]', "359,8");
  await page.fill('#sample-mc005 input[name="balance"]', "254");
  await page.selectOption('#sample-mc005 select[name="overgrips"]', "0");
  await page.fill('#sample-mc005 input[name="config"]', "grip + correa, sin overgrip, sin film");
  await page.click('#sample-mc005 .measure-form button[type="submit"]');
  await page.waitForTimeout(200);
  assert.ok((await page.locator(".local-reg").textContent()).includes("359,8 g · 254 mm"), "la medición local aparece en la ficha nueva");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("korve-explorador-v1")).measurements.mc005[0]);
  assert.strictEqual(saved.mass, "359,8");
  await page.click('.hero-actions [data-action="add-compare"]');
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem("korve-explorador-v1")).compare)).includes("mc005"));
  step("Profundizar: ficha técnica completa, registro de medición local y comparador siguen funcionando");

  await page.goto(URL + "#pala--w3");
  assert.ok((await page.locator("main").textContent()).includes("ficha en preparación"));
  step("Otras muestras: aviso de ficha en preparación con acceso a sus datos");

  /* ---------- Movimiento reducido ---------- */
  const rm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const rp = await rm.newPage();
  await rp.goto(URL + "#inicio");
  await rp.click("#pf-tab-CONTROL");
  await rp.locator(".pf-panel details.smooth summary").click();
  await rp.goto(URL + "#pala--mc005");
  await rp.locator("#st-balance [data-step-next]").click();
  const running = await rp.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  assert.strictEqual(running, 0, "sin animaciones en curso con movimiento reducido");
  assert.ok(await rp.locator(".pf-panel, .xp-pala").first().isVisible());
  await rm.close();
  step("Movimiento reducido: sin animaciones y todo el contenido visible");

  /* ---------- Celulares: toques y legibilidad de diagramas ---------- */
  for (const w of [375, 390, 430]) {
    const m = await browser.newContext({ viewport: { width: w, height: 800 }, screen: { width: w, height: 800 }, isMobile: true, hasTouch: true });
    const mp = await m.newPage();
    mp.on("pageerror", (e) => errors.push(w + ": " + e.message));
    await mp.goto(URL + "#inicio");
    await mp.tap("#pf-tab-HYBRID");
    assert.strictEqual(await mp.locator(".pf-panel").getAttribute("data-profile"), "HYBRID", w + ": selección táctil de perfil");
    await mp.tap('.xp-read .term[data-term="k12"]');
    const sheet = await mp.locator("#termtip").boundingBox();
    assert.ok(sheet && sheet.x >= 0 && sheet.x + sheet.width <= w, w + ": explicación dentro de la pantalla");
    await mp.tap(".termtip-x");
    for (const v of ["inicio", "pala--mc005"]) {
      await mp.goto(URL + "#" + v); await mp.reload(); await mp.waitForTimeout(300);
      const over = await mp.evaluate((W) => Math.max(document.documentElement.scrollWidth, innerWidth) - W, w);
      assert.ok(over <= 1, w + " " + v + ": desborde horizontal " + over);
      const small = await mp.evaluate(() => {
        const out = [];
        document.querySelectorAll("main svg text").forEach((t) => {
          const svg = t.ownerSVGElement; if (!svg.getClientRects().length || getComputedStyle(svg).display === "none") return;
          const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          const px = parseFloat(getComputedStyle(t).fontSize) * k;
          if (px < 10.5) out.push(t.textContent.trim() + " " + px.toFixed(1));
        });
        document.querySelectorAll("main *").forEach((el) => {
          if (el.closest("svg") || !el.childNodes.length) return;
          const own = [].some.call(el.childNodes, (n) => n.nodeType === 3 && n.textContent.trim());
          if (own && el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 11) out.push(el.className + " " + getComputedStyle(el).fontSize);
        });
        return out;
      });
      assert.deepStrictEqual(small, [], w + " " + v + ": textos chicos");
    }
    await mp.tap('.pala-nav [data-goto="p-tester"]'); await mp.waitForTimeout(700);
    const tt = await mp.evaluate(() => document.getElementById("p-tester-t").getBoundingClientRect().top);
    const navB = await mp.evaluate(() => document.querySelector(".pala-nav").getBoundingClientRect().bottom);
    assert.ok(tt >= navB - 1, w + ": la navegación interna no tapa el título (" + tt + " / " + navB + ")");
    await m.close();
  }
  step("Celulares 375/390/430: toques, explicaciones, sin desbordes, textos y diagramas legibles, navegación interna sin tapar títulos");

  await browser.close();
  if (errors.length) { console.error("Errores de página:\n" + errors.join("\n")); process.exit(1); }
  console.log("\nExperiencia Entender KORVE: todo en orden.");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
