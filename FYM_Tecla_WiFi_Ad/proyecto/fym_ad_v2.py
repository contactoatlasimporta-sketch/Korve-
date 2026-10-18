#!/usr/bin/env python3
"""
FYM — Tecla Wi-Fi 2 botones · Anuncio vertical V2 (Reels / TikTok)

Cambios respecto de V1 (fym_ad.py, que queda intacto para comparar):
- Sin el plano del manual/QR: ese tramo lo cubre un plano del producto.
- Insertos alternados (ambiente / detalle / vendedor); la foto instalada se usa
  solo 2 veces y con encuadres distintos. Producto con más presencia.
- Vendedor encuadrado para que los subtítulos queden debajo del mentón.
- Cierre con el logo auténtico de FYM (extraído de los materiales) y producto
  más grande.

Proyecto editable. Todo el montaje está definido en las tablas de la sección
"EDICIÓN" (segmentos de audio, planos, textos y subtítulos). Para ajustar el
video, cambiá esos valores y volvé a ejecutar:

    python3 fym_ad_v2.py                 # render completo -> 04_export/FYM_Tecla_WiFi_Ad_V2.mp4
    python3 fym_ad_v2.py --stills 1,6,17 # PNG de control en 02_trabajo/stills_v2/

Requisitos: ffmpeg, Python 3 con numpy, opencv-python-headless y pillow.
Todos los tiempos "src" son segundos del video original.
"""
import argparse, json, math, os, subprocess, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_VIDEO = f"{ROOT}/01_originales/87ca1ceb-8b77-4689-9d65-88dcb02d436a.mov"
FOTO_LIVING = f"{ROOT}/01_originales/fotos/foto_06_af0faa5a.jpg"   # tecla negra instalada, living al fondo
FOTO_NEGRA = f"{ROOT}/01_originales/fotos/foto_04_fc95e3e8.jpg"    # tecla negra 2 botones, fondo blanco
FONTS = f"{ROOT}/03_recursos/fuentes"
RES = f"{ROOT}/03_recursos"
WORK = f"{ROOT}/02_trabajo"
OUT_DIR = f"{ROOT}/04_export"
OUT_NAME = "FYM_Tecla_WiFi_Ad_V2.mp4"
CACHE = os.environ.get("FYM_CACHE", f"{WORK}/cache")

W, H, FPS = 1080, 1920, 30
SR = 48000

# ----------------------------------------------------------------------------
# EDICIÓN
# ----------------------------------------------------------------------------
# Segmentos de voz en orden de montaje. a_in / a_out = recorte del audio
# original (cortes en pausas verificadas). gap = silencio (tono de sala) antes.
# cuts = silencios internos que se quitan (solo en tramos cubiertos por insertos,
# así no hay saltos de imagen). Se dejan ~0,2 s de pausa natural.
SEGMENTS = [
    dict(id="A",  a_in=0.28,  a_out=2.28,  gap=0.00),  # "Este productito nuevo que nos ingresó"
    dict(id="B",  a_in=4.00,  a_out=6.32,  gap=0.00,   # "Son teclas de luz"
         cuts=[(4.42, 5.02)]),                         #   pausa de 0,8 s con chasquidos de boca
    dict(id="C",  a_in=10.45, a_out=13.80, gap=0.12,   # "Y se instalan como si fuera un enchufe normal y corriente"
         cuts=[(11.16, 11.31), (12.24, 12.44)]),
    dict(id="D",  a_in=19.15, a_out=25.00, gap=0.15,   # "Súper sencillo la instalación de esto. Y la instalación ... de prender y apagar"
         cuts=[(20.10, 20.62)]),
    dict(id="iA", a_in=27.30, a_out=29.02, gap=0.10),  # "Está para iPhone y Android"
    dict(id="E1", a_in=29.30, a_out=30.075, gap=0.12, fade_out=0.040),  # "Lo mejor de todo" (cierre suave de la vocal)
    dict(id="E2", a_in=31.45, a_out=33.46, gap=0.22),  # "vamos a vender a 17.500 pesos"
    dict(id="F",  a_in=43.66, a_out=45.37, gap=0.10),  # "Y lo tengo en color negro también"
]
FADE = 0.020   # fundido de igual potencia en cada borde de recorte
END_CARD_DUR = 2.70
END_PRICE_Y = 1182            # cierre: precio
END_CTA_Y = 1352              # cierre: botón "Escribinos para comprar" (termina en y≈1460)

# Encuadre del vendedor (V2). Medido con detección de rostro en cada cuadro:
# ojos y >= 420 y mentón y <= 753 (px del original 576×1024). Se escala a ancho
# completo (×1.875) y se sube 90 px: el rostro queda entre y≈700 y y≈1322 de la
# salida, con lugar para la cartela arriba y los subtítulos debajo del mentón.
# Los subtítulos incrustados del original (y>=912) caen en y>=1620, dentro de
# la zona de interfaz de Reels/TikTok, y los cubre un fundido oscuro opaco
# (del color del buzo) que empieza en y=1450 y es total desde y=1600.
FRAMING = "v2"
SELLER_SCALE = 1080 / 576.0
SELLER_SHIFT = 90.0
SCRIM_Y0, SCRIM_Y1 = 1450, 1600
SCRIM_RGB = (15, 14, 13)

# Subtítulos nuevos: grupos de palabras (índices de palabras alineadas por segmento).
# {texto} entre llaves = resaltado en color de acento.
CAPTIONS = {
    "A":  [("Este productito nuevo", 0, 2), ("que nos ingresó", 3, 5)],
    "B":  [("Son teclas de luz", 0, 3)],
    "C":  [("Y se instalan", 0, 2), ("como si fuera", 3, 5), ("un enchufe normal", 6, 8), ("y corriente", 9, 10)],
    "D":  [("Súper sencillo", 0, 1), ("la instalación de esto", 2, 5), ("Y la instalación", 6, 8),
           ("para que funcione", 9, 11), ("por la aplicación", 12, 14), ("de prender y apagar", 15, 18)],
    "iA": [("Está para", 0, 1), ("iPhone y Android", 2, 4)],
    "E1": [("Lo mejor de todo,", 0, 3)],
    "E2": [("vamos a vender", 0, 2), ("a {17.500} pesos", 3, 7)],
    "F":  [("Y lo tengo", 0, 2), ("en color negro", 3, 5), ("también", 6, 6)],   # a la derecha de la tecla
}

