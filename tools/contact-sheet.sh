#!/bin/bash
# usage: scripts_contact.sh name frame1 frame2 ...  → out/<name>.png contact sheet (renders stills)
set -e
cd "$(dirname "$0")/.."
export REMOTION_BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
name=$1; shift
mkdir -p out/stills
npx remotion bundle --out-dir=out/bundle >/dev/null 2>&1 || true
for fr in "$@"; do
  npx remotion still out/bundle KorveArmPro out/stills/f$fr.png --frame=$fr --log=error &
  while [ $(jobs -r | wc -l) -ge 4 ]; do sleep 0.5; done
done
wait
python3 - "$name" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
name=sys.argv[1]; frames=sys.argv[2:]
cols=2 if len(frames)<=4 else 3
rows=(len(frames)+cols-1)//cols
W,H=960,540
c=Image.new('RGB',(W*cols,H*rows),(30,30,30))
for i,f in enumerate(frames):
    im=Image.open(f'out/stills/f{f}.png').convert('RGB').resize((W,H))
    d=ImageDraw.Draw(im); d.text((10,10),f'f{f}',fill=(255,80,80))
    c.paste(im,((i%cols)*W,(i//cols)*H))
c.save(f'out/{name}.png')
PY
