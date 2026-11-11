/*
 * Ramas del mapa conceptual: POWER, HYBRID y CONTROL (secciones 8, 9, 10 y 11).
 * Cada aspecto tiene "summary" (corto) y "details" (desplegable).
 * refs: ids de window.KORVE_DATA.references (fichas) o { name, why } sin ficha.
 */
window.KORVE_DATA = window.KORVE_DATA || {};

window.KORVE_DATA.aspects = [
  { id: "behavior", label: "Comportamiento" },
  { id: "player", label: "Jugador" },
  { id: "sample", label: "Muestra candidata" },
  { id: "refs", label: "Referencias" },
  { id: "develop", label: "Desarrollar" },
  { id: "tests", label: "Pruebas que deciden" },
  { id: "missing", label: "Información faltante" }
];

window.KORVE_DATA.branches = [
  { id: "POWER", name: "POWER", tagline: "Acelerar y finalizar",
    behavior: {
      summary: "Potencia que el jugador puede aprovechar durante un partido: velocidad de remate, profundidad de volea y víbora.",
      details: [
        "No volverse inestable fuera del centro ni lenta en todas las transiciones.",
        "Se acepta que requiera más esfuerzo que CONTROL.",
        "No se acepta que su potencia solo aparezca en un golpe perfecto y desaparezca en el resto."
      ] },
    player: {
      summary: "Intermedio avanzado / avanzado ofensivo, con técnica para acelerar y que no quiere perder completamente la defensa.",
      details: ["No intentar satisfacer con una única POWER al rematador profesional y al principiante."] },
    sample: {
      sampleIds: ["w3"],
      summary: "W3 (NEX): base interna natural por objetivo de masa/balance. Candidata, sin validación.",
      details: [
        "Comparar la unidad original y una variante de menor inercia conservando lo máximo posible su respuesta.",
        "No aprobar aligerar el mango indiscriminadamente: puede subir el balance y empeorar el resultado buscado."
      ] },
    refs: {
      summary: "Prioritarias: Technical Viper 3.0, Coello Pro 2026 y Bomba Max. Segunda ronda: Metalbone HRD+ y Hack 05.",
      items: [
        { refId: "bb-technical-viper-30", why: "Respuesta firme.", tier: "Prioritaria" },
        { refId: "hd-coello-pro-2026", why: "Extremo ofensivo; techo ofensivo y fatiga.", tier: "Prioritaria" },
        { refId: "tf-bomba-max", why: "Respuesta progresiva multicapa (no porque 18K sea mejor que 12K).", tier: "Prioritaria" },
        { refId: "ad-metalbone-hrdplus-2026", why: "Distribución de masa ajustable.", tier: "Segunda ronda" },
        { refId: "bp-hack05-27", why: "Ataque, diamante.", tier: "Segunda ronda" }
      ] },
    develop: {
      summary: "Distribución de masa, consistencia de núcleo/laminado y tolerancias primero; luego núcleo multicapa, acabado, EVA y refuerzos locales.",
      devIds: ["dev-masa", "dev-nucleo", "dev-tolerancias", "dev-multicapa", "dev-rugosidad", "dev-eva", "dev-refuerzos"],
      details: ["Variante de menor inercia de W3 conservando su respuesta."] },
    tests: {
      summary: "Más velocidad útil o más remates eficaces a esfuerzo comparable, sin deteriorar defensa, dispersión, estabilidad y fatiga.",
      criterion: { main: "Más velocidad útil o más remates eficaces a esfuerzo comparable.", also: "No deteriorar defensa, dispersión, estabilidad y fatiga por encima del margen acordado." },
      details: [
        "W3 original vs. variante de menor inercia vs. referencias firmes y multicapa.",
        "Series de 20 golpes válidos en remate, bandeja/víbora y volea, más defensa (Etapa B).",
        "Inercia a 100 mm y torsión en laboratorio (Etapa C)."
      ] },
    missing: {
      summary: "Medición individual de W3, resultado de cancha, inercia/torsión y márgenes de no inferioridad.",
      details: [
        "La ficha NEX repite rangos, no lecturas individuales.",
        "No hay resultado de cancha local consolidado.",
        "No hay número de swingweight/twistweight: faltan mediciones de las unidades en un mismo equipo."
      ] },
    window: { mass: "365–372 g", balance: "263–270 mm", pending: "Si W3 necesita menos inercia sin perder ataque." } },

  { id: "HYBRID", name: "HYBRID", tagline: "Sólida en todas las fases",
    behavior: {
      summary: "Solidez previsible a distintas intensidades: conservar firmeza, estabilidad, salida suficiente y capacidad de atacar de MC.",
      details: [
        "Reducir errores de profundidad y pérdida de rendimiento fuera del centro, conservando maniobrabilidad.",
        "No debe ser simplemente la media aritmética entre POWER y CONTROL."
      ] },
    player: {
      summary: "Jugador competitivo versátil que defiende, construye y finaliza, y quiere una única pala para todo el partido.",
      details: [] },
    sample: {
      sampleIds: ["mc005"],
      summary: "MC-005 (William): referencia de comportamiento HYBRID. El rival interno sigue siendo MC hasta que otra la supere.",
      details: [
        "Es referencia por uso, no ficha de laboratorio.",
        "Tomás pidió conservar movilidad y tacto seco y añadir peso: merece una variante controlada."
      ] },
    refs: {
      summary: "AT10 2026 de Tomás como comparación disponible; Genius 12K 2027; Neuron 27. Adicionales: StarVie Eternal y Wilson Bela.",
      items: [
        { name: "NOX AT10 Luxury Genius 12K Alum XTREM 2026 (Tomás)", why: "Comparación disponible y vinculada al feedback de MC. Sin ficha en el informe.", tier: "Prioritaria" },
        { refId: "nx-genius-12k-2027", why: "Comprobar si aporta una mejora real sobre la 2026.", tier: "Prioritaria" },
        { refId: "bp-neuron-27", why: "Contrastar un tacto firme.", tier: "Prioritaria" },
        { name: "StarVie Eternal", why: "Referencia adicional; no sustituye el ensayo directo. Sin ficha en el informe.", tier: "Adicional" },
        { name: "Wilson Bela", why: "Referencia adicional; no sustituye el ensayo directo. Sin ficha en el informe.", tier: "Adicional" }
      ] },
    develop: {
      summary: "Distribución de masa (incluida una variante más pesada), consistencia, tolerancias, núcleo multicapa, acabado y EVA.",
      devIds: ["dev-masa", "dev-nucleo", "dev-tolerancias", "dev-multicapa", "dev-rugosidad", "dev-eva"],
      details: ["Incluir la variante más pesada solicitada por Tomás."] },
    tests: {
      summary: "MC actual vs. MC con redistribución reversible vs. futura HYBRID de la fábrica elegida.",
      criterion: { main: "Rendimiento consistente entre defensa, construcción y ataque.", also: "Mantener cualidades preferidas de MC; no aceptar mejora mínima de una fase que empeore mucho otra." },
      details: [
        "MC actual, MC con pequeña redistribución reversible de masa y futura HYBRID de la fábrica seleccionada.",
        "Series por fase de juego (Etapa B) y análisis por perfil de jugador."
      ] },
    missing: {
      summary: "Balance real de MC, ficha normalizada sin overgrips y opiniones de más de un jugador.",
      details: [
        "Tomás anotó 364,1 g con dos overgrips; balance en blanco.",
        "La referencia del proveedor (360 ±5 g / 255 ±7 mm) es sin overgrip: no comparable directamente.",
        "La preferencia por MC procede de una persona."
      ] },
    window: { mass: "358–367 g", balance: "252–260 mm", pending: "Qué combinación conserva sensación MC y mejora estabilidad/rapidez; incluir variante más pesada solicitada por Tomás." } },

  { id: "CONTROL", name: "CONTROL", tagline: "Colocar y defender con precisión",
    behavior: {
      summary: "Precisión, tolerancia y rapidez sin sensación hueca, incluso fuera del centro.",
      details: [
        "Facilitar cambios de dirección y profundidad.",
        "Devolver impactos descentrados sin una caída brusca de salida o torsión.",
        "Una pelota que sale fácil puede ayudar en defensa y perjudicar el bloqueo: medir ambas cosas."
      ] },
    player: {
      summary: "Jugador técnico que prioriza colocación, defensa, bloqueo y transiciones, incluyendo niveles altos.",
      details: ["CONTROL no significa pala de iniciación ni necesariamente núcleo muy blando."] },
    sample: {
      sampleIds: ["amp22"],
      summary: "AMP22 (NEX): candidata razonable por 357 g / 250 mm objetivo. Sin validación.",
      details: [
        "Falta validar que no pague rapidez con poca estabilidad.",
        "Si fuera fácil de mover pero inconsistente al bloquear, redistribuir masa o revisar laminado antes de declararla terminada."
      ] },
    refs: {
      summary: "Endure Pro V1, Gravity Pro 2027 (cuando esté disponible) y Obsidian Pro 2027. Contrastes: Kuikma Control Pro, Curva Speed y Royal Padel.",
      items: [
        { name: "Wilson Endure Pro V1", why: "Referencia de control para AMP22. Sin ficha D en el informe; tiene un dato L de fricción.", tier: "Prioritaria" },
        { refId: "hd-gravity-pro-2027", why: "Control con masa intermedia, cuando esté disponible.", tier: "Prioritaria" },
        { refId: "sx-obsidian-pro-2027", why: "Lágrima de control.", tier: "Prioritaria" },
        { refId: "kk-control-pro", why: "Contraste de valor y construcción.", tier: "Contraste" },
        { refId: "tf-curva-speed-2026", why: "Contraste de respuesta más firme.", tier: "Contraste" },
        { name: "Royal Padel (polietileno)", why: "Límite de comodidad, sin convertir esa cualidad en la definición completa de CONTROL. Sin ficha en el informe.", tier: "Contraste" }
      ] },
    develop: {
      summary: "Masa periférica de AMP22, consistencia, tolerancias, refuerzos locales, acabado y EVA.",
      devIds: ["dev-masa", "dev-nucleo", "dev-tolerancias", "dev-refuerzos", "dev-rugosidad", "dev-eva"],
      details: ["Cuánta masa periférica necesita AMP22 para resistir impactos descentrados."] },
    tests: {
      summary: "Menor dispersión y mayor tasa de acierto, central y descentrado, con salida suficiente en defensa y bloqueo estable.",
      criterion: { main: "Menor dispersión y mayor tasa de acierto, central y descentrado.", also: "Salida suficiente en defensa, estabilidad de bloqueo y capacidad ofensiva mínima definida." },
      details: [
        "Medir defensa y bloqueo por separado (Etapa B).",
        "Mapa de respuesta y torsión en impactos descentrados (Etapa C)."
      ] },
    missing: {
      summary: "Medición real de AMP22, precisión de “flat-laid” y masa periférica necesaria.",
      details: [
        "No inferir tacto solo por la designación T700.",
        "Sin opinión de tester registrada en el informe."
      ] },
    window: { mass: "352–361 g", balance: "248–257 mm", pending: "Cuánta masa periférica necesita AMP22 para resistir impactos descentrados." } }
];

window.KORVE_DATA.windowNote = "Ventanas exploratorias, no especificaciones finales: propuestas de ingeniería basadas en nuestras muestras y el mapa comercial, no óptimos demostrados. Con grip y correa de producción, sin film, overgrip ni protector. Balance desde la base del tapón, correa recogida siempre igual. No adoptar como tolerancia de producción.";
