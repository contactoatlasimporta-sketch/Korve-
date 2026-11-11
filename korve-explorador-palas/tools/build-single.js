/* Genera dist/korve-explorador.html: la app completa en un solo archivo (útil en celular).
   Uso: node tools/build-single.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) =>
  "<style>\n" + fs.readFileSync(path.join(root, f), "utf8") + "\n</style>");
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) =>
  "<script>\n" + fs.readFileSync(path.join(root, f), "utf8").replace(/<\/script/gi, "<\\/script") + "\n</script>");
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
