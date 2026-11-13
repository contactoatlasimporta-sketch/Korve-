# KORVE · Explorador de palas

Aplicación local para explorar la investigación “KORVE — Mercado de palas y objetivos de desarrollo” (corte 11/11/2026) y decidir hacia dónde desarrollar POWER, HYBRID y CONTROL.

No necesita instalación, cuentas, API keys ni servidor. No está publicada ni integrada a ninguna web.

## Cómo abrirla

1. Abrí la carpeta `korve-explorador-palas`.
2. Hacé doble clic en `index.html` (Chrome, Edge, Firefox o Safari).

Si tu navegador bloquea archivos locales, podés servirla desde esa carpeta (opcional):

```
python3 -m http.server 8000
```

y abrí `http://localhost:8000`.

### En el celular

En pantallas angostas el mapa pasa a una disposición vertical: KORVE arriba, las tres ramas en fila y, debajo, los aspectos y sus ítems como un árbol, en tamaño de lectura. El botón **Detalle ↓** lleva al panel con la información de lo seleccionado y **↑ Volver al mapa** regresa.

Usá `dist/korve-explorador.html`: es la app completa en un solo archivo. Descomprimí el ZIP en Archivos (iPhone) o en Files de Google (Android) y abrí ese archivo con el navegador.

Para regenerarlo después de editar los datos o el diseño: `node tools/build-single.js`. El logo y las fuentes quedan incrustados en el archivo, que no depende de ninguna otra ruta. Ese comando también genera `dist/artifact.html`, la variante que se publica como vista previa en el chat de Claude.

## Identidad visual

- **Logo:** `assets/korve-logo.png`, recortado del archivo original sin redibujar (solo se quitó el margen vacío; proporción 6,24 : 1). Tiene letras blancas, por eso va sobre negro: en el encabezado y en el nodo central del mapa.
- **Color:** negro, grises y blanco. El verde `#A8DD46` se midió en el logo y marca solo estados: pestaña activa, foco del teclado, selección en el mapa y la rama elegida. Sobre fondo blanco se usa el mismo tono oscurecido (`#4C7C10`) para que se lea.
- **Tipografía:** Sora en títulos e Inter en textos, incluidas en `fonts/` (licencia SIL OFL 1.1, ver `fonts/LICENSE-*.txt`), así que funcionan sin conexión. Si no cargan, el navegador usa las fuentes del sistema.
- **Perfiles:** POWER, HYBRID y CONTROL comparten colores y se distinguen por un símbolo: diagonal ascendente, círculo a medio llenar y mira.
- **Etiquetas de evidencia:** cada una lleva su texto; el trazo (lleno, contorno, discontinuo, punteado, doble) refuerza la diferencia sin depender del color.

## Vistas

- **Mapa**: KORVE en el centro y tres ramas. Tocá una rama para ver sus siete aspectos: comportamiento, jugador, muestra candidata, referencias, qué desarrollar, pruebas que deciden e información faltante. Muestra, Referencias y Desarrollar abren un tercer nivel. Con `+` y `−` acercás y alejás (también con la rueda o pellizcando), `◎` centra la selección y `↩` o `Esc` vuelve al nivel anterior. También podés arrastrar el mapa.
- **Explorador del mercado**: las 41 marcas, con búsqueda y filtros por marca, familia, temporada, cobertura y características documentadas. Los modelos que solo aparecen enumerados no tienen ficha.
- **Comparador**: hasta tres palas lado a lado, con advertencias cuando se mezclan configuraciones, temporadas, escalas de dureza o clases de evidencia.
- **Nuestras muestras**: W3, AMP22, MC-005 y KS-01, con objetivo solicitado, construcción declarada, medición real y opinión de tester por separado. Podés registrar mediciones locales.
- **Desarrollo y pruebas**: mejoras por prioridad, plan de validación y referencias a conseguir. Todo empieza como “Pendiente”.
- **Decisión de fábrica**: NEX frente a William, sin declarar ganador.
- **Fuentes y método**: fecha de corte, clases de evidencia, reglas de lectura, inconsistencias, mediciones externas y todos los enlaces.

## Notas y estados

Las notas, los estados y las mediciones que cargues se guardan **solo en ese navegador** (localStorage). Usá **Exportar JSON** para hacer una copia de seguridad o pasarlos a otro dispositivo: podés copiar el JSON o descargarlo como archivo (la descarga no funciona dentro del chat; ahí usá Copiar). Para recuperarlos, usá **Importar archivo** o **Importar pegando JSON**. La app valida todo el archivo antes de tocar nada: versión, estructura, tipos, identificadores, estados y cada medición (fecha, g, mm, configuración y campos). Si algo no es compatible, muestra los problemas y no cambia tus datos. Si el archivo es válido, te pide confirmación y reemplaza los datos locales actuales.

