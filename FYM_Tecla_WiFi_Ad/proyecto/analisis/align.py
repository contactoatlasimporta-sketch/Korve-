import sys, json, numpy as np
from transformers import Wav2Vec2Processor
d=np.load(sys.argv[1] if __name__=="__main__" else "ctc_emis.npz"); T=d['T']; LP=d['LP']
proc=Wav2Vec2Processor.from_pretrained("jonatasgrosman/wav2vec2-large-xlsr-53-spanish")
vocab=proc.tokenizer.get_vocab(); blank=proc.tokenizer.pad_token_id; sep=vocab['|']
def tok(text):
    words=text.lower().split()
    ids=[]; wmap=[]
    for wi,w in enumerate(words):
        if wi>0: ids.append(sep); wmap.append(-1)
        for ch in w:
            if ch in vocab: ids.append(vocab[ch]); wmap.append(wi)
    return words, ids, wmap
def align(a,b,text):
    m=(T>=a)&(T<b); t=T[m]; lp=LP[m]
    words,ids,wmap=tok(text)
    L=len(ids); S=2*L+1
    states=[blank if s%2==0 else ids[s//2] for s in range(S)]
    NEG=-1e18
    dp=np.full((len(t),S),NEG); bp=np.zeros((len(t),S),dtype=np.int32)
    dp[0,0]=lp[0,blank]; dp[0,1]=lp[0,states[1]]
    for i in range(1,len(t)):
        for s in range(S):
            best=dp[i-1,s]; arg=s
            if s>0 and dp[i-1,s-1]>best: best=dp[i-1,s-1]; arg=s-1
            if s>1 and states[s]!=blank and states[s]!=states[s-2] and dp[i-1,s-2]>best: best=dp[i-1,s-2]; arg=s-2
            dp[i,s]=best+lp[i,states[s]]; bp[i,s]=arg
    end = S-1 if dp[-1,S-1]>dp[-1,S-2] else S-2
    score=dp[-1,end]
    path=[end]
    for i in range(len(t)-1,0,-1): path.append(bp[i,path[-1]])
    path=path[::-1]
    # word spans
    spans={}
    for i,s in enumerate(path):
        if s%2==1:
            wi=wmap[s//2]
            if wi>=0:
                spans.setdefault(wi,[t[i],t[i]+0.02])
                spans[wi][1]=t[i]+0.02
    return score, [(words[k],round(float(spans[k][0]),2),round(float(spans[k][1]),2)) for k in sorted(spans)]
if __name__=='__main__':
    jobs=json.load(open(sys.argv[2]))
    for j in jobs:
        sc,sp=align(j['a'],j['b'],j['text'])
        print(f"[{j['a']}-{j['b']}] score={sc:.1f} :: {j['text']}")
        print('   ',' '.join(f"{w}[{s:.2f}-{e:.2f}]" for w,s,e in sp))