# Paleta (cálida, hogar moderno) — RGB
C_INK = (26, 23, 20)          # carbón cálido
C_PAPER = (248, 242, 234)     # blanco cálido
C_ACCENT = (242, 158, 52)     # ámbar (afín al naranja de FYM)
C_ACCENT_DARK = (214, 112, 24)
C_MUTED = (110, 98, 88)

# Zonas seguras (Reels/TikTok): textos dentro de x 80–1000, y 230–1480.
TOP_Y = 262                   # borde superior de títulos/cartelas
PRICE_Y = 240                 # borde superior de la cartela de precio
CAP_PAD = 50                  # margen de la capa de subtítulo (sombra completa)
CAP_Y = 1400                  # centro de los subtítulos (franja 1362–1438: debajo del mentón, dentro de zona segura)


# ----------------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------------
def font(name, size):
    return ImageFont.truetype(f"{FONTS}/{name}", size)

def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)

def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3

def build_timeline():
    """Divide cada segmento en tramos (si tiene pausas recortadas) y calcula, para cada
    tramo, su inicio en la línea de tiempo y el offset (src = t + off)."""
    t = 0.0
    segs, pieces = {}, []
    for s_ in SEGMENTS:
        t += s_["gap"]
        bounds = [s_["a_in"]]
        for a, b in s_.get("cuts", []):
            bounds += [a, b]
        bounds.append(s_["a_out"])
        d = dict(s_)
        d["t0"] = t
        d["pieces"] = []
        for k in range(0, len(bounds), 2):
            p_in, p_out = bounds[k], bounds[k + 1]
            pc = dict(seg=s_["id"], a_in=p_in, a_out=p_out, t0=t, t1=t + (p_out - p_in), off=p_in - t,
                      fade_in=FADE, fade_out=s_.get("fade_out", FADE) if k + 2 == len(bounds) else FADE)
            d["pieces"].append(pc)
            pieces.append(pc)
            t = pc["t1"]
        d["t1"] = t
        segs[s_["id"]] = d
    return segs, pieces, t

SEG, PIECES, SPEECH_END = build_timeline()

def T(seg_id, src):
    """Tiempo de la línea de tiempo que corresponde a un tiempo src de un segmento
    (si src cae en una pausa recortada, devuelve el inicio del tramo siguiente)."""
    pcs = SEG[seg_id]["pieces"]
    for pc in pcs:
        if src <= pc["a_out"] + 1e-9:
            return max(src, pc["a_in"]) - pc["off"]
    return src - pcs[-1]["off"]

def off_at(seg_id, t):
    """Offset del tramo que suena en el tiempo t (para sincronizar la imagen del vendedor)."""
    pcs = SEG[seg_id]["pieces"]
    for pc in pcs:
        if t < pc["t1"]:
            return pc["off"]
    return pcs[-1]["off"]

TOTAL = T("F", 45.37) + END_CARD_DUR

# Planos (capa base). Alternancia: vendedor / ambiente / detalle / vendedor…
SELLER_D_END = 24.88   # antes de que entre el manual al cuadro
SHOTS = [
    dict(t0=0.0,                 t1=T("A", 2.28),     kind="seller", seg="A"),
    dict(t0=T("A", 2.28),        t1=SEG["C"]["t0"],   kind="living_env"),     # ambiente: tecla en el living
    dict(t0=SEG["C"]["t0"],      t1=SEG["D"]["t0"],   kind="negra_macro"),    # detalle: recorrido por el frente
    dict(t0=SEG["D"]["t0"],      t1=T("D", 22.20),    kind="living_detail"),  # detalle: la tecla en la pared
    dict(t0=T("D", 22.20),       t1=T("D", SELLER_D_END), kind="seller", seg="D"),
    dict(t0=T("D", SELLER_D_END), t1=T("E2", 31.45),  kind="negra_hero"),     # producto (reemplaza el manual/QR)
    dict(t0=T("E2", 31.45),      t1=T("F", 43.66),    kind="seller", seg="E2"),
    dict(t0=T("F", 43.66),       t1=T("F", 45.37),    kind="seller", seg="F", cap_side="right"),
    dict(t0=T("F", 45.37),       t1=TOTAL,            kind="endcard"),
]

# Textos gráficos (zona superior). (inicio, fin, tipo, contenido)
def overlays():
    e2 = SEG["E2"]
    return [
        dict(t0=0.0,  t1=2.30, kind="hook", lines=["Controlá tus luces", "desde el celular"]),
        dict(t0=2.40, t1=SEG["C"]["t0"] - 0.04, kind="label", text="Tecla táctil Wi-Fi"),
        dict(t0=SEG["C"]["t0"] + 0.15, t1=SEG["C"]["t0"] + 2.05, kind="label", text="2 botones · Color negro"),
        dict(t0=T("D", 22.20) + 0.10, t1=T("D", SELLER_D_END) - 0.04, kind="label", text="Prendé y apagá desde el celular"),
        dict(t0=T("E2", 31.62), t1=T("F", 45.37), kind="price", price="$17.500", sub="Modelo Wi-Fi de 2 botones"),
    ]


# ----------------------------------------------------------------------------
# Gráficos (RGBA en numpy float32, premultiplicado)
# ----------------------------------------------------------------------------
class Sprite:
    def __init__(self, img: Image.Image, x, y):
        a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255.0
        a[..., :3] *= a[..., 3:4]
        self.a = a
        self.x, self.y = int(round(x)), int(round(y))