Las notas se guardan al escribir, al salir del campo, al cambiar de vista y al cerrar u ocultar la página. La exportación incluye lo último que escribiste.

Al registrar una medición indicá overgrips, correa y protector. El comparador usa esos datos para avisar cuándo se mezclan configuraciones distintas.

Cada copia de la app guarda sus propios datos: la vista previa del chat, el archivo abierto en el celular y el abierto en la computadora no comparten notas. Para pasar notas de una a otra, exportalas e importalas.

## Actualizar la investigación

Los datos están separados de la interfaz, en `data/`:

| Archivo | Contenido |
|---|---|
| `data/meta.js` | Fecha de corte, clases de evidencia, reglas, inconsistencias, huecos y tendencias |
| `data/brands.js` | 41 marcas, familias enumeradas, cobertura y características |
| `data/references.js` | Fichas técnicas (sección 4) y mediciones externas (sección 6) |
| `data/korve.js` | Muestras, mejoras, plan de validación, préstamos y fábricas |
| `data/branches.js` | Contenido de las ramas POWER, HYBRID y CONTROL |

Cada dato lleva su clase de evidencia en `ev`: `D` (declaración del fabricante), `F` (ensayo del fabricante), `L` (medición externa), `P` (publicidad), `KP` (declaración de proveedor), `KO` (objetivo solicitado), `KM` (medición interna), `KT` (opinión de tester), `PR` (propuesta) o `A` (análisis del informe). Los datos ausentes se cargan como `{ missing: "NP" | "PEND" | "NI" | "BLANK" }`. Para agregar un resultado de ensayo, completá `results` en `data/korve.js` con su clase de evidencia.

Después de editar, ejecutá la verificación:

```
node tests/check-data.js
```

## Pruebas

- `node tests/check-data.js` controla la integridad de los datos y las reglas de rigor. Por ejemplo, que haya 41 marcas, que cada dato tenga clase de evidencia y que ningún ensayo figure como realizado.
- `node tests/robustness.js` prueba casos específicos: 31 archivos de importación inválidos rechazados sin alterar el estado, notas pendientes al exportar o cambiar de vista, escalas de dureza (W3 y AMP22 comparten Shore C) y mediciones locales en las advertencias del comparador.
- `node tests/mobile.js [carpeta-capturas]` revisa celulares de 375, 390 y 430 px en vertical, con la fuente del sistema y con una de métricas tipo Helvetica (como iOS). Comprueba que el texto quede dentro de cada nodo del mapa, que no haya nodos superpuestos, letras de menos de 10,5 px, controles tapados, destinos ocultos bajo el encabezado, campos de menos de 16 px (Safari hace zoom al tocarlos) ni contenido que ensanche la página.
- `node tests/william.js` verifica la actualización de William en Muestras, Comparador, Fábrica y Fuentes, en escritorio y a 375 px: lecturas del proveedor separadas de las mediciones de Tomás, 19–22 sin escala y límites de control de calidad.
- `node tests/e2e.js [carpeta-capturas]` (con `KORVE_FILE=` y la ruta completa de `dist/korve-explorador.html` o `dist/artifact.html` prueba esas versiones; vale también para `robustness.js`) prueba con Playwright la navegación del mapa, los filtros, el comparador, las fuentes, los estados vacíos, la exportación e importación y la vista móvil de 390 px.

## Actualización interna — 13/11/2026

Se incorporaron las aclaraciones de William desde capturas de WhatsApp aportadas por Gonzalo. La fecha calendario del intercambio no es visible: se registra la fecha de incorporación, sin inventar fecha de fuente. Cambios en Muestras, Comparador, Fábrica y Fuentes. Las lecturas de William (MC 357 g / 250 mm, KS 361 g / 257 mm) son declaraciones KP sin protocolo; no sustituyen las mediciones locales de Tomás. El rango 19–22 no tiene magnitud/escala confirmada. No hay acuerdo de garantía simultánea ni exclusión de unidades fuera de especificación. Se conserva el corte de mercado del 11/11/2026.

No se modificaron interfaz, identificadores, esquema de importación ni almacenamiento de notas. Antes de cambiar de archivo o navegador, exportar las notas: el almacenamiento puede depender de la ubicación de apertura.
