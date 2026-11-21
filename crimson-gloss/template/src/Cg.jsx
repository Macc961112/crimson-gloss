// Crimson Gloss: plantilla guiada por datos. Todo sale de `plan` (ver SKILL.md).
import { createContext, useContext } from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/BricolageGrotesque';
import { Character, SetWall, SetProps, SetFloor } from './Character';
import { BrollBody, isFull } from './Broll';
import { Assets, GenAsset, useAssets } from './Asset';

const F = loadFont().fontFamily;
export let FPS = 30; // se fija desde plan.fps en <Cg>
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const useT = () => useCurrentFrame() / FPS;
const prog = (t, a, b, e = EASE) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
const R = (s, lo = 0, hi = 1) => lo + random(s) * (hi - lo);

const DEFAULT_TH = { accent: '#e10600', dark: '#7a0012', light: '#ff2a2a', soft: '#ff9aa8', bg: '#ececf0', ink: '#c8102e' };
let TH = DEFAULT_TH; // se fija al renderizar <Cg>
// Dimensiones del lienzo: vertical 1080x1920 (por defecto) u horizontal 1920x1080. Los componentes las leen con useDims().
export const Dims = createContext({ W: 1080, H: 1920 });
export const useDims = () => useContext(Dims);
export let CW = 1080, CH = 1920;

// --- Texto -------------------------------------------------------------------
// theme.mid / theme.outline: para fondos oscuros (rojo más claro + borde blanco fino) y que el texto se lea
const glossFill = () => ({ backgroundImage: `linear-gradient(180deg, ${TH.dark} 0%, ${TH.mid || '#d0000f'} 45%, ${TH.light} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...(TH.outline ? { WebkitTextStroke: TH.outline, paintOrder: 'stroke fill' } : {}) });
const cw = (c) => (c === ' ' ? 0.3 : /[A-ZÁÉÍÓÚÑ0-9?¡!]/.test(c) ? 0.7 : 0.56); // ancho por carácter en em (mayúsculas más anchas)
const fit = (text, maxW, maxSize) => Math.max(40, Math.min(maxSize, maxW / Math.max(...text.split('\n').map((l) => l.split('').reduce((a, c) => a + cw(c), 0)))));

const Gloss = ({ text, at, until, size = 260, white, bright }) => {
  const t = useT();
  const s = at - 0.1;
  if (t < s) return null;
  const out = until === undefined ? 0 : prog(t, until, until + 0.28, Easing.in(Easing.cubic));
  if (out >= 1) return null;
  const n = Math.floor((t - s) * 30 / 1.6);
  return (
    <div style={{ display: 'inline-block', fontFamily: F, fontWeight: 800, fontSize: size, lineHeight: 0.9, letterSpacing: '-0.05em', whiteSpace: 'nowrap', transform: `skewX(-9deg) scaleX(${1 + out * 0.5}) translateX(${out * 160}px)`, filter: `blur(${out * 40}px) drop-shadow(0 10px 14px ${TH.dark}3d)`, opacity: 1 - out * 0.9 }}>
      {text.split('').map((c, i) => {
        if (i >= n) return <span key={i} style={{ opacity: 0, whiteSpace: 'pre' }}>{c}</span>;
        const age = n - i;
        return <span key={i} style={{ ...(white ? { color: '#fff', textShadow: `0 0 18px ${TH.soft}` } : bright ? { ...glossFill(), backgroundImage: 'linear-gradient(180deg, #ff9a9a 0%, #ff4a4a 55%, #e61a1a 100%)', WebkitTextStroke: '2px #ffffff', paintOrder: 'stroke fill' } : glossFill()), filter: age < 3 ? `blur(${(3 - age) * 7}px)` : undefined, display: 'inline-block', whiteSpace: 'pre' }}>{c}</span>;
      })}
    </div>
  );
};

const Small = ({ children, at, until, size = 44, white }) => {
  const t = useT();
  if (t < at - 0.1) return null;
  const p = prog(t, at - 0.1, at + 0.2), out = until === undefined ? 0 : prog(t, until, until + 0.2);
  if (out >= 1) return null;
  return <div style={{ fontFamily: F, fontWeight: 500, fontStyle: 'italic', fontSize: size, color: white ? '#fff' : TH.ink, letterSpacing: '-0.04em', textShadow: white ? `0 0 14px ${TH.soft}` : '0 2px 10px #000c', opacity: p * (1 - out), filter: `blur(${(1 - p) * 8 + out * 14}px)`, transform: `translateY(${(1 - p) * 20}px) skewX(-8deg)`, whiteSpace: 'nowrap' }}>{children}</div>;
};

const Pill = ({ children, at, until, size = 44 }) => {
  const t = useT();
  if (t < at - 0.1) return null;
  const sp = spring({ frame: Math.round((t - at + 0.1) * FPS), fps: FPS, config: { damping: 14 } });
  const out = until === undefined ? 0 : prog(t, until, until + 0.2);
  if (out >= 1) return null;
  return <div style={{ background: TH.accent, color: '#fff', fontFamily: F, fontWeight: 600, fontStyle: 'italic', fontSize: size, letterSpacing: '-0.04em', padding: '2px 22px 6px', borderRadius: 10, transform: `scale(${sp}) skewX(-8deg)`, opacity: 1 - out, boxShadow: `0 6px 14px ${TH.accent}44`, whiteSpace: 'nowrap' }}>{children}</div>;
};

// --- Efectos -----------------------------------------------------------------
const Pixels = ({ at, x, y, flip }) => {
  const t = useT();
  const dt = t - at;
  if (dt < 0 || dt > 0.45) return null;
  return <>{[[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [-1, 1], [3, 1], [2, 2]].map(([cx, cy], i) => {
    const on = Math.floor(dt * 15 + i) % 3 !== 0;
    return <div key={i} style={{ position: 'absolute', left: x + cx * 18 * (flip ? -1 : 1), top: y + cy * 18, width: 18, height: 18, background: i % 3 === 0 ? TH.accent : TH.soft, opacity: (1 - dt / 0.45) * (on ? 1 : 0.35) * R(i + at * 10, 0.6, 1) }} />;
  })}</>;
};

const Halftone = ({ at, x, y, size = 1000 }) => {
  const t = useT();
  const p = prog(t, at, at + 0.6, Easing.out(Easing.cubic));
  if (t < at || p >= 1) return null;
  const mask = 'radial-gradient(circle, transparent 38%, #000 52%, transparent 74%)';
  return <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${0.6 + p * 0.9})`, opacity: 1 - p * p, WebkitMaskImage: mask, maskImage: mask, backgroundImage: `radial-gradient(circle, #ff5a6a 3px, transparent 3.6px), radial-gradient(circle, ${TH.soft} 2px, transparent 2.6px)`, backgroundSize: '20px 20px, 12px 12px', backgroundPosition: '0 0, 6px 6px' }} />;
};

