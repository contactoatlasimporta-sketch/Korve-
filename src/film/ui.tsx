import React from 'react';
import {FONT_DISPLAY, FONT_MONO, FONT_SANS} from '../fonts';
import {clamp01, E} from '../director/math';

export const C = {
  bg: '#060708',
  ink: '#EDEFF1',
  dim: '#8A9097',
  faint: 'rgba(237,239,241,0.32)',
  line: 'rgba(237,239,241,0.22)',
  lime: '#B8FF2C',
};

/** masked vertical reveal (text rises out of a hairline) */
export const Mask: React.FC<{p: number; out?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  out = 0,
  children,
  style,
}) => {
  const i = E.settle(clamp01(p));
  const o = E.inOut(clamp01(out));
  return (
    <div style={{overflow: 'hidden', ...style}}>
      <div style={{transform: `translateY(${(1 - i) * 105 - o * 105}%)`, opacity: Math.min(1, i * 1.4) * (1 - o)}}>{children}</div>
    </div>
  );
};

export const mono = (size = 14, color = C.dim, ls = 0.2): React.CSSProperties => ({
  fontFamily: FONT_MONO,
  fontSize: size,
  letterSpacing: `${ls}em`,
  textTransform: 'uppercase',
  color,
  fontWeight: 500,
  whiteSpace: 'nowrap',
});

/** Section title block: lime index, title, optional subtitle */
export const SectionTitle: React.FC<{
  f: number;
  inAt: number;
  outAt: number;
  index: string;
  title: string;
  sub?: string;
  subAt?: number;
  x?: number;
  y?: number;
  size?: number;
  align?: 'left' | 'right';
}> = ({f, inAt, outAt, index, title, sub, subAt, x = 128, y = 812, size = 52, align = 'left'}) => {
  if (f < inAt - 2 || f > outAt + 20) return null;
  const p = (d: number) => (f - inAt - d) / 18;
  const out = (f - outAt) / 14;
  const lineW = 64 * E.settle(clamp01(p(0) * 1.2)) * (1 - E.inOut(clamp01(out)));
  const sp = subAt !== undefined ? (f - subAt) / 18 : p(10);
  return (
    <div style={{position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? x : undefined, top: y, textAlign: align}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, justifyContent: align === 'right' ? 'flex-end' : 'flex-start'}}>
        <div style={{width: lineW, height: 2, background: C.lime}} />
        <Mask p={p(2)} out={out}>
          <span style={mono(14, C.lime, 0.28)}>{index}</span>
        </Mask>
      </div>
      <Mask p={p(5)} out={out} style={{marginTop: 14}}>
        <div style={{fontFamily: FONT_SANS, fontWeight: 600, fontSize: size, letterSpacing: '0.035em', color: C.ink, textTransform: 'uppercase', lineHeight: 1.08, whiteSpace: 'pre'}}>
          {title}
        </div>
      </Mask>
      {sub ? (
        <Mask p={sp} out={out} style={{marginTop: 16}}>
          <span style={mono(16, C.dim, 0.24)}>{sub}</span>
        </Mask>
      ) : null}
    </div>
  );
};

/** leader-line callout anchored to a projected point */
export const Callout: React.FC<{
  f: number;
  inAt: number;
  outAt: number;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  label: string;
  sub?: string;
  accent?: boolean;
}> = ({f, inAt, outAt, ax, ay, dx, dy, label, sub, accent}) => {
  if (f < inAt || f > outAt + 14) return null;
  const p = E.settle(clamp01((f - inAt) / 16));
  const o = 1 - E.inOut(clamp01((f - outAt) / 12));
  const ex = ax + dx;
  const ey = ay + dy;
  const kneeX = ax + dx * 0.25;
  const len = Math.hypot(kneeX - ax, ey - ay) + Math.abs(ex - kneeX);
  const right = dx >= 0;
  return (
    <>
      <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} width={1920} height={1080}>
        <circle cx={ax} cy={ay} r={9 * p} fill="none" stroke={C.lime} strokeOpacity={0.5 * o} strokeWidth={1} />
        <circle cx={ax} cy={ay} r={3.2} fill={C.lime} opacity={o * Math.min(1, p * 3)} />
        <path
          d={`M ${ax} ${ay} L ${kneeX} ${ey} L ${ex} ${ey}`}
          fill="none"
          stroke={accent ? C.lime : 'rgba(237,239,241,0.55)'}
          strokeWidth={1.2}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - p)}
          opacity={o}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: right ? ex + 14 : undefined,
          right: right ? undefined : 1920 - ex + 14,
          top: ey - 11,
          textAlign: right ? 'left' : 'right',
          opacity: o,
        }}
      >
        <Mask p={(f - inAt - 6) / 16}>
          <div style={mono(14, C.ink, 0.16)}>{label}</div>
        </Mask>
        {sub ? (
          <Mask p={(f - inAt - 10) / 16} style={{marginTop: 6}}>
            <div style={mono(12, C.dim, 0.14)}>{sub}</div>
          </Mask>
        ) : null}
      </div>
    </>
  );
};

export const Wordmark: React.FC<{size: number; pro?: boolean; f: number; at: number; gap?: number}> = ({size, f, at, gap = 0.28}) => {
  const letters = 'KORVE'.split('');
  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: size * gap}}>
      <div style={{display: 'flex'}}>
        {letters.map((l, i) => (
          <Mask key={i} p={(f - at - i * 2.2) / 20}>
            <span style={{fontFamily: FONT_DISPLAY, fontStretch: '125%', fontWeight: 800, fontSize: size, color: C.ink, letterSpacing: '0.02em', lineHeight: 1}}>
              {l}
            </span>
          </Mask>
        ))}
      </div>
    </div>
  );
};

export const ArmPro: React.FC<{size: number; f: number; at: number}> = ({size, f, at}) => (
  <Mask p={(f - at) / 20}>
    <span style={{fontFamily: FONT_SANS, fontWeight: 300, fontSize: size, color: C.ink, letterSpacing: '0.32em'}}>
      ARM <span style={{fontWeight: 600, color: C.lime}}>PRO</span>
    </span>
  </Mask>
);
