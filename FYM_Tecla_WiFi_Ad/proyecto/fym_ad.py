#!/usr/bin/env python3
"""
FYM — Tecla Wi-Fi 2 botones · Anuncio vertical V1 (Reels / TikTok)

Proyecto editable. Todo el montaje está definido en las tablas de la sección
"EDICIÓN" (segmentos de audio, planos, textos y subtítulos). Para ajustar el
video, cambiá esos valores y volvé a ejecutar:

    python3 fym_ad.py                 # render completo -> 04_export/FYM_Tecla_WiFi_Ad_V1.mp4
    python3 fym_ad.py --stills 1,6,17 # PNG de control en 02_trabajo/stills/
    python3 fym_ad.py --framing full  # alternativa de encuadre (ver FRAMING)

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
OUT_NAME = "FYM_Tecla_WiFi_Ad_V1.mp4"
CACHE = os.environ.get("FYM_CACHE", f"{WORK}/cache")

W, H, FPS = 1080, 1920, 30
SR = 48000

# ----------------------------------------------------------------------------
# EDICIÓN
# ----------------------------------------------------------------------------
# Segmentos de voz en orden de montaje. a_in / a_out = recorte del audio
# original (cortes en pausas verificadas). gap = silencio (tono de sala) antes.
SEGMENTS = [
    dict(id="A",  a_in=0.28,  a_out=2.28,  gap=0.00),  # "Este productito nuevo que nos ingresó"
    dict(id="B",  a_in=4.00,  a_out=6.32,  gap=0.00),  # "Son teclas de luz"
    dict(id="C",  a_in=10.45, a_out=13.80, gap=0.12),  # "Y se instalan como si fuera un enchufe normal y corriente"
    dict(id="D",  a_in=19.15, a_out=25.00, gap=0.15),  # "Súper sencillo la instalación de esto. Y la instalación ... de prender y apagar"
    dict(id="iA", a_in=27.30, a_out=29.02, gap=0.10),  # "Está para iPhone y Android"
    dict(id="E1", a_in=29.30, a_out=30.04, gap=0.12),  # "Lo mejor de todo"
    dict(id="E2", a_in=31.45, a_out=33.46, gap=0.22),  # "vamos a vender a 17.500 pesos"
    dict(id="F",  a_in=43.66, a_out=45.37, gap=0.10),  # "Y lo tengo en color negro también"
]
END_CARD_DUR = 2.70

# Encuadre del vendedor. El original tiene subtítulos incrustados en
# y≈912–1010 (de 1024). "crop": se recorta el cuadro por encima (y<904) y se
# escala a 1080×1920 (acercamiento ≈13 %), así los subtítulos viejos quedan
# fuera. "full": cuadro completo + franja oscura inferior que los tapa.
FRAMING = "crop"
CROP_H = 903.0               # alto útil del original (px) en modo crop

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
    "F":  [("Y lo tengo", 0, 2), ("en color negro", 3, 5), ("también", 6, 6)],
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
CAP_Y = {"crop": 1440, "full": 1330}   # centro vertical de los subtítulos según encuadre


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
    """Calcula inicio en la línea de tiempo y offset (src = t + off) por segmento."""
    t = 0.0
    out = {}
    for s in SEGMENTS:
        t += s["gap"]
        d = dict(s)
        d["t0"] = t
        d["t1"] = t + (s["a_out"] - s["a_in"])
        d["off"] = s["a_in"] - t
        out[s["id"]] = d
        t = d["t1"]
    return out, t

SEG, SPEECH_END = build_timeline()
def T(seg_id, src):
    """Tiempo de línea de tiempo que corresponde a un tiempo src dentro de un segmento."""
    return src - SEG[seg_id]["off"]

TOTAL = T("F", 45.37) + END_CARD_DUR

# Planos (capa base). kind: seller | photo_living | photo_negra | endcard
SHOTS = [
    dict(t0=0.0,               t1=T("A", 2.28),   kind="seller", seg="A"),
    dict(t0=T("A", 2.28),      t1=SEG["C"]["t0"], kind="living_wide"),
    dict(t0=SEG["C"]["t0"],    t1=SEG["D"]["t0"], kind="negra_full"),
    dict(t0=SEG["D"]["t0"],    t1=T("D", 22.20),  kind="living_close"),
    dict(t0=T("D", 22.20),     t1=T("D", 24.97),  kind="seller", seg="D"),
    dict(t0=T("D", 24.97),     t1=T("iA", 28.75), kind="seller", seg="iA", flip=True),  # el original es selfie espejado: se corrige para que el manual se lea
    dict(t0=T("iA", 28.75),    t1=T("E2", 31.45), kind="living_mid"),
    dict(t0=T("E2", 31.45),    t1=T("F", 43.66),  kind="seller", seg="E2"),
    dict(t0=T("F", 43.66),     t1=T("F", 45.37),  kind="seller", seg="F", cap_x=700),
    dict(t0=T("F", 45.37),     t1=TOTAL,          kind="endcard"),
]

# Textos gráficos (zona superior). (inicio, fin, tipo, contenido)
def overlays():
    e2 = SEG["E2"]
    return [
        dict(t0=0.0,  t1=2.55, kind="hook", lines=["Controlá tus luces", "desde el celular"]),
        dict(t0=2.70, t1=SEG["C"]["t0"] - 0.05, kind="label", text="Tecla táctil Wi-Fi"),
        dict(t0=SEG["C"]["t0"] + 0.15, t1=SEG["D"]["t0"] - 0.05, kind="label", text="2 botones · Color negro"),
        dict(t0=T("D", 22.20) + 0.10, t1=T("D", 24.97) - 0.05, kind="label", text="Prendé y apagá desde el celular"),
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
    pad = 30
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
    pad = 40
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
    pad = 34
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
    pad = 40
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
        sh = np.roll(sh, (34, 18), axis=(0, 1))
        out *= (1 - 0.30 * sh[..., None] * np.array([1.0, 1.0, 1.0], np.float32))
    out = out * (1 - warped[..., 3:4]) + warped[..., :3]
    return out


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

def seller_view(frame_u8, framing, zoom=1.0, cx_off=0.0):
    f = frame_u8.astype(np.float32) / 255.0
    if framing == "crop":
        ch = CROP_H / zoom
        cw = ch * W / H
        cx = 288.0 + cx_off
        cy = CROP_H / 2
        scale = H / ch
        out = affine_view(f, cx, cy, scale)
    else:
        scale = H / 1024.0 * zoom
        out = affine_view(f, 288.0 + cx_off, 512.0, scale)
    # nitidez suave tras el escalado
    blur = cv2.GaussianBlur(out, (0, 0), 1.4)
    out = np.clip(out + 0.35 * (out - blur), 0, 1)
    return warm_grade(out, 1.0)

SCRIM = None
def bottom_scrim():
    global SCRIM
    if SCRIM is None:
        y = np.arange(H, dtype=np.float32)
        a = np.clip((y - 1480) / (1676 - 1480), 0, 1)
        a = smooth_arr(a)
        SCRIM = a[:, None, None]
    return SCRIM

def smooth_arr(a):
    return a * a * (3 - 2 * a)


# ----------------------------------------------------------------------------
# Render de un fotograma
# ----------------------------------------------------------------------------
class Renderer:
    def __init__(self, framing=FRAMING):
        self.framing = framing
        self.src = Source()
        self.living = warm_grade(load_rgb(FOTO_LIVING), 0.6)
        self.negra = cutout_negra()
        self.backdrop = warm_backdrop()
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
                s = ws[i0]["s"] - 0.07 - seg["off"]
                if gi + 1 < len(groups):
                    nxt = ws[groups[gi + 1][1]]["s"] - 0.07 - seg["off"]
                    e = nxt if nxt - (ws[i1]["e"] - seg["off"]) < 0.6 else ws[i1]["e"] + 0.25 - seg["off"]
                else:
                    e = ws[i1]["e"] + 0.30 - seg["off"]
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
                if sh["t0"] <= mid < sh["t1"] and "cap_x" in sh:
                    cx = sh["cap_x"]
            c["sprite"] = make_caption(c["text"], cx, CAP_Y[self.framing])
        return caps

    # ---- cierre ----
    def build_endcard_static(self):
        el = {}
        f_brand = font("InterDisplay-Black.otf", 190)
        img = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        txt = "FYM"
        # letter-spacing manual
        sp = 18
        widths = [text_width(d, ch, f_brand) for ch in txt]
        tot = sum(widths) + sp * (len(txt) - 1)
        x = (W - tot) / 2
        bb = d.textbbox((0, 0), "F", font=f_brand)
        for ch, wd in zip(txt, widths):
            d.text((x, 40 - bb[1]), ch, font=f_brand, fill=C_INK)
            x += wd + sp
        el["brand"] = Sprite(img, 0, 214)
        f_tag = font("Inter-SemiBold.otf", 42)
        img = Image.new("RGBA", (W, 80), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        t = "Teclas de luz inteligentes"
        d.text(((W - text_width(d, t, f_tag)) / 2, 8), t, font=f_tag, fill=C_MUTED)
        el["tag"] = Sprite(img, 0, 452)
        f_price = font("InterDisplay-Black.otf", 118)
        f_sub = font("Inter-Bold.otf", 42)
        img = Image.new("RGBA", (W, 230), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        p = "$17.500"
        pb = d.textbbox((0, 0), p, font=f_price)
        d.text(((W - (pb[2] - pb[0])) / 2 - pb[0], 10 - pb[1]), p, font=f_price, fill=C_INK)
        s = "Modelo Wi-Fi de 2 botones"
        d.text(((W - text_width(d, s, f_sub)) / 2, 10 + (pb[3] - pb[1]) + 26), s, font=f_sub, fill=C_ACCENT_DARK)
        el["price"] = Sprite(img, 0, 1118)
        # CTA
        f_cta = font("Inter-ExtraBold.otf", 54)
        cta = "Escribinos para comprar"
        tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
        tw = text_width(tmp, cta, f_cta)
        bw, bh, pad = tw + 2 * 58, 118, 40
        img = Image.new("RGBA", (bw + 2 * pad, bh + 2 * pad), (0, 0, 0, 0))
        img.alpha_composite(shadow_layer(img.size, (pad, pad, pad + bw, pad + bh), 59, 18, 0.30, (0, 12)))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((pad, pad, pad + bw, pad + bh), 59, fill=C_INK + (255,))
        asc, desc = f_cta.getmetrics()
        d.text((pad + 58, pad + (bh - (asc + desc)) / 2 + 1), cta, font=f_cta, fill=(255, 255, 255))
        el["cta"] = Sprite(img, (W - img.width) / 2, 1338 - pad)
        return el

    # ---- capa base ----
    def base(self, t):
        for sh in SHOTS:
            if sh["t0"] - 1e-6 <= t < sh["t1"] - 1e-6 or (sh is SHOTS[-1] and t >= sh["t0"]):
                break
        k = sh["kind"]
        u = (t - sh["t0"]) / max(sh["t1"] - sh["t0"], 1e-6)
        if k == "seller":
            seg = SEG[sh["seg"]]
            fr = self.src.get(t + seg["off"])
            if sh.get("flip"):
                fr = fr[:, ::-1]
            img = seller_view(fr, self.framing, sh.get("zoom", 1.0), sh.get("cx_off", 0.0))
            if self.framing == "full":
                img = img * (1 - bottom_scrim()) + np.array(C_INK, np.float32) / 255 * bottom_scrim()
            return img
        if k == "living_wide":
            # paneo lento: de la tecla centrada a revelar el living a la derecha
            e = smooth(u)
            scale = H / 1288.0 * (1.0 + 0.02 * e)
            cx = 640.0 + (842.0 - 640.0) * e
            return affine_view(self.living, cx, 644.0, scale)
        if k == "living_close":
            e = smooth(u)
            scale = H / 1288.0 * (1.36 + 0.08 * e)
            return affine_view(self.living, 657.0, 760.0 - 12 * e, scale)
        if k == "negra_full":
            # frente y acabado: producto completo sobre fondo cálido, acercamiento lento
            e = smooth(u)
            scale = 0.80 + 0.06 * e
            return composite_cutout(self.backdrop, self.negra, W / 2 + 10, 1000 - 10 * e, scale)
        if k == "living_mid":
            e = smooth(u)
            scale = H / 1288.0 * (1.00 + 0.035 * e)
            return affine_view(self.living, 850.0 - 8 * e, 644.0, scale)
        if k == "endcard":
            e = ease_out(min(u * (sh["t1"] - sh["t0"]) / 0.6, 1))
            scale = 0.355 + 0.02 * smooth(u)
            return composite_cutout(self.backdrop, self.negra, W / 2 + 4, 812 - 16 * (1 - e), scale)
        raise ValueError(k)

    def frame(self, t):
        img = self.base(t).astype(np.float32)
        # textos de cierre
        endsh = SHOTS[-1]
        if t >= endsh["t0"]:
            lt = t - endsh["t0"]
            for key, delay in (("brand", 0.05), ("tag", 0.15), ("price", 0.25), ("cta", 0.38)):
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
def build_audio(path_out):
    """Arma la pista de voz: limpieza suave del original, cortes con fundidos cortos,
    tono de sala en las pausas agregadas y normalización de sonoridad."""
    clean = f"{CACHE}/voz_limpia_48k.f32"
    # 1) limpieza suave del original completo (antes de cortar, para no generar transitorios)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC_VIDEO, "-vn", "-ac", "1", "-ar", str(SR),
                    "-af", "highpass=f=75:poles=2,highpass=f=75:poles=2,afftdn=nr=6:nf=-44:tn=1,"
                           "equalizer=f=220:t=q:w=1.0:g=-1.5,equalizer=f=3200:t=q:w=1.2:g=1.5",
                    "-f", "f32le", clean], check=True)
    x = np.fromfile(clean, dtype=np.float32)
    # el reductor de ruido (afftdn) agrega latencia fija: se mide contra el original y se compensa
    ref_p = f"{CACHE}/voz_ref_48k.f32"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC_VIDEO, "-vn", "-ac", "1", "-ar", str(SR),
                    "-af", "highpass=f=75:poles=2,highpass=f=75:poles=2", "-f", "f32le", ref_p], check=True)
    ref = np.fromfile(ref_p, dtype=np.float32)
    seg_ref = ref[5 * SR:9 * SR]
    c = np.correlate(x[5 * SR - 4800:9 * SR + 4800], seg_ref, "valid")
    delay = int(np.argmax(c)) - 4800
    if delay > 0:
        x = np.concatenate([x[delay:], np.zeros(delay, np.float32)])
    print(f"  latencia del filtro compensada: {delay} muestras ({delay / SR * 1000:.1f} ms)")
    total = int(math.ceil(TOTAL * SR))
    out = np.zeros(total, np.float32)
    # tono de sala: tramo sin voz del original, en bucle
    rt = x[int(10.12 * SR):int(10.48 * SR)].copy()
    def room(n):
        if n <= 0: return np.zeros(0, np.float32)
        reps = int(math.ceil(n / len(rt))) + 1
        r = np.tile(rt, reps)[:n].copy()
        return r
    fade = int(0.012 * SR)
    ramp = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fade))).astype(np.float32)
    # base de tono de sala en todo lo hablado (para que las pausas no caigan a cero)
    out[:int(SEG["F"]["t1"] * SR)] = room(int(SEG["F"]["t1"] * SR)) * 1.0
    for s in SEGMENTS:
        sg = SEG[s["id"]]
        a0, a1 = int(round(s["a_in"] * SR)), int(round(min(s["a_out"], len(x) / SR) * SR))
        piece = x[a0:a1].copy()
        piece[:fade] *= ramp
        piece[-fade:] *= ramp[::-1]
        t0 = int(round(sg["t0"] * SR))
        n = len(piece)
        # el tono de sala se atenúa debajo de la voz
        env = np.ones(n, np.float32); env[:fade] = 1 - ramp; env[-fade:] = ramp[::-1]
        env[fade:-fade] = 0
        out[t0:t0 + n] = out[t0:t0 + n] * env + piece
    # desvanecer el tono de sala al entrar al cierre
    e0 = int(SEG["F"]["t1"] * SR)
    out[e0 - int(0.05 * SR):e0] *= np.linspace(1, 0, int(0.05 * SR)).astype(np.float32)
    raw = f"{CACHE}/voz_montada.f32"
    out.tofile(raw)
    # 2) normalización de sonoridad en dos pasadas (−14 LUFS, pico real −1.5 dBTP)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-af", "pan=stereo|c0=c0|c1=c0,acompressor=threshold=-24dB:ratio=2:attack=8:release=120:makeup=1,"
                               "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    js = m.stderr[m.stderr.rfind("{"):m.stderr.rfind("}") + 1]
    st = json.loads(js)
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={st['input_i']}:measured_TP={st['input_tp']}:"
          f"measured_LRA={st['input_lra']}:measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "pan=stereo|c0=c0|c1=c0,acompressor=threshold=-24dB:ratio=2:attack=8:release=120:makeup=1," + ln +
                           f",aresample={SR}",
                    "-c:a", "pcm_s16le", path_out], check=True)
    return path_out


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def render(args):
    os.makedirs(OUT_DIR, exist_ok=True)
    r = Renderer(args.framing)
    if args.stills:
        os.makedirs(f"{WORK}/stills", exist_ok=True)
        for ts in args.stills.split(","):
            t = float(ts)
            img = (r.frame(t) * 255).round().astype(np.uint8)
            p = f"{WORK}/stills/{args.framing}_{t:06.2f}.png"
            Image.fromarray(img).save(p)
            print("still", p)
        return
    wav = build_audio(f"{WORK}/voz_final.wav")
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
    ap.add_argument("--framing", default=FRAMING, choices=["crop", "full"])
    ap.add_argument("--timeline", action="store_true")
    ap.add_argument("--audio-only", action="store_true", help="rehacer solo el audio sobre el MP4 existente")
    a = ap.parse_args()
    if a.timeline:
        for k, v in SEG.items():
            print(f"{k:3s} t {v['t0']:6.2f}-{v['t1']:6.2f}  src {v['a_in']:.2f}-{v['a_out']:.2f}  off {v['off']:.3f}")
        for sh in SHOTS:
            print(f"shot {sh['kind']:13s} {sh['t0']:6.2f}-{sh['t1']:6.2f}")
        print("TOTAL", round(TOTAL, 2))
        sys.exit()
    render(a)