// Cinta: siempre una curva suave de A a B (nunca al azar), dibujada DETRÁS del presentador
const Ribbon = ({ at, d, width = 16 }) => {
  const t = useT();
  const dt = t - at;
  if (dt < 0 || dt > 0.9) return null;
  const draw = prog(t, at, at + 0.35, Easing.out(Easing.cubic)), fade = prog(t, at + 0.45, at + 0.9);
  return (
    <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: 1 - fade }}>
      <path d={d} pathLength="1" fill="none" stroke={TH.accent} strokeWidth={width * (1 - fade)} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 14px ${TH.accent})` }} />
      <path d={d} pathLength="1" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - draw + 0.08} />
    </svg>
  );
};
const trail = ([fx, fy], [tx, ty]) => {
  const mx = (fx + tx) / 2, my = (fy + ty) / 2, dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1;
  const k = 0.22 * len, side = tx > 540 ? -1 : 1; // la curva se abre hacia fuera
  return `M${fx} ${fy} Q${mx - (dy / len) * k * side} ${my + (dx / len) * k * side} ${tx} ${ty}`;
};

// --- Tarjetas ------------------------------------------------------------------
const Icon = ({ name }) => {
  if (name === 'play') return <svg width="46" height="46" viewBox="0 0 10 10"><path d="M2.5 1.5l6 3.5-6 3.5z" fill="#fff" /></svg>;
  if (name === 'headphones') return <svg width="46" height="46" viewBox="0 0 24 24"><path d="M3 14a9 9 0 0118 0v4a2 2 0 01-2 2h-2v-7h4M3 14v4a2 2 0 002 2h2v-7H3" fill="none" stroke="#fff" strokeWidth="2" /></svg>;
  return <span style={{ fontSize: 46 }}>{name}</span>;
};

const CardBody = ({ c = {}, W, H }) => {
  const assets = useAssets();
  if (c.asset) return <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: c.bg || 'linear-gradient(160deg,#fff,#f6e9e9)' }}><GenAsset spec={assets[c.asset]} params={{ ...(c.color ? { color: c.color } : {}), ...(c.params || {}) }} state={c.state} t={useT()} size={Math.min(W, H) * 0.78} /></div>;
  if (c.image) return <Img src={staticFile(c.image)} style={{ width: '100%', height: '100%', objectFit: c.fit || 'cover', objectPosition: 'top' }} />;
  if (c.emoji) return <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: c.bg || 'linear-gradient(160deg,#fff,#f6d6d6)', fontSize: Math.min(W, H) * 0.55 }}>{c.emoji}</div>;
  if (c.text) return <div style={{ width: '100%', height: '100%', padding: 22, background: c.bg || 'linear-gradient(160deg,#fff,#f1e2e2)', fontFamily: F, fontWeight: 800, fontStyle: 'italic', fontSize: Math.min(60, W / 4.6), lineHeight: 0.95, color: TH.accent, whiteSpace: 'pre-line', display: 'flex', alignItems: 'center' }}>{c.text}</div>;
  const [a, b] = c.colors || [TH.accent, TH.dark];
  return <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${a}, ${b})`, display: 'grid', placeItems: 'center' }}><Icon name="play" /></div>;
};

