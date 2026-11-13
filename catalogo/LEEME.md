# Catálogo PDF para WhatsApp

Genera un catálogo A4 (portada con índice, productos en grilla 2×3 agrupados por categoría y página final de contacto con botón de WhatsApp).

## Cómo usarlo
1. Poné tus fotos en `catalogo/fotos/` (JPG o PNG, idealmente ~1200 px y fondo claro).
2. Editá `catalogo/catalogo.json`:
   - `negocio`: nombre, logo (ruta a la imagen, ej. `fotos/logo.png`), WhatsApp, Instagram, colores, moneda y nota legal.
   - `productos`: uno por producto con `categoria`, `codigo`, `nombre`, `descripcion`, `precio`, `foto`.
     Opcionales: `precioAnterior` (muestra tachado), `etiqueta` (ej. "Nuevo", "Oferta"), `agotado: true`.
3. Ejecutá: `node catalogo/generar.js`
4. El PDF queda en `catalogo/salida/`, listo para mandar.

Para usar otro archivo de datos: `node catalogo/generar.js mi-lista.json salida.pdf`