def blend(frame, spr: Sprite, opacity=1.0, dx=0, dy=0):
    if opacity <= 0.001:
        return
    h, w = spr.a.shape[:2]
    x0, y0 = spr.x + int(round(dx)), spr.y + int(round(dy))
    fx0, fy0 = max(x0, 0), max(y0, 0)
    fx1, fy1 = min(x0 + w, W), min(y0 + h, H)
    if fx1 <= fx0 or fy1 <= fy0:
        return
    s = spr.a[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
    dst = frame[fy0:fy1, fx0:fx1]
    dst *= (1.0 - s[..., 3:4] * opacity)
    dst += s[..., :3] * opacity

def text_width(draw, txt, f):
    b = draw.textbbox((0, 0), txt, font=f)
    return b[2] - b[0]

def parse_marked(txt):
    """'a {17.500} pesos' -> [(texto, resaltado)]"""
    out, cur, hl = [], "", False
    for ch in txt:
        if ch == "{":
            if cur: out.append((cur, hl))
            cur, hl = "", True
        elif ch == "}":
            if cur: out.append((cur, hl))
            cur, hl = "", False
        else:
            cur += ch
    if cur: out.append((cur, hl))
    return out

def shadow_layer(size, box, radius, blur, opacity, offset=(0, 10)):
    sh = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sh)
    x0, y0, x1, y1 = box
    d.rounded_rectangle((x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]), radius,
                        fill=(0, 0, 0, int(255 * opacity)))
    return sh.filter(ImageFilter.GaussianBlur(blur))

def make_caption(txt, cx, cy):
    f = font("Inter-ExtraBold.otf", 56)
    parts = parse_marked(txt)
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    full = "".join(p for p, _ in parts)
    tw = text_width(tmp, full, f)
    padx, pady, hgt = 30, 16, 78
    bw, bh = tw + 2 * padx, hgt
    pad = CAP_PAD   # margen suficiente para que la sombra no se corte
    img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 22, 12, 0.25, (0, 6)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 22, fill=(22, 19, 17, 196))
    x = pad + padx
    # baseline vertical centring using font metrics
    asc, desc = f.getmetrics()
    ty = pad + (bh - (asc + desc)) / 2 + 2
    for p, hl in parts:
        d.text((x, ty), p, font=f, fill=C_ACCENT if hl else (255, 255, 255))
        x += text_width(d, p, f) + (0 if p.endswith(" ") else 0)
    # clamp horizontally into safe area (80..1000)
    left = cx - img.width / 2
    left = min(max(left, 80 - pad), 1000 + pad - img.width)
    return Sprite(img, left, cy - img.height / 2)

def make_hook(lines):
    f = font("InterDisplay-ExtraBold.otf", 82)
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    tw = max(text_width(tmp, l, f) for l in lines)
    padx, pady, lh = 48, 34, 96
    bw, bh = tw + 2 * padx, lh * len(lines) + 2 * pady - 8
    pad = 70
    img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 30, 18, 0.30, (0, 12)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 30, fill=C_PAPER + (246,))
    asc, desc = f.getmetrics()
    for i, l in enumerate(lines):
        col = C_INK if i == 0 else C_ACCENT_DARK
        lw = text_width(d, l, f)
        d.text((pad + (bw - lw) / 2, pad + pady + i * lh - 10), l, font=f, fill=col)
    return Sprite(img, (W - img.width) / 2, TOP_Y - pad)

def make_label(text):
    f = font("Inter-Bold.otf", 52)
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    tw = text_width(tmp, text, f)
    dot = 18
    padx, bh = 36, 96
    bw = tw + 2 * padx + dot + 22
    pad = 66
    img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 48, 16, 0.28, (0, 10)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 48, fill=C_INK + (232,))
    cy = pad + bh / 2
    d.ellipse((pad + padx, cy - dot / 2, pad + padx + dot, cy + dot / 2), fill=C_ACCENT)
    asc, desc = f.getmetrics()
    d.text((pad + padx + dot + 22, pad + (bh - (asc + desc)) / 2 + 1), text, font=f, fill=(255, 255, 255))
    return Sprite(img, (W - img.width) / 2, TOP_Y - pad)

def make_price(price, sub):
    fp = font("InterDisplay-Black.otf", 140)
    fs = font("Inter-Bold.otf", 44)
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    pb = tmp.textbbox((0, 0), price, font=fp)
    sb = tmp.textbbox((0, 0), sub, font=fs)
    pw, ph = pb[2] - pb[0], pb[3] - pb[1]
    sw, sh_ = sb[2] - sb[0], sb[3] - sb[1]
    top, gap1, gap2, bottom = 34, 24, 24, 34
    bw = max(pw, sw) + 2 * 56
    bh = top + ph + gap1 + 5 + gap2 + sh_ + bottom
    pad = 80
    img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
    img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 36, 20, 0.35, (0, 14)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 36, fill=C_INK + (238,))
    y = pad + top
    d.text((pad + (bw - pw) / 2 - pb[0], y - pb[1]), price, font=fp, fill=C_PAPER)
    y += ph + gap1
    d.rounded_rectangle((pad + bw / 2 - 40, y, pad + bw / 2 + 40, y + 5), 3, fill=C_ACCENT)
    y += 5 + gap2
    d.text((pad + (bw - sw) / 2 - sb[0], y - sb[1]), sub, font=fs, fill=C_ACCENT)
    return Sprite(img, (W - img.width) / 2, PRICE_Y - pad)