const Card = ({ at, until, x, y, w = 320, h = 460, rot = 0, from = [0, 300], label, icon, content }) => {
  const t = useT();
  if (t < at) return null;
  const sp = spring({ frame: Math.round((t - at) * FPS), fps: FPS, config: { damping: 14 } });
  const out = until === undefined ? 0 : prog(t, until, until + 0.25);
  if (out >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `translate(${(1 - sp) * from[0]}px, ${(1 - sp) * from[1]}px) rotate(${rot + (1 - sp) * 14}deg) scale(${sp})`, opacity: 1 - out, filter: `blur(${out * 20}px)` }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 34, border: `9px solid ${TH.accent}`, overflow: 'hidden', background: '#dfe9f1', boxShadow: '0 24px 44px #00000033', position: 'relative' }}>
        <CardBody c={content} W={w} H={h} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #ffffff40, transparent 35%)' }} />
      </div>
      {label && <div style={{ position: 'absolute', left: 14, top: -30, background: TH.accent, color: '#fff', fontFamily: F, fontWeight: 600, fontStyle: 'italic', fontSize: 34, padding: '0 20px 4px', borderRadius: 10, transform: 'rotate(-6deg)' }}>{label}</div>}
      {icon && <div style={{ position: 'absolute', right: -26, top: 40, width: 96, height: 96, borderRadius: 26, background: TH.dark, border: '4px solid #ff6a7a', transform: 'rotate(10deg)', display: 'grid', placeItems: 'center', boxShadow: `0 0 24px ${TH.accent}88` }}><Icon name={icon} /></div>}
    </div>
  );
};

// --- Posiciones (slots) relativas a la cabeza del presentador --------------------
const SLOTS_LAND = {
  gloss: { top: { y: 300, max: 300 }, second: { y: 610, max: 220 }, aboveHead: { y: 300, max: 300 }, bottom: { y: 780, max: 190 }, footer: { y: 930, max: 130 } },
  small: { tl: { x: 90, y: 190 }, tr: { x: 90, y: 150 }, lead: { x: 90, y: 230 }, sub: { x: 90, y: 560 }, bottom: { x: 90, y: 990 } },
  pill: { left: { x: 90, y: 740 }, right: { x: 360, y: 740 }, url: { x: 90, y: 980 } },
  card: {
    aboveHead: { x: 1560, y: 110, w: 220, h: 300, rot: 4, from: [-220, 300] },
    left1: { x: 900, y: 520, w: 190, h: 300, rot: -6, from: [330, 100] },
    left2: { x: 880, y: 300, w: 200, h: 320, rot: 4, from: [340, 60] },
    left3: { x: 920, y: 700, w: 230, h: 300, rot: -3, from: [330, -80] },
    right1: { x: 1650, y: 430, w: 220, h: 290, rot: 6, from: [-260, 200] },
    right2: { x: 1620, y: 200, w: 250, h: 380, rot: 5, from: [-250, 300] },
  },
};
const LAND_CX = 1340; // centro del presentador en horizontal

const slots = (ht, land) => land ? SLOTS_LAND : ({
  gloss: { top: { y: 130, max: 420 }, second: { y: 430, max: 260 }, aboveHead: { y: ht - 380, max: 330 }, bottom: { y: 1180, max: 210 }, footer: { y: 1620, max: 150 } },
  small: { tl: { x: 90, y: 62 }, tr: { r: 90, y: 62 }, lead: { x: 100, y: ht - 430 }, sub: { x: 110, y: 580 }, bottom: { x: 0, y: 1560, center: true } },
  pill: { left: { x: 70, y: 540 }, right: { r: 70, y: 540 }, url: { x: 60, y: 1650 } },
  card: {
    aboveHead: { x: 375, y: ht - 330, w: 330, h: 470, rot: 0, from: [0, 360] },
    left1: { x: 90, y: ht + 100, w: 190, h: 330, rot: -6, from: [330, 140] },
    left2: { x: 70, y: 1030, w: 210, h: 360, rot: 4, from: [340, 60] },
    left3: { x: 190, y: 1230, w: 300, h: 400, rot: -3, from: [330, -80] },
    right1: { x: 775, y: ht + 40, w: 240, h: 300, rot: 6, from: [-260, 300] },
    right2: { x: 620, y: 640, w: 310, h: 520, rot: 5, from: [-250, 470] },
  },
});

