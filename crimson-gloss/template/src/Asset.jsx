// Elementos generados por código: un JSON declarativo (capas SVG + parámetros + animaciones + estados) que Claude escribe
// para cualquier cosa que pida el guion. No se ejecuta código: solo se pinta SVG saneado y se aplican transformaciones.
import { createContext, useContext } from 'react';

export const Assets = createContext({});          // { nombre: spec } embebido en plan.assets
export const useAssets = () => useContext(Assets);

const hexMix = (a, b, k) => {
  const p = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

// {{color}}, {{color:dark}}, {{color:light}}, {{c2:dark}}…
const fill = (svg, P) => svg.replace(/\{\{(\w+)(?::(dark|darker|light|lighter))?\}\}/g, (_, k, m) => {
  const c = isHex(P[k]) ? P[k] : '#888888';
  return m === 'dark' ? hexMix(c, '#000000', 0.25) : m === 'darker' ? hexMix(c, '#000000', 0.45) : m === 'light' ? hexMix(c, '#ffffff', 0.35) : m === 'lighter' ? hexMix(c, '#ffffff', 0.6) : c;
});
// defensa en profundidad: aunque assets.py ya valida, aquí no se pinta nada peligroso
const clean = (svg) => svg.replace(/<\s*(script|foreignObject|iframe|object|embed|image|use)[\s\S]*?(<\/\s*\1\s*>|\/>)/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '').replace(/(href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, '').replace(/javascript:/gi, '');

const animTf = (anims = [], t, idx, cx, cy) => anims.map((a) => {
  const ph = (a.phase ?? 0) + idx * 0.7, w = (a.speed ?? 1) * Math.PI * 2, [ox, oy] = (a.origin || `${cx} ${cy}`).split(/\s+/).map(Number), s = Math.sin(t * w + ph);
  switch (a.type) {
    case 'bob': return `translate(0 ${(a.amp ?? 6) * s})`;
    case 'slide': return `translate(${(a.amp ?? 6) * s} 0)`;
    case 'sway': return `rotate(${(a.amp ?? 6) * s} ${ox} ${oy})`;
    case 'spin': return `rotate(${t * (a.speed ?? 0.5) * 360} ${ox} ${oy})`;
    case 'pulse': return `translate(${ox} ${oy}) scale(${1 + (a.amp ?? 0.06) * s}) translate(${-ox} ${-oy})`;
    case 'blink': { const p = (t * (a.speed ?? 0.4) + (a.phase ?? 0)) % 1; return `translate(${ox} ${oy}) scale(1 ${p > 0.94 ? 0.1 : 1}) translate(${-ox} ${-oy})`; }
    case 'flap': return `translate(${ox} ${oy}) scale(1 ${1 - Math.abs(s) * (a.amp ?? 0.5)}) translate(${-ox} ${-oy})`;
    default: return '';
  }
}).join(' ');

export const specRatio = (spec) => {
  if (!spec) return 1;
  if (spec.ratio) return spec.ratio;
  const v = (spec.viewBox || '0 0 200 200').split(/\s+/).map(Number);
  return v[3] / v[2];
};

export const GenAsset = ({ spec, params = {}, state, t = 0, size = 240 }) => {
  if (!spec) return <div style={{ width: size, height: size, borderRadius: size / 6, background: '#ff4d5e55', border: '4px dashed #ff4d5e' }} />;
  const P = { ...(spec.params || {}), ...params }, st = (state && spec.states?.[state]) || {};
  const vb = (spec.viewBox || '0 0 200 200').split(/\s+/).map(Number), cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
  return (
    <svg width={size} height={size * specRatio(spec)} viewBox={spec.viewBox || '0 0 200 200'} style={{ overflow: 'visible' }}>
      {(spec.layers || []).map((L, i) => {
        const o = st[L.id] || {};
        if (o.hidden) return null;
        return <g key={i} transform={`${o.transform || ''} ${animTf(L.anim, t, i, cx, cy)}`} opacity={o.opacity ?? L.opacity ?? 1} dangerouslySetInnerHTML={{ __html: clean(fill(L.svg || '', P)) }} />;
      })}
    </svg>
  );
};
