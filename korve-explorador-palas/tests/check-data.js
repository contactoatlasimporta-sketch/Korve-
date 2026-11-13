/* Verifica la integridad y las reglas de rigor de los datos. Uso: node tests/check-data.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { window: {} }; vm.createContext(ctx);
["meta", "brands", "references", "korve", "branches"].forEach((f) =>
  vm.runInContext(fs.readFileSync(path.join(root, "data", f + ".js"), "utf8"), ctx));
const D = ctx.window.KORVE_DATA;
const errors = [];
const ok = (c, m) => { if (!c) errors.push(m); };

ok(D.brands.length === 41, "Debe haber 41 marcas, hay " + D.brands.length);
ok(new Set(D.brands.map((b) => b.id)).size === D.brands.length, "IDs de marca duplicados");
D.brands.forEach((b) => {
  ok(/^https:\/\//.test(b.url), b.name + ": falta enlace de fuente");
  ok(["completa", "parcial"].includes(b.coverage), b.name + ": cobertura inválida");
  ok(b.coverageBasis, b.name + ": falta motivo de cobertura");
  ok(b.families.length > 0, b.name + ": sin familias");
  b.features.forEach((f) => ok(D.featureTags[f], b.name + ": etiqueta desconocida " + f));
});

const EV = Object.keys(D.evidence), MISS = Object.keys(D.missingStates);
function checkVal(v, where) {
  if (v == null) return;
  if (Array.isArray(v)) return v.forEach((x) => checkVal(x, where));
  if (typeof v === "string") return;
  if (v.missing) return ok(MISS.includes(v.missing), where + ": estado ausente inválido " + v.missing);
  ok(EV.includes(v.ev), where + ": dato sin clase de evidencia válida: " + JSON.stringify(v));
  if (v.u === "mm") ok(/^[\d ±–,.]+$/.test(v.v), where + ": balance en mm no numérico: " + v.v);
  if (v.qual) ok(!v.u, where + ": balance cualitativo con unidad");
}
D.references.forEach((r) => {
  ok(D.brands.some((b) => b.id === r.brandId), r.name + ": marca inexistente");
  ok(/^https:\/\//.test(r.url), r.name + ": falta enlace");
  ["mass", "balance", "face", "core", "finish", "hardness", "other", "friction"].forEach((k) => checkVal(r[k], r.name + "." + k));
  ok(r.mass.u === "g" || r.mass.missing, r.name + ": masa debe estar en g");
  ok(r.config, r.name + ": falta configuración de medición");
});
D.samples.forEach((s) => {
  ["mass", "balance", "face", "core", "finish", "hardness", "other", "friction"].forEach((k) => checkVal(s.compare[k], s.name + ".compare." + k));
  s.requested.forEach((x) => ok(x.ev === "KO", s.name + ": objetivo solicitado debe ser KO"));
  s.declared.forEach((x) => ok(x.ev === "KP" || x.missing, s.name + ": construcción declarada debe ser KP"));
  s.measured.forEach((x) => ok(x.ev === "KM" || x.missing, s.name + ": medición debe ser KM"));
  s.tester.forEach((x) => ok(x.ev === "KT", s.name + ": opinión debe ser KT"));
});
ok(D.samples.find((s) => s.id === "mc005").role.includes("HYBRID"), "MC-005 debe ser referencia HYBRID");
// Los ensayos no deben venir marcados como realizados en los datos.
D.devItems.forEach((d) => ok(Array.isArray(d.results) && d.results.length === 0, d.change + ": no debe tener resultados en el informe inicial"));
// Referencias de ramas válidas.
D.branches.forEach((b) => {
  b.refs.items.forEach((it) => ok(!it.refId || D.references.some((r) => r.id === it.refId), b.id + ": ref inexistente " + it.refId));
  b.develop.devIds.forEach((id) => ok(D.devItems.some((d) => d.id === id), b.id + ": dev inexistente " + id));
  b.sample.sampleIds.forEach((id) => ok(D.samples.some((s) => s.id === id), b.id + ": muestra inexistente " + id));
  D.aspects.forEach((a) => ok(b[a.id] && b[a.id].summary, b.id + ": falta aspecto " + a.id));
});
// Durezas con escala explícita y configuraciones estructuradas válidas.
function checkHard(h, where) { if (h && !h.missing) ok(D.hardnessScales[h.scale], where + ": dureza sin escala válida"); }
function checkSpecs(specs, where) {
  (specs || []).forEach((c) => {
    ok(c.label, where + ": configuración sin etiqueta");
    ok(c.overgrips === null || [0, 1, 2, 3].includes(c.overgrips), where + ": overgrips inválido");
    ["strap", "protector"].forEach((k) => ok(c[k] === null || typeof c[k] === "boolean", where + ": " + k + " inválido"));
  });
}
D.references.forEach((r) => { checkHard(r.hardness, r.name); checkSpecs(r.configSpecs, r.name); });
D.samples.forEach((s) => { checkHard(s.compare.hardness, s.name); ok(Array.isArray(s.compare.configSpecs) && s.compare.configSpecs.length, s.name + ": faltan configuraciones estructuradas"); checkSpecs(s.compare.configSpecs, s.name); });
ok(/^https:\/\//.test(D.frictionData.sourceUrl), "Falta enlace de Padel University");
ok(!/\bTomi\b/.test(JSON.stringify(D)), "Usar el nombre Tomás Sánchez, no Tomi");
// Actualización de William (13/11/2026): lecturas del proveedor separadas de las mediciones locales.
const mc = D.samples.find((x) => x.id === "mc005"), ks = D.samples.find((x) => x.id === "ks01");
[[mc, "364,1"], [ks, "366,6"]].forEach(([smp, v]) => {
  const m = smp.measured.find((x) => x.label === "Masa");
  ok(m && m.v === v && m.ev === "KM" && /Tomás/.test(m.who), smp.name + ": se conserva la medición local de Tomás (" + v + " g, KM)");
  ok(smp.measured.some((x) => x.label === "Balance" && x.missing === "BLANK"), smp.name + ": el balance local de Tomás sigue en blanco");
  ok(smp.compare.mass.some((x) => x.v === v && x.ev === "KM"), smp.name + ": el comparador conserva la medición local de Tomás");
  [...smp.declared, ...smp.compare.mass, ...smp.compare.balance].forEach((x) => {
    if (/William/.test(x.label || "") || /informada por William/.test(x.note || "")) ok(x.ev === "KP", smp.name + ": una lectura de William debe ser declaración de proveedor (KP), no " + x.ev);
  });
});
ok(ks.compare.hardness.scale === "sin-escala" && /19–22/.test(ks.compare.hardness.v), "KS-01: 19–22 sin escala asignada");
JSON.stringify(D).split(/(?<=[.;"])/).filter((t) => /19–22/.test(t)).forEach((t) =>
  ok(!/\b(Shore|kg\/m|g\/cm)/.test(t) || /no (tratar|comparable)|No comparable|no tratar/i.test(t), "19–22 no debe asociarse a Shore ni a una unidad de densidad: " + t));
ok(mc.warnings.concat(ks.warnings).some((w) => /no están garantizados simultáneamente/.test(w)), "Sin garantía acordada de peso y balance simultáneos");
ok(D.factories.find((f) => f.id === "william").toValidate.some((t) => /fuera de especificación/.test(t)), "Fábrica William: política de unidades fuera de especificación pendiente");
// Ningún texto declara ganador ni "mejor".
const all = JSON.stringify(D);
ok(!/ganador:/i.test(all), "No debe haber ganador declarado");

if (errors.length) { console.error("ERRORES (" + errors.length + "):\n- " + errors.join("\n- ")); process.exit(1); }
console.log("Datos OK: " + D.brands.length + " marcas, " + D.references.length + " fichas, " + D.samples.length + " muestras, " + D.devItems.length + " mejoras.");
