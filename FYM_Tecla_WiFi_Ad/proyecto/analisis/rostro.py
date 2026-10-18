"""Mide ojos / boca / mentón del vendedor en cada cuadro de los planos usados (YuNet, OpenCV).
Uso: python3 rostro.py <video_original> <face_detection_yunet_2023mar.onnx> <salida.json>
Modelo: https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet (licencia MIT)."""
import sys, json, subprocess
import numpy as np, cv2
video, model, out = sys.argv[1:4]
W, H = 576, 1024
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                     capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
det = cv2.FaceDetectorYN.create(model, "", (W, H), 0.6, 0.3, 5000)
shots = {"A": (0.28, 2.28), "D2": (22.20, 24.97), "E2": (31.45, 33.56), "F": (43.66, 45.37)}
res = {}
for k, (a, b) in shots.items():
    per = []
    for i in range(int(round(a * 30)), int(round(b * 30))):
        _, faces = det.detect(frames[i].copy())
        fc = max(faces, key=lambda r: r[2] * r[3])
        x, y, w, h = fc[:4]
        per.append([i, float(min(fc[5], fc[7])), float(max(fc[11], fc[13])), float(y + h), float(x), float(x + w)])
    res[k] = per   # [cuadro, ojos_y, boca_y, menton_y, x_izq, x_der]
json.dump(res, open(out, "w"))