const place = (s) => (s.center ? { left: 0, right: 0, display: 'flex', justifyContent: 'center', top: s.y } : s.r !== undefined ? { right: s.r, top: s.y } : { left: s.x ?? 60, top: s.y });

// Elemento de escena presentador. layer: 'back' (tarjetas, cintas, halo) | 'front' (texto)
const Element = ({ el, sc, ht, layer, hasCutout, land }) => {
  const S = slots(ht, land);
  const until = el.until ?? (el.kind === 'gloss' ? sc.to - 0.05 : sc.to);
  if (el.kind === 'card') {
    if (layer !== 'back') return null;
    const g = { ...(S.card[el.slot] || S.card.aboveHead), ...el };
    const target = [g.x + g.w / 2, g.y + g.h / 2];
    return (
      <>
        {hasCutout && <Ribbon at={el.at - 0.1} d={trail(land ? [LAND_CX, 560] : [540, ht + 420], target)} />}
        <Card at={el.at} until={until} {...g} label={el.label} icon={el.icon} content={el.content} />
      </>
    );
  }
  if (layer !== 'front') return null;
  if (el.kind === 'gloss') {
    const g = S.gloss[el.slot] || S.gloss.top;
    const size = el.size ?? fit(el.text, el.maxWidth ?? (land ? 860 : 930), g.max);
    const y = el.y ?? g.y;
    const style = el.align === 'center' ? { left: 0, ...(land ? { width: 960 } : { right: 0 }), display: 'flex', justifyContent: 'center', top: y } : { left: el.x ?? (land ? 90 : 60), top: y };
    return <div style={{ position: 'absolute', ...style }}><Gloss text={el.text} at={el.at} until={until} size={size} white={el.white} /></div>;
  }
  if (el.kind === 'small') {
    const g = { ...(S.small[el.slot] || S.small.tl), ...(el.x !== undefined ? { x: el.x, r: undefined } : {}), ...(el.y !== undefined ? { y: el.y } : {}) };
    return <div style={{ position: 'absolute', ...place(g) }}><Small at={el.at} until={until} size={el.size ?? 44} white={el.white}>{el.text}</Small></div>;
  }
  if (el.kind === 'pill') {
    const g = S.pill[el.slot] || S.pill.left;
    return <div style={{ position: 'absolute', ...place(g) }}><Pill at={el.at} until={until} size={el.size ?? 44}>{el.text}</Pill></div>;
  }
  return null;
};

// Escena presentador: capa de fondo + capa de texto
const PresenterScene = ({ sc, plan, layer }) => {
  const t = useT();
  const { W, H } = useDims(), land = W > H && !!plan.character;
  if (t < sc.from || t >= sc.to + 0.3) return null;
  const ht = 1920 - (1920 - (plan.headTop ?? (plan.character ? 718 : 780))) * zoomOf(sc); // la cabeza baja cuando se aleja el video
  const els = sc.elements || [];
  return (
    <>
      {layer === 'back' && sc.halo !== false && <Halftone at={sc.from} x={land ? LAND_CX : 540} y={land ? 540 : ht + 220} size={land ? 900 : 1100} />}
      {layer === 'back' && sc.from > 0.5 && (plan.cutout || plan.character) && <Ribbon at={sc.from - 0.55} d={land ? `M-60 ${H * 0.92 + 30} C ${W * 0.3} ${H * 0.92 - 70} ${W * 0.7} ${H * 0.92 + 110} ${W + 60} ${H * 0.92 - 10}` : `M-60 ${(plan.floorY ?? 1580) + 30} C 300 ${(plan.floorY ?? 1580) - 70} 700 ${(plan.floorY ?? 1580) + 110} 1140 ${(plan.floorY ?? 1580) - 10}`} />}
      {layer === 'front' && els.length > 0 && <Pixels at={els[0].at - 0.12} x={sc.pixelX ?? (land ? 90 : 140)} y={sc.pixelY ?? (land ? 110 : 220)} />}
      {els.map((el, i) => <Element key={i} el={el} sc={sc} ht={ht} layer={layer} hasCutout={!!(plan.cutout || plan.character)} land={land} />)}
    </>
  );
};