# ----------------------------------------------------------------------------
# Imágenes de producto
# ----------------------------------------------------------------------------
def load_rgb(path):
    return cv2.cvtColor(cv2.imread(path, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

def warm_grade(img, amount=1.0):
    """Gradación cálida suave (img float 0..1)."""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    out = np.empty_like(img)
    out[..., 0] = r + 0.030 * amount * (1 - r) * r * 4 * 0.5
    out[..., 1] = g + 0.008 * amount * (1 - g) * g * 4 * 0.5
    out[..., 2] = b - 0.028 * amount * (1 - b) * b * 4 * 0.5
    # contraste suave (curva S)
    out = out + 0.06 * amount * (out - 0.5) * (1 - np.abs(2 * out - 1))
    return np.clip(out, 0, 1)

def cutout_negra():
    """Recorte limpio de la tecla negra sobre fondo blanco (foto 04)."""
    cache = f"{RES}/tecla_negra_recorte.png"
    if os.path.exists(cache):
        rgba = np.asarray(Image.open(cache).convert("RGBA")).astype(np.float32) / 255.0
        return rgba
    from scipy import ndimage
    img = cv2.cvtColor(cv2.imread(FOTO_NEGRA), cv2.COLOR_BGR2RGB)
    img[:, 1186:] = 255                      # borde derecho con línea verde de la captura
    a = img.astype(np.float32)
    mn = a.min(2)
    cand = mn >= 246
    lab, n = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    obj = ~bg
    obj = ndimage.binary_fill_holes(obj)
    # alfa suave en el borde: banda de 3 px según luminancia
    dist_in = ndimage.distance_transform_edt(obj)
    lum = a.mean(2)
    soft = np.clip((255.0 - lum) / (255.0 - 30.0), 0, 1)
    alpha = np.where(dist_in > 3, 1.0, np.where(obj, np.maximum(soft, 0.0), 0.0))
    alpha = np.clip(alpha, 0, 1)
    # des-premultiplicar el halo blanco en la banda
    rgb = a / 255.0
    al = alpha[..., None]
    rgb_u = np.where(al > 0.02, (rgb - (1 - al) * 1.0) / np.maximum(al, 0.02), rgb)
    rgb_u = np.clip(rgb_u, 0, 1)
    rgba = np.concatenate([rgb_u, al], axis=2).astype(np.float32)
    Image.fromarray((rgba * 255).round().astype(np.uint8), "RGBA").save(cache)
    return rgba

def warm_backdrop(seed=7):
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    x = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    top = np.array([241, 233, 222], np.float32) / 255
    bot = np.array([214, 201, 186], np.float32) / 255
    base = top[None, None, :] * (1 - y[..., None]) + bot[None, None, :] * y[..., None]
    # luz cálida suave detrás del producto
    r = np.sqrt(((x - 0.52) / 0.75) ** 2 + ((y - 0.42) / 0.55) ** 2)
    glow = np.clip(1 - r, 0, 1)[..., None] ** 2
    base = base + glow * (np.array([255, 246, 232], np.float32) / 255 - base) * 0.55
    rng = np.random.default_rng(seed)
    base += (rng.standard_normal((H, W, 1)).astype(np.float32) * 0.004)
    return np.clip(base, 0, 1)

def affine_view(src, cx, cy, scale, out_w=W, out_h=H, interp=cv2.INTER_LANCZOS4, border=cv2.BORDER_REFLECT):
    """Vista de 'cámara': el punto (cx,cy) de src queda en el centro de salida, con escala 'scale'."""
    M = np.array([[1 / scale, 0, cx - (out_w / 2) / scale],
                  [0, 1 / scale, cy - (out_h / 2) / scale]], np.float32)
    return cv2.warpAffine(src, M, (out_w, out_h), flags=interp | cv2.WARP_INVERSE_MAP, borderMode=border)

def composite_cutout(bg, rgba, cx, cy, scale, shadow=True):
    """Coloca el recorte (rgba, no premultiplicado) con su centro en (cx,cy) de salida."""
    h, w = rgba.shape[:2]
    M = np.array([[1 / scale, 0, w / 2 - cx / scale],
                  [0, 1 / scale, h / 2 - cy / scale]], np.float32)
    pm = rgba.copy()
    pm[..., :3] *= pm[..., 3:4]
    warped = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP,
                            borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    warped = np.clip(warped, 0, 1)
    out = bg.copy()
    if shadow:
        a = warped[..., 3]
        sh = cv2.GaussianBlur(a, (0, 0), 38)
        sh = shift_nowrap(sh, 34, 18)
        out *= (1 - 0.30 * sh[..., None] * np.array([1.0, 1.0, 1.0], np.float32))
    out = out * (1 - warped[..., 3:4]) + warped[..., :3]
    return out


def shift_nowrap(a, dy, dx):
    """Desplaza una imagen sin que lo que sale por un borde reaparezca por el otro."""
    out = np.zeros_like(a)
    out[dy:, dx:] = a[:a.shape[0] - dy, :a.shape[1] - dx]
    return out

PRODUCT_PIVOT = (650.0, 795.0)   # centro del producto en la foto 04
PRODUCT_TILT = 28.5              # inclinación del eje largo en la foto (grados)

def composite_product(bg, rgba, cx, cy, scale, rot_deg, shadow=0.30, sweep=None):
    """Producto recortado con rotación rígida (sin deformar) alrededor de su centro.
    rot_deg = grados que se endereza el producto (PRODUCT_TILT = vertical).
    sweep = posición 0..1 de un reflejo de luz suave sobre el producto (o None)."""
    th = math.radians(rot_deg)
    c, s_ = math.cos(th), math.sin(th)
    px, py = PRODUCT_PIVOT
    M = np.array([[c / scale, s_ / scale, px - (c * cx + s_ * cy) / scale],
                  [-s_ / scale, c / scale, py - (-s_ * cx + c * cy) / scale]], np.float32)
    pm = rgba.copy()
    pm[..., :3] *= pm[..., 3:4]
    warped = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP,
                            borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    warped = np.clip(warped, 0, 1)
    a = warped[..., 3:4]
    out = bg.copy()
    if shadow:
        sh = shift_nowrap(cv2.GaussianBlur(warped[..., 3], (0, 0), 34), 40, 22)
        contact = shift_nowrap(cv2.GaussianBlur(warped[..., 3], (0, 0), 10), 14, 8)
        out *= (1 - (shadow * sh + 0.18 * contact)[..., None].clip(0, 0.6))
    rgb = warped[..., :3]
    if sweep is not None and 0.0 < sweep < 1.0:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = (xx * 0.42 + yy * 0.91)                       # banda diagonal
        pos = -400 + sweep * (W * 0.42 + H * 0.91 + 800)
        band = np.exp(-((d - pos) / 70.0) ** 2) * 0.10 * math.sin(math.pi * sweep)
        dark = 1 - rgb.mean(2, keepdims=True) / np.maximum(a, 1e-3)
        rgb = rgb + band[..., None] * a * dark.clip(0, 1) * np.array([1.0, 0.97, 0.92], np.float32)
    return out * (1 - a) + rgb

_BD_BASE = None
def backdrop_at(gx=0.52, gy=0.42, seed=7):
    """Fondo cálido con luz suave; (gx, gy) mueve la luz para dar paralaje."""
    global _BD_BASE
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    x = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    if _BD_BASE is None:
        top = np.array([241, 233, 222], np.float32) / 255
        bot = np.array([212, 199, 184], np.float32) / 255
        base = top[None, None, :] * (1 - y[..., None]) + bot[None, None, :] * y[..., None]
        rng = np.random.default_rng(seed)
        base = base + rng.standard_normal((H, W, 1)).astype(np.float32) * 0.004
        _BD_BASE = base
    r = np.sqrt(((x - gx) / 0.75) ** 2 + ((y - gy) / 0.55) ** 2)
    glow = (np.clip(1 - r, 0, 1) ** 2)[..., None]
    out = _BD_BASE + glow * (np.array([255, 246, 232], np.float32) / 255 - _BD_BASE) * 0.55
    return np.clip(out, 0, 1)

def load_logo():
    rgba = np.asarray(Image.open(f"{RES}/logo_fym_extraido.png").convert("RGBA")).astype(np.float32) / 255
    return np.pad(rgba, ((12, 12), (12, 12), (0, 0)))   # margen transparente


# ----------------------------------------------------------------------------
# Video del vendedor
# ----------------------------------------------------------------------------
class Source:
    def __init__(self):
        self.w, self.h = 576, 1024
        os.makedirs(CACHE, exist_ok=True)
        cache = f"{CACHE}/src_frames.u8"   # caché temporal (se puede borrar; se regenera)
        n = None
        if not os.path.exists(cache):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC_VIDEO, "-f", "rawvideo",
                            "-pix_fmt", "rgb24", cache], check=True)
        n = os.path.getsize(cache) // (self.w * self.h * 3)
        self.frames = np.memmap(cache, dtype=np.uint8, mode="r", shape=(n, self.h, self.w, 3))
        self.n = n

    def get(self, src_t):
        i = int(round(src_t * FPS))
        i = min(max(i, 0), self.n - 1)
        return self.frames[i]

