import sys, wave, json, numpy as np, torch
from faster_whisper import WhisperModel
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
wav=sys.argv[1]; cands=json.loads(sys.argv[2])
wf=wave.open(wav); x=np.frombuffer(wf.readframes(wf.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
sr=16000
def piece(a,b,fade=0.012):
    s=x[int(a*sr):int(b*sr)].copy(); n=int(fade*sr)
    s[:n]*=np.linspace(0,1,n); s[-n:]*=np.linspace(1,0,n); return s
wm=WhisperModel("large-v3",device="cpu",compute_type="int8",cpu_threads=4)
name="jonatasgrosman/wav2vec2-large-xlsr-53-spanish"
proc=Wav2Vec2Processor.from_pretrained(name); cm=Wav2Vec2ForCTC.from_pretrained(name).eval()
for c in cands:
    parts=[]
    for a,b in c['parts']:
        parts.append(piece(a,b)); parts.append(np.zeros(int(c.get('gap',0.12)*sr),dtype=np.float32))
    y=np.concatenate([np.zeros(int(0.3*sr),dtype=np.float32)]+parts)
    segs,_=wm.transcribe(y,language="es",beam_size=5,condition_on_previous_text=False)
    wt=' '.join(s.text.strip() for s in segs)
    with torch.no_grad(): lg=cm(proc(y,sampling_rate=sr,return_tensors="pt").input_values).logits
    ct=proc.batch_decode(lg.argmax(-1))[0]
    print(f"{c['name']}: WHISPER='{wt}' | CTC='{ct}'",flush=True)