// --- Escena inserto: fondo + objeto que representa lo que se dice --------------------
const BGS = {
  sky: ['#5aa9c4', '#a7d4e4', '#d6eef5'], sunset: ['#ff7a59', '#ffb26b', '#ffe0b8'], night: ['#10122b', '#2a2f6b', '#4a5aa8'],
  mint: ['#58c9a8', '#a6e8d0', '#e0faf0'], gold: ['#3a2a10', '#8a6a22', '#e8c36a'], paper: ['#d9d6dc', '#ececf0', '#f7f6f8'], rose: ['#ff8fa3', '#ffc2cf', '#fff0f3'],
};
const stickerOutline = '0 0 0 #fff, 4px 0 0 #fff, -4px 0 0 #fff, 0 4px 0 #fff, 0 -4px 0 #fff, 3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff';

const InsertScene = ({ sc }) => {
  const t = useT();
  const { W, H } = useDims();
  if (t < sc.from + 0.12 || t >= sc.to + 0.1) return null;
  const s = sc.from + 0.12;
  const out = prog(t, sc.to - 0.2, sc.to + 0.1);
  const [c1, c2, c3] = BGS[sc.bg] || BGS.sky;
  if (isFull(sc)) return <AbsoluteFill style={{ opacity: 1 - out * 0.4, filter: `blur(${out * 30}px)` }}><BrollBody sc={sc} s={s} /></AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`, filter: `blur(${out * 50}px)`, opacity: 1 - out * 0.4 }}>
      {Array.from({ length: 16 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, -100, W - 80) + Math.sin(t * 0.6 + i) * 16, top: R(i + 30, H * 0.08, H * 0.88), width: R(i + 60, 260, 520) * (H / 1920 + 0.4), height: R(i + 60, 200, 380) * (H / 1920 + 0.4), borderRadius: '50%', background: '#fff', opacity: R(i + 90, 0.18, 0.5), filter: 'blur(30px)' }} />)}
      <BrollBody sc={sc} s={s} />
      <Halftone at={s} x={W / 2} y={H * 0.47} size={Math.max(W, H) * 0.78} />
      <Pixels at={s} x={W * 0.08} y={H * 0.11} /><Pixels at={s + 0.9} x={W * 0.76} y={H * 0.1} flip />
    </AbsoluteFill>
  );
};

// --- Cámara: zoom del presentador, desenfoque en cada corte, destello en insertos ------
const BlurMask = ({ cuts, children }) => {
  const t = useT();
  let k = 0;
  for (const c of cuts) k = Math.max(k, 1 - Math.min(1, Math.abs(t - c) / 0.14));
  return <AbsoluteFill style={{ filter: k ? `blur(${k * 26}px)` : undefined, transform: `scale(${1 + k * 0.05})` }}>{children}</AbsoluteFill>;
};

const Flash = ({ cuts }) => {
  const t = useT();
  let k = 0;
  for (const c of cuts) k = Math.max(k, 1 - Math.min(1, Math.abs(t - c) / 0.18));
  return <AbsoluteFill style={{ background: '#fff', opacity: k * 0.95, pointerEvents: 'none' }} />;
};

const SHOT = { wide: 0.92, medium: 1, close: 1.3 }; // tomas de cámara
const zoomOf = (sc) => sc.zoom ?? SHOT[sc.shot] ?? 1;
const zoomAt = (plan, t) => {
  const list = (plan.scenes || []).filter((x) => x.type !== 'insert');
  let cur = 1, prev = 1;
  for (const sc of list) if (sc.from <= t) { prev = cur; cur = zoomOf(sc); }
  const sc = list.filter((x) => x.from <= t).pop();
  return sc ? interpolate(prog(t, sc.from, sc.from + 0.45, Easing.inOut(Easing.cubic)), [0, 1], [prev, cur]) : 1;
};

// Zoom de énfasis (punch-in): sube suave a `scale`, se mantiene y vuelve
const punchAt = (plan, t) => {
  let k = 1;
  for (const p of plan.punches || []) {
    const x = (t - p.at) / p.dur;
    if (x > 0 && x < 1) { const e = Math.min(1, x * 5, (1 - x) * 5); k *= 1 + ((p.scale ?? 1.1) - 1) * e * e * (3 - 2 * e); }
  }
  return k;
};

const PersonVideo = ({ plan, src, transparent }) => {
  const t = useT();
  const z = zoomAt(plan, t);
  const feather = z < 0.999 && !transparent ? { WebkitMaskImage: 'linear-gradient(to right, transparent, #000 90px, #000 calc(100% - 90px), transparent), linear-gradient(to bottom, transparent, #000 90px)', WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } : {};
  return (
    <AbsoluteFill style={{ transformOrigin: '50% 100%', transform: `scale(${z})`, ...feather }}>
      <AbsoluteFill style={{ transformOrigin: '50% 38%', transform: `scale(${punchAt(plan, t)})` }}>
        <OffthreadVideo src={staticFile(src)} transparent={transparent} muted={transparent} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- Modo normal: subtítulos palabra a palabra, rótulo y llamada a la acción ----------
const Captions = ({ cfg }) => {
  const t = useT();
  const { W, H } = useDims(), land = W > H, sc = Math.min(1, (H / 1920) * 1.5);
  const ws = cfg.words || [];
  if (!ws.length) return null;
  const per = cfg.perLine ?? 3;
  const chunks = [];
  let cur = [];
  ws.forEach((w, i) => {
    cur.push({ ...w, i });
    const next = ws[i + 1];
    if (cur.length >= per || !next || (/[.!?¿¡,;:]$/.test(w.w) && cur.length >= 2) || next.s - w.e > 0.5) { chunks.push(cur); cur = []; }
  });
  const ch = chunks.find((c) => t >= c[0].s - 0.04 && t < c[c.length - 1].e + 0.28);
  if (!ch) return null;
  const k = prog(t, ch[0].s - 0.04, ch[0].s + 0.12);
  const emph = new Set((cfg.emphasis || []).map((x) => String(x).toLowerCase()));
  // zona segura: márgenes laterales amplios (en vertical, los botones de la app tapan ~120 px a la derecha) y tamaño que
  // siempre cabe: la palabra más larga entra en una línea y el bloque entero en dos líneas como máximo.
  const avail = land ? Math.min(W - 240, 1500) : W - 200;
  const txt = ch.map((w) => w.w.replace(/[.,;:]+$/, ''));
  const CW = 0.64, PAD = 30, GAP = 18;
  const sumLen = txt.reduce((a, x) => a + x.length, 0), maxLen = Math.max(...txt.map((x) => x.length));
  const fitWord = (avail * 0.93 - PAD) / (maxLen * CW), fitTwo = (2 * avail * 0.8 - txt.length * (PAD + GAP)) / (sumLen * CW);
  const size = Math.floor(Math.max(34, Math.min(cfg.size ?? Math.round(84 * sc), fitWord, fitTwo)));
  const bottomMax = land ? H * 0.86 : H * 0.78, rows = txt.reduce((a, x) => a + x.length * CW * size + PAD + GAP, 0) > avail ? 2 : 1;
  const top = Math.min(cfg.y ?? Math.round(H * (land ? 0.69 : 0.64)), bottomMax - rows * size * 1.2);
  return (
    <div style={{ position: 'absolute', left: (W - avail) / 2 - (land ? 0 : 20), width: avail, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', transform: `scale(${0.9 + k * 0.1}) translateY(${(1 - k) * 24}px)`, opacity: k }}>
      {ch.map((w, j) => {
        const on = t >= w.s && t < w.e + 0.04;
        const em = emph.has(w.w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase());
        // contorno oscuro grueso: legible sobre fondos claros, oscuros o con la cara detrás
        return <span key={w.i} style={{ display: 'inline-block', fontFamily: F, fontWeight: 800, fontSize: size, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 1.1, color: on ? (cfg.activeText ?? '#111') : em ? TH.accent : '#fff', background: on ? TH.accent : 'transparent', borderRadius: 16, padding: '0 14px', WebkitTextStroke: on ? '0' : `${Math.max(6, Math.round(size / 9))}px #0b0b10`, paintOrder: 'stroke fill', textShadow: on ? 'none' : '0 5px 0 #000000aa, 0 0 22px #00000088', transform: `scale(${on ? 1.06 : 1})` }}>{txt[j]}</span>;
      })}
    </div>
  );
};

