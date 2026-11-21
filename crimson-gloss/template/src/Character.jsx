// Personaje 2D por capas, animado por código: sincronía labial por visemas, parpadeo, mirada, cejas,
// respiración, cabeceo, gestos de brazos/manos con cinemática (hombro-codo-muñeca) y un set con parallax.
import { AbsoluteFill, random } from 'remotion';
import { useDims } from './Cg';

const R = (s, lo = 0, hi = 1) => lo + random(s) * (hi - lo);
const c01 = (x) => Math.max(0, Math.min(1, x));
const sm = (x) => { x = c01(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };

export const DEF_CHAR = { skin: '#e2ad8d', hair: '#2b1d16', hairStyle: 'short', beard: 'full', glasses: false, glassesColor: '#1b1b22', eyes: '#3a2a20', top: '#111114', outfit: 'hoodie', pants: '#1c1c22', shoes: '#ffffff', tie: '#e10600', chair: '#6b3a26', lips: '#b4586a' };

// --- Sincronía labial --------------------------------------------------------
const VIS = { A: { h: 1, w: 0.95, r: 0, t: 1 }, E: { h: 0.55, w: 1.05, r: 0, t: 1 }, I: { h: 0.3, w: 1.2, r: 0, t: 1 }, O: { h: 0.8, w: 0.6, r: 1, t: 0 }, U: { h: 0.45, w: 0.45, r: 1, t: 0 }, M: { h: 0, w: 0.75, r: 0, t: 0 }, F: { h: 0.14, w: 0.9, r: 0, t: 1, f: 1 }, C: { h: 0.3, w: 0.8, r: 0, t: 0.4 }, X: { h: 0.04, w: 0.85, r: 0, t: 0 } };
const WEIGHT = { A: 2.4, E: 2.2, I: 2, O: 2.3, U: 2.1, M: 0.8, F: 0.8, C: 0.7 };
const letterVis = (c) => ('aáà'.includes(c) ? 'A' : 'eéè'.includes(c) ? 'E' : 'iíìy'.includes(c) ? 'I' : 'oóò'.includes(c) ? 'O' : 'uúüw'.includes(c) ? 'U' : 'bmp'.includes(c) ? 'M' : 'fv'.includes(c) ? 'F' : 'hq'.includes(c) ? null : /[a-zñ0-9]/.test(c) ? 'C' : null);

let cache = { k: null, v: null };
const buildVisemes = (words) => {
  if (cache.k === words) return cache.v;
  const out = [];
  words.forEach((w, wi) => {
    const seq = [];
    for (const c of w.w.toLowerCase()) { const v = letterVis(c); if (v && seq[seq.length - 1] !== v) seq.push(v); }
    if (!seq.length) return;
    const tot = seq.reduce((a, v) => a + WEIGHT[v], 0), span = Math.max(0.12, w.e - w.s - 0.02);
    let t = w.s;
    seq.forEach((v) => { out.push({ t, v }); t += (WEIGHT[v] / tot) * span; });
    const next = words[wi + 1];
    if (!next || next.s - w.e > 0.08) out.push({ t: w.e, v: 'X' });
  });
  cache = { k: words, v: out };
  return out;
};

const mouthAt = (vs, t) => {
  if (!vs.length || t < vs[0].t) return VIS.X;
  let lo = 0, hi = vs.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (vs[m].t <= t) lo = m; else hi = m - 1; }
  const cur = VIS[vs[lo].v], prev = VIS[(vs[lo - 1] || { v: 'X' }).v];
  const k = sm((t - vs[lo].t) / 0.06);
  return Object.fromEntries(Object.keys(cur).map((p) => [p, lerp(prev[p] ?? 0, cur[p], k)]));
};

// --- Gestos ----------------------------------------------------------------------
const REST = { a1: 8, a2: -60, hand: 'fist' };
export const GESTURES = {
  open: { R: { a1: 38, a2: 128, hand: 'open' }, L: { a1: 38, a2: 128, hand: 'open' } },
  point: { R: { a1: 48, a2: 108, hand: 'point' }, L: REST },
  count: { R: { a1: 34, a2: 158, hand: 'count' }, L: REST },
  chop: { R: { a1: 30, a2: 100, hand: 'fist', osc: 14 }, L: REST },
  shrug: { R: { a1: 24, a2: 122, hand: 'open' }, L: { a1: 24, a2: 122, hand: 'open' }, shoulders: 9 },
  wave: { R: { a1: 62, a2: 168, hand: 'open', osc: 20, fast: true }, L: REST },
};

