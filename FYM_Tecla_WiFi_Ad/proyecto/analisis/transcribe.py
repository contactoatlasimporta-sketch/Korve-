import sys, json
from faster_whisper import WhisperModel
model_name, wav, out = sys.argv[1], sys.argv[2], sys.argv[3]
import wave, numpy as np
wf=wave.open(wav); audio=np.frombuffer(wf.readframes(wf.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
m = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
segs, info = m.transcribe(audio, language="es", word_timestamps=True, beam_size=5, vad_filter=False,
    initial_prompt="Teclas de luz inteligentes Wi-Fi. Interruptor táctil. Ramos Mejía.")
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"w": w.word, "s": round(w.start,3), "e": round(w.end,3), "p": round(w.probability,3)} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