const Lower = ({ cfg }) => {
  const t = useT();
  const { W, H } = useDims(), sc = Math.min(1, (H / 1920) * 1.5);
  const at = cfg.at ?? 0.4, to = at + (cfg.dur ?? 3.2);
  if (t < at || t > to + 0.4) return null;
  const k = prog(t, at, at + 0.35), o = prog(t, to, to + 0.3);
  return (
    <div style={{ position: 'absolute', left: 60, top: cfg.y ?? Math.round(H * (W > H ? 0.5 : 0.5)), transform: `translateX(${(1 - k) * -520 - o * 520}px)` }}>
      <div style={{ background: TH.accent, color: cfg.activeText ?? '#111', fontFamily: F, fontWeight: 800, fontSize: Math.round(64 * sc), padding: '6px 28px 10px', borderRadius: 14, letterSpacing: '-0.03em', width: 'fit-content' }}>{cfg.name}</div>
      {cfg.role && <div style={{ background: '#111', color: '#fff', fontFamily: F, fontWeight: 500, fontSize: Math.round(34 * sc), padding: '6px 22px', borderRadius: '0 0 14px 14px', width: 'fit-content' }}>{cfg.role}</div>}
    </div>
  );
};

const Cta = ({ cfg }) => {
  const t = useT();
  const { W, H } = useDims(), sc = Math.min(1, (H / 1920) * 1.5);
  if (t < cfg.at) return null;
  const sp = spring({ frame: Math.round((t - cfg.at) * FPS), fps: FPS, config: { damping: 12 } });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: cfg.y ?? Math.round(H * (W > H ? 0.84 : 0.78)), display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: TH.accent, color: cfg.activeText ?? '#111', fontFamily: F, fontWeight: 800, fontSize: Math.round(54 * sc), padding: '10px 38px 14px', borderRadius: 99, transform: `scale(${sp * (1 + 0.03 * Math.sin(t * 8))})`, boxShadow: `0 14px 40px ${TH.accent}66` }}>{cfg.text}</div>
    </div>
  );
};

