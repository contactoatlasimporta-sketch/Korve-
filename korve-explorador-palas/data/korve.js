/*
 * Información interna KORVE (secciones 7 a 12 del informe).
 * Fuente interna: save maestro KORVE del 11/11/2026, ficha NEX consolidada y
 * evaluación de Tomás Sánchez. Las cifras de proveedor no se transforman en mediciones.
 *
 * Para agregar resultados reales: completar "measurements" / "testerOpinion" de
 * cada muestra o "results" de cada ensayo, con su clase de evidencia y fecha.
 */
window.KORVE_DATA = window.KORVE_DATA || {};

(function () {
  function M(k, note) { return { missing: k, note: note || "" }; }

  window.KORVE_DATA.internalSource = "Save maestro KORVE del 11/11/2026, ficha NEX consolidada y evaluación de Tomás Sánchez.";

  /* ---------- Muestras ---------- */
  window.KORVE_DATA.samples = [
    { id: "w3", name: "W3", factory: "NEX", role: "Candidata POWER", roleStatus: "Sin validación definitiva",
      requested: [
        { label: "Masa objetivo", v: "368 ±3", u: "g", ev: "KO" },
        { label: "Balance objetivo", v: "268 ±3", u: "mm", ev: "KO" },
        { label: "Configuración del objetivo", v: "Grip original + correa, sin overgrip/protector", u: "", ev: "KO" }
      ],
      declared: [
        { label: "Cara", v: "Exterior 12K Twill; 2 capas carbono + 1 vidrio", ev: "KP", note: "W3 contiene vidrio: no describirla como cara íntegramente de carbono." },
        { label: "Núcleo", v: "H/S/H 28/15/28 Shore C, aprox. 7/14/7 mm", ev: "KP" },
        { label: "Marco", v: "Carbono 0/90/±45°", ev: "KP", note: "Orientaciones confirmadas para marco/puente, no para toda la cara." },
        { label: "Relleno", v: "EVA parcial de mango ≈10 g", ev: "KP" },
        { label: "Acabado", v: "Mate arenoso, sin 3D en muestra", ev: "KP" }
      ],
      measured: [],
      measuredNote: "Recibida. La ficha del proveedor repite rangos, no lecturas individuales: no hay medición real registrada.",
      tester: [],
      testerNote: "Sin resultado de cancha local consolidado.",
      status: "Recibida. Candidata POWER, sin resultado de cancha local consolidado.",
      warnings: [
        "Que tenga H/S/H no prueba igualdad de comportamiento con MC ni con una NOX.",
        "No aligerar el mango indiscriminadamente: puede subir el balance y empeorar el resultado buscado."
      ],
      compare: {
        mass: [{ v: "368 ±3", u: "g", ev: "KO", note: "Objetivo solicitado, no medición." }, M("PEND", "Medición individual pendiente (Etapa A).")],
        balance: [{ v: "268 ±3", u: "mm", ev: "KO", note: "Objetivo solicitado, no medición." }, M("PEND", "Medición individual pendiente (Etapa A).")],
        face: { v: "Exterior 12K Twill; 2 carbono + 1 vidrio", ev: "KP" },
        core: { v: "H/S/H; EVA parcial de mango ≈10 g", ev: "KP" },
        hardness: { v: "28/15/28 Shore C", scale: "shore-c", ev: "KP", note: "Escala Shore C declarada por proveedor." },
        finish: { v: "Mate arenoso, sin 3D", ev: "KP" },
        other: { v: "Marco carbono 0/90/±45° (marco/puente)", ev: "KP" },
        config: "Objetivo con grip original + correa, sin overgrip ni protector.",
        configSpecs: [{ label: "Objetivo solicitado", overgrips: 0, strap: true, protector: false }],
        friction: M("PEND", "No medida."),
        pending: ["Masa real (0,1 g)", "Balance real (mm)", "Inercia y torsión", "Resultado de cancha"]
      } },

    { id: "amp22", name: "AMP22", factory: "NEX", role: "Candidata CONTROL / SPEED", roleStatus: "Sin validación definitiva",
      requested: [
        { label: "Masa objetivo", v: "357 ±3", u: "g", ev: "KO" },
        { label: "Balance objetivo", v: "250 ±3", u: "mm", ev: "KO" },
        { label: "Configuración del objetivo", v: "Grip original + correa, sin overgrip/protector (misma configuración que W3)", u: "", ev: "KO" }
      ],
      declared: [
        { label: "Cara", v: "Exterior carbono, designación T700; 2 carbono + 1 vidrio en capas separadas", ev: "KP", note: "“Flat-laid” pendiente de precisión. No inferir tacto solo por T700." },
        { label: "Núcleo", v: "Mismo núcleo que W3 (H/S/H 28/15/28 Shore C, aprox. 7/14/7 mm)", ev: "KP" },
        { label: "Marco y relleno", v: "Mismo marco y relleno que W3", ev: "KP" },
        { label: "Acabado", v: "Mate arenoso, sin 3D", ev: "KP" }
      ],
      measured: [],
      measuredNote: "Recibida. Sin medición individual registrada.",
      tester: [],
      testerNote: "Sin opinión de tester registrada en el informe.",
      status: "Recibida. Candidata CONTROL/SPEED.",
      warnings: [
        "Falta validar que no pague rapidez con poca estabilidad.",
        "Si fuera fácil de mover pero inconsistente al bloquear, habría que redistribuir masa o revisar laminado antes de declararla terminada."
      ],
      compare: {
        mass: [{ v: "357 ±3", u: "g", ev: "KO", note: "Objetivo solicitado, no medición." }, M("PEND", "Medición individual pendiente (Etapa A).")],
        balance: [{ v: "250 ±3", u: "mm", ev: "KO", note: "Objetivo solicitado, no medición." }, M("PEND", "Medición individual pendiente (Etapa A).")],
        face: { v: "Carbono, designación T700; 2 carbono + 1 vidrio", ev: "KP", note: "T700 no equivale a un número K." },
        core: { v: "H/S/H (mismo que W3)", ev: "KP" },
        hardness: { v: "28/15/28 Shore C", scale: "shore-c", ev: "KP", note: "Escala Shore C declarada por proveedor." },
        finish: { v: "Mate arenoso, sin 3D", ev: "KP" },
        other: { v: "“Flat-laid” pendiente de precisión", ev: "KP" },
        config: "Objetivo con grip original + correa, sin overgrip ni protector.",
        configSpecs: [{ label: "Objetivo solicitado", overgrips: 0, strap: true, protector: false }],
        friction: M("PEND", "No medida."),
        pending: ["Masa real (0,1 g)", "Balance real (mm)", "Precisión de “flat-laid”", "Masa periférica necesaria", "Resultado de cancha"]
      } },

    { id: "mc005", name: "MC-005", factory: "William", role: "Referencia de comportamiento HYBRID", roleStatus: "Benchmark interno por uso, no ficha de laboratorio",
      requested: [],
      requestedNote: "El informe no indica un objetivo solicitado para MC-005.",
      declared: [
        { label: "Cara", v: "12K", ev: "KP" },
        { label: "Núcleo", v: "H/S/H; espuma adicional en puente y parte alta del mango", ev: "KP" },
        { label: "Acabado", v: "Mate arenoso + 3D", ev: "KP" },
        { label: "Masa de referencia del proveedor", v: "360 ±5 g", ev: "KP", note: "Grip + correa, sin overgrip." },
        { label: "Balance de referencia del proveedor", v: "255 ±7 mm", ev: "KP", note: "Grip + correa, sin overgrip." }
      ],
      measured: [
        { label: "Masa", v: "364,1", u: "g", ev: "KM", who: "Tomás Sánchez", config: "Con DOS overgrips, sin protector", note: "No comparable directamente con la referencia del proveedor (sin overgrip)." },
        { label: "Balance", missing: "BLANK", who: "Tomás Sánchez", note: "Balance en blanco. No atribuirle un balance medido de 250 mm." }
      ],
      tester: [
        { who: "Tomás Sánchez", text: "Preferencia por MC frente a otras opciones probadas.", ev: "KT" },
        { who: "Tomás Sánchez", text: "Pidió conservar movilidad y tacto seco y añadir peso.", ev: "KT", note: "Merece una variante controlada, no bajar peso automáticamente." }
      ],
      testerNote: "Evidencia de usuario útil, pero procede de una sola persona: mediciones y opiniones de MC-005 y KS-01 son de Tomás Sánchez.",
      status: "Referencia HYBRID por uso, no ficha de laboratorio.",
      warnings: [
        "No atribuirle balance medido de 250 mm por Tomás.",
        "No pedir una copia de su molde a otra fábrica: encargar con objetivo medido."
      ],
      compare: {
        mass: [
          { v: "360 ±5", u: "g", ev: "KP", note: "Referencia de proveedor; grip + correa, sin overgrip." },
          { v: "364,1", u: "g", ev: "KM", note: "Tomás, con dos overgrips, sin protector." }
        ],
        balance: [
          { v: "255 ±7", u: "mm", ev: "KP", note: "Referencia de proveedor." },
          { missing: "BLANK", note: "Medición de Tomás: balance en blanco." }
        ],
        face: { v: "12K", ev: "KP" },
        core: { v: "H/S/H; espuma adicional en puente y parte alta del mango", ev: "KP" },
        hardness: M("NI", "Escala y valores de dureza no incluidos en el informe."),
        finish: { v: "Mate arenoso + 3D", ev: "KP" },
        other: M("NI"),
        config: "Proveedor: grip + correa sin overgrip. Medición interna: dos overgrips, sin protector.",
        configSpecs: [
          { label: "Referencia de proveedor", overgrips: 0, strap: true, protector: null },
          { label: "Medición interna (Tomás Sánchez)", overgrips: 2, strap: null, protector: false }
        ],
        friction: M("PEND", "No medida."),
        pending: ["Balance medido", "Ficha normalizada (sin overgrips)", "Inercia y torsión"]
      } },

    { id: "ks01", name: "KS-01", factory: "William", role: "Rol por determinar", roleStatus: "No asignarla a CONTROL solo para completar la línea",
      requested: [],
      requestedNote: "El informe no indica un objetivo solicitado para KS-01.",
      declared: [
        { label: "Cara", v: "Carbono", ev: "KP" },
        { label: "Núcleo", v: "EVA medio", ev: "KP" },
        { label: "Acabado", v: "Liso / brillante", ev: "KP" },
        { label: "Valores históricos de proveedor", missing: "NI", note: "Mencionados en el informe sin cifras; requieren normalizar configuración." }
      ],
      measured: [
        { label: "Masa", v: "366,6", u: "g", ev: "KM", who: "Tomás Sánchez", config: "Con DOS overgrips, sin protector" },
        { label: "Balance", missing: "BLANK", who: "Tomás Sánchez", note: "Balance en blanco." }
      ],
      tester: [
        { who: "Tomás Sánchez", text: "Menor preferencia ofensiva.", ev: "KT" }
      ],
      testerNote: "",
      status: "Menor preferencia ofensiva de Tomás. Rol a determinar por pruebas.",
      warnings: ["No asignarla a CONTROL solo para completar la línea."],
      compare: {
        mass: [M("NI", "Valores históricos de proveedor no incluidos en el informe."), { v: "366,6", u: "g", ev: "KM", note: "Tomás, con dos overgrips, sin protector." }],
        balance: [{ missing: "BLANK", note: "Medición de Tomás: balance en blanco." }],
        face: { v: "Carbono", ev: "KP" },
        core: { v: "EVA medio", ev: "KP" },
        hardness: { v: "“Medio” (sin escala)", scale: "sin-escala", ev: "KP", note: "Sin escala identificada." },
        finish: { v: "Liso / brillante", ev: "KP" },
        other: M("NI"),
        config: "Medición interna: dos overgrips, sin protector.",
        configSpecs: [{ label: "Medición interna (Tomás Sánchez)", overgrips: 2, strap: null, protector: false }],
        friction: M("PEND", "No medida."),
        pending: ["Balance medido", "Ficha normalizada", "Rol por pruebas"]
      } }
  ];

  window.KORVE_DATA.tomiReference = {
    name: "NOX AT10 Luxury Genius 12K Alum XTREM 2026 (blanca/dorada)",
    text: "Pala de uso de Tomás Sánchez, la misma persona que midió y evaluó MC-005 y KS-01. Es la referencia más accesible y vinculada al feedback de MC. El informe no incluye su ficha técnica.",
    ev: "KT"
  };

  /* ---------- Ensayos y mejoras (sección 9) ---------- */
  window.KORVE_DATA.devItems = [
    { id: "dev-masa", priority: 1, change: "Distribución de masa", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Mejor compromiso entre aceleración y resistencia a torsión.",
      test: "Medir masa, balance, inercia a 100 mm y torsión; variantes reversibles; golpes alternados y orden aleatorio.",
      results: [] },
    { id: "dev-nucleo", priority: 1, change: "Consistencia del núcleo y laminado", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Respuesta más uniforme entre zonas, temperatura y unidades.",
      test: "Rigidez y rebote en mapa de puntos; misma pelota/velocidad; varias unidades; repetir a 15/25/35 °C tras estabilizar temperatura.",
      results: [] },
    { id: "dev-tolerancias", priority: 1, change: "Tolerancias y control final", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Que el comprador reciba el comportamiento desarrollado.",
      test: "Lote piloto, distribución de masa/balance/inercia e inspección de acabado; no aprobar con la mejor unidad sola.",
      results: [] },
    { id: "dev-multicapa", priority: 2, change: "Núcleo multicapa versus alternativa bien definida", models: ["POWER", "HYBRID"],
      benefit: "Mejor progresión entre golpe lento y fuerte.",
      test: "Comparar igual molde/masa/balance/cara, cambiando solo núcleo; dos velocidades de impacto como mínimo.",
      results: [] },
    { id: "dev-rugosidad", priority: 2, change: "Rugoso arena versus relieve y combinación", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Efecto repetible y conservación de acabado.",
      test: "Giro y dispersión en impactos oblicuos; fricción antes/después de desgaste; seguimiento de masa y tacto.",
      results: [] },
    { id: "dev-eva", priority: 2, change: "EVA mango existente versus relleno controlado/inserto", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Menor vibración molesta conservando información del golpe.",
      test: "Acelerómetro mismo punto y sujeción; impacto central/descentrado; compensar masa de control; frecuencia y tiempo de decaimiento.",
      results: [] },
    { id: "dev-refuerzos", priority: 3, change: "Refuerzos y cambios de laminado locales", models: ["POWER", "CONTROL"],
      benefit: "Estabilidad sin subir masa excesivamente.",
      test: "Simulación como filtro, después rigidez/torsión, mapa de respuesta y fatiga en muestras dedicadas.",
      results: [] },
    { id: "dev-pesos-usuario", priority: 3, change: "Ajuste de pesos de usuario", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Adaptación a preferencias.",
      test: "Solo si una solución simple produce cambios útiles y no falla ni altera negativamente estructura/garantía.",
      results: [] },
    { id: "dev-aero", priority: 4, change: "Agujeros aerodinámicos y geometrías radicales", models: ["POWER", "HYBRID", "CONTROL"],
      benefit: "Menor arrastre o mapa de respuesta más favorable.",
      test: "Medir fuerza de arrastre y velocidad de swing; validar respuesta y resistencia después. No aceptar solo CFD/render.",
      results: [] }
  ];
  window.KORVE_DATA.devNote = "NEX indicó que los elastómeros viscoelásticos finos serían un desarrollo nuevo: eleva el riesgo de proceso. No convertirlo en condición inicial obligatoria. Toda modificación estructural o ensayo destructivo requiere muestras destinadas a desarrollo.";

  /* Estados disponibles para ensayos (editables localmente). Valor inicial: pendiente. */
  window.KORVE_DATA.statusOptions = [
    { id: "pendiente", label: "Pendiente" },
    { id: "planificado", label: "Planificado" },
    { id: "en-curso", label: "En curso" },
    { id: "con-resultado", label: "Con resultado registrado" },
    { id: "descartado", label: "Descartado" }
  ];

  /* ---------- Plan de validación (sección 10) ---------- */
  window.KORVE_DATA.stages = [
    { id: "etapa-a", name: "Etapa A — Registrar las unidades que ya tenemos",
      summary: "Ficha normalizada de KS, MC, W3, AMP22 y la NOX de Tomás.",
      steps: [
        "Identificar las unidades con códigos, fotografiar y quitar film.",
        "Anotar masa con resolución de 0,1 g, balance en mm, dimensiones, grip/correa y accesorios.",
        "Repetir tres lecturas retirando y recolocando la pala; registrar incertidumbre práctica. Tres lecturas de una pala siguen siendo una sola unidad.",
        "Segunda ficha en configuración de juego: overgrips que cada persona necesite, pesar cada accesorio. Si Gonza usa dos, registrar y mantener su configuración entre pruebas.",
        "No comparar peso listo para jugar con peso de catálogo sin aclararlo."
      ] },
    { id: "etapa-b", name: "Etapa B — Ensayo en cancha antes de cambiar construcción",
      summary: "Piloto propuesto: 6–12 jugadores, tres sesiones en días distintos, orden alternado y aleatorio.",
      steps: [
        "Opiniones individuales antes de la conversación grupal; cubrir marcas sin alterar masa ni superficie de impacto. No es un estudio estadístico definitivo ni garantiza cegamiento completo.",
        "Por jugador y pala: series de 20 golpes válidos por ejercicio (defensa, globo dirigido, bloqueo/volea, bandeja/víbora, remate).",
        "Registrar aciertos, errores cortos/largos, dispersión y, si hay radar/video, velocidad y rotación.",
        "Definir antes la selección de golpes válidos y los descansos. Mismas pelotas, presión, cancha y condiciones dentro de cada bloque.",
        "Escalas ancladas de facilidad, estabilidad, tacto y fatiga. Analizar por perfil."
      ] },
    { id: "etapa-c", name: "Etapa C — Prototipos comparables y laboratorio",
      summary: "Al menos tres unidades por variante en el piloto de ingeniería, como punto de partida.",
      steps: [
        "Medir varias zonas con impactos repetidos; controlar temperatura, pelota, sujeción y velocidad. Repeticiones no aumentan el número de palas ensayadas.",
        "Inercia sobre un eje a 100 mm del tapón y torsión sobre el eje longitudinal.",
        "Rigidez mediante carga/deformación bajo montaje conocido. Vibración: ubicación/orientación de sensor, fuerza de impacto, sujeción y señal completa.",
        "Comparar primero en configuración normalizada, después con acabado, grip y correa finales.",
        "Repetir controles tras desgaste/impactos en unidades dedicadas."
      ] },
    { id: "etapa-d", name: "Etapa D — Criterio de aprobación por perfil",
      summary: "Márgenes de mejora y no inferioridad a definir después de conocer la repetibilidad.",
      steps: [
        "Una diferencia menor que el error de medida no es una mejora.",
        "Registrar resultados negativos y fallos, no solo los mejores golpes."
      ] }
  ];

  /* ---------- Referencias a conseguir prestadas (sección 11) ---------- */
  window.KORVE_DATA.loanRefs = [
    { id: "loan-at10", order: 1, name: "NOX AT10 Luxury Genius 12K Alum XTREM 2026 (de Tomás)", why: "Referencia más accesible y vinculada al feedback de MC.", refId: null },
    { id: "loan-viper", order: 2, name: "Babolat Technical Viper 3.0", why: "Ataque firme como contraste de W3.", refId: "bb-technical-viper-30" },
    { id: "loan-bomba", order: 3, name: "Tecnifibre Bomba Max", why: "Ataque multicapa distinto; no porque 18K sea mejor que 12K.", refId: "tf-bomba-max" },
    { id: "loan-endure", order: 4, name: "Wilson Endure Pro V1", why: "Referencia de control para AMP22.", refId: null },
    { id: "loan-kuikma", order: 5, name: "Kuikma Control Pro", why: "Alternativa constructiva y económica para evitar asociar calidad solo a precio.", refId: "kk-control-pro" },
    { id: "loan-neuron", order: 6, name: "Bullpadel Neuron 27", why: "Híbrida firme, si hay unidad disponible; si no, probar la versión disponible y registrarla sin trasladar su resultado a 2027.", refId: "bp-neuron-27" }
  ];
  window.KORVE_DATA.loanSecondRound = "Segunda ronda si aparece una duda específica: Coello Pro para techo ofensivo y fatiga; Gravity Pro 2027/Obsidian 2027 para control cuando estén disponibles; Genius 2027 frente a la 2026; Oxdog Pro Light para masa baja; Royal Padel de polietileno para sensación de comodidad; Metalbone para distribución ajustable. La selección es un diseño de comparación, no un ranking de las mejores compras. No se compró ni se contactó a nadie.";

  /* ---------- Decisión de fábrica (sección 12) ---------- */
  window.KORVE_DATA.factories = [
    { id: "nex", name: "NEX",
      samples: ["w3", "amp22"],
      contributes: [
        { profile: "POWER", text: "W3 pasaría a desarrollo POWER.", status: "Candidata sin validar" },
        { profile: "CONTROL", text: "AMP22 pasaría a desarrollo CONTROL.", status: "Candidata sin validar" },
        { profile: "HYBRID", text: "Encargar HYBRID con un objetivo medido basado en MC, sin pedir una copia de su molde.", status: "Por desarrollar" }
      ],
      declared: [
        "Marco carbono 0/90/±45° (confirmado para marco/puente).",
        "EVA parcial de mango ≈10 g.",
        "Elastómeros viscoelásticos finos serían un desarrollo nuevo (riesgo de proceso)."
      ],
      toValidate: [
        "W3 y AMP22 en cancha frente a sus referencias (Etapa B).",
        "Medición individual de W3 y AMP22: la ficha repite rangos, no lecturas.",
        "Capacidad de lograr una HYBRID a partir de un objetivo medido de MC (requiere medir MC, cuyo balance está en blanco).",
        "Consistencia entre unidades y lote piloto."
      ] },
    { id: "william", name: "William",
      samples: ["mc005", "ks01"],
      contributes: [
        { profile: "HYBRID", text: "MC-005 sigue como base HYBRID.", status: "Referencia por uso" },
        { profile: "Por determinar", text: "Determinar por pruebas qué papel puede cumplir KS-01. No adjudicarle CONTROL por descarte.", status: "Rol pendiente" },
        { profile: "Categoría restante", text: "Desarrollar la categoría que KS-01 no cubra.", status: "Por desarrollar" }
      ],
      declared: [
        "MC-005: 12K, H/S/H, espuma adicional en puente y parte alta del mango, mate arenoso + 3D.",
        "KS-01: carbono, EVA medio, acabado liso/brillante."
      ],
      toValidate: [
        "Ficha normalizada de MC-005 y KS-01 (hoy solo hay masa con dos overgrips y balance en blanco).",
        "Rol de KS-01 por pruebas.",
        "Capacidad de desarrollar POWER y/o CONTROL hasta cubrir la línea.",
        "Consistencia entre unidades y lote piloto."
      ] }
  ];

  window.KORVE_DATA.factoryMatrix = [
    { id: "fm-rend", criterion: "Rendimiento de los tres perfiles frente a sus referencias", weight: "40%" },
    { id: "fm-cons", criterion: "Consistencia entre unidades y capacidad de control de calidad", weight: "25%" },
    { id: "fm-iter", criterion: "Capacidad de iteración, documentación y corrección de fallos", weight: "15%" },
    { id: "fm-costo", criterion: "Costo total, MOQ, plazos y servicio", weight: "15%" },
    { id: "fm-prop", criterion: "Propiedad de diseño, archivos y condiciones contractuales claras", weight: "5%" }
  ];
  window.KORVE_DATA.factoryGates = [
    "Ningún perfil puede fallar durabilidad o requisitos funcionales básicos antes de sumar puntajes.",
    "Una gran POWER no compensa una CONTROL deficiente.",
    "Compartir proveedor no obliga a compartir exactamente el mismo núcleo, cara ni balance.",
    "Si ninguna fábrica consigue el tercer modelo, conviene retrasarlo o seguir desarrollándolo antes que llenar la colección con una pala que no cumple su promesa."
  ];
})();
