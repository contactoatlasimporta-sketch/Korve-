import sys, wave, numpy as np, torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
wav=sys.argv[1]; out=sys.argv[2]
wf=wave.open(wav); x=np.frombuffer(wf.readframes(wf.getnframes()),dtype=np.int16).astype(np.float32)/32768.0
name="jonatasgrosman/wav2vec2-large-xlsr-53-spanish"
proc=Wav2Vec2Processor.from_pretrained(name); model=Wav2Vec2ForCTC.from_pretrained(name).eval()
torch.set_num_threads(4)
# chunk with overlap
sr=16000; chunk=12*sr; ov=2*sr
allp=[]; 
pos=0; logps=None
starts=[]
res_frames=[]
step=chunk-ov
emis=[]
i=0
while i < len(x):
    seg=x[i:i+chunk]
    inp=proc(seg, sampling_rate=sr, return_tensors="pt")
    with torch.no_grad(): lg=model(inp.input_values).logits[0]
    lp=torch.log_softmax(lg,-1).numpy()
    fps=lp.shape[0]/(len(seg)/sr)
    emis.append((i/sr, lp, fps))
    if i+chunk>=len(x): break
    i+=step
# stitch: for each chunk keep frames from (start+1s if not first) to (end-1s if not last)
frames=[]
for k,(t0,lp,fps) in enumerate(emis):
    n=lp.shape[0]
    a = 0 if k==0 else int(1.0*fps)
    b = n if k==len(emis)-1 else n-int(1.0*fps)
    for j in range(a,b): frames.append((t0+j/fps, lp[j]))
T=np.array([f[0] for f in frames]); LP=np.stack([f[1] for f in frames])
np.savez(out, T=T, LP=LP)
vocab=proc.tokenizer.get_vocab(); inv={v:k for k,v in vocab.items()}
ids=LP.argmax(-1)
blank=proc.tokenizer.pad_token_id
# greedy with times
words=[]; cur=''; ws=None; prev=-1; last=None
for t,i in zip(T,ids):
    if i!=prev and i!=blank:
        ch=inv[i]
        if ch=='|':
            if cur: words.append((cur,ws,last)); cur=''
        else:
            if not cur: ws=t
            cur+=ch; last=t+0.02
    prev=i
if cur: words.append((cur,ws,last))
print(' '.join(f"{w}[{a:.2f}-{b:.2f}]" for w,a,b in words))
print('vocab', ''.join(sorted(k for k in vocab if len(k)==1)))