// --- Modo personaje: cámara con parallax, personaje y música con ducking ---------------
const Stage = ({ plan, depth = 1, children }) => {
  const t = useT();
  const { W, H } = useDims(), ld = W > H;
  const z = 1 + ((ld ? Math.min(zoomAt(plan, t), 1.05) : zoomAt(plan, t)) - 1) * depth;  // en horizontal el zoom no puede sacar la cabeza del cuadro
  const sc = (plan.scenes || []).find((x) => x.type !== 'insert' && t >= x.from && t < x.to);
  const drift = sc ? 0.03 * prog(t, sc.from, sc.to, Easing.linear) : 0; // empuje lento de cámara
  return (
    <AbsoluteFill style={{ transformOrigin: ld ? '70% 92%' : '50% 100%', transform: `scale(${z * (1 + drift * depth)})` }}>
      <AbsoluteFill style={{ transformOrigin: ld ? '70% 45%' : '50% 38%', transform: `scale(${1 + (punchAt(plan, t) - 1) * depth})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const CharacterLayer = ({ plan }) => {
  const t = useT();
  const ch = plan.character;
  const emph = (plan.scenes || []).flatMap((s) => (s.elements || []).filter((e) => e.kind === 'gloss').map((e) => e.at)).concat(ch.emph || []);
  const { W, H } = useDims(), ld = W > H, cw = ld ? H * 0.56 : 740;
  return <div style={{ position: 'absolute', left: ld ? LAND_CX - cw / 2 : 170, top: ld ? H * 0.9 - cw * 1.4 * (548 / 560) : 640 }}><Character cfg={ch.cfg} t={t} words={ch.words || []} gestures={ch.gestures || []} emph={emph} W={cw} /></div>;
};

const speechSpans = (words) => {
  const out = [];
  for (const w of words) { const l = out[out.length - 1]; if (l && w.s - l[1] < 0.6) l[1] = w.e; else out.push([w.s, w.e]); }
  return out;
};
const duck = (t, spans, base) => {
  let k = 0;
  for (const [s, e] of spans) { const d = t < s ? s - t : t > e ? t - e : 0; k = Math.max(k, 1 - Math.min(1, d / 0.25)); }
  return base * (1 - 0.62 * k);
};

// --- Horizontal: los modos con presentador se componen en el lienzo vertical (1080x1920) y se encajan por altura -------
const Backdrop = ({ plan }) => {
  const t = useT();
  if (plan.character) return <><SetWall set={plan.set} t={t} accent={TH.accent} /><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 1560 * (CH / 1920), background: plan.set?.kind === 'night' ? 'linear-gradient(#171a3c, #0a0b1c)' : 'linear-gradient(#e6e4ec, #d2d0da)' }} /></>;
  if (plan.video) return <AbsoluteFill style={{ overflow: 'hidden' }}><OffthreadVideo src={staticFile(plan.video)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(46px) brightness(0.85)', transform: 'scale(1.25)' }} /></AbsoluteFill>;
  return <AbsoluteFill style={{ background: Array.isArray(plan.bg) ? `linear-gradient(180deg, ${plan.bg[0]}, ${plan.bg[1]})` : TH.bg }} />;
};
const DesignFit = ({ plan, bare, children }) => {
  const k = CH / 1920, left = (CW - 1080 * k) / 2;
  return (
    <AbsoluteFill>
      {!bare && <Backdrop plan={plan} />}
      <div style={{ position: 'absolute', left, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${k})`, overflow: 'hidden' }}>
        <Dims.Provider value={{ W: 1080, H: 1920 }}>{children}</Dims.Provider>
      </div>
    </AbsoluteFill>
  );
};