const poseAt = (gestures, t) => {
  let best = null, bw = 0;
  for (const g of gestures) {
    if (t < g.at || t > g.at + g.dur + 0.05) continue;
    const w = sm((t - g.at) / 0.28) * (1 - sm((t - (g.at + g.dur - 0.3)) / 0.3));
    if (w > bw) { bw = w; best = g; }
  }
  const mk = (side) => {
    if (!best || !GESTURES[best.kind]) return { ...REST };
    const tgt = GESTURES[best.kind][side];
    let a2 = lerp(REST.a2, tgt.a2, bw);
    if (tgt.osc) a2 += tgt.osc * bw * Math.sin(2 * Math.PI * (tgt.fast ? 5 : 3) * (t - best.at)) * (tgt.fast ? 1 : Math.exp(-(t - best.at) * 0.9));
    return { a1: lerp(REST.a1, tgt.a1, bw), a2, hand: bw > 0.3 ? tgt.hand : REST.hand, n: best.n ?? 1 };
  };
  return { R: mk('R'), L: mk('L'), shoulders: best && GESTURES[best.kind].shoulders ? GESTURES[best.kind].shoulders * bw : 0 };
};

const fk = (S, l1, l2, a1, a2) => {
  const d = (a) => [Math.sin((a * Math.PI) / 180), Math.cos((a * Math.PI) / 180)];
  const [x1, y1] = d(a1), [x2, y2] = d(a2);
  const E = [S[0] + l1 * x1, S[1] + l1 * y1];
  return { E, W: [E[0] + l2 * x2, E[1] + l2 * y2] };
};

const Hand = ({ kind, n = 1, sk, skD }) => {
  const f = (x, len, rot = 0, y0 = 14) => <ellipse key={x + '_' + rot} cx={x} cy={y0 + len} rx="3.8" ry={len} transform={`rotate(${rot} ${x} ${y0})`} fill={sk} stroke={skD} strokeWidth="1" />;
  const palm = <ellipse cx="0" cy="11" rx="11.5" ry="13" fill={sk} stroke={skD} strokeWidth="1" />;
  if (kind === 'open') return <g>{f(-8, 11, -14)}{f(-3, 13, -5)}{f(2, 13, 4)}{f(7, 11, 13)}{palm}<ellipse cx="-12" cy="10" rx="3.8" ry="9" transform="rotate(-50 -12 10)" fill={sk} stroke={skD} strokeWidth="1" /></g>;
  if (kind === 'count') {
    const xs = [-8, -3, 2, 7], ls = [12, 14, 13, 10];
    return <g>{xs.map((x, i) => (i < n ? f(x, ls[i], (i - 1.5) * 4) : <circle key={x} cx={x} cy="22" r="4.4" fill={sk} stroke={skD} strokeWidth="1" />))}{palm}{n >= 5 && <ellipse cx="-12" cy="10" rx="3.8" ry="9" transform="rotate(-50 -12 10)" fill={sk} stroke={skD} strokeWidth="1" />}</g>;
  }
  return <g>{kind === 'point' && f(-3, 15, 0, 18)}<circle cx="0" cy="12" r="12" fill={sk} stroke={skD} strokeWidth="1" /><ellipse cx="-10" cy="8" rx="4" ry="7" transform="rotate(-25 -10 8)" fill={sk} stroke={skD} strokeWidth="1" /></g>;
};

const Arm = ({ pose, C, sk, skD, lift }) => {
  const S = [274, 256 - lift], { E, W } = fk(S, 78, 58, pose.a1, pose.a2);
  const full = C.outfit !== 'tee', topD = mix(C.top, '#000000', 0.4);
  const seg = (A, B, col, w) => <path d={`M${A[0]} ${A[1]} L${B[0]} ${B[1]}`} stroke={col} strokeWidth={w} strokeLinecap="round" fill="none" />;
  return (
    <g>
      {seg(S, E, topD, 46)}{seg(E, W, full ? topD : skD, full ? 40 : 34)}
      {seg(S, E, C.top, 42)}{seg(E, W, full ? C.top : sk, full ? 36 : 30)}
      <g transform={`translate(${W[0]} ${W[1]}) rotate(${-pose.a2})`}><Hand kind={pose.hand} n={pose.n} sk={sk} skD={skD} /></g>
    </g>
  );
};

