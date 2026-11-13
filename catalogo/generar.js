#!/usr/bin/env node
// Genera un catálogo PDF (A4) liviano para compartir por WhatsApp.
// Uso: node catalogo/generar.js [catalogo.json] [salida.pdf]
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const dir = __dirname;
const entrada = path.resolve(process.argv[2] || path.join(dir, "catalogo.json"));
const base = path.dirname(entrada);
const data = JSON.parse(fs.readFileSync(entrada, "utf8"));
const n = data.negocio;
const salida = path.resolve(
  process.argv[3] || path.join(dir, "salida", `catalogo-${slug(n.nombre)}.pdf`)
);

const POR_PAGINA = 6; // 2 columnas x 3 filas

function slug(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function esc(s = "") {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function precio(v) {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "string") return esc(v);
  return `${esc(n.moneda || "$")} ${v.toLocaleString("es-AR")}`;
}
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
function img(ruta) {
  if (!ruta) return "";
  if (/^https?:\/\//.test(ruta)) return ruta;
  const p = path.resolve(base, ruta);
  if (!fs.existsSync(p)) {
    console.warn(`⚠  No se encontró la foto: ${ruta}`);
    return "";
  }
  const mime = MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
  return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;
}

// Agrupa por categoría manteniendo el orden del JSON
const categorias = [];
for (const prod of data.productos) {
  const cat = prod.categoria || "Productos";
  let g = categorias.find((c) => c.nombre === cat);
  if (!g) categorias.push((g = { nombre: cat, items: [] }));
  g.items.push(prod);
}

const total = data.productos.length;
const wa = String(n.whatsapp || "").replace(/[^\d]/g, "");

function tarjeta(p) {
  const src = img(p.foto);
  const etiqueta = p.agotado ? "Sin stock" : p.etiqueta;
  return `
  <div class="card ${p.agotado ? "agotado" : ""}">
    <div class="foto">
      ${src ? `<img src="${src}">` : `<div class="sinfoto">Sin foto</div>`}
      ${etiqueta ? `<span class="tag ${p.agotado ? "tag-off" : ""}">${esc(etiqueta)}</span>` : ""}
    </div>
    <div class="info">
      <div class="fila"><h3>${esc(p.nombre)}</h3>${p.codigo ? `<span class="cod">${esc(p.codigo)}</span>` : ""}</div>
      ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}
      <div class="precio">
        ${p.precioAnterior ? `<s>${precio(p.precioAnterior)}</s>` : ""}
        <strong>${precio(p.precio)}</strong>
      </div>
    </div>
  </div>`;
}

let paginas = "";
let nroPagina = 1;
const indice = [];
for (const cat of categorias) {
  for (let i = 0; i < cat.items.length; i += POR_PAGINA) {
    nroPagina++;
    if (i === 0) indice.push({ nombre: cat.nombre, pagina: nroPagina, cant: cat.items.length });
    const trozo = cat.items.slice(i, i + POR_PAGINA);
    paginas += `
    <section class="page">
      <header class="top">
        <span class="marca">${esc(n.nombre)}</span>
        <h2>${esc(cat.nombre)}${i > 0 ? ` <em>(cont.)</em>` : ""}</h2>
      </header>
      <div class="grid">${trozo.map(tarjeta).join("")}</div>
      <footer class="bottom"><span>Pedidos por WhatsApp ${esc(n.whatsapp)}</span><span>${nroPagina}</span></footer>
    </section>`;
  }
}

const logo = img(n.logo);
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  :root { --c: ${n.colorPrincipal || "#14110f"}; --a: ${n.colorAcento || "#c8a45a"}; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1d1d1d; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 14mm 12mm 12mm; position: relative; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }

  .portada { background: var(--c); color: #fff; justify-content: center; align-items: center; text-align: center; }
  .portada .logo { max-width: 70mm; max-height: 40mm; margin-bottom: 14mm; }
  .portada h1 { font-size: 40pt; letter-spacing: .12em; font-weight: 300; }
  .portada .linea { width: 30mm; height: 1.2mm; background: var(--a); margin: 9mm auto; }
  .portada .sub { font-size: 14pt; letter-spacing: .3em; text-transform: uppercase; color: var(--a); }
  .portada .temp { margin-top: 4mm; font-size: 11pt; opacity: .7; }
  .indice { margin-top: 22mm; width: 120mm; text-align: left; }
  .indice div { display: flex; justify-content: space-between; border-bottom: .3mm solid rgba(255,255,255,.18); padding: 3mm 0; font-size: 11pt; }
  .indice span:last-child { color: var(--a); }
  .portada .pie { position: absolute; bottom: 14mm; left: 0; right: 0; font-size: 10pt; opacity: .75; }

  .top { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: .6mm solid var(--c); padding-bottom: 3mm; margin-bottom: 6mm; }
  .top .marca { font-size: 9pt; letter-spacing: .25em; text-transform: uppercase; color: #777; }
  .top h2 { font-size: 18pt; font-weight: 600; color: var(--c); }
  .top h2 em { font-size: 10pt; font-weight: 400; color: #888; font-style: normal; }
  .grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 5mm; }
  .card { min-height: 0; border: .3mm solid #e4e1dc; border-radius: 3mm; overflow: hidden; display: flex; flex-direction: column; background: #fff; }
  .foto { flex: 1; position: relative; background: #f4f2ef; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .foto img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 3mm; }
  .sinfoto { color: #aaa; font-size: 9pt; }
  .tag { position: absolute; top: 3mm; left: 3mm; background: var(--a); color: #fff; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 1mm 2.5mm; border-radius: 1mm; }
  .tag-off { background: #8a8a8a; }
  .agotado .foto img { opacity: .45; filter: grayscale(1); }
  .info { padding: 3mm 4mm 3.5mm; }
  .fila { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
  .info h3 { font-size: 11pt; font-weight: 600; }
  .cod { font-size: 7.5pt; color: #999; letter-spacing: .05em; white-space: nowrap; }
  .info p { font-size: 8pt; color: #666; margin-top: 1mm; line-height: 1.35; }
  .precio { margin-top: 2mm; display: flex; gap: 2.5mm; align-items: baseline; }
  .precio strong { font-size: 13pt; color: var(--c); }
  .precio s { font-size: 9pt; color: #999; }
  .bottom { display: flex; justify-content: space-between; font-size: 8pt; color: #999; margin-top: 4mm; }

  .contacto { background: var(--c); color: #fff; justify-content: center; align-items: center; text-align: center; }
  .contacto h2 { font-size: 26pt; font-weight: 300; letter-spacing: .08em; }
  .contacto .dato { font-size: 14pt; margin-top: 5mm; }
  .contacto .dato b { color: var(--a); font-weight: 600; }
  .contacto .wa { display: inline-block; margin-top: 12mm; background: var(--a); color: var(--c); padding: 4mm 10mm; border-radius: 10mm; font-weight: 700; text-decoration: none; font-size: 13pt; }
  .contacto .nota { position: absolute; bottom: 16mm; left: 20mm; right: 20mm; font-size: 9pt; opacity: .6; }
</style></head><body>
  <section class="page portada">
    ${logo ? `<img class="logo" src="${logo}">` : ""}
    <h1>${esc(n.nombre)}</h1>
    <div class="linea"></div>
    <div class="sub">${esc(n.subtitulo || "Catálogo")}</div>
    ${n.temporada ? `<div class="temp">${esc(n.temporada)}</div>` : ""}
    <div class="indice">${indice.map((c) => `<div><span>${esc(c.nombre)} · ${c.cant}</span><span>pág. ${c.pagina}</span></div>`).join("")}</div>
    <div class="pie">${total} productos · WhatsApp ${esc(n.whatsapp)}</div>
  </section>
  ${paginas}
  <section class="page contacto">
    <h2>¿Te gustó algo?</h2>
    <div class="dato">Escribinos por WhatsApp con el <b>código</b> del producto</div>
    ${n.whatsapp ? `<div class="dato"><b>${esc(n.whatsapp)}</b></div>` : ""}
    ${n.instagram ? `<div class="dato">Instagram <b>${esc(n.instagram)}</b></div>` : ""}
    ${n.web ? `<div class="dato">${esc(n.web)}</div>` : ""}
    ${wa ? `<a class="wa" href="https://wa.me/${wa}">Abrir WhatsApp</a>` : ""}
    ${n.nota ? `<div class="nota">${esc(n.nota)}</div>` : ""}
  </section>
</body></html>`;

(async () => {
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: salida, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  const kb = Math.round(fs.statSync(salida).size / 1024);
  console.log(`✓ Catálogo generado: ${salida} (${total} productos, ${nroPagina + 1} páginas, ${kb} KB)`);
  if (kb > 15000) console.warn("⚠  Pesa bastante: achicá las fotos a ~1200 px y JPG para que viaje rápido por WhatsApp.");
})();