SCRIM = None
def bottom_scrim():
    global SCRIM
    if SCRIM is None:
        y = np.arange(H, dtype=np.float32)
        a = np.clip((y - SCRIM_Y0) / (SCRIM_Y1 - SCRIM_Y0), 0, 1)
        SCRIM = (a * a * (3 - 2 * a))[:, None, None]
    return SCRIM

def seller_view(frame_u8):
    f = frame_u8.astype(np.float32) / 255.0
    cy = 512.0 + SELLER_SHIFT / SELLER_SCALE
    out = affine_view(f, 288.0, cy, SELLER_SCALE)
    blur = cv2.GaussianBlur(out, (0, 0), 1.3)
    out = np.clip(out + 0.30 * (out - blur), 0, 1)
    out = warm_grade(out, 1.0)
    sc = bottom_scrim()
    return out * (1 - sc) + np.array(SCRIM_RGB, np.float32) / 255 * sc

def src_to_out_x(x):
    return (x - 288.0) * SELLER_SCALE + W / 2

def src_to_out_y(y):
    return (y - 512.0) * SELLER_SCALE + H / 2 - SELLER_SHIFT


# ----------------------------------------------------------------------------
# Render de un fotograma
# ----------------------------------------------------------------------------
class Renderer:
    def __init__(self):
        self.src = Source()
        self.living = warm_grade(load_rgb(FOTO_LIVING), 0.6)
        self.negra = cutout_negra()
        self.logo = load_logo()
        self.ovl = overlays()
        self.ovl_sprites = []
        for o in self.ovl:
            if o["kind"] == "hook": s = make_hook(o["lines"])
            elif o["kind"] == "label": s = make_label(o["text"])
            elif o["kind"] == "price": s = make_price(o["price"], o["sub"])
            self.ovl_sprites.append(s)
        self.caps = self.build_captions()
        self.end = self.build_endcard_static()

    # ---- subtítulos ----
    def build_captions(self):
        words = json.load(open(f"{RES}/palabras_alineadas.json"))
        caps = []
        for sid, groups in CAPTIONS.items():
            ws = words[sid]["words"]
            seg = SEG[sid]
            for gi, (txt, i0, i1) in enumerate(groups):
                s = T(sid, ws[i0]["s"]) - 0.07
                if gi + 1 < len(groups):
                    nxt = T(sid, ws[groups[gi + 1][1]]["s"]) - 0.07
                    e = nxt if nxt - T(sid, ws[i1]["e"]) < 0.6 else T(sid, ws[i1]["e"]) + 0.25
                else:
                    e = T(sid, ws[i1]["e"]) + 0.30
                caps.append(dict(t0=max(s, seg["t0"] - 0.05), t1=e, text=txt, seg=sid))
        caps.sort(key=lambda c: c["t0"])
        # evitar solapes entre segmentos
        for a, b in zip(caps, caps[1:]):
            if a["t1"] > b["t0"]:
                a["t1"] = b["t0"]
        # ningún subtítulo entra en la placa de cierre
        for c in caps:
            c["t1"] = min(c["t1"], SHOTS[-1]["t0"])
        # sprites (posición x según plano)
        for c in caps:
            mid = (c["t0"] + c["t1"]) / 2
            cx = 540
            for sh in SHOTS:
                if sh["t0"] <= mid < sh["t1"] and sh.get("cap_side") == "right":
                    # a la derecha de la tecla que sostiene (borde derecho de la tecla: x=260 del original)
                    tmp = make_caption(c["text"], 540, CAP_Y)
                    wpill = tmp.a.shape[1] - 2 * CAP_PAD
                    left = src_to_out_x(260) + 24
                    cx = min(left + wpill / 2, 1000 - wpill / 2)
            c["sprite"] = make_caption(c["text"], cx, CAP_Y)
        self.check_caption_clearance(caps)
        return caps

    def check_caption_clearance(self, caps):
        """Comprueba con el seguimiento de rostro que ningún subtítulo toque la boca/mentón."""
        p = f"{RES}/rostro_seguimiento.json"
        if not os.path.exists(p):
            return
        track = json.load(open(p))
        seg2shot = {"A": "A", "D": "D2", "E2": "E2", "F": "F"}
        worst = 1e9
        for c in caps:
            spr = c["sprite"]
            pill_top = spr.y + CAP_PAD
            for sh in SHOTS:
                if sh["kind"] != "seller":
                    continue
                key = seg2shot.get(sh["seg"])
                for (i, ey, my, chin, x0, x1) in track.get(key, []):
                    t = T(sh["seg"], i / FPS)
                    if max(c["t0"], sh["t0"]) <= t < min(c["t1"], sh["t1"]):
                        gap = pill_top - src_to_out_y(chin)
                        worst = min(worst, gap)
        print(f"  subtítulos: distancia mínima mentón→subtítulo = {worst:.0f} px")

    # ---- cierre ----
    def build_endcard_static(self):
        el = {}
        # logo auténtico (extraído de la foto 05), sin redibujar
        lg = self.logo
        target_h = 216.0
        sc = target_h / lg.shape[0]
        lw, lh = int(round(lg.shape[1] * sc)), int(round(lg.shape[0] * sc))
        rgb = cv2.resize(lg[..., :3] * lg[..., 3:4], (lw, lh), interpolation=cv2.INTER_AREA)
        al = cv2.resize(lg[..., 3], (lw, lh), interpolation=cv2.INTER_AREA)
        img = np.dstack([np.clip(rgb / np.maximum(al[..., None], 1e-4), 0, 1), al])
        el["logo"] = Sprite(Image.fromarray((img * 255).round().astype(np.uint8), "RGBA"), (W - lw) / 2, 222)
        f_price = font("InterDisplay-Black.otf", 104)
        f_sub = font("Inter-Bold.otf", 40)
        img = Image.new("RGBA", (W, 200), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        p = "$17.500"
        pb = d.textbbox((0, 0), p, font=f_price)
        d.text(((W - (pb[2] - pb[0])) / 2 - pb[0], 6 - pb[1]), p, font=f_price, fill=C_INK)
        s_ = "Modelo Wi-Fi de 2 botones"
        sb = d.textbbox((0, 0), s_, font=f_sub)
        d.text(((W - (sb[2] - sb[0])) / 2 - sb[0], 6 + (pb[3] - pb[1]) + 20 - sb[1]), s_, font=f_sub, fill=C_ACCENT_DARK)
        el["price"] = Sprite(img, 0, END_PRICE_Y)
        f_cta = font("Inter-ExtraBold.otf", 52)
        cta = "Escribinos para comprar"
        tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
        tw = text_width(tmp, cta, f_cta)
        bw, bh, pad = tw + 2 * 56, 108, 70
        img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
        img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 54, 18, 0.30, (0, 12)))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 54, fill=C_INK + (255,))
        asc, desc = f_cta.getmetrics()
        d.text((pad + 56, pad + (bh - (asc + desc)) / 2 + 1), cta, font=f_cta, fill=(255, 255, 255))
        el["cta"] = Sprite(img, (W - img.width) / 2, END_CTA_Y - pad)
        return el

    # ---- capa base ----
    def base(self, t):
        for sh in SHOTS:
            if sh["t0"] - 1e-6 <= t < sh["t1"] - 1e-6 or (sh is SHOTS[-1] and t >= sh["t0"]):
                break
        k = sh["kind"]
        u = (t - sh["t0"]) / max(sh["t1"] - sh["t0"], 1e-6)
        if k == "seller":
            fr = self.src.get(t + off_at(sh["seg"], t))
            return seller_view(fr)
        if k == "living_env":
            # ambiente: arranca abierto (tecla + living) y se acerca despacio a la tecla
            e = smooth(u)
            scale = H / 1288.0 * (1.00 + 0.13 * e)
            return affine_view(self.living, 850.0 - 80.0 * e, 644.0 + 30.0 * e, scale)
        if k == "living_detail":
            # detalle en la pared: frente, aros táctiles y canto
            e = smooth(u)
            scale = H / 1288.0 * (1.42 + 0.12 * e)
            return affine_view(self.living, 657.0, 756.0 - 14.0 * e, scale)
        if k == "negra_macro":
            # recorrido lento por el frente: del aro superior al inferior, producto enderezado
            e = smooth(u)
            scale = 1.52 - 0.06 * e
            rot = PRODUCT_TILT - 4.0 + 2.0 * e
            # punto del producto que va al centro: del aro superior (565,470) al inferior (860,975)
            fx, fy = 565 + (860 - 565) * (0.10 + 0.80 * e), 470 + (975 - 470) * (0.10 + 0.80 * e)
            th = math.radians(rot); c, s_ = math.cos(th), math.sin(th)
            dx, dy = fx - PRODUCT_PIVOT[0], fy - PRODUCT_PIVOT[1]
            ox, oy = scale * (c * dx - s_ * dy), scale * (s_ * dx + c * dy)
            bg = backdrop_at(0.50 + 0.06 * e, 0.40 - 0.04 * e)
            return composite_product(bg, self.negra, W / 2 - ox, H / 2 - 40 - oy, scale, rot,
                                     shadow=0.22, sweep=(u - 0.15) / 0.7)
        if k == "negra_hero":
            # producto completo con presencia: leve giro y acercamiento
            e = smooth(u)
            scale = 1.06 + 0.06 * e
            rot = PRODUCT_TILT - 6.0 + 4.0 * e
            bg = backdrop_at(0.46 + 0.08 * e, 0.42)
            return composite_product(bg, self.negra, W / 2 + 6, 905 - 10 * e, scale, rot,
                                     shadow=0.30, sweep=(u - 0.25) / 0.65)
        if k == "endcard":
            dur = sh["t1"] - sh["t0"]
            e = ease_out(min(u * dur / 0.6, 1))
            scale = 0.465 + 0.015 * smooth(u)
            bg = backdrop_at(0.5, 0.40)
            return composite_product(bg, self.negra, W / 2 + 4, 812 - 18 * (1 - e), scale,
                                     PRODUCT_TILT - 10.0, shadow=0.28)
        raise ValueError(k)

    def frame(self, t):
        img = self.base(t).astype(np.float32)
        # textos de cierre
        endsh = SHOTS[-1]
        if t >= endsh["t0"]:
            lt = t - endsh["t0"]
            for key, delay in (("logo", 0.05), ("price", 0.22), ("cta", 0.36)):
                a = ease_out((lt - delay) / 0.35)
                blend(img, self.end[key], a, dy=18 * (1 - a))
        # títulos / cartelas
        for o, s in zip(self.ovl, self.ovl_sprites):
            if o["t0"] - 0.001 <= t < o["t1"]:
                din = 0.0 if o["t0"] == 0.0 else 0.22
                a_in = 1.0 if din == 0 else ease_out((t - o["t0"]) / din)
                a_out = smooth((o["t1"] - t) / 0.18)
                a = min(a_in, a_out)
                blend(img, s, a, dy=14 * (1 - a_in))
        # subtítulos
        for c in self.caps:
            if c["t0"] <= t < c["t1"]:
                a_in = ease_out((t - c["t0"]) / 0.08)
                blend(img, c["sprite"], min(a_in, 1.0))
        return np.clip(img, 0, 1)


