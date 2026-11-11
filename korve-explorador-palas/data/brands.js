/*
 * Mapa de marcas (sección 3 del informe). 41 marcas.
 * - families: familias/modelos ENUMERADOS en la fuente. No son fichas técnicas.
 *   season: año de colección/nombre comercial SOLO cuando el informe lo indica;
 *   null = sin temporada indicada. El año del nombre no demuestra fecha de venta.
 * - coverage: "completa" = cobertura completa de la página revisada;
 *             "parcial"  = el informe declara cobertura parcial / paginada / regional.
 *   coverageBasis cita el motivo según el informe.
 * - features: temas documentados en el informe para esa marca (ver featureTags).
 */
window.KORVE_DATA = window.KORVE_DATA || {};

window.KORVE_DATA.featureTags = {
  "masa-ajustable": "Masa ajustable / pesos intercambiables",
  "distribucion-masa": "Balance y distribución de masa",
  "nucleo": "Núcleo y dureza",
  "materiales-cara": "Materiales y laminado de cara",
  "geometria": "Geometría / forma",
  "acabado": "Acabado y superficie",
  "confort": "Confort / amortiguación (sin evidencia clínica)",
  "polietileno": "Núcleo de polietileno",
  "linea-perfiles": "Línea por perfiles (ataque / híbrida / control)",
  "config-medicion": "Configuración de medición explícita",
  "escala-dureza": "Dureza con escala no identificada",
  "valor-costo": "Referencia de valor / costo",
  "argentina": "Oferta argentina observada",
  "temporadas-mezcladas": "Temporadas o ediciones mezcladas"
};