const sfx = (src, at, vol, dur, key) => <Sequence key={key} from={Math.max(0, Math.round(at * FPS))} durationInFrames={dur}><Audio src={staticFile(src)} volume={vol} /></Sequence>;

export const Cg = ({ plan }) => {
  FPS = plan.fps ?? 30;
  const land = plan.orientation === 'horizontal';
  CW = land ? 1920 : 1080; CH = land ? 1080 : 1920;
  TH = { ...DEFAULT_TH, ...(plan.theme || {}) };
  const speechWords = plan.character?.words || plan.captions?.words || [];
  const spans = plan.speech || speechSpans(speechWords);
  const t = useT();
  const scenes = plan.scenes || [];
  const cuts = scenes.slice(1).map((s) => s.from);
  const inserts = scenes.filter((s) => s.type === 'insert');
  const flashes = inserts.flatMap((s) => [s.from + 0.12, s.to + 0.1]);
  const gray = (plan.introFade === false || plan.character) ? 0 : 1 - prog(t, 0, 0.35, Easing.linear);
  const layerScenes = (layer) => scenes.filter((s) => s.type !== 'insert').map((s, i) => <PresenterScene key={i} sc={s} plan={plan} layer={layer} />);
  const useFit = land && !plan.character && scenes.some((x) => x.type !== 'insert');
  const layers = (
    <>
      {plan.character
        ? <>{!useFit && <Stage plan={plan} depth={0.5}><SetWall set={plan.set} t={t} accent={TH.accent} /></Stage>}<Stage plan={plan} depth={0.8}><SetProps set={plan.set} t={t} accent={TH.accent} /></Stage><Stage plan={plan} depth={1}><SetFloor set={plan.set} accent={TH.accent} /></Stage></>
        : plan.video ? <PersonVideo plan={plan} src={plan.video} /> : null}
      {layerScenes('back')}
      {plan.character ? <Stage plan={plan} depth={1}><CharacterLayer plan={plan} /></Stage> : plan.cutout ? <PersonVideo plan={plan} src={plan.cutout} transparent /> : null}
      {layerScenes('front')}
    </>
  );
  const overlays = (
    <>
      {plan.captions && <Captions cfg={plan.captions} />}
      {plan.lower && <Lower cfg={plan.lower} />}
      {plan.cta && <Cta cfg={plan.cta} />}
    </>
  );
  return (
    <Dims.Provider value={{ W: CW, H: CH }}>
    <Assets.Provider value={plan.assets || {}}>
    <AbsoluteFill style={{ background: Array.isArray(plan.bg) ? `linear-gradient(180deg, ${plan.bg[0]}, ${plan.bg[1]})` : TH.bg }}>
      <BlurMask cuts={cuts}>
        {useFit ? <DesignFit plan={plan}>{layers}</DesignFit> : layers}
        {inserts.map((s, i) => <InsertScene key={i} sc={s} />)}
        <AbsoluteFill style={{ background: '#8c8c94', opacity: gray * 0.85 }} />
      </BlurMask>
      {useFit ? <DesignFit plan={plan} bare>{overlays}</DesignFit> : overlays}
      <Flash cuts={flashes} />
      {plan.voice && <Audio src={staticFile(plan.voice)} />}
      {plan.music && <Audio src={staticFile(plan.music)} volume={(f) => duck(f / FPS, spans, plan.musicVolume ?? 0.08)} />}
      {cuts.map((c, i) => sfx('whoosh.wav', c - 0.12, 0.45, 16, 'w' + i))}
      {scenes.flatMap((sc, i) => (sc.elements || []).filter((e) => e.kind === 'gloss').map((e, j) => sfx('pop.wav', e.at - 0.1, 0.3, 5, `g${i}_${j}`)))}
      {scenes.map((sc, i) => (sc.elements?.length ? sfx('click.wav', sc.elements[0].at - 0.15, 0.4, 3, 'k' + i) : null))}
    </AbsoluteFill>
    </Assets.Provider>
    </Dims.Provider>
  );
};

// Piezas compartidas con Broll.jsx (import circular: solo se usan al renderizar)
export { Gloss, Small, Pill, Pixels, Halftone, useT, prog, R, fit, F, glossFill, TH, BGS, stickerOutline, clamp, EASE };
