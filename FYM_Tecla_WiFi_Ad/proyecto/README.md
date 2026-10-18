# FYM · Tecla Wi-Fi 2 botones · Anuncio V1 (Reels / TikTok)

**Entregable:** `04_export/FYM_Tecla_WiFi_Ad_V1.mp4`
1080 × 1920 (9:16) · 30 fps · H.264 High · AAC 48 kHz estéreo 192 kbps · 23,2 s · −14 LUFS (pico real −1,5 dBTP)

## Carpetas

| Carpeta | Contenido |
|---|---|
| `01_originales/` | Copias intactas del video y de las 9 fotos recibidas (no se modifican) |
| `02_trabajo/control_calidad/` | Hojas de contacto del original y del V1 (revisión cuadro a cuadro) |
| `03_recursos/` | Fuentes Inter (licencia OFL, uso comercial libre), recorte PNG de la tecla negra, transcripción anotada, tiempos por palabra, voz procesada |
| `04_export/` | MP4 final |
| `proyecto/` | `fym_ad.py` (montaje completo, editable) y `analisis/` (scripts de transcripción y alineación) |

## Montaje (orden final)

| Tiempo V1 | Imagen | Voz original (tiempo en el original) |
|---|---|---|
| 0,0–2,0 | Vendedor con la caja + gancho "Controlá tus luces desde el celular" | "Este productito nuevo que nos ingresó" (0,3–2,3) |
| 2,0–4,4 | Foto: tecla negra instalada en el living (paneo lento) + "Tecla táctil Wi-Fi" | "Son teclas de luz" (4,0–6,3) |
| 4,4–7,9 | Foto: tecla negra completa, fondo cálido (acercamiento lento) + "2 botones · Color negro" | "Y se instalan como si fuera un enchufe normal y corriente" (10,5–13,8) |
| 7,9–11,0 | Foto: detalle del frente de la tecla en la pared | "Súper sencillo la instalación de esto. Y la instalación…" (19,2–) |
| 11,0–13,8 | Vendedor + "Prendé y apagá desde el celular" | "…para que funcione por la aplicación de prender y apagar" (–25,0) |
| 13,8–15,3 | Manual con QR / Google Play / App Store (espejado corregido) | "Está para iPhone y Android" (27,3–29,0) |
| 15,3–16,7 | Foto: tecla en la pared con el living | "Lo mejor de todo," (29,3–30,0) |
| 16,7–18,8 | Vendedor + cartela "$17.500 · Modelo Wi-Fi de 2 botones" | "vamos a vender a 17.500 pesos" (31,5–33,5) |
| 18,8–20,5 | Vendedor mostrando la tecla negra (cartela de precio) | "Y lo tengo en color negro también" (43,7–45,4) |
| 20,5–23,2 | Cierre: FYM · tecla · $17.500 · "Escribinos para comprar" | — |

Omitido a propósito: "tenemos 200 unidades" (stock), "Cotagaita 2280, Ramos Mejía" (dirección), "Los estamos liquidando / en ningún lado…" (condición comercial), "tengo de un punto, de dos, para tres luces" (otros modelos), conexiones, manual y "te llega así con tornillitos y capacitor" (contenido de la caja, no confirmado en el brief).

## Cómo se hizo

- **Transcripción**: Whisper large-v3 local + alineación forzada con wav2vec2 (español) para fijar cada corte en una pausa real (resolución 20 ms). Cada empalme se verificó re-transcribiéndolo; el audio final se volvió a transcribir completo.
- **Subtítulos incrustados del original**: se eliminaron recortando el cuadro por encima de ellos (y < 904 de 1024; acercamiento ≈ 13 %). Los subtítulos nuevos salen de la transcripción verificada, están sincronizados por palabra y no se duplican.
- **Audio**: filtro paso alto 75 Hz (quita el retumbe grave), reducción de ruido suave, EQ leve, compresión 2:1 suave y normalización a −14 LUFS. Fundidos de 12 ms en cada corte y tono de sala en las pausas. Sin música (no había pista con licencia comercial).
- **Sincronía**: verificada por correlación con el original (error 0,0 ms en los 8 segmentos).
- **Insertos**: composición de las fotos reales (sin generación por IA): recortes, fondo cálido y movimientos de cámara lentos. Sin deformación (solo escala/encuadre).

## Ajustar y volver a exportar

Requisitos: `ffmpeg`, Python 3 con `numpy`, `opencv-python-headless`, `pillow` (y `scipy` solo si se borra el recorte PNG).

```bash
cd proyecto
python3 fym_ad.py --timeline           # ver la línea de tiempo calculada
python3 fym_ad.py --stills 1,6,17.5    # PNG de control en 02_trabajo/stills/
python3 fym_ad.py                      # export completo (~3–4 min)
python3 fym_ad.py --audio-only         # rehacer solo el audio
```

Todo lo editable está arriba en `fym_ad.py`, sección **EDICIÓN**:
- `SEGMENTS`: recortes de voz (`a_in`/`a_out` en segundos del original) y pausas (`gap`).
- `SHOTS`: qué imagen va en cada tramo.
- `overlays()`: textos (gancho, etiquetas, precio).
- `CAPTIONS`: agrupación de palabras de los subtítulos (`{texto}` = color de acento).
- Paleta, tipografías, márgenes seguros (`TOP_Y`, `CAP_Y`), duración del cierre (`END_CARD_DUR`).
