/*
 * Comparativa técnica de referencias (sección 4) + mediciones externas (sección 6).
 * Todos los datos de ficha son D (declaración del fabricante), no mediciones de
 * nuestras unidades. Masa en g, balance en mm. Los balances cualitativos se
 * guardan como texto (qual) y NUNCA se convierten en mm.
 *
 * Formato de un valor:
 *   { v: "365–375", u: "g", ev: "D", note: "..." }   dato con clase de evidencia
 *   { missing: "NP" | "PEND" | "NI" | "BLANK", note: "..." }   dato ausente
 *   { qual: "Alto", ev: "D", note: "..." }   valor cualitativo
 * Un campo puede ser un arreglo de valores (p. ej. declaración + medición).
 */
window.KORVE_DATA = window.KORVE_DATA || {};

(function () {
  var NO_CONFIG = "La ficha no especifica simultáneamente grip, overgrip, protector, correa, incertidumbre ni tamaño de muestra.";
  function D(v, u, note) { return { v: v, u: u || "", ev: "D", note: note || "" }; }
  function Q(q, note) { return { qual: q, ev: "D", note: note || "Balance cualitativo: no se convierte a mm." }; }
  function M(k, note) { return { missing: k, note: note || "" }; }

  window.KORVE_DATA.references = [
    { id: "bp-hack05-27", brandId: "bullpadel", name: "Bullpadel Hack 05 27", season: "2027",
      url: "https://www.bullpadel.com/es/6828-pala-bullpadel-hack-05-27.html",
      mass: D("365–375", "g"), balance: D("265", "mm"),
      face: { v: "Tacto intermedio-duro (declarado)", ev: "D", note: "Detalles de laminado completos no publicados." },
      core: M("NP", "Detalles de laminado/núcleo completos no publicados."),
      finish: M("NP"), hardness: null,
      other: D("Forma diamante; 38 mm; superficie 522 cm²"),
      use: "Ataque, diamante, 38 mm y superficie 522 cm².",
      config: NO_CONFIG,
      friction: { missing: "NP", note: "Existe dato L para Vertex/otros, no para esta versión." },
      pending: ["Laminado completo", "Núcleo", "Acabado", "Configuración de pesaje"] },

    { id: "bp-neuron-27", brandId: "bullpadel", name: "Bullpadel Neuron 27", season: "2027",
      url: "https://www.bullpadel.com/es/6836-pala-bullpadel-neuron-27.html",
      mass: D("365–375", "g"), balance: D("255", "mm"),
      face: D("X-Tend 3K"), core: D("MultiEVA"), finish: D("3D Grain"), hardness: null,
      other: D("38 mm; superficie 525 cm²"),
      use: "Híbrida firme, 38 mm, 525 cm².",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Configuración de pesaje"] },

    { id: "bp-vertex05-27", brandId: "bullpadel", name: "Bullpadel Vertex 05 27", season: "2027",
      url: "https://www.bullpadel.com/es/6831-pala-bullpadel-vertex-05-27.html",
      mass: D("365–375", "g"), balance: D("255", "mm"),
      face: D("12K"), core: { v: "MultiEVA", ev: "D", note: "Según familia oficial." }, finish: M("NP"), hardness: null,
      other: D("Diamante; 38 mm; superficie 530 cm²"),
      use: "Diamante sin balance nominal extremo; 38 mm, 530 cm².",
      config: NO_CONFIG,
      friction: { missing: "NP", note: "Hay un dato L (0,645) para Vertex 05 2026: es otra temporada y no se traslada a la 27." },
      pending: ["Acabado", "Configuración de pesaje"] },

    { id: "ad-metalbone-hrdplus-2026", brandId: "adidas", name: "adidas Metalbone HRD+ 2026", season: "2026",
      url: "https://allforpadel.com/en/padel-rackets/7522-padel-racket-adidas-metalbone-hrd-2026-ale-galan-8435739405826.html",
      mass: D("345–360 + 0–11,2 ajustables", "g", "Masa ajustable declarada."),
      balance: Q("Alto"),
      face: D("16K aluminizado"), core: D("EVA High Memory"), finish: M("NP"), hardness: null,
      other: D("38 mm; ajuste de distribución de masa"),
      use: "Ataque y ajuste de distribución de masa; 38 mm.",
      config: NO_CONFIG + " Ficha publicada por All For Padel, licenciatario oficial de adidas pádel.",
      friction: { v: "0,214", u: "(sin unidad)", ev: "L", note: "Coeficiente de fricción estática, Padel University / TWU. Una unidad por modelo. No es rpm ni potencia." },
      pending: ["Balance en mm", "Acabado"] },

    { id: "bb-technical-viper-30", brandId: "babolat", name: "Babolat Technical Viper 3.0", season: null,
      url: "https://www.babolat.com/es/padel/palas.html",
      mass: D("370 ±10", "g"), balance: Q("Alto"),
      face: D("3K"), core: D("Hard EVA"), finish: M("NP"),
      hardness: { v: "“Hard” EVA (sin escala)", scale: "sin-escala", ev: "D", note: "Denominación comercial, sin escala." },
      other: D("38 mm"),
      use: "Ataque firme; 38 mm.",
      config: NO_CONFIG,
      friction: { v: "0,346", u: "(sin unidad)", ev: "L", note: "Coeficiente de fricción estática, Padel University / TWU. Una unidad por modelo." },
      pending: ["Balance en mm", "Acabado"] },

    { id: "bb-counter-viper-26", brandId: "babolat", name: "Babolat Counter Viper 2.6", season: null,
      url: "https://www.babolat.com/es/padel/palas.html",
      mass: D("365 ±10", "g"), balance: Q("Alto"),
      face: D("3K"), core: D("X-EVA"), finish: M("NP"), hardness: null,
      other: D("Forma redonda"),
      use: "Redonda de contraataque: control no equivale necesariamente a balance bajo.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Acabado", "Ficha individual (dato tomado del catálogo general)"] },

    { id: "hd-coello-pro-2026", brandId: "head", name: "HEAD Coello Pro 2026", season: "2026",
      url: "https://www.head.com/es_ES/product/coello-pro-2026-special-packaging-225066",
      mass: D("370", "g"), balance: D("272", "mm"),
      face: D("Carbon Hybrid Woven"), core: D("Power Foam"), finish: M("NP"), hardness: null,
      other: M("NP"),
      use: "Extremo ofensivo para establecer el costo de maniobrabilidad.",
      config: NO_CONFIG,
      friction: { v: "0,277", u: "(sin unidad)", ev: "L", note: "Coeficiente de fricción estática, Padel University / TWU. Una unidad por modelo." },
      pending: ["Acabado"] },

    { id: "hd-gravity-pro-2027", brandId: "head", name: "HEAD Gravity Pro 2027", season: "2027",
      url: "https://www.head.com/en_MT/product/gravity-pro-2027-224017",
      mass: D("360", "g"), balance: D("258", "mm"),
      face: D("Hybrid Woven"), core: D("Control Foam"), finish: D("Spin Surface"), hardness: null,
      other: { v: "Próxima llegada en la página consultada", ev: "D", note: "Disponibilidad no confirmada." },
      use: "Control con masa intermedia; próxima llegada en página consultada.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Disponibilidad", "Configuración de pesaje"] },

    { id: "nx-genius-12k-2027", brandId: "nox", name: "NOX Genius 12K Alum XTREM 2027", season: "2027",
      url: "https://noxsport.com/products/genius-12k-alum-xtrem-agustin-tapia-2027",
      mass: D("360–375", "g"), balance: M("NP", "Balance no publicado en mm."),
      face: D("12K Alum XTREM"), core: D("MLD Black EVA"), finish: D("Dual Spin"), hardness: null,
      other: D("Pesos intercambiables hasta 8 g (declarado)"),
      use: "Polivalencia; pesos intercambiables hasta 8 g declarados.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm"] },

    { id: "nx-genius-12k-lite-2027", brandId: "nox", name: "NOX Genius 12K Alum XTREM Lite 2027", season: "2027",
      url: "https://noxsport.com/products/genius-12k-alum-xtrem-lite-agustin-tapia-2027",
      mass: D("350–360", "g"), balance: M("NP", "Balance no publicado en mm."),
      face: D("12K Alum XTREM"), core: D("HR3 White EVA"), finish: M("NP"), hardness: null,
      other: M("NP"),
      use: "Contraste de masa y núcleo dentro de una misma línea.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Acabado"] },

    { id: "sx-obsidian-pro-2027", brandId: "siux", name: "Siux Obsidian Pro 2027", season: "2027",
      url: "https://www.siuxpadel.com/products/obsidian-pro-2027-silver",
      mass: D("355–375", "g"), balance: Q("Bajo"),
      face: D("16K"), core: D("EVA Soft"), finish: D("Satinado + 3D"),
      hardness: { v: "5/10 (escala comercial, no Shore)", scale: "comercial-10", ev: "D", note: "No equiparar con Shore C." },
      other: D("Forma lágrima"),
      use: "Lágrima de control; dureza comercial 5/10, no Shore.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm"] },

    { id: "ox-ultimate-proplus", brandId: "oxdog", name: "Oxdog Ultimate Pro+", season: null,
      url: "https://www.oxdog.net/en/padel",
      mass: D("370", "g"), balance: M("NP", "Balance no publicado en mm."),
      face: { v: "HES Carbon", ev: "D", note: "HES es denominación comercial, no caracterización completa." },
      core: D("Hard"), finish: M("NP"),
      hardness: { v: "“Hard” (sin escala)", scale: "sin-escala", ev: "D", note: "Denominación comercial sin escala." },
      other: M("NP"),
      use: "Ataque; HES es denominación comercial, no caracterización completa.",
      config: NO_CONFIG, friction: M("NP", "El dato L 0,865 corresponde a Ultimate Pro Smash 2026, otro modelo."),
      pending: ["Balance en mm", "Temporada", "Acabado"] },

    { id: "ox-ultimate-pro-light", brandId: "oxdog", name: "Oxdog Ultimate Pro Light", season: null,
      url: "https://www.oxdog.net/en/padel",
      mass: D("350", "g"), balance: M("NP", "Balance no publicado en mm."),
      face: D("HES Carbon"), core: D("Medium+"), finish: M("NP"),
      hardness: { v: "“Medium+” (sin escala)", scale: "sin-escala", ev: "D", note: "Denominación comercial sin escala." },
      other: M("NP"),
      use: "Evaluar si conserva estabilidad con menor masa; no asumirlo.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Temporada", "Acabado"] },

    { id: "kk-control-pro", brandId: "kuikma", name: "Kuikma Control Pro", season: null,
      url: "https://www.decathlon.es/es/p/pala-de-padel-adulto-kuikma-control-pro/349709/c142m8826017",
      mass: D("Ficha incluye 361–375", "g"), balance: Q("Neutro"),
      face: { v: "3 capas vidrio + 1 TeXtreme 18K", ev: "D", note: "“18K” no significa cara íntegramente de carbono." },
      core: D("Dual Foam"), finish: M("NP"), hardness: null,
      other: M("NP"),
      use: "Construcción explícita: “18K” no significa cara íntegramente de carbono.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Acabado"] },

    { id: "tf-bomba-max", brandId: "tecnifibre", name: "Tecnifibre Bomba Max", season: null,
      url: "https://www.tecnifibre.com/en/products/bomba-max",
      mass: D("365", "g"), balance: D("265", "mm"),
      face: D("18K"), core: D("Multi Soft Foam, tres capas, centro más blando"), finish: M("NP"), hardness: null,
      other: D("Diamante; 38 mm"),
      use: "Diamante 38 mm: comparar progresividad frente a H/S/H de NEX.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Acabado", "Temporada"] },

    { id: "tf-curva-speed-2026", brandId: "tecnifibre", name: "Tecnifibre Curva Speed 2026", season: "2026",
      url: "https://www.tecnifibre.com/es/collections/padel/products/curva-speed-2026",
      mass: D("355", "g"), balance: M("NP", "Balance no publicado en mm."),
      face: D("16K"), core: D("Espuma firme tipo sándwich"), finish: M("NP"), hardness: null,
      other: M("NP"),
      use: "Precisión y rapidez; contraste con Curva Power de espuma blanda.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Acabado"] },

    { id: "st-18k-lw-cyber-g2", brandId: "stiga", name: "STIGA 18K LW Cybershape Gen 2", season: null,
      url: "https://www.stigasports.com/en/product/padel-racket-18k-lw-cybershape-gen-2",
      mass: D("345 ±8", "g"), balance: Q("Medio"),
      face: D("18K"), core: { v: "Carbon Duplex (declarado)", ev: "D", note: "Así figura en la columna cara/núcleo del informe." },
      finish: M("NP"), hardness: null,
      other: D("Geometría Cybershape"),
      use: "Estudiar geometría y estabilidad a baja masa; no validar por forma.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Balance en mm", "Acabado"] },

    { id: "gm-sterling", brandId: "gamma", name: "Gamma Sterling", season: null,
      url: "https://gammasports.com/products/sterling-padel-racquet",
      mass: D("365", "g", "Declarado SIN correa: hay que sumar accesorios para comparar."),
      balance: Q("Ligeramente alto"),
      face: D("18K"), core: D("EVA alta densidad"), finish: M("NP"), hardness: null,
      other: D("Cara orientada 45° (declarado)"),
      use: "Cara orientada 45° declarada; requiere sumar accesorios para comparar.",
      config: "Peso declarado sin correa. Resto de accesorios no especificado.",
      configSpecs: [{ label: "Peso declarado", overgrips: null, strap: false, protector: null }],
      friction: M("NP"),
      pending: ["Balance en mm", "Peso de la correa", "Acabado"] },

    { id: "pb-hector", brandId: "palbea", name: "Palbea HECTOR", season: null,
      url: "https://www.palbea.com/en/explore/products/hector-padel-racket/",
      mass: D("360 ±10", "g"), balance: D("266", "mm"),
      face: D("12K"), core: D("EVA H/S/H"), finish: D("Mate, arena y 3D"), hardness: null,
      other: M("NP"),
      use: "Otra receta nominal próxima, no “la misma pala”.",
      config: NO_CONFIG, friction: M("NP"),
      pending: ["Configuración de pesaje"] }
  ];

  /* Sección 6: coeficiente de fricción estática (L), sin unidad. */
  window.KORVE_DATA.frictionData = {
    source: "Padel University / Tennis Warehouse University",
    sourceUrl: "https://twu.tennis-warehouse.com/learning_center/padel/padelspecs.php",
    caveat: "Externa a las marcas, pero vinculada a un grupo comercial. Una unidad por modelo: sirve para comparar esas unidades, no para estimar dispersión de producción. No son rpm, potencia, comodidad ni un ranking general. La tabla consultada no permite fijar todas las condiciones de pelota, humedad y desgaste.",
    rows: [
      { model: "Babolat Technical Viper 3.0", value: "0,346", refId: "bb-technical-viper-30" },
      { model: "adidas Metalbone HRD+ 2026", value: "0,214", refId: "ad-metalbone-hrdplus-2026" },
      { model: "HEAD Coello Pro 2026", value: "0,277", refId: "hd-coello-pro-2026" },
      { model: "Wilson Endure Pro V1", value: "0,482", refId: null },
      { model: "Bullpadel Vertex 05 2026", value: "0,645", refId: null, note: "Temporada 2026: no trasladar a Vertex 05 27." },
      { model: "Oxdog Ultimate Pro Smash 2026", value: "0,865", refId: null }
    ]
  };

  window.KORVE_DATA.measurementSources = [
    { name: "Padel University / Tennis Warehouse University: especificaciones de palas", url: "https://twu.tennis-warehouse.com/learning_center/padel/padelspecs.php",
      documents: "Mediciones de propiedades de palas, entre ellas el coeficiente de fricción estática.",
      limits: "Externa a las marcas, pero vinculada a un grupo comercial. Una unidad por modelo: no estima dispersión de producción." },
    { name: "Testea Padel: ensayos", url: "https://testeapadel.com/en/test/",
      documents: "Deformación/rigidez, rebote, potencia, vibración y durabilidad.",
      limits: "Marco para contratar ensayos. Un sello sin informe no demuestra superioridad sobre todo el mercado." },
    { name: "Testfakta, protocolo del 7/03/2022", url: "https://www.testfakta.com/en/test/it-could-be-your-padel-rackets-fault-if-your-game-has-gotten-worse/about-the-test",
      documents: "Mapa de 90 puntos; impactos repetidos y comparación antes/después; ensayo destructivo.",
      limits: "Antecedente metodológico. Sus palas y resultados históricos no ordenan colecciones 2027; no adoptar automáticamente sus umbrales." },
    { name: "Sensors 2023, 225 palas", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10747547/",
      documents: "Localización de respuesta vibratoria mediante impactos controlados.",
      limits: "No equiparar mínimo de vibración en una línea con mapa bidimensional de máxima restitución o control." },
    { name: "Sensors 2022, inercias", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9741144/",
      documents: "Caracterización mecánica de 137 palas y evaluación de usuarios.",
      limits: "Fundamento para medir distribución de masa; no prescribe una masa ideal para todos." }
  ];
})();
