/*
 * KORVE — Datos de investigación: metadatos, clases de evidencia y reglas.
 * Fuente: informe "KORVE — Mercado de palas y objetivos de desarrollo".
 * Para actualizar la investigación, editar estos archivos de /data (no la interfaz).
 */
window.KORVE_DATA = window.KORVE_DATA || {};

window.KORVE_DATA.meta = {
  title: "KORVE — Mercado de palas y objetivos de desarrollo",
  cutoff: "11/11/2026",
  cutoffNote:
    "Fecha de consulta de todas las fuentes: 11/11/2026. Salvo indicación expresa, la fecha de publicación y el día exacto de lanzamiento no están publicados o no se verificaron.",
  status:
    "Decisiones propuestas, no especificaciones aprobadas para producción.",
  conclusion:
    "La oportunidad de KORVE es ofrecer tres comportamientos claramente diferenciados y reproducibles: POWER para acelerar y finalizar; HYBRID para jugar sólido en todas las fases; CONTROL para colocar y defender con precisión, incluso fuera del centro. Las tres tienen que mantener estabilidad, comodidad y calidad de fabricación. Ninguna debería convertirse en una versión inferior de otra.",
  noBest:
    "No hay evidencia pública suficiente para declarar una pala como la mejor del mundo. Los catálogos describen materiales y tecnologías, pero rara vez publican rigidez, inercia, dispersión de rebote, variación entre unidades y desgaste bajo un protocolo común. Por eso se proponen referencias de comparación, no un ranking de rendimiento.",
  recommendation:
    "Mantener MC-005 como referencia de comportamiento HYBRID; evaluar W3 como POWER y AMP22 como CONTROL sin aprobarlas todavía; enfrentar las cuatro muestras a referencias comerciales concretas. Elegir una fábrica por su capacidad para conseguir los tres perfiles y repetirlos en serie, no por la suma de nombres de tecnologías.",
  scope:
    "Se revisaron catálogos o páginas oficiales de 41 marcas, además de pruebas y publicaciones técnicas. El inventario enumera las familias y variantes identificadas; no es una certificación de que se localizaron todos los SKU mundiales. Ya aparecen colecciones 2027: el año del nombre comercial no demuestra fecha de puesta a la venta.",
  finalResult:
    "Hay suficientes referencias y evidencia metodológica para diseñar una comparación seria. Todavía no hay evidencia de que nuestras muestras sean iguales a un modelo comercial, superiores a todo el mercado o listas para producción. El siguiente avance decisivo será medir y probar lo que ya llegó."
};

/*
 * Clases de evidencia. Cada dato de la app lleva una de estas claves en "ev".
 * D, F, L, P y K provienen del informe. K se subdivide para distinguir
 * proveedor, objetivo, medición y opinión. "PR" (propuesta) y "A" (análisis)
 * marcan criterio propio del informe, no datos del mercado.
 */
window.KORVE_DATA.evidence = {
  D:  { code: "D",  label: "Declaración del fabricante", desc: "Ficha técnica o descripción del fabricante: materiales, pesos y balances comerciales." },
  F:  { code: "F",  label: "Ensayo del fabricante", desc: "Resultado con protocolo identificable. No se encontró una batería homogénea F que permita ordenar el mercado." },
  L:  { code: "L",  label: "Medición externa", desc: "Laboratorio o investigación ajena al fabricante, con sus propias limitaciones y conflictos comerciales declarados." },
  P:  { code: "P",  label: "Publicidad", desc: "Beneficios, porcentajes o puntuaciones sin documentación suficiente para verificarlos." },
  KP: { code: "K",  label: "Declaración de proveedor", desc: "Información interna KORVE: lo que declara la fábrica (NEX, William). No es medición local." },
  KO: { code: "K",  label: "Objetivo solicitado", desc: "Información interna KORVE: valor pedido a la fábrica. No demuestra que la unidad lo cumpla." },
  KM: { code: "K",  label: "Medición interna", desc: "Información interna KORVE: medición local de una unidad, con su configuración." },
  KT: { code: "K",  label: "Opinión de tester", desc: "Información interna KORVE: percepción de un jugador. Útil, pero procede de una persona." },
  PR: { code: "PR", label: "Propuesta, no aprobada", desc: "Propuesta de ingeniería o de método del informe. No es especificación ni resultado." },
  A:  { code: "A",  label: "Análisis del informe", desc: "Interpretación o criterio de uso escrito en el informe a partir de las fuentes." }
};

/* Escalas de dureza. Solo se comparan valores de la misma escala identificada. */
window.KORVE_DATA.hardnessScales = {
  "shore-c": "Shore C",
  "comercial-10": "Escala comercial 0–10 propia de la marca",
  "sin-escala": "Denominación sin escala identificada"
};

/* Estados para datos ausentes. */
window.KORVE_DATA.missingStates = {
  NP: "No publicado",
  PEND: "Pendiente de confirmar",
  NI: "No incluido en el informe",
  BLANK: "En blanco (no medido)"
};

