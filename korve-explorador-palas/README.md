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

Usá `dist/korve-explorador.html`: es la app completa en un solo archivo. Descomprimí el ZIP en Archivos (iPhone) o en Files de Google (Android) y abrí ese archivo con el navegador.

Para regenerarlo después de editar los datos: `node tools/build-single.js`. Ese comando también genera `dist/artifact.html`, la variante que se publica como vista previa en el chat de Claude.

## Vistas

- **Mapa**: KORVE en el centro y tres ramas. Tocá una rama para ver sus siete aspectos: comportamiento, jugador, muestra candidata, referencias, qué desarrollar, pruebas que deciden e información faltante. Muestra, Referencias y Desarrollar abren un tercer nivel. Con `+` y `−` acercás y alejás (también con la rueda o pellizcando), `◎` centra la selección y `↩` o `Esc` vuelve al nivel anterior. También podés arrastrar el mapa.
- **Explorador del mercado**: las 41 marcas, con búsqueda y filtros por marca, familia, temporada, cobertura y características documentadas. Los modelos que solo aparecen enumerados no tienen ficha.
- **Comparador**: hasta tres palas lado a lado, con advertencias cuando se mezclan configuraciones, temporadas, escalas de dureza o clases de evidencia.
- **Nuestras muestras**: W3, AMP22, MC-005 y KS-01, con objetivo solicitado, construcción declarada, medición real y opinión de tester por separado. Podés registrar mediciones locales.
- **Desarrollo y pruebas**: mejoras por prioridad, plan de validación y referencias a conseguir. Todo empieza como “Pendiente”.
- **Decisión de fábrica**: NEX frente a William, sin declarar ganador.
- **Fuentes y método**: fecha de corte, clases de evidencia, reglas de lectura, inconsistencias, mediciones externas y todos los enlaces.

## Notas y estados

Las notas, los estados y las mediciones que cargues se guardan **solo en ese navegador** (localStorage). Usá **Exportar JSON** para hacer una copia de seguridad o pasarlos a otro dispositivo: podés copiar el JSON o descargarlo como archivo (la descarga no funciona dentro del chat; ahí usá Copiar). Para recuperarlos, usá **Importar archivo** o **Importar pegando JSON**. Al importar se reemplazan los datos locales actuales; la app pide confirmación antes de hacerlo.

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
- `node tests/e2e.js [carpeta-capturas]` (con `KORVE_FILE=dist/korve-explorador.html` prueba la versión de un solo archivo) prueba con Playwright la navegación del mapa, los filtros, el comparador, las fuentes, los estados vacíos, la exportación e importación y la vista móvil de 390 px.