# ----------------------------------------------------------------------------
# Audio
# ----------------------------------------------------------------------------
HPF = "highpass=f=95:poles=2,highpass=f=95:poles=2,highpass=f=95:poles=2"   # quita el retumbe (70–85 Hz); la voz está en ~150 Hz
ROOM_TONE_SRC = [(4.40, 4.71), (20.45, 20.70), (6.37, 6.49)]               # silencios verificados (sin voz ni respiración)
TARGET_LUFS, LIMIT_DB = -14.0, -2.0

def _loudness(path_or_raw, raw=False):
    args = (["-f", "f32le", "-ar", str(SR), "-ac", "1"] if raw else []) + ["-i", path_or_raw]
    m = subprocess.run(["ffmpeg", "-hide_banner"] + args + ["-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    summ = m[m.rfind("Summary:"):]
    I = float(summ.split("I:")[1].split("LUFS")[0])
    TP = float(summ.split("Peak:")[1].split("dBFS")[0])
    return I, TP

def build_audio(path_out):
    """Voz: limpieza suave del original, cortes con fundidos de igual potencia, tono de sala
    real en las pausas agregadas y normalización ESTÁTICA (ganancia fija + limitador de picos),
    sin control automático de ganancia que suba el fondo en las pausas."""
    clean = f"{CACHE}/voz_limpia_v2_48k.f32"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC_VIDEO, "-vn", "-ac", "1", "-ar", str(SR),
                    "-af", HPF + ",afftdn=nr=6:nf=-44:tn=1,"
                           "equalizer=f=220:t=q:w=1.0:g=-1.5,equalizer=f=3200:t=q:w=1.2:g=1.5",
                    "-f", "f32le", clean], check=True)
    x = np.fromfile(clean, dtype=np.float32)
    ref_p = f"{CACHE}/voz_ref_v2_48k.f32"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC_VIDEO, "-vn", "-ac", "1", "-ar", str(SR),
                    "-af", HPF, "-f", "f32le", ref_p], check=True)
    ref = np.fromfile(ref_p, dtype=np.float32)
    c = np.correlate(x[5 * SR - 4800:9 * SR + 4800], ref[5 * SR:9 * SR], "valid")
    delay = int(np.argmax(c)) - 4800
    if delay > 0:
        x = np.concatenate([x[delay:], np.zeros(delay, np.float32)])
    print(f"  latencia del filtro compensada: {delay} muestras ({delay / SR * 1000:.1f} ms)")
    total = int(math.ceil(TOTAL * SR))
    out = np.zeros(total, np.float32)
    # tono de sala: silencios reales encadenados con fundidos, en bucle
    xf = int(0.015 * SR)
    parts = [x[int(a * SR):int(b * SR)].copy() for a, b in ROOM_TONE_SRC]
    rt = parts[0]
    for pz in parts[1:]:
        w = np.sin(np.linspace(0, np.pi / 2, xf)).astype(np.float32)
        rt = np.concatenate([rt[:-xf], rt[-xf:] * w[::-1] + pz[:xf] * w, pz[xf:]])
    def room(n):
        res = np.zeros(0, np.float32)
        w = np.sin(np.linspace(0, np.pi / 2, xf)).astype(np.float32)
        while len(res) < n:
            res = rt.copy() if len(res) == 0 else np.concatenate([res[:-xf], res[-xf:] * w[::-1] + rt[:xf] * w, rt[xf:]])
        return res[:n]
    n_sp = int(SEG["F"]["t1"] * SR)
    out[:n_sp] = room(n_sp)
    # nivelación por frase: cada frase se lleva hacia la mediana (máx. ±2,5 dB);
    # el cambio de ganancia ocurre solo en los bordes de recorte (pausas), nunca dentro de una palabra
    seg_I = {}
    for sid, sg in SEG.items():
        y = np.concatenate([x[int(pc["a_in"] * SR):int(pc["a_out"] * SR)] for pc in sg["pieces"]])
        if len(y) < int(0.9 * SR):                      # ebur128 necesita al menos ~0,4 s con señal
            y = np.concatenate([y, np.zeros(int(0.9 * SR) - len(y), np.float32)])
        tmp = f"{CACHE}/seg_{sid}.f32"
        y.astype(np.float32).tofile(tmp)
        seg_I[sid] = _loudness(tmp, raw=True)[0]
    med = float(np.median(list(seg_I.values())))
    seg_gain = {k: float(np.clip(med - v, -2.5, 2.5)) for k, v in seg_I.items()}
    print("  nivel por frase (dB de corrección):", " ".join(f"{k}:{g:+.1f}" for k, g in seg_gain.items()))
    for pc in PIECES:
        a0 = int(round(pc["a_in"] * SR))
        a1 = int(round(min(pc["a_out"], len(x) / SR) * SR))
        piece = x[a0:a1].copy() * (10 ** (seg_gain[pc["seg"]] / 20))
        n = len(piece)
        fi, fo = int(pc["fade_in"] * SR), int(pc["fade_out"] * SR)
        g = np.ones(n, np.float32)
        g[:fi] = np.sin(np.linspace(0, np.pi / 2, fi))
        g[n - fo:] = np.cos(np.linspace(0, np.pi / 2, fo))
        r = np.sqrt(np.clip(1 - g ** 2, 0, 1))          # tono de sala complementario (igual potencia)
        t0 = int(round(pc["t0"] * SR))
        out[t0:t0 + n] = out[t0:t0 + n] * r + piece * g
    e0 = int(SEG["F"]["t1"] * SR)
    nf = int(0.35 * SR)
    out[e0 - nf:e0] *= np.cos(np.linspace(0, np.pi / 2, nf)).astype(np.float32)
    out[e0:] = 0
    raw = f"{CACHE}/voz_montada_v2.f32"
    out.tofile(raw)
    # normalización estática: compresión suave, ganancia fija y limitador de picos
    comp = "acompressor=threshold=-24dB:ratio=2:attack=8:release=120:makeup=1"
    pre = f"{CACHE}/voz_comp_v2.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "pan=stereo|c0=c0|c1=c0," + comp, "-c:a", "pcm_f32le", pre], check=True)
    I0, _ = _loudness(pre)
    gain = TARGET_LUFS - I0
    lim = 10 ** (LIMIT_DB / 20)
    for _ in range(3):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre,
                        # atrim/apad compensan la anticipación del limitador (attack = 4 ms)
                        "-af", f"volume={gain:.2f}dB,alimiter=limit={lim:.4f}:attack=4:release=60:level=false,"
                               f"atrim=start_sample={int(0.004 * SR)},apad=pad_len={int(0.004 * SR)},aresample={SR}",
                        "-c:a", "pcm_s16le", path_out], check=True)
        I, TP = _loudness(path_out)
        if abs(I - TARGET_LUFS) < 0.2:
            break
        gain += TARGET_LUFS - I
    print(f"  audio: {I:.1f} LUFS, pico real {TP:.1f} dBTP, ganancia fija {gain:+.1f} dB")
    return path_out


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def render(args):
    os.makedirs(OUT_DIR, exist_ok=True)
    r = Renderer()
    if args.stills:
        os.makedirs(f"{WORK}/stills_v2", exist_ok=True)
        for ts in args.stills.split(","):
            t = float(ts)
            img = (r.frame(t) * 255).round().astype(np.uint8)
            p = f"{WORK}/stills_v2/v2_{t:06.2f}.png"
            Image.fromarray(img).save(p)
            print("still", p)
        return
    wav = build_audio(f"{CACHE}/voz_final_v2.wav")
    out = f"{OUT_DIR}/{OUT_NAME}"
    if args.audio_only:
        # rehace solo la pista de audio y la vuelve a unir con el video ya exportado
        tmp = out + ".tmp.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-i", wav, "-map", "0:v", "-map", "1:a",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
                        "-movflags", "+faststart", "-shortest", tmp], check=True)
        os.replace(tmp, out)
        print("OK (audio)", out)
        return
    nframes = int(round(TOTAL * FPS))
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav,
           "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high", "-level", "4.2",
           "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-color_range", "tv", "-x264-params", "keyint=60:min-keyint=30",
           "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
           "-movflags", "+faststart", "-shortest", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for n in range(nframes):
        t = n / FPS
        img = (r.frame(t) * 255).round().astype(np.uint8)
        p.stdin.write(img.tobytes())
        if n % 60 == 0:
            print(f"  frame {n}/{nframes}", flush=True)
    p.stdin.close()
    p.wait()
    if p.returncode != 0:
        sys.exit("ffmpeg falló")
    print("OK", out, f"{TOTAL:.2f}s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", default="")
    ap.add_argument("--timeline", action="store_true")
    ap.add_argument("--audio-only", action="store_true", help="rehacer solo el audio sobre el MP4 existente")
    a = ap.parse_args()
    if a.timeline:
        for pc in PIECES:
            print(f"{pc['seg']:3s} t {pc['t0']:6.2f}-{pc['t1']:6.2f}  src {pc['a_in']:.2f}-{pc['a_out']:.2f}  off {pc['off']:.3f}")
        for sh in SHOTS:
            print(f"shot {sh['kind']:13s} {sh['t0']:6.2f}-{sh['t1']:6.2f}")
        print("TOTAL", round(TOTAL, 2))
        sys.exit()
    render(a)