window.KORVE_DATA.brands = [
  { id: "nox", name: "NOX", url: "https://noxsport.com/en/collections/coleccion-palas-padel-2027-nox",
    coverage: "completa", coverageBasis: "Página de 17 modelos revisada.",
    families: [
      { name: "Genius", detail: "18K Alum, Attack 18K Alum, 12K Alum XTREM, Attack 12K Alum XTREM, Lite", season: "2027" },
      { name: "Ventus", detail: "Hybrid 12K XTREM, Attack 12K XTREM, Control 3K, Control 12K, Hybrid 12K Lite", season: "2027" },
      { name: "Pro Cup", detail: "Hard / Soft", season: "2027" },
      { name: "ML10 Pro Cup", detail: "COORP / Rough / Silver", season: "2027" },
      { name: "Equation", detail: "Hard / Soft", season: "2027" }
    ],
    note: "Diferenciación por núcleo, geometría y masa; Genius como referencia HYBRID. No confundir con AT10 2026 de Tomás.",
    features: ["nucleo", "geometria", "masa-ajustable", "distribucion-masa"] },

  { id: "bullpadel", name: "Bullpadel", url: "https://www.bullpadel.com/es/39-pro-line",
    coverage: "parcial", coverageBasis: "Catálogo mixto, paginado y con ediciones especiales: cobertura de familias, no censo íntegro de variantes.",
    families: [
      { name: "Hack", detail: "05 / Hybrid / Comfort", season: null },
      { name: "Vertex", detail: "05 / Hybrid / Comfort; Vertex Geo; Vertex W", season: null },
      { name: "XPLO", detail: "XPLO / Comfort", season: null },
      { name: "Neuron", detail: "Neuron", season: null },
      { name: "Icon", detail: "Icon", season: null },
      { name: "Elite", detail: "Elite", season: null },
      { name: "Pearl", detail: "Pearl", season: null },
      { name: "Wonder", detail: "Wonder", season: null },
      { name: "Flow", detail: "Flow", season: null },
      { name: "Otras gamas", detail: "Cloud, Next, Advance, Tour y Junior", season: null }
    ],
    note: "Balance, estabilidad y sistemas de ajuste.",
    features: ["distribucion-masa", "masa-ajustable"] },

  { id: "adidas", name: "adidas", url: "https://allforpadel.com/es/54-palas-padel",
    coverage: "completa", coverageBasis: "Página revisada en allforpadel.com, sitio de All For Padel (AFP), que se presenta como licenciatario oficial de adidas para pádel: diseña, gestiona y comercializa la línea. Se trata como fuente oficial de adidas pádel. Conviven temporadas y ediciones.",
    families: [
      { name: "Arrow", detail: "Hit / CTRL", season: null },
      { name: "Metalbone", detail: "Metalbone / HRD+ / CTRL / Carbon / Carbon CTRL / Team / Team Light / Superlight / Reserve", season: null },
      { name: "Cross It", detail: "Cross It / CTRL / Carbon / Carbon CTRL / Team CTRL / Team Light / Light / Pro EDT", season: null },
      { name: "Adipower Legend", detail: "Adipower Legend", season: null },
      { name: "RX, Discovery, Match y Junior", detail: "Gamas RX, Discovery, Match y Junior", season: null },
      { name: "Ediciones Zidane", detail: "Ediciones Zidane", season: null }
    ],
    note: "Interesa la masa ajustable; no trasladar especificaciones 3.4 a 2026.",
    features: ["masa-ajustable", "temporadas-mezcladas"] },

  { id: "babolat", name: "Babolat", url: "https://www.babolat.com/es/padel/palas.html",
    coverage: "completa", coverageBasis: "Catálogo oficial revisado. Comprobar versión exacta al conseguir una unidad.",
    families: [
      { name: "Technical", detail: "Viper / Veron 3.0", season: null },
      { name: "Air", detail: "Viper / Veron / Vertuo", season: null },
      { name: "Counter", detail: "Viper / Veron / Vertuo", season: null },
      { name: "Juan Lebrón", detail: "Viper / Veron, con 3.1 en catálogo", season: null },
      { name: "Vita, Energy, Spirit, Origin y Junior", detail: "Gamas Vita, Energy, Spirit, Origin y Junior", season: null }
    ],
    note: "Diferenciación ataque aéreo / contraataque; comprobar versión exacta al conseguir una unidad.",
    features: ["linea-perfiles"] },

  { id: "head", name: "HEAD", url: "https://www.head.com/shop-padel/racquets/tournament",
    coverage: "parcial", coverageBasis: "Catálogos regionales parciales.",
    families: [
      { name: "Coello", detail: "Variantes Pro / Motion / Team según familia", season: null },
      { name: "Extreme", detail: "Variantes según familia; Extreme ONE / ONE X", season: null },
      { name: "Radical", detail: "Variantes según familia", season: null },
      { name: "Speed", detail: "Variantes según familia; Speed ONE / ONE X", season: null },
      { name: "Gravity", detail: "Gravity 2027 aparece como próxima llegada", season: "2027" },
      { name: "ONE", detail: "ONE", season: null }
    ],
    note: "Gravity 2027 aparece como próxima llegada; no dar disponibilidad por confirmada.",
    features: [] },

  { id: "wilson", name: "Wilson", url: "https://www.wilson.com/en-us/products/endure-pro-v1-padel-racket-wr19030",
    coverage: "parcial", coverageBasis: "Familias verificadas mediante páginas oficiales, no inventario completo de versiones regionales.",
    families: [
      { name: "Endure", detail: "Pro / V1 / LS", season: null },
      { name: "Defy", detail: "Pro / V1 / LS", season: null },
      { name: "Bela", detail: "Pro / V3 / LS", season: null },
      { name: "Blade", detail: "V4 / LS V4", season: null }
    ],
    note: "Endure para CONTROL; Defy para ataque; Bela/Blade para contraste intermedio. Algunas fichas tienen unidades o campos mal renderizados.",
    features: ["linea-perfiles"] },

  { id: "siux", name: "Siux", url: "https://www.siuxpadel.com/collections/palas",
    coverage: "parcial", coverageBasis: "Página paginada, varias próximas llegadas y persisten productos 2026 no enumerados.",
    families: [
      { name: "Obsidian", detail: "Variantes Pro / Elite según modelo (sustituye a Trilogy según ficha)", season: "2027" },
      { name: "Fenix", detail: "Variantes Pro / Elite según modelo", season: "2027" },
      { name: "Electra", detail: "Variantes Pro / Elite según modelo", season: "2027" },
      { name: "Diablo", detail: "Variantes Pro / Elite según modelo", season: "2027" },
      { name: "Valkiria", detail: "Variantes Pro / Elite según modelo", season: "2027" },
      { name: "Pegasus", detail: "Variantes Pro / Elite según modelo", season: "2027" },
      { name: "Tsunami Go", detail: "Hybrid / Air / Control", season: null },
      { name: "Beat Play", detail: "Hybrid / Air / Control / Kid", season: null }
    ],
    note: "Obsidian sustituye a Trilogy según ficha; no comparar nombres como si fueran la misma pala. Dureza comercial 5/10 (no Shore) y “92 cm² de punto dulce” sin protocolo verificable.",
    features: ["escala-dureza", "temporadas-mezcladas"] },

  { id: "starvie", name: "StarVie", url: "https://starvie.com/collections/palas",
    coverage: "completa", coverageBasis: "12 entradas observadas en la página revisada.",
    families: [
      { name: "Eternal", detail: "Eternal Sanyo", season: null },
      { name: "Raptor+", detail: "Raptor+ Red", season: null },
      { name: "Tritón", detail: "T-One Tamara; Power+; Balance+", season: null },
      { name: "Black Titan", detail: "Black Titan Blue", season: null },
      { name: "Astrum+", detail: "Astrum+ Black", season: null },
      { name: "Metheora+", detail: "Metheora+", season: null },
      { name: "Phantom", detail: "Phantom", season: null },
      { name: "Drax+", detail: "Drax+", season: null },
      { name: "Shade", detail: "Shade", season: null },
      { name: "Kyra", detail: "Kyra", season: null }
    ],
    note: "Interesan distribución de masa y arquitectura de marco; nombres renovados, no asumir equivalencia con antiguas Raptor/Tritón.",
    features: ["distribucion-masa", "masa-ajustable"] },

  { id: "oxdog", name: "Oxdog", url: "https://www.oxdog.net/en/padel",
    coverage: "completa", coverageBasis: "Catálogo oficial revisado.",
    families: [
      { name: "Ultimate", detail: "Pro+, Pro, Pro Smash, Pro Light, Tour X, NxtGen, Court", season: null },
      { name: "Hyper 2.0", detail: "Pro+ / Pro / Tour X", season: null },
      { name: "Pure", detail: "Pro+ / Tour X / Court", season: null },
      { name: "Woman Air", detail: "Ultimate / Hyper / Pure", season: null },
      { name: "Classic (referencias)", detail: "Ultimate / Hyper / Sense Pro", season: null }
    ],
    note: "Variantes de dureza, masa y pesos reemplazables. No mezclar los sistemas de contrapeso de distintas generaciones.",
    features: ["masa-ajustable", "nucleo"] },

  { id: "kuikma", name: "Kuikma", url: "https://www.decathlon.es/es/lp/c/kuikma-pro",
    coverage: "parcial", coverageBasis: "Trío Pro revisado; las gamas inferiores no quedaron inventariadas por completo.",
    families: [
      { name: "Pro", detail: "Power Pro, Hybrid Pro Coki, Control Pro", season: null }
    ],
    note: "Trío Pro contrastado. Referencia para construcción detallada y valor por costo. Shock Block: mención de laboratorio externo = declaración de ensayo, no verificación independiente.",
    features: ["linea-perfiles", "materiales-cara", "valor-costo"] },

  { id: "tecnifibre", name: "Tecnifibre", url: "https://www.tecnifibre.com/es/pages/bomba-explosive-power",
    coverage: "parcial", coverageBasis: "Cobertura de la familia Wall Master parcial.",
    families: [
      { name: "Bomba", detail: "Max / Speed / Soft / Lite", season: null },
      { name: "Curva", detail: "Power / Speed / Soft", season: "2026" },
      { name: "Wall Master", detail: "Familia vista en navegación; cobertura parcial", season: null }
    ],
    note: "Bomba y Curva muestran que potencia no exige siempre núcleo duro monodensidad.",
    features: ["nucleo"] },

  { id: "dunlop", name: "Dunlop", url: "https://dunlopsports.com/en-gb/padel/rackets",
    coverage: "completa", coverageBasis: "Listado regional (en-gb) revisado, con duplicados.",
    families: [
      { name: "FX", detail: "Pro / Lite / Hybrid / Team / Hybrid Team / Start / JR", season: null },
      { name: "Galactica", detail: "Pro / Lite / Team / OS / OS Lite / Junior / Pro LS y By Nisse", season: null },
      { name: "Aerostar", detail: "Aerostar / Team", season: null },
      { name: "Tristorm", detail: "Pro / Lite", season: null },
      { name: "Nanomax", detail: "Pro / Lite", season: null },
      { name: "Megamax", detail: "Megamax", season: null }
    ],
    note: "Permite comparar escalones de una misma familia.",
    features: [] },

  { id: "varlion", name: "Varlion", url: "https://www.varlion.com/es/palas/",
    coverage: "completa", coverageBasis: "Página revisada; separa catálogo histórico 2025 de oferta actual.",
    families: [
      { name: "Bourne", detail: "Carbon Black / Prisma Carbon Soft / Carbon Platinum", season: null },
      { name: "Maxima", detail: "Carbon Chrome / Prisma Orquídea", season: null },
      { name: "LW", detail: "Carbon 3 Summum", season: null },
      { name: "Cube (catálogo 2025)", detail: "Cube / Elbowcare y variantes S/W", season: "2025" }
    ],
    note: "Conceptos de temperatura y geometría, sin eficacia clínica demostrada aquí.",
    features: ["geometria", "temporadas-mezcladas"] },

  { id: "royal", name: "Royal Padel", url: "https://royalpadel.com/product-category/palas/",
    coverage: "completa", coverageBasis: "Página revisada, más oferta argentina observada.",
    families: [
      { name: "M27 Poly", detail: "M27 Poly", season: "2027" },
      { name: "Whip Polietileno", detail: "Whip Polietileno", season: "2027" },
      { name: "RACE", detail: "RACE", season: "2026" },
      { name: "Oferta argentina", detail: "Whip Pro, M27, Junior", season: null }
    ],
    note: "Contrapunto de polietileno frente a EVA; no generalizar la goma de una variante a toda la familia.",
    features: ["polietileno", "nucleo", "confort", "argentina"] },

  { id: "blackcrown", name: "Black Crown", url: "https://blackcrown.es/product/pala-pdel-black-crown-patron-kore",
    coverage: "parcial", coverageBasis: "Cobertura parcial: dos modelos verificados técnicamente.",
    families: [
      { name: "Patron Kore", detail: "Verificada técnicamente", season: null },
      { name: "Special Max", detail: "Verificada técnicamente", season: null }
    ],
    note: "Interesan núcleos multicapa y combinación carbono/UD; inconsistencias de rango de peso en sus propias fichas.",
    features: ["nucleo", "materiales-cara"] },

  { id: "volt", name: "Volt", url: "https://www.voltpadel.com/shop/products/rackets",
    coverage: "completa", coverageBasis: "Catálogo oficial revisado.",
    families: [
      { name: "v5", detail: "950, 900, 600, 1000, 700, 500", season: null },
      { name: "v4 (referencias)", detail: "950 / 900 / 1000", season: null },
      { name: "Otras referencias", detail: "1000 V23 y 500 Junior", season: null }
    ],
    note: "Arquitectura de línea fácil de entender: ataque / híbrida / control. No confundir v4 con v5.",
    features: ["linea-perfiles"] },

  { id: "vibora", name: "Víbora", url: "https://viborapadel.com/8-palas",
    coverage: "parcial", coverageBasis: "Primera parte del catálogo paginado; no todos los modelos.",
    families: [
      { name: "Titan", detail: "Berus / Nerodia", season: null },
      { name: "Yarara", detail: "Atrox / Evo Pro / Radical 12K 3.0 / Pro Bifid", season: null },
      { name: "Black Mamba", detail: "Pro Neo / Atrox / Re-Edition", season: null },
      { name: "King Cobra", detail: "Ruby", season: null },
      { name: "Diva", detail: "Evo Pro / Elite Cream", season: null }
    ],
    note: "Primera parte del catálogo paginado; no todos los modelos.",
    features: [] },

  { id: "akkeron", name: "Akkeron", url: "https://akkeron.com/palas-2025/",
    coverage: "completa", coverageBasis: "Página “palas 2025” revisada; colección rotulada 2025 todavía visible.",
    families: [
      { name: "A25", detail: "Armageddon / Poseidon / Atlas / Fenix y Black", season: "2025" },
      { name: "Otros modelos", detail: "Vega, Oro / Black Oro, Plata, Helios, Andrómeda, Nexus, Calypso", season: null },
      { name: "En portada", detail: "Diablo / Stormbreaker 25", season: "2025" }
    ],
    note: "Acabados y personalización; no presentarla como lanzamiento 2027.",
    features: ["acabado"] },

  { id: "sane", name: "SANE", url: "https://sane.com.ar/",
    coverage: "completa", coverageBasis: "Sitio revisado; también vende otras marcas, que no se atribuyen a SANE.",
    families: [
      { name: "Precissor", detail: "Precissor Carbon", season: null },
      { name: "Agressor", detail: "VII Juani Rubini Textreme 12K Alum; VI Black / Legend", season: null },
      { name: "Cinetik 28", detail: "Advanced / Professional 12K", season: null },
      { name: "Rissing", detail: "Classic Carbon EVA Compact", season: null },
      { name: "Assassin", detail: "Tactic 3K", season: null },
      { name: "Elis", detail: "Elis 2", season: null }
    ],
    note: "Cinetik permite estudiar una arquitectura distinta de espesor/mango.",
    features: ["geometria", "argentina"] },

  { id: "lok", name: "LOK", url: "https://loksports.com/es/3-palas-padel",
    coverage: "parcial", coverageBasis: "Familias oficiales verificadas; no toda la segunda generación (catálogos alojados por terceros).",
    families: [
      { name: "Maxx", detail: "Hype / Flow", season: null },
      { name: "Carb-On", detail: "Hype / Flow y Franco", season: null },
      { name: "Easy", detail: "Hype / Flow", season: null },
      { name: "Be", detail: "Hype / Flow", season: null }
    ],
    note: "No dar por verificada toda segunda generación desde catálogos alojados por terceros.",
    features: [] },

  { id: "hirostar", name: "Hirostar", url: "https://hirostar.com/gb/3-padel-rackets",
    coverage: "completa", coverageBasis: "Catálogo oficial revisado.",
    families: [
      { name: "Alien", detail: "Alien Pro 26, Alien Core 26", season: "2026" },
      { name: "Alien (otras)", detail: "Alien Junior; Alien / Alien Pro anteriores", season: null },
      { name: "Horizon", detail: "Horizon 26", season: "2026" },
      { name: "Precision", detail: "Familia Precision", season: null },
      { name: "Starter", detail: "Familia Starter", season: null }
    ],
    note: "Las especificaciones de Alien antigua no se trasladan a Alien Pro 26.",
    features: ["temporadas-mezcladas"] },

  { id: "cork", name: "Cork", url: "https://www.corkpadel.com/en/",
    coverage: "completa", coverageBasis: "Sitio oficial revisado.",
    families: [
      { name: "Classic", detail: "Classic II", season: null },
      { name: "Premium", detail: "Woman; Control / Power / Hybrid III", season: null },
      { name: "Supreme", detail: "Control / Power / Hybrid IV", season: null }
    ],
    note: "Confort y acabado como propuesta; no inferir reducción de vibraciones por presencia de corcho sin ensayo.",
    features: ["confort", "acabado", "linea-perfiles"] },

  { id: "tactical", name: "Tactical Padel", url: "https://tacticalpadel.com/",
    coverage: "completa", coverageBasis: "Sitio revisado durante renovación de tienda; disponibilidad incierta.",
    families: [
      { name: "El Jefe", detail: "Master, Midnight 3K / 12K / 18K y ediciones", season: null },
      { name: "El Toro", detail: "Master y ediciones", season: null },
      { name: "Katana", detail: "Black / Pro", season: null },
      { name: "Anteriores", detail: "El Sabio, El Unico, El Mago, El Torito, El Maestro", season: null }
    ],
    note: "Disponibilidad incierta durante renovación de tienda; separar oferta antigua agotada.",
    features: ["temporadas-mezcladas"] },

  { id: "vidar", name: "Vidar", url: "https://vidarpadel.com/en-en",
    coverage: "completa", coverageBasis: "Sitio oficial revisado.",
    families: [
      { name: "Vantage", detail: "Pro V2; Pro S / Air", season: null },
      { name: "Motion", detail: "Pro S2", season: null }
    ],
    note: "Posicionamiento ergonómico; las promesas de prevenir lesiones no se aceptan como evidencia clínica.",
    features: ["confort"] },

  { id: "stiga", name: "STIGA", url: "https://www.stigasports.com/en-row/explore-stiga-sports/how-to-choose-a-padel-racket",
    coverage: "completa", coverageBasis: "Línea Cybershape Gen 2 revisada.",
    families: [
      { name: "Cybershape Gen 2", detail: "1.3K Ultra LW / Hard, 3K / LW, 18K / LW", season: null }
    ],
    note: "Geometría no convencional y versiones ligeras; no tomar el porcentaje de punto dulce como medida comparable.",
    features: ["geometria"] },

  { id: "dropshot", name: "Drop Shot", url: "https://es.dropshotstore.com/collections/palas-padel-2027",
    coverage: "completa", coverageBasis: "Página revisada. La URL dice 2027 y el encabezado recuperado dice 2026: se mantiene la ambigüedad.",
    families: [
      { name: "Attack", detail: "Axion, Explorer Pro, Canyon Pro, Conqueror, Prime, Cyber, Furia", season: "Ambigua" },
      { name: "Soft", detail: "Flame, Axion, Explorer Pro, Canyon Pro, Quantum W", season: "Ambigua" },
      { name: "Comfort", detail: "Axion, Canyon Pro, Explorer Pro", season: "Ambigua" },
      { name: "Explorer Soft", detail: "W / 9.0", season: "Ambigua" },
      { name: "Axion Junior", detail: "Axion Junior", season: "Ambigua" }
    ],
    note: "URL dice 2027, encabezado recuperado 2026. Versiones 2.0 en varias familias.",
    features: ["temporadas-mezcladas"] },

  { id: "enebe", name: "Enebe", url: "https://www.enebe.com/en/padel-enebe/",
    coverage: "completa", coverageBasis: "Amplio catálogo oficial revisado; colores agrupados.",
    families: [
      { name: "Phoenix Attack", detail: "16K / 3K", season: null },
      { name: "Mercury Attack", detail: "3K / 12K", season: null },
      { name: "MX Turbo", detail: "12K", season: null },
      { name: "Furius Max", detail: "Furius Max", season: null },
      { name: "Combat", detail: "Fiber / JR; Combat 7.1", season: null },
      { name: "Spitfire Ultra", detail: "12K", season: null },
      { name: "Scape", detail: "Scape", season: null },
      { name: "Mustang Pro", detail: "15K / 3K", season: null },
      { name: "Genius", detail: "Genius", season: null },
      { name: "Space", detail: "Space", season: null },
      { name: "Response", detail: "3K Evo / 24K", season: null },
      { name: "Suburban", detail: "12K Pro / 3K", season: null },
      { name: "Point Light", detail: "Point Light", season: null },
      { name: "Astra", detail: "Astra", season: null },
      { name: "RSX / Aerox", detail: "RSX 7.1, Aerox 7.1", season: null }
    ],
    note: "Colores agrupados; no suponer identidad mecánica entre grados distintos.",
    features: ["materiales-cara"] },

  { id: "kombat", name: "Kombat", url: "https://kombatpadel.com/es/palas-padel?productListView=list",
    coverage: "parcial", coverageBasis: "Catálogo paginado, cobertura parcial.",
    families: [
      { name: "Legend", detail: "SWAT / O’Neil, Hunter / Black Edition", season: null },
      { name: "Mirage", detail: "Mirage Pro 26", season: "2026" },
      { name: "Onyx", detail: "Onyx Pro 26", season: "2026" },
      { name: "Troya", detail: "Aquiles / Ulises 2.5", season: null },
      { name: "Galeras / Arenal", detail: "Galeras / Arenal 26", season: "2026" },
      { name: "Xifos", detail: "Xifos V2", season: null }
    ],
    note: "Referencia de precio/construcción, no equivalencia de rendimiento por 18K.",
    features: ["valor-costo"] },

  { id: "joma", name: "Joma", url: "https://www.joma-sport.com/es_AR/deporte/padel/palas-de-padel/",
    coverage: "completa", coverageBasis: "Oferta argentina (es_AR) revisada, con temporadas mezcladas.",
    families: [
      { name: "Hyper Pro", detail: "HRD / SFT", season: null },
      { name: "Blast Pro", detail: "HRD", season: null },
      { name: "Valkiria", detail: "Flex / Pro SFT / Pro HRD", season: null },
      { name: "Master", detail: "Master", season: null },
      { name: "Tournament Pro Iconic", detail: "Tournament Pro Iconic", season: null },
      { name: "Slam Pro Iconic", detail: "Slam Pro Iconic", season: null },
      { name: "Gold Pro", detail: "Gold Pro", season: null },
      { name: "Ediciones", detail: "Ediciones de jugadores / clubes", season: null }
    ],
    note: "Composición global y capa exterior pueden describir cosas diferentes.",
    features: ["argentina", "temporadas-mezcladas", "materiales-cara"] },

  { id: "osaka", name: "Osaka", url: "https://osakaworld.com/collections/equipment-padel",
    coverage: "completa", coverageBasis: "Nueve entradas observadas en la página revisada.",
    families: [
      { name: "Custom Pro", detail: "Control", season: null },
      { name: "Vision", detail: "Power / Control", season: null },
      { name: "Vision Pro", detail: "Control / Power", season: null },
      { name: "Pro Tour LTD", detail: "Control / Power", season: null },
      { name: "Raúl Marcos Pro", detail: "Power", season: null },
      { name: "Deshi", detail: "Control", season: null }
    ],
    note: "Arquitectura de dos polos de juego.",
    features: ["linea-perfiles"] },

  { id: "forza", name: "FZ Forza", url: "https://fz-forza.com/padel/",
    coverage: "completa", coverageBasis: "Oferta identificada en la página revisada.",
    families: [
      { name: "Brace", detail: "Power / Spin", season: null },
      { name: "Champion", detail: "Power / Spin", season: null },
      { name: "Ultra Power", detail: "Ultra Power", season: null },
      { name: "Blast Power", detail: "Blast Power", season: null },
      { name: "X Power", detail: "X Power", season: null },
      { name: "Power", detail: "Power", season: null },
      { name: "Match", detail: "Match", season: null }
    ],
    note: "Datos técnicos comparables limitados.",
    features: [] },

  { id: "pallap", name: "Pallap", url: "https://pallapsport.com/es/collections/raquetas",
    coverage: "completa", coverageBasis: "16 entradas con colores observadas.",
    families: [
      { name: "Evoforce", detail: "Team / Pro / Elite / Dark Star / Bright Star", season: null },
      { name: "Power Pro", detail: "HDR / Star / Elite / Team", season: null },
      { name: "Velocity", detail: "Star / Team Light / Elite / Team", season: null },
      { name: "Kids", detail: "Kids", season: null }
    ],
    note: "Alternativas fuera de las grandes marcas; especificaciones por variante pendientes de ensayo.",
    features: [] },

  { id: "rs", name: "RS", url: "https://rs-sports.com/en-global/collections/padelracket",
    coverage: "completa", coverageBasis: "Once entradas observadas.",
    families: [
      { name: "Pro Edition", detail: "Pro Edition Power", season: null },
      { name: "Prime", detail: "Prime Pro Edition 2.0; Prime Power Edition 3.0; Prime Team / Light 2.0; Prime Cobra / Light", season: null },
      { name: "Rialto", detail: "Pro / Light 3.0", season: null },
      { name: "Cobra Junior", detail: "Cobra Junior", season: null },
      { name: "Margaux Kids", detail: "Margaux Kids", season: null }
    ],
    note: "Once entradas observadas.",
    features: [] },

  { id: "alkemia", name: "Alkemia", url: "https://alkemiapadel.com/",
    coverage: "completa", coverageBasis: "Cinco modelos 2026 observados.",
    families: [
      { name: "Línea 2026", detail: "Vento, Ignis, Tenebris, Thunder, Terra", season: "2026" }
    ],
    note: "Selección de peso como referencia de servicio al comprador.",
    features: ["masa-ajustable"] },

  { id: "prokennex", name: "ProKennex", url: "https://www.prokennex.eu/en/padel/",
    coverage: "completa", coverageBasis: "Página oficial revisada.",
    families: [
      { name: "Black Ace", detail: "Black Ace, Black Ace RND", season: null },
      { name: "Focus", detail: "Focus, Focus Pro", season: null }
    ],
    note: "Sistemas Kinetic y cámaras de amortiguación: interés experimental, no conclusión médica.",
    features: ["confort"] },

  { id: "gamma", name: "Gamma", url: "https://gammasports.com/pages/padel",
    coverage: "completa", coverageBasis: "Página oficial revisada.",
    families: [
      { name: "Modelos", detail: "Sterling, Ashford, Parker, Sullivan, Brooks", season: null }
    ],
    note: "Sterling explicita peso sin correa: ejemplo de por qué hay que normalizar configuraciones.",
    features: ["config-medicion"] },

  { id: "torpey", name: "Torpey", url: "https://torpey.ie/pages/padel",
    coverage: "completa", coverageBasis: "Página oficial revisada.",
    families: [
      { name: "Modelos", detail: "FÍOR y SAOR", season: null }
    ],
    note: "Alternativas ataque / polivalencia; dureza expresada en grados sin escala identificada. No equiparar a Shore C.",
    features: ["escala-dureza", "linea-perfiles"] },

  { id: "palbea", name: "Palbea", url: "https://www.palbea.com/en/explore/products/hector-padel-racket/",
    coverage: "parcial", coverageBasis: "Cobertura parcial: HECTOR y THESEUS verificadas.",
    families: [
      { name: "HECTOR", detail: "Verificada", season: null },
      { name: "THESEUS", detail: "Verificada", season: null }
    ],
    note: "HECTOR combina 12K y EVA H/S/H: compartir descripción no demuestra equivalencia con nuestras palas.",
    features: ["nucleo", "acabado"] },

  { id: "puma", name: "PUMA", url: "https://ar.puma.com/pd/paleta-de-padel-nova-padel-elite-hyb/049029.html?color=02",
    coverage: "parcial", coverageBasis: "Cobertura parcial: solo Nova Elite HYB verificada.",
    families: [
      { name: "Nova", detail: "Nova Elite HYB", season: null }
    ],
    note: "12K Twill y EVA Zote UK declarados. No adjudicar escala a la dureza 37–38 sin aclaración.",
    features: ["escala-dureza", "materiales-cara", "argentina"] },

  { id: "lacoste", name: "Lacoste", url: "https://corporate.lacoste.com/lacoste-unveils-its-debut-padel-collection/",
    coverage: "completa", coverageBasis: "Anuncio corporativo fechado 20/09/2026 con dos modelos.",
    families: [
      { name: "Colección debut", detail: "L.MAX y L.SOFT", season: null }
    ],
    note: "Colaboración técnica con Tecnifibre. Diferenciar posicionamiento de moda de rendimiento probado.",
    features: [] },

  { id: "steelcustom", name: "Steel Custom", url: "https://steelcustom2.mitiendanube.com/",
    coverage: "completa", coverageBasis: "Tienda revisada.",
    families: [
      { name: "Modelos", detail: "Boss Carbon, Tiger Air, Dark Plus Foam / EVA, Air Impact, Imperia Blackcore", season: null }
    ],
    note: "Alternativas de foam y fibra de vidrio presentes en Argentina.",
    features: ["nucleo", "materiales-cara", "argentina"] }
];
