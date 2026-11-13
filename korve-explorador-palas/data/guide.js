/*
 * Capa de lectura simple ("Entender KORVE").
 * Reescribe en lenguaje cotidiano lo que ya está en los datos de investigación; no agrega
 * especificaciones, resultados ni promesas. Cada bloque indica de dónde sale (src) para que
 * pueda verificarse en "Profundizar". Los datos numéricos se leen de korve.js y branches.js,
 * no se copian acá.
 */
window.KORVE_DATA = window.KORVE_DATA || {};

window.KORVE_DATA.guide = {
  hero: {
    eyebrow: "Plataforma de desarrollo · Etapa de muestras",
    title: "Tres palas con un carácter propio cada una.",
    lead: "KORVE busca tres comportamientos claramente distintos y que se puedan repetir en cada unidad: POWER para acelerar y definir, HYBRID para jugar sólido en todas las fases y CONTROL para colocar y defender con precisión.",
    status: "Todo lo que ves son hipótesis de desarrollo: ninguna pala está aprobada para producción.",
    src: "Informe, sección 1"
  },

  /* Qué queremos crear: tres ideas del informe, sección 1. */
  principles: [
    { title: "Tres comportamientos, no tres precios.", text: "Cada pala tiene que destacar en algo distinto. Ninguna debería ser una versión inferior de otra." },
    { title: "Que se sienta igual en cada unidad.", text: "Una muestra excelente no alcanza: lo que importa es que cada pala fabricada repita ese comportamiento." },
    { title: "Base común: estabilidad, comodidad y buena fabricación.", text: "Las tres comparten esas condiciones, aunque usen materiales o núcleos distintos." }
  ],
  principlesSrc: "Informe, secciones 1 y 5.5",

  /* Perfiles en palabras simples (informe, sección 8). Los datos completos salen de branches.js. */
  profiles: {
    POWER: {
      verb: "Acelerar y definir",
      plain: "Para quien ataca: que la pelota salga rápida y profunda en remates, voleas y víboras, sin que la pala se vuelva inestable cuando el golpe no es perfecto.",
      player: "Jugador intermedio avanzado o avanzado, ofensivo.",
      tradeoff: "Puede pedir algo más de esfuerzo que CONTROL; lo que no se acepta es que su potencia aparezca solo en el golpe perfecto."
    },
    HYBRID: {
      verb: "Sólida en todas las fases",
      plain: "Una sola pala para todo el partido: defender, construir y terminar el punto con una respuesta previsible.",
      player: "Jugador competitivo y versátil.",
      tradeoff: "No es el promedio entre POWER y CONTROL: tiene que mantener lo que gustó de MC-005 y fallar menos fuera del centro."
    },
    CONTROL: {
      verb: "Colocar y defender",
      plain: "Para quien juega con precisión: cambiar dirección y profundidad con facilidad y que los golpes descentrados no pierdan salida de repente.",
      player: "Jugador técnico, incluidos niveles altos. No es una pala de iniciación.",
      tradeoff: "Una pelota que sale fácil ayuda a defender pero puede complicar el bloqueo: hay que medir las dos cosas."
    }
  },
  profilesSrc: "Informe, sección 8",

  /* Qué rol se evalúa para cada muestra, en palabras simples. */
  samplesPlain: {
    w3: "La base natural para POWER por el peso y balance que le pedimos a NEX. Todavía no se probó en cancha.",
    amp22: "Candidata a CONTROL por el peso y balance que le pedimos a NEX: más liviana y con el balance más bajo que W3. Falta comprobar que sea estable al bloquear.",
    mc005: "Nuestra vara para HYBRID: en uso convenció por firmeza, estabilidad, salida suficiente y capacidad de atacar.",
    ks01: "Rol todavía abierto. No la asignamos a CONTROL solo para completar la línea."
  },
  samplesSrc: "Informe, secciones 7 y 8; actualización de William del 13/11/2026",

  /* Estado del proyecto. Cada punto remite a su fuente; el próximo paso es la Etapa A del plan. */
  known: [
    { text: "Tenemos las cuatro muestras: W3 y AMP22 de NEX, MC-005 y KS-01 de William.", src: "Informe, sección 7" },
    { text: "MC-005 funcionó bien en uso: Tomás Sánchez la prefirió frente a las otras opciones que probó. Es la opinión de una sola persona.", src: "Informe, sección 7" },
    { text: "No hay datos públicos suficientes para declarar cuál es la mejor pala del mercado: por eso comparamos contra referencias, sin rankings.", src: "Informe, sección 1" }
  ],
  missing: [
    { text: "Medir las cuatro muestras con el mismo método: hoy ninguna tiene un balance medido por nosotros.", src: "Muestras; plan, Etapa A" },
    { text: "Probar W3 y AMP22 en cancha frente a palas comerciales concretas.", src: "Plan, Etapa B" },
    { text: "Que cada fábrica confirme cómo controla peso y balance unidad por unidad y qué hace con las que salen fuera de especificación.", src: "Decisión de fábrica" },
    { text: "Aclarar datos ambiguos de William: el rango «19–22», la mención «±10» y el término «vacuum air tube».", src: "Actualización de William, 13/11/2026" }
  ],
  next: {
    title: "Registrar con el mismo método las palas que ya tenemos.",
    text: "Pesar cada muestra con resolución de 0,1 g, medir su balance en mm, anotar grip, correa y accesorios, y repetir tres lecturas. Primero sin overgrips; después, como la juega cada persona.",
    stageId: "etapa-a",
    src: "Plan de validación, Etapa A"
  },

  /* Cómo leer cada dato: la misma clase de evidencia de siempre, dicha en palabras simples. */
  voices: [
    { ev: "KP", plain: "Lo declara el proveedor", hint: "Lo informó la fábrica. Sirve, pero no lo comprobamos nosotros." },
    { ev: "KM", plain: "Lo medimos nosotros", hint: "Medición propia de una unidad, con la configuración anotada." },
    { ev: "KT", plain: "Lo opinó un jugador", hint: "Percepción en cancha. Útil, pero es de una persona." },
    { ev: "PR", plain: "Es una propuesta", hint: "Idea de trabajo o prueba sugerida. No está aprobada." }
  ],

  /* Glosario: definiciones generales y breves, con el criterio del informe donde aplica. */
  glossary: {
    balance: { term: "Balance", text: "Dónde está el punto de equilibrio de la pala, medido en milímetros desde el tapón del mango. Más milímetros significa más peso hacia la cabeza: el golpe lleva más inercia, pero cuesta más mover la pala." },
    salida: { term: "Salida de bola", text: "Qué tan fácil sale despedida la pelota con poco esfuerzo. Ayuda a defender desde el fondo, pero demasiada puede hacer que un bloqueo se vaya largo." },
    estabilidad: { term: "Estabilidad", text: "Cuánto resiste la pala a girarse o vibrar cuando la pelota pega lejos del centro." },
    dureza: { term: "Dureza", text: "Qué tan firme se siente el núcleo o la cara. Cada marca usa su propia escala (Shore C, del 1 al 10, palabras), así que no se pueden comparar entre sí." },
    nucleo: { term: "Núcleo multicapa", text: "El relleno interior de la pala armado en capas. «H/S/H» significa duro, blando, duro: dos capas firmes y una más blanda en el medio." },
    k12: { term: "12K, 18K", text: "Miles de filamentos por cada hilo de carbono. Describe cómo es el tejido, no su calidad: 18K no es mejor que 12K." },
    t700: { term: "T700", text: "Nombre de un tipo de fibra de carbono. No es un número K ni una escala de calidad." },
    overgrip: { term: "Overgrip", text: "Cinta fina que se enrolla sobre el grip. Agrega peso, así que una pala pesada con overgrips no se compara con un peso de catálogo sin ellos." },
    tapon: { term: "Tapón", text: "La pieza que cierra el extremo del mango. Es el punto desde el que se mide el balance." }
  },

  /* Ficha de MC-005: textos de lectura simple. Los valores se leen de korve.js. */
  mc005: {
    headline: "La referencia de HYBRID",
    summary: "MC-005 es una muestra de la fábrica William. La usamos como vara para HYBRID porque en uso convenció: firmeza, estabilidad, salida suficiente y capacidad de atacar. Cualquier HYBRID nueva tiene que superarla en el uso previsto.",
    caveat: "Es una referencia por uso, no una ficha de laboratorio, y la preferencia viene de una sola persona.",
    src: "Informe, secciones 7 y 8",
    numbersTitle: "Tres pares de números que no son lo mismo",
    numbersLead: "Para MC-005 circulan tres juegos de cifras. Cada uno se tomó de otra forma y con otros accesorios, así que no se restan ni se promedian.",
    nextTitle: "Próxima prueba propuesta",
    nextSteps: [
      { title: "Ficha normalizada", text: "Medir MC-005 sin overgrips, con tres lecturas de peso y balance, igual que las demás muestras.", src: "Plan, Etapa A" },
      { title: "MC-005 contra sí misma", text: "Comparar la MC-005 actual con una versión con una pequeña redistribución de peso que se pueda revertir, incluida la variante algo más pesada que pidió Tomás.", src: "Informe, sección 8 (HYBRID)" },
      { title: "La futura HYBRID", text: "Enfrentar ambas a la HYBRID que desarrolle la fábrica elegida, en series de golpes por fase de juego y con varios jugadores.", src: "Plan, Etapas B y C" }
    ]
  },

  /* Diagrama de balance: pasos. El último usa valores declarados de MC-005. */
  balanceSteps: [
    { title: "La pala se apoya en un solo punto", text: "Si la apoyás de costado sobre un filo, hay un único punto donde queda en equilibrio." },
    { title: "Se mide desde el tapón", text: "El balance es la distancia, en milímetros, entre el tapón del mango y ese punto." },
    { title: "Más milímetros, más peso arriba", text: "Un balance alto pone más masa hacia la cabeza: más inercia en el golpe y más esfuerzo para moverla. Un balance bajo la hace más rápida de manejar. Aun así, el balance solo no lo explica todo: por eso el plan también propone medir inercia." },
    { title: "El caso de MC-005", text: "El proveedor pide 255 ±7 mm y William informó 250 mm en la muestra. Nuestro propio balance todavía no se midió." }
  ],

  /* Diagrama del núcleo: pasos. Las proporciones del dibujo son ilustrativas. */
  coreSteps: [
    { title: "Cara exterior de carbono 12K", text: "Es la capa que golpea la pelota. «12K» describe el tejido, no la calidad." },
    { title: "Dos capas de fibra de vidrio", text: "Debajo de la capa de carbono. William indica tres capas en total, sin publicar ángulos, gramajes ni resina." },
    { title: "Núcleo duro, blando, duro", text: "El relleno tiene tres zonas: dos firmes y una más blanda en el medio. William no publicó la dureza ni el espesor de cada una." },
    { title: "Marco con refuerzos y espuma", text: "El contorno es de carbono con refuerzos. William confirma que lleva espuma (antes se había indicado en el puente y la parte alta del mango), sin precisar material, extensión ni peso agregado." }
  ]
};
