/* URL a probar. Por defecto index.html; con KORVE_FILE, otra versión.
 * dist/artifact.html no trae <html>/<head>: el visor del chat la envuelve con charset y
 * viewport (width=device-width, viewport-fit=cover). Aquí se reproduce ese envoltorio
 * para que la prueba vea la página como el visor y no como un documento sin viewport. */
const fs = require("fs"), os = require("os"), path = require("path");
const file = process.env.KORVE_FILE || path.join(__dirname, "..", "index.html");
let target = file;
if (/artifact\.html$/.test(file)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "korve-visor-"));
  target = path.join(dir, "visor.html");
  fs.writeFileSync(target, '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n' + fs.readFileSync(file, "utf8") + "\n</body></html>");
}
module.exports = "file://" + target;