// --- Cabeza ------------------------------------------------------------------------
const HAIR = {
  short: 'M147 104 Q142 46 200 42 Q260 44 253 104 Q248 78 224 70 Q196 62 168 74 Q152 84 147 104Z',
  quiff: 'M147 104 Q140 40 204 34 Q268 40 253 104 Q248 76 224 62 Q192 54 168 70 Q152 82 147 104Z',
  long: 'M147 100 Q150 46 200 42 Q252 46 253 100 Q232 74 200 80 Q168 74 147 100Z',
  bun: 'M147 104 Q142 46 200 42 Q260 44 253 104 Q248 78 224 70 Q196 62 168 74 Q152 84 147 104Z',
};

const Head = ({ C, sk, skD, skL, t, words, emph, mouth, blink, gaze, tilt }) => {
  const brow = Math.max(0, ...emph.map((e) => { const d = t - e; return d > -0.05 && d < 0.6 ? 7 * Math.pow(Math.sin(Math.PI * c01((d + 0.05) / 0.65)), 0.7) : 0; }));
  const hairD = mix(C.hair, '#000000', 0.3), hairL = mix(C.hair, '#ffffff', 0.22);
  const eye = (cx) => (
    <g key={cx} transform={`translate(${cx} 113)`}>
      <ellipse rx="8.2" ry="7.4" fill="#fff" />
      <circle cx={gaze[0]} cy={gaze[1]} r="4.7" fill={C.eyes} /><circle cx={gaze[0]} cy={gaze[1]} r="2.3" fill="#0b0705" /><circle cx={gaze[0] + 1.6} cy={gaze[1] - 1.6} r="1.2" fill="#fff" />
      <rect x="-9" y="-9" width="18" height={18 * blink} rx="4" fill={sk} />
      <path d="M-8.6 -1 Q0 -9.4 8.6 -1" stroke="#1a100c" strokeWidth="2" fill="none" strokeLinecap="round" transform={`translate(0 ${-9 + 18 * blink + 8.4})`} opacity={blink > 0.12 ? 1 : 0.7} />
    </g>
  );
  const m = mouth, hw = 13 * m.w, hh = 14 * m.h, smile = 2.5;
  const lip = C.lips;
  return (
    <g>
      {C.hairStyle === 'long' && <path d="M140 95 Q118 200 138 285 L262 285 Q282 200 260 95Z" fill={C.hair} />}
      <rect x="176" y="148" width="48" height="58" rx="14" fill={sk} /><ellipse cx="200" cy="176" rx="34" ry="12" fill={skD} opacity=".55" />
      <ellipse cx="148" cy="116" rx="8" ry="14" fill={sk} /><ellipse cx="252" cy="116" rx="8" ry="14" fill={sk} />
      <ellipse cx="200" cy="112" rx="52" ry="60" fill={sk} />
      <ellipse cx="200" cy="112" rx="52" ry="60" fill="url(#cgFace)" />
      <ellipse cx="172" cy="132" rx="9" ry="6" fill="#ff7a8a" opacity=".16" /><ellipse cx="228" cy="132" rx="9" ry="6" fill="#ff7a8a" opacity=".16" />
      {C.beard !== 'none' && <path d="M149 122 Q150 178 200 184 Q250 178 251 122 Q242 150 224 152 Q200 156 176 152 Q158 150 149 122Z" fill={C.hair} opacity={C.beard === 'full' ? 0.88 : 0.34} />}
      {C.beard === 'full' && <ellipse cx="200" cy="149" rx="19" ry="11" fill={mix(sk, '#7a3a2a', 0.12)} />}
      {C.beard !== 'none' && <path d="M178 140 Q200 130 222 140 Q200 146 178 140Z" fill={C.hair} opacity={C.beard === 'full' ? 0.92 : 0.45} />}
      {m.h < 0.06 ? <path d={`M${200 - hw} 149 Q200 ${149 + smile + 1} ${200 + hw} 149`} stroke={lip} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        : <g transform="translate(200 148)">
          <path d={`M${-hw} 0 Q0 ${-hh * 0.35 - 1} ${hw} 0 Q0 ${hh * 1.25 + 1} ${-hw} 0Z`} fill="#4a1520" />
          {m.t > 0.2 && <path d={`M${-hw * 0.8} -0.2 Q0 ${-hh * 0.3} ${hw * 0.8} -0.2 L${hw * 0.8} ${hh * 0.32} Q0 ${hh * 0.2} ${-hw * 0.8} ${hh * 0.32}Z`} fill="#fff" opacity={m.t} />}
          {m.h > 0.5 && <ellipse cx="0" cy={hh * 0.85} rx={hw * 0.5} ry={hh * 0.22} fill="#c4566a" />}
          <path d={`M${-hw} 0 Q0 ${-hh * 0.35 - 2} ${hw} 0`} stroke={lip} strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d={`M${-hw} 0 Q0 ${hh * 1.25 + 2} ${hw} 0`} stroke={lip} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>}
      <path d="M200 114 Q208 130 198 133" stroke={skD} strokeWidth="3" fill="none" strokeLinecap="round" />
      {eye(182)}{eye(218)}
      <g transform={`translate(0 ${-brow})`}>
        <path d="M167 99 Q181 91 196 98" stroke={C.hair} strokeWidth="5" fill="none" strokeLinecap="round" transform={`rotate(${-brow * 0.6} 181 96)`} />
        <path d="M204 98 Q219 91 233 99" stroke={C.hair} strokeWidth="5" fill="none" strokeLinecap="round" transform={`rotate(${brow * 0.6} 219 96)`} />
      </g>
      {C.glasses && <g fill="none" stroke={C.glassesColor} strokeWidth="3.6"><rect x="160" y="100" width="38" height="28" rx="9" /><rect x="202" y="100" width="38" height="28" rx="9" /><path d="M198 112 L202 112" /><path d="M160 108 L150 104M240 108 L250 104" /><path d="M166 104 L178 124" stroke="#fff" strokeOpacity=".22" strokeWidth="4" /></g>}
      {C.hairStyle !== 'bald' && <path d={HAIR[C.hairStyle] || HAIR.short} fill={C.hair} />}
      {C.hairStyle === 'quiff' && <path d="M156 68 Q205 14 252 62 Q222 50 156 68Z" fill={C.hair} />}
      {C.hairStyle === 'bun' && <circle cx="200" cy="30" r="22" fill={C.hair} />}
      {C.hairStyle !== 'bald' && <path d="M170 66 Q200 52 232 66" stroke={hairL} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".55" />}
      <ellipse cx="200" cy="112" rx="52" ry="60" fill="none" stroke={skL} strokeWidth="2" opacity=".25" strokeDasharray="60 200" strokeDashoffset="-30" />
    </g>
  );
};