window.KORVE_DATA.rules = [
  "No hay rankings de rendimiento: la publicidad no ordena el mercado.",
  "12K/16K/18K describen haces de filamentos, no una escala de calidad. 18K no es mejor que 12K. T700 tampoco equivale a un número K.",
  "No equiparar durezas sin conocer la escala (Shore C, “5/10” comercial, grados sin escala identificada).",
  "No mezclar temporadas ni configuraciones con/sin overgrips, correa o protector.",
  "Balances cualitativos (alto/medio/bajo) no se convierten en milímetros.",
  "Las ventanas de peso y balance propuestas para KORVE son exploratorias, no especificaciones aprobadas.",
  "La cercanía visual en el mapa no indica equivalencia técnica.",
  "Un material no publicado no equivale a material ausente. Un catálogo oficial demuestra oferta declarada, no fabricación propia.",
  "Los ensayos propuestos figuran como pendientes hasta que se registre un resultado."
];

window.KORVE_DATA.inconsistencies = [
  "HEAD Gravity Motion 2027 tiene diferencias entre descripción de tejido y tabla de material. No se resolvieron suponiendo que una sección era correcta.",
  "Black Crown Patron Kore y Special Max muestran rangos de masa distintos entre texto y ficha. No se eligió arbitrariamente uno.",
  "Algunas fichas Wilson contienen unidades o campos mal renderizados. Se evitó transformar esos campos en medidas confiables.",
  "El “92 cm² de punto dulce” de Siux y porcentajes de ampliación de otras marcas no comparten protocolo público verificable. No son superficies comparables.",
  "“3D” puede ser relieve de acabado, decal con relieve curado o estructura de molde. No demuestra ni proceso ni durabilidad por sí solo."
];

window.KORVE_DATA.gaps = {
  brands: ["Atila", "Prince", "DoPadel", "Fila", "Salming", "Rossignol", "Cartri"],
  text:
    "No quedaron cubiertas con un catálogo oficial actual suficientemente completo y coherente en esta revisión. Tampoco se censaron todas las marcas privadas de marketplaces. No se las descarta por rendimiento; quedan fuera de las conclusiones técnicas."
};

window.KORVE_DATA.trends = [
  { id: "t1", title: "Masa, balance e inercia antes que un número K",
    summary: "Dos palas de igual masa y balance pueden distribuir la masa de forma distinta. Hay que medir resistencia al giro al moverla y ante impactos descentrados.",
    detail: "La investigación de Sensors sobre 137 palas y evaluación con 50 usuarios respalda caracterizar inercias, sin convertir sus resultados en una regla universal. adidas, NOX, Bullpadel, StarVie y Oxdog ofrecen formas de ajustar masa: eso justifica experimentar con posiciones de peso, no incorporar cinco sistemas de ajuste a la primera KORVE." },
  { id: "t2", title: "Núcleo y laminado funcionan juntos",
    summary: "La dureza nominal no predice por sí sola salida, velocidad, precisión o comodidad. Las palas deben probarse como sistemas completos.",
    detail: "W3 y AMP22 declaran el mismo núcleo y capas similares, pero tienen masas, balances, tejidos y geometrías diferentes. Sin gramaje, fibra, resina, proporción, orientación, compactación, espesor y control de curado, una comparación de caras queda incompleta. No cambiar a “24K” sin una hipótesis mecánica verificable." },
  { id: "t3", title: "Rugosidad útil y que sobreviva al uso",
    summary: "Arena visible o mucha fricción estática no garantizan más efecto en todas las condiciones.",
    detail: "Medir trayectoria/rotación y repetir después del desgaste, con la misma pelota y condiciones." },
  { id: "t4", title: "Amortiguación sin destruir sensaciones ni distribución de masa",
    summary: "La presencia de EVA no demuestra reducción de vibración ni prevención de lesiones.",
    detail: "NEX declara alrededor de 10 g de relleno parcial: cualquier ensayo con/sin espuma debe controlar esa diferencia de masa para no confundir amortiguación con redistribución de peso." },
  { id: "t5", title: "Calidad repetible como diferenciación premium",
    summary: "Una muestra excelente no demuestra una producción excelente.",
    detail: "Conviene publicar pesos reales, configuración de medición y controles por lote." }
];

window.KORVE_DATA.recommendedDecisions = [
  "Conservar las cuatro muestras sin modificaciones irreversibles; comenzar por ficha normalizada y prueba comparativa.",
  "Mantener MC como benchmark HYBRID y NOX 2026 como referencia comercial concreta.",
  "Validar W3 y AMP22 antes de invertir en nuevos moldes o cambiar grados de carbono.",
  "Definir CONTROL por precisión, tolerancia y estabilidad; POWER por ataque útil; HYBRID por consistencia entre fases.",
  "Cerrar objetivos numéricos de inercia, rigidez y respuesta después de medir las bases, no a partir de publicidad.",
  "Elegir una sola fábrica únicamente cuando sus resultados y capacidad de repetición justifiquen los tres modelos."
];

/* Actualización de fuentes internas; no cambia el corte de investigación del mercado. */
window.KORVE_DATA.meta.cutoffNote += " Actualización interna de William incorporada el 13/11/2026 a partir de capturas aportadas por Gonzalo; no es una nueva revisión del mercado.";
window.KORVE_DATA.inconsistencies.push("William / KS-01: el rango 19–22 fue llamado dureza y después densidad, sin unidad ni escala. Los objetivos de peso y balance no equivalen a garantía conjunta de producción; ±10 continúa ambiguo. Separar unidades fuera de especificación en cajas no significa excluirlas del envío.");
