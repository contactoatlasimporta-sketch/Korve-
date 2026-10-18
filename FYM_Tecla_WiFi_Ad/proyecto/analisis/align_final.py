import sys, json
sys.path.insert(0, sys.argv[1])
import align as AL
segs=json.load(open(sys.argv[2]))
out={}
for k,(a,b,text) in segs.items():
    sc,sp=AL.align(a,b,text)
    out[k]={"src_in":a,"src_out":b,"text":text,"score":round(float(sc),1),"words":[{"w":w,"s":s,"e":e} for w,s,e in sp]}
    print(k, round(float(sc),1), ' '.join(f"{w}[{s:.2f}-{e:.2f}]" for w,s,e in sp))
json.dump(out, open(sys.argv[3],'w'), ensure_ascii=False, indent=1)