// --- Personaje completo ------------------------------------------------------------
export const Character = ({ cfg = {}, t, words = [], gestures = [], emph = [], W = 740 }) => {
  const C = { ...DEF_CHAR, ...cfg };
  const sk = C.skin, skD = mix(sk, '#5a2a1a', 0.3), skL = mix(sk, '#ffffff', 0.25);
  const topD = mix(C.top, '#000000', 0.38), topL = mix(C.top, '#ffffff', 0.16);
  const vs = buildVisemes(words), mouth = mouthAt(vs, t);
  const blinkTimes = (() => { const a = []; let x = 1.2; for (let i = 0; i < 80; i++) { a.push(x); if (R(i + 500) > 0.82) a.push(x + 0.28); x += R(i, 2.2, 4.8); } return a; })();
  let blink = 0;
  for (const b of blinkTimes) { const d = t - b; if (d > 0 && d < 0.16) blink = Math.sin((Math.PI * d) / 0.16); }
  const gaze = [Math.max(-3, Math.min(3, 2.2 * Math.sin(t * 0.9 + 1) + 1.4 * Math.sin(t * 2.3))), Math.max(-2, Math.min(2, 1.2 * Math.sin(t * 0.7) + 0.8 * Math.sin(t * 1.9 + 2)))];
  let nod = 0;
  for (const w of words) { const d = t - w.e; if (/[,.;!?]$/.test(w.w) && d > 0 && d < 0.35) nod = Math.max(nod, 3.6 * Math.sin((Math.PI * d) / 0.35)); }
  const tilt = 1.6 * Math.sin(t * 0.8) + 1.0 * Math.sin(t * 1.7 + 1) + nod;
  const breathe = Math.sin((2 * Math.PI * t) / 3.4), pose = poseAt(gestures, t);
  const shift = 2.5 * Math.sin(t * 0.45);
  const arm = (side, mir) => <g transform={mir ? 'translate(400 0) scale(-1 1)' : undefined}><Arm pose={pose[side]} C={C} sk={sk} skD={skD} lift={pose.shoulders} /></g>;
  return (
    <svg width={W} height={W * 1.4} viewBox="0 0 400 560" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="cgFace" cx=".38" cy=".32" r=".8"><stop offset=".45" stopColor={sk} stopOpacity="0" /><stop offset="1" stopColor={skD} stopOpacity=".5" /></radialGradient>
        <linearGradient id="cgTop" x1="0" x2="1"><stop offset="0" stopColor={topL} /><stop offset=".55" stopColor={C.top} /><stop offset="1" stopColor={topD} /></linearGradient>
        <linearGradient id="cgChair" x1="0" x2="1"><stop offset="0" stopColor={mix(C.chair, '#ffffff', 0.18)} /><stop offset="1" stopColor={mix(C.chair, '#000000', 0.35)} /></linearGradient>
        <linearGradient id="cgPants" x1="0" x2="1"><stop offset="0" stopColor={mix(C.pants, '#ffffff', 0.12)} /><stop offset="1" stopColor={mix(C.pants, '#000000', 0.4)} /></linearGradient>
      </defs>
      <ellipse cx="200" cy="548" rx="200" ry="12" fill="#00000026" />
      <g transform={`translate(${shift} 0)`}>
        <rect x="55" y="160" width="290" height="280" rx="70" fill="url(#cgChair)" /><rect x="40" y="330" width="320" height="110" rx="45" fill="url(#cgChair)" /><rect x="70" y="176" width="260" height="46" rx="30" fill="#ffffff" opacity=".07" />
        <rect x="85" y="430" width="10" height="112" fill="#17151a" /><rect x="305" y="430" width="10" height="112" fill="#17151a" />
        <path d="M118 345 Q150 305 200 335 Q250 305 288 348 L282 432 L215 442 L200 402 L185 442 L116 432Z" fill="url(#cgPants)" />
        <rect x="100" y="425" width="90" height="36" rx="16" fill={C.shoes} /><rect x="215" y="432" width="95" height="36" rx="16" fill={C.shoes} /><rect x="104" y="448" width="82" height="7" rx="3" fill="#0000001a" /><rect x="219" y="455" width="87" height="7" rx="3" fill="#0000001a" />
        <g transform={`translate(0 ${-pose.shoulders * 0.4}) rotate(0)`}>
          <g transform={`translate(200 350) scale(1 ${1 + 0.011 * breathe}) translate(-200 -350)`}>
            <path d="M112 246 Q200 162 288 246 L304 350 L96 350Z" fill="url(#cgTop)" />
            {C.outfit === 'hoodie' && <><path d="M150 190 Q200 236 250 190 L264 216 Q200 266 136 216Z" fill={topD} /><path d="M188 215 L186 268 M212 215 L214 268" stroke="#d9d9de" strokeWidth="3" strokeLinecap="round" /><path d="M140 330 Q200 350 260 330" stroke={topD} strokeWidth="3" fill="none" /></>}
            {C.outfit === 'tee' && <path d="M166 196 Q200 232 234 196" stroke={topD} strokeWidth="6" fill="none" />}
            {C.outfit === 'suit' && <><path d="M170 200 L200 280 L230 200Z" fill="#f4f4f6" /><path d="M164 196 L200 300 L146 322 Z M236 196 L200 300 L254 322 Z" fill={topD} /><path d="M194 214 L206 214 L210 290 L200 304 L190 290Z" fill={C.tie} /></>}
          </g>
          {arm('L', true)}{arm('R', false)}
          <g transform={`rotate(${tilt} 200 176) translate(0 ${breathe * -1.2})`}><Head C={C} sk={sk} skD={skD} skL={skL} t={t} words={words} emph={emph} mouth={mouth} blink={blink} gaze={gaze} /></g>
        </g>
      </g>
    </svg>
  );
};

