/* Genera las versiones de un solo archivo (sin rutas externas):
 *  - dist/korve-explorador.html: la app completa, útil en celular y sin conexión.
 *  - dist/artifact.html: la misma página sin <html>/<head>/<body>, que agrega el visor del chat.
 * El logo y las fuentes Sora/Inter se incrustan como data: URI.
 * Uso: node tools/build-single.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const dataUri = (rel, type) => "data:" + type + ";base64," + fs.readFileSync(path.join(root, rel)).toString("base64");
const LOGO = dataUri("assets/korve-logo.png", "image/png");

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => {
  let css = fs.readFileSync(path.join(root, f), "utf8");
  css = css.replace(/url\((?:\.\.\/)?fonts\/([^)]+\.woff2)\)/g, (_, font) => "url(" + dataUri("fonts/" + font, "font/woff2") + ")");
  return "<style>\n" + css + "\n</style>";
});
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) =>
  "<script>\n" + fs.readFileSync(path.join(root, f), "utf8").replace(/<\/script/gi, "<\\/script") + "\n</script>");
/* El favicon repetiría el logo incrustado: en las versiones de un solo archivo se omite. */
html = html.replace(/\s*<link rel="icon"[^>]*>/, "");
html = html.split("assets/korve-logo.png").join(LOGO);
if (/(?:src|href)="(?:assets|fonts|css|js|data)\//.test(html) || /url\((?:\.\.\/)?fonts\//.test(html)) throw new Error("Quedó una ruta externa sin incrustar");

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "korve-explorador.html"), html);
console.log("dist/korve-explorador.html (" + Math.round(html.length / 1024) + " KB)");

/* Variante para vista previa en el chat (artifact): sin <html>/<head>/<body>, que el visor agrega. */
const art = html
  .replace(/<!doctype html>\s*/i, "").replace(/<\/?html[^>]*>\s*/gi, "")
  .replace(/<\/?head>\s*/gi, "").replace(/<\/?body>\s*/gi, "")
  .replace(/<meta charset="utf-8">\s*/i, "").replace(/<meta name="viewport"[^>]*>\s*/i, "");
fs.writeFileSync(path.join(root, "dist", "artifact.html"), art);
console.log("dist/artifact.html (" + Math.round(art.length / 1024) + " KB)");