// --- Set (fondo con capas para parallax) ---------------------------------------------
export const SetWall = ({ set = {}, t, accent = '#e10600' }) => {
  const night = set.kind === 'night';
  const [c1, c2, c3] = set.colors || (night ? ['#0e1024', '#1d2250', '#323a7a'] : ['#f6f4f8', '#ebe9f0', '#dedce6']);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c1} 0%, ${c2} 60%, ${c3} 100%)` }}>
      <div style={{ position: 'absolute', left: -200, top: 150, width: 1480, height: 1480, borderRadius: '50%', background: night ? 'radial-gradient(#5a64c855, transparent 62%)' : 'radial-gradient(#ffffffdd, transparent 62%)' }} />
      {night && Array.from({ length: 26 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, 1080), top: R(i + 40, 120, 900), width: R(i + 80, 18, 70), height: R(i + 80, 18, 70), borderRadius: '50%', background: ['#ff7ab8', '#7ad7ff', '#ffd27a'][i % 3], opacity: 0.28 + 0.12 * Math.sin(t * 1.2 + i), filter: 'blur(6px)' }} />)}
    </AbsoluteFill>
  );
};

export const SetProps = ({ set = {}, t, accent = '#e10600' }) => {
  const { W, H } = useDims(), land = W > H;
  const night = set.kind === 'night';
  const sway = Math.sin(t * 0.9) * 2;
  const sc = land ? (H * 0.86) / 1650 : 1;                 // el decorado está dibujado para un suelo en y = 1650
  const lampX = land ? W * 0.5 : 170, plantX = land ? W * 0.94 : 905;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs><radialGradient id="cgGlow"><stop offset="0" stopColor="#ffe3a8" stopOpacity=".75" /><stop offset="1" stopColor="#ffe3a8" stopOpacity="0" /></radialGradient></defs>
        <g transform={`translate(${lampX - 170 * sc} 0) scale(${sc})`}>
          <ellipse cx="170" cy="880" rx="260" ry="320" fill="url(#cgGlow)" opacity={night ? 1 : 0.55} />
          <rect x="164" y="1010" width="12" height="640" rx="6" fill="#2b2b33" /><ellipse cx="170" cy="1655" rx="50" ry="9" fill="#2b2b33" />
          <path d="M104 1010 L236 1010 L206 880 L134 880Z" fill="#fff2d1" stroke="#e0c58a" strokeWidth="5" />
        </g>
        <g transform={`translate(${plantX - 905 * sc} 0) scale(${sc})`}>
          <rect x="860" y="1520" width="90" height="120" rx="14" fill={accent} /><rect x="852" y="1506" width="106" height="24" rx="10" fill={accent} /><rect x="856" y="1630" width="98" height="10" fill="#0003" />
          {[[-70, 150], [-35, 175], [0, 190], [35, 170], [70, 145], [-100, 110], [100, 105]].map(([a, h], i) => <ellipse key={i} cx="905" cy={1500 - h / 2} rx="20" ry={h / 2} fill={i % 2 ? '#2d8a57' : '#3fae6e'} transform={`rotate(${a + sway * (i % 2 ? 1 : -1)} 905 1505)`} />)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const SetFloor = ({ set = {}, accent = '#e10600' }) => {
  const { W, H } = useDims(), land = W > H, fy = land ? H * 0.86 : 1560, rcx = land ? 1340 : 540;
  const night = set.kind === 'night';
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: fy, bottom: 0, background: night ? 'linear-gradient(#171a3c, #0a0b1c)' : 'linear-gradient(#e6e4ec, #d2d0da)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: fy - 4, height: 8, background: '#00000010' }} />
      <div style={{ position: 'absolute', left: rcx - 390, top: fy + 52, width: 780, height: land ? 100 : 120, borderRadius: '50%', background: `${accent}22`, border: `4px solid ${accent}33` }} />
    </AbsoluteFill>
  );
};
