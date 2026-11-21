// Motor de cuentos infantiles y contenido educativo (vertical y horizontal): mundos con parallax, personajes (emojis) con movimiento,
// globos de diálogo, página de cuento con lectura resaltada, portada, "FIN", moraleja, contar, letras, formas, mapa y magia.
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Gloss, Small, useT, prog, R, F, glossFill, TH, clamp, fit, useDims } from './Cg';
import { Kid, KID_RATIO } from './Kids';
import { Prop, PROP_RATIO } from './Props';
import { GenAsset, specRatio, useAssets } from './Asset';

const pop = (t, at, d = 0.4) => interpolate(t, [at, at + d], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
const fade = (t, at, d = 0.3) => interpolate(t, [at, at + d], [0, 1], clamp);
const txt = (size, color = '#3a2a1a', w = 800) => ({ fontFamily: F, fontWeight: w, fontSize: size, color, letterSpacing: '-0.02em', lineHeight: 1.1 });
// Unidad de escala: todo el diseño vertical está pensado para H = 1920; en horizontal se escala por la altura.
const dims = () => { const { W, H } = useDims(); const U = H / 1920; return { W, H, U, land: W > H, S: U * (W > H ? 1.2 : 1) }; };

// --- Mundos -----------------------------------------------------------------------
export const WORLDS = {
  forest: { sky: ['#8fd3ff', '#e3f6ff'], ground: ['#58b368', '#2f7d45'], h: 0.62, sun: '☀️', far: ['🌲', '🌳', '🌲', '🌳', '🌲'], near: ['🌳', '🌼', '🍄', '🌲'], fx: 'clouds' },
  jungle: { sky: ['#3da56b', '#b9f0c4'], ground: ['#2d7d46', '#1d5a31'], h: 0.62, sun: '☀️', far: ['🌴', '🌿', '🌴', '🌿'], near: ['🌴', '🌺', '🍃'], fx: 'leaves' },
  ocean: { sky: ['#77c8ff', '#e6f7ff'], water: ['#2a8fd6', '#0b4f9c'], h: 0.5, sun: '☀️', far: ['⛵', '🐳'], near: ['🐠', '🐙', '🐚', '🦀'], fx: 'bubbles' },
  beach: { sky: ['#8fdcff', '#fff3d6'], ground: ['#f6d99b', '#e9bf74'], water: ['#37b6e6', '#1a86c4'], h: 0.56, sun: '☀️', far: ['🌴', '⛱️', '⛵'], near: ['🐚', '🦀', '⭐'], fx: 'clouds' },
  castle: { sky: ['#9bb8ff', '#ffe6f2'], ground: ['#7ccf7a', '#4ea05a'], h: 0.64, sun: '☀️', far: ['🌳', '🏰', '🌳'], near: ['🌷', '🌳', '🚩'], fx: 'clouds' },
  space: { sky: ['#0b0b2a', '#2a1760'], ground: ['#4a3b7a', '#2b2150'], h: 0.8, sun: '🌙', far: ['🪐', '🌎', '⭐'], near: ['☄️', '🛸'], fx: 'stars' },
  farm: { sky: ['#8fd3ff', '#fff6d9'], ground: ['#8fcf5f', '#5fa23c'], h: 0.62, sun: '☀️', far: ['🏠', '🌾', '🌳'], near: ['🌻', '🌾', '🥕'], fx: 'clouds' },
  desert: { sky: ['#ffcf8a', '#fff0cf'], ground: ['#f2c26b', '#d99a3e'], h: 0.62, sun: '☀️', far: ['🌵', '🏜️', '🌵'], near: ['🌵', '🪨'], fx: 'sun' },
  city: { sky: ['#8aa6ff', '#ffe3f0'], ground: ['#6c6c7a', '#44444f'], h: 0.7, sun: '☀️', far: ['🏙️', '🏢', '🏬'], near: ['🚗', '🌳', '🚌'], fx: 'clouds' },
  snow: { sky: ['#bfe3ff', '#f4fbff'], ground: ['#ffffff', '#d9ecfa'], h: 0.64, sun: '🌥️', far: ['🏔️', '🌲', '🌲'], near: ['⛄', '🌲', '❄️'], fx: 'snow' },
  night: { sky: ['#0d1033', '#2b2f78'], ground: ['#1d3b5a', '#10243b'], h: 0.68, sun: '🌙', far: ['🏡', '🌲', '🌲'], near: ['🌲', '🍃'], fx: 'stars' },
  park: { sky: ['#8fd3ff', '#eaf8ff'], ground: ['#74d18a', '#3f9b4f'], h: 0.5, sun: '☀️', far: ['🌳', '🌳', '🌳', '🌳'], near: ['🌼', '🌷', '🌸', '🌼', '🌳'], nearY: [0.08, 0.2], nearScale: 0.42, fx: 'clouds' },
  candy: { sky: ['#ffc2e6', '#fff0fa'], ground: ['#ffd1ea', '#ff9fd0'], h: 0.64, sun: '🍭', far: ['🧁', '🍰', '🍭'], near: ['🍬', '🍩', '🍭'], fx: 'sparkles' },
};
export const WORLD_NAMES = Object.keys(WORLDS);

export const World = ({ world = 'forest', W: pw, H: ph, pan = 0, stream = false }) => {
  const d = useDims(), W = pw ?? d.W, H = ph ?? d.H, t = useT(), w = WORLDS[world] || WORLDS.forest, hy = H * w.h;
  const u = H * 0.56, rep = Math.max(1, Math.round(W / u));           // en horizontal el decorado se repite a lo ancho
  const wrap = (x0, dd, size) => { const span = W + size * 2; return ((((x0 * W - t * pan * dd) % span) + span) % span) - size; };
  const farSize = u * 0.2, nearSize = u * 0.27 * (w.nearScale ?? 1), night = w.fx === 'stars' || world === 'night', water = w.water, fxN = 26 * rep;
  const far = Array.from({ length: w.far.length * rep }, (_, i) => w.far[i % w.far.length]);
  const near = Array.from({ length: w.near.length * rep }, (_, i) => w.near[i % w.near.length]);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: `linear-gradient(180deg, ${w.sky[0]}, ${w.sky[1]})` }}>
      {night && Array.from({ length: 44 * rep }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W), top: R(i + 50, 0, hy * 0.9), width: R(i + 9, 3, 8), height: R(i + 9, 3, 8), borderRadius: '50%', background: '#fff', opacity: 0.35 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)) }} />)}
      {w.sun && <div style={{ position: 'absolute', left: W * 0.76, top: H * 0.06, fontSize: u * 0.17, lineHeight: 1, transform: `rotate(${w.sun === '☀️' ? t * 8 : 0}deg)`, filter: w.sun === '🌙' ? 'drop-shadow(0 0 30px #fff8)' : undefined }}>{w.sun}</div>}
      {(w.fx === 'clouds' || w.fx === 'sun') && Array.from({ length: 3 + rep * 2 }, (_, i) => <div key={i} style={{ position: 'absolute', left: ((((R(i, 0, 1) * W + t * (14 + (i % 4) * 6)) % (W + 300)) + W + 300) % (W + 300)) - 200, top: H * (0.05 + 0.07 * (i % 4)) + 10 * Math.sin(t + i), fontSize: u * (0.2 + 0.04 * (i % 2)), lineHeight: 1, opacity: 0.9 }}>☁️</div>)}
      <div style={{ position: 'absolute', left: -W * 0.2, top: hy - H * 0.05, width: W * 0.9, height: H * 0.2, borderRadius: '50%', background: (w.ground || w.water || ['#fff'])[0], opacity: 0.55 }} />
      <div style={{ position: 'absolute', left: W * 0.35, top: hy - H * 0.035, width: W * 0.95, height: H * 0.18, borderRadius: '50%', background: (w.ground || w.water || ['#fff'])[0], opacity: 0.7 }} />
      {far.map((e, i) => <div key={'f' + i} style={{ position: 'absolute', left: wrap((i + 0.5) / far.length, 0.25, farSize), top: hy - farSize * 0.82 + R(i + 4, -10, 10), fontSize: farSize, lineHeight: 1, opacity: 0.92 }}>{e}</div>)}
      {water
        ? <svg width={W} height={H - hy} style={{ position: 'absolute', left: 0, top: hy }} viewBox={`0 0 ${W} ${H - hy}`} preserveAspectRatio="none">
          <defs><linearGradient id={'cgW' + world} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={water[0]} /><stop offset="1" stopColor={water[1]} /></linearGradient></defs>
          {[0, 1, 2].map((k) => <path key={k} d={`M0 ${40 * (H / 1920 + 0.4) + k * 90 * (H / 1920 + 0.2)} ${Array.from({ length: 13 * rep }, (_, i) => `L${(i * W) / (12 * rep)} ${40 * (H / 1920 + 0.4) + k * 90 * (H / 1920 + 0.2) + 18 * Math.sin(i * 1.3 + t * 2 + k)}`).join(' ')} L${W} ${H} L0 ${H}Z`} fill={`url(#cgW${world})`} opacity={0.55 + 0.2 * k} />)}
        </svg>
        : <div style={{ position: 'absolute', left: 0, top: hy, width: W, height: H - hy, background: `linear-gradient(180deg, ${w.ground[0]}, ${w.ground[1]})` }} />}
      {stream && (() => {
        const y0 = hy + (H - hy) * 0.64, th = (H - hy) * 0.2, N = 14;
        const top = Array.from({ length: N + 1 }, (_, i) => `${i ? 'L' : 'M'}${(i * W) / N} ${y0 - th / 2 + 14 * Math.sin(i * 0.9)}`).join(' ');
        const bot = Array.from({ length: N + 1 }, (_, i) => `L${((N - i) * W) / N} ${y0 + th / 2 + 14 * Math.sin((N - i) * 0.9 + 1)}`).join(' ');
        return (
          <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs><linearGradient id={'cgS' + world} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fd0ff" /><stop offset="1" stopColor="#2a8fd6" /></linearGradient></defs>
            <path d={`${top} ${bot}Z`} fill="#2c7a3d" transform="translate(0 -10) scale(1 1.12) translate(0 -40)" opacity=".5" />
            <path d={`${top} ${bot}Z`} fill={`url(#cgS${world})`} />
            {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(((i * W) / 8 + t * 70) % (W + 120)) - 60} ${y0 + Math.sin(i * 2.3) * th * 0.28} q 24 -10 48 0`} fill="none" stroke="#ffffffcc" strokeWidth="5" strokeLinecap="round" />)}
          </svg>
        );
      })()}
      {w.water && w.ground && <div style={{ position: 'absolute', left: 0, top: hy + (H - hy) * 0.55, width: W, height: (H - hy) * 0.45, background: `linear-gradient(180deg, ${w.ground[0]}, ${w.ground[1]})` }} />}
      {near.map((e, i) => <div key={'n' + i} style={{ position: 'absolute', left: wrap((i + 0.3) / near.length + R(i + 2, -0.05, 0.05), 0.7, nearSize), top: hy + (H - hy) * (w.nearY ? w.nearY[i % 2] : 0.38 + 0.18 * (i % 2)), fontSize: nearSize * (0.7 + 0.35 * R(i + 7)), lineHeight: 1 }}>{e}</div>)}
      {w.fx === 'snow' && Array.from({ length: fxN }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 30 * Math.sin(t + i), top: (((t * R(i + 3, 60, 140) + R(i + 9, 0, H)) % (H + 80)) - 40), fontSize: R(i + 5, 24, 56), opacity: 0.9 }}>❄️</div>)}
      {w.fx === 'bubbles' && Array.from({ length: fxN }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 20 * Math.sin(t * 2 + i), top: H - (((t * R(i + 3, 50, 130) + R(i + 9, 0, H)) % (H + 80)) - 40), width: R(i + 5, 18, 52), height: R(i + 5, 18, 52), borderRadius: '50%', border: '4px solid #ffffffaa', background: '#ffffff33' }} />)}
      {w.fx === 'leaves' && Array.from({ length: 14 * rep }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 60 * Math.sin(t + i), top: (((t * R(i + 3, 50, 110) + R(i + 9, 0, H)) % (H + 80)) - 40), fontSize: R(i + 5, 36, 70), transform: `rotate(${t * 60 + i * 40}deg)` }}>🍃</div>)}
      {w.fx === 'sparkles' && Array.from({ length: 24 * rep }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W), top: R(i + 20, 0, H), fontSize: R(i + 5, 30, 66), opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)), transform: `scale(${0.7 + 0.3 * Math.sin(t * 3 + i)})` }}>✨</div>)}
    </div>
  );
};

// --- Personajes y globos ------------------------------------------------------------------
const Bubble = ({ text, x, y, W, at, dur = 2.6, size = 46 }) => {
  const t = useT();
  if (t < at || t > at + dur + 0.25) return null;
  const k = pop(t, at, 0.3) * (1 - fade(t, at + dur, 0.25)), n = Math.floor(interpolate(t, [at + 0.1, at + 0.1 + Math.min(1.1, text.length * 0.04)], [0, text.length], clamp));
  const w = Math.min(W * 0.62, 120 + text.length * size * 0.48), cx = Math.max(w / 2 + 20, Math.min(W - w / 2 - 20, x));
  return (
    <div style={{ position: 'absolute', left: cx - w / 2, top: y, width: w, transform: `scale(${k})`, transformOrigin: `${x - (cx - w / 2)}px 100%`, opacity: k }}>
      <div style={{ background: '#fff', border: `${Math.max(4, size * 0.13)}px solid #3a2a1a`, borderRadius: size * 0.85, padding: `${size * 0.4}px ${size * 0.55}px`, ...txt(size, '#3a2a1a', 700), textAlign: 'center', boxShadow: '0 10px 18px #0003' }}>{text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span></div>
      <div style={{ position: 'absolute', left: Math.max(30, Math.min(w - 60, x - (cx - w / 2) - 22)), bottom: -size * 0.74, width: 0, height: 0, borderLeft: `${size * 0.48}px solid transparent`, borderRight: `${size * 0.48}px solid transparent`, borderTop: `${size * 0.83}px solid #3a2a1a` }} />
      <div style={{ position: 'absolute', left: Math.max(36, Math.min(w - 54, x - (cx - w / 2) - 16)), bottom: -size * 0.52, width: 0, height: 0, borderLeft: `${size * 0.35}px solid transparent`, borderRight: `${size * 0.35}px solid transparent`, borderTop: `${size * 0.6}px solid #fff` }} />
    </div>
  );
};

const Actor = ({ a, W, H, S }) => {
  const t = useT(), at = a.at ?? 0, assets = useAssets();
  if (t < at) return null;
  const lt = t - at, k = pop(t, at, 0.45), isKid = !!a.kid, isAsset = !!a.asset, isProp = !!a.prop || isAsset, own = isKid || isProp;     // niño y objeto se dibujan por código
  const size = (a.size ?? (isKid ? 520 : isProp ? 260 : 280)) * S, dur = a.dur ?? 3, mv = a.move || 'none';
  const x0 = a.x ?? 0.5, y = a.y ?? (own ? 0.8 : 0.72), ph = ((a.prop?.color || a.name || 'x').length * 1.7) % 6;
  let x = x0, dy = 0, rot = 0, sx = a.flip ? -1 : 1, sc = 1, pose = a.pose;
  const to = a.to ?? x0 + 0.35, goingLeft = to < x0;
  if (mv === 'walk') { const p = Math.min(1, lt / dur); x = x0 + (to - x0) * p; dy = -Math.abs(Math.sin(lt * 7)) * 22 * S * (p < 1 ? 1 : 0.2); rot = Math.sin(lt * 7) * 5 * (p < 1 ? 1 : 0.2); if (!a.flip) sx = own ? (goingLeft ? -1 : 1) : (goingLeft ? 1 : -1); pose = pose ?? (p < 1 ? 'run' : 'idle'); }
  else if (mv === 'sail') { const p = Math.max(0, (lt - (a.delay ?? 0)) / dur), stop = a.stopAt ?? 1, pp = Math.min(p, stop), stopped = p >= stop && stop < 1; x = x0 + (to - x0) * pp; dy = Math.sin(lt * 3 + ph) * 8 * S; rot = Math.sin(lt * 2.2 + ph) * 4 + (stopped ? Math.sin(lt * 14) * 3 : 0); }
  else if (mv === 'bounce') { dy = -Math.abs(Math.sin(lt * 5)) * 110 * S; pose = pose ?? 'jump'; }
  else if (mv === 'float') { dy = Math.sin(lt * 1.8) * 30 * S; x = x0 + Math.sin(lt * 0.9) * 0.02; }
  else if (mv === 'fly') { const p = Math.min(1, lt / dur); x = x0 + (to - x0) * p + Math.sin(lt * 1.1) * 0.04; dy = Math.sin(lt * 3) * 50 * S; if (!a.flip) sx = own ? (goingLeft ? -1 : 1) : (goingLeft ? 1 : -1); }
  else if (mv === 'swim') { x = x0 + Math.sin(lt * 1.2) * 0.14; dy = Math.sin(lt * 2.4) * 28 * S; if (!a.flip) sx = own ? (Math.cos(lt * 1.2) > 0 ? 1 : -1) : (Math.cos(lt * 1.2) > 0 ? -1 : 1); }
  else if (mv === 'sway') rot = Math.sin(lt * 3) * (isKid ? 2 : 12);
  else if (mv === 'spin') rot = lt * 180;
  else if (mv === 'pulse') sc = 1 + 0.08 * Math.sin(lt * 5);
  const ground = !a.noShadow && mv !== 'sail' && ['walk', 'bounce', 'none', 'sway', 'pulse'].includes(mv) && (own ? isKid : true);
  const h = isKid ? size : isAsset ? size * specRatio(assets[a.asset.name]) : isProp ? size * (PROP_RATIO[a.prop.kind] ?? 1) : size, w = isKid ? size / KID_RATIO : size;
  const top = own ? y * H - h + dy : y * H - size / 2 + dy;
  const bs = Math.max(34, 46 * S);
  return (
    <>
      {ground && <div style={{ position: 'absolute', left: x * W - (own ? w : size) * 0.4, top: y * H - (own ? 6 * S : -size * 0.42), width: (own ? w : size) * 0.8, height: size * 0.1, borderRadius: '50%', background: '#000', opacity: 0.18 * k * (1 + dy / 400), filter: 'blur(5px)' }} />}
      {own
        ? <div style={{ position: 'absolute', left: x * W - w / 2, top, width: w, height: h, transformOrigin: '50% 100%', transform: `scale(${k * sx * sc}, ${k * sc}) rotate(${rot}deg)`, filter: 'drop-shadow(0 10px 8px #0003)' }}>
          {isKid ? <Kid cfg={a.kid} mode={pose || 'idle'} t={lt} size={size} /> : isAsset ? <GenAsset spec={assets[a.asset.name]} params={{ ...(a.asset.color ? { color: a.asset.color } : {}), ...(a.asset.params || {}) }} state={a.asset.state} t={lt} size={size} /> : <Prop kind={a.prop.kind} color={a.prop.color} state={a.prop.state} t={lt} size={size} />}
        </div>
        : <div style={{ position: 'absolute', left: x * W - size / 2, top, width: size, height: size, fontSize: size * 0.9, lineHeight: `${size}px`, textAlign: 'center', transform: `scale(${k * sx * sc}, ${k * sc}) rotate(${rot}deg)`, filter: 'drop-shadow(0 12px 12px #0003)' }}>{a.emoji}</div>}
      {a.holding && <div style={{ position: 'absolute', left: x * W - size * 0.22, top: top + h * 0.5, width: size * 0.44, transform: `scale(${k})`, pointerEvents: 'none' }}>{a.holding.asset ? <GenAsset spec={assets[a.holding.asset]} params={{ ...(a.holding.color ? { color: a.holding.color } : {}) }} state={a.holding.state} t={lt} size={size * 0.44} /> : <Prop kind={a.holding.kind} color={a.holding.color} state={a.holding.state} t={lt} size={size * 0.44} />}</div>}
      {a.name && <div style={{ position: 'absolute', left: x * W - 110, top: y * H + 10 * S, width: 220, textAlign: 'center', opacity: k }}><span style={{ ...txt(Math.max(30, 40 * S), '#fff', 800), background: a.kid?.shirt || '#3a2a1a', padding: '2px 22px 4px', borderRadius: 30, border: '4px solid #fff', boxShadow: '0 6px 10px #0003' }}>{a.name}</span></div>}
      {a.say && <Bubble text={a.say} x={x * W} y={own ? top - 170 * S : y * H - size * 0.55 + dy - 190 * S} W={W} at={a.sayAt ?? at + 0.6} dur={a.sayDur ?? 2.6} size={bs} />}
    </>
  );
};
export const Actors = ({ actors = [], W: pw, H: ph, S: ps }) => { const d = dims(), W = pw ?? d.W, H = ph ?? d.H, S = ps ?? d.S; return <>{actors.map((a, i) => <Actor key={i} a={a} W={W} H={H} S={S} />)}</>; };

const Caption = ({ text, at, to }) => {
  const t = useT(), { H, U } = dims();
  if (!text) return null;
  const k = fade(t, at, 0.3) * (1 - fade(t, to - 0.3, 0.3));
  return <div style={{ position: 'absolute', left: '5%', right: '5%', top: H * 0.07, textAlign: 'center', ...txt(Math.max(40, 62 * U * 1.25), '#fff', 800), textShadow: '0 4px 0 #0008, 0 0 24px #000a', opacity: k, transform: `translateY(${(1 - k) * -20}px)` }}>{text}</div>;
};

// --- scene: ilustración a pantalla completa --------------------------------------------------------
const Scene = ({ sc, s }) => {
  const c = sc.scene || {};
  return (
    <AbsoluteFill>
      <World world={c.world} pan={c.pan ?? 0} stream={c.stream} />
      <Actors actors={c.actors} />
      <Caption text={c.caption} at={s + 0.3} to={sc.to} />
    </AbsoluteFill>
  );
};

// --- storybook: página de cuento con lectura resaltada (vertical: ilustración arriba; horizontal: ilustración a la izquierda) ----
const ReadAlong = ({ text, words, from, to, size }) => {
  const t = useT();
  const ws = words && words.length ? words : (() => { const a = (text || '').split(/\s+/).filter(Boolean), dd = (to - from) / Math.max(1, a.length); return a.map((w, i) => ({ w, s: from + i * dd, e: from + (i + 1) * dd })); })();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', justifyContent: 'center' }}>
      {ws.map((w, i) => {
        const on = t >= w.s && t < w.e, done = t >= w.e;
        return <span key={i} style={{ ...txt(size * (ws.length > 22 ? 0.85 : 1), '#3a2a1a', 800), opacity: done || on ? 1 : 0.38, background: on ? '#ffd966' : 'transparent', borderRadius: 14, padding: '0 10px', transform: `scale(${on ? 1.08 : 1})`, display: 'inline-block' }}>{w.w}</span>;
      })}
    </div>
  );
};

const Storybook = ({ sc, s }) => {
  const t = useT(), c = sc.story || {}, k = pop(t, s, 0.5), { W, H, land, U } = dims();
  const m = Math.round(60 * (land ? 0.8 : 1));
  const PW = land ? Math.round(W * 0.56) : W - 120, PH = land ? H - m * 2 : Math.round(H * 0.54);
  const px = m, py = land ? m : Math.round(H * 0.057);
  const tx = land ? px + PW + m * 1.6 : 70, tw = land ? W - tx - m * 1.2 : W - 140, ty = land ? 0 : py + PH + H * 0.04;
  const fs = land ? Math.round(H * 0.075) : 66;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff3d6, #f0d9a8)' }}>
      <div style={{ position: 'absolute', left: px, top: py, width: PW, height: PH, borderRadius: 44 * (land ? 0.8 : 1), border: `${land ? 12 : 14}px solid #8a5a2b`, overflow: 'hidden', boxShadow: '0 24px 40px #0005', transform: `scale(${k}) rotate(${(1 - k) * -4}deg)`, background: '#000' }}>
        <World world={c.world} W={PW} H={PH} pan={c.pan ?? 0} stream={c.stream} />
        <Actors actors={c.actors} W={PW} H={PH} S={land ? PH / 820 : 1} />
      </div>
      <div style={{ position: 'absolute', left: tx, width: tw, top: land ? 0 : ty, bottom: land ? 0 : undefined, display: 'flex', alignItems: land ? 'center' : 'flex-start', opacity: fade(t, s + 0.3) }}><div style={{ width: '100%' }}><ReadAlong text={c.text} words={sc.words} from={s + 0.3} to={sc.to - 0.2} size={fs} /></div></div>
      {c.page && <div style={{ position: 'absolute', bottom: H * 0.035, left: land ? tx : 0, width: land ? tw : '100%', textAlign: 'center', ...txt(Math.max(30, 46 * U * 1.2), '#8a5a2b', 700) }}>— {c.page} —</div>}
    </AbsoluteFill>
  );
};

// --- title / theend / moral ---------------------------------------------------------------------------------------------
const Title = ({ sc, s }) => {
  const t = useT(), c = sc.title || {}, k = pop(t, s + 0.2, 0.6), { W, H, land, U } = dims();
  const ws = (c.text || 'Mi cuento').split(' ');
  let best = ws.length, bi = ws.length;
  for (let i = 1; i < ws.length; i++) { const d = Math.abs(ws.slice(0, i).join(' ').length - ws.slice(i).join(' ').length); if (d < best) { best = d; bi = i; } }
  const ls = ws.length > 2 || (c.text || '').length > 12 ? [ws.slice(0, bi).join(' '), ws.slice(bi).join(' ')].filter(Boolean) : [c.text || 'Mi cuento'];
  const textW = land ? W * 0.56 : W - 180, cx = land ? W * 0.31 : W / 2;
  return (
    <AbsoluteFill>
      <World world={c.world || 'castle'} pan={20} />
      <AbsoluteFill style={{ background: 'radial-gradient(circle, #0000 30%, #0006 100%)' }} /><AbsoluteFill style={{ background: 'linear-gradient(180deg, #0008 0%, #0000 45%)' }} />
      <div style={{ position: 'absolute', inset: 70 * (land ? 0.55 : 1), border: `${14 * (land ? 0.7 : 1)}px solid #ffd966`, borderRadius: 70 * (land ? 0.6 : 1), boxShadow: '0 0 40px #ffd96688 inset, 0 0 40px #ffd96688', opacity: fade(t, s, 0.5) }} />
      <div style={{ position: 'absolute', top: H * (land ? 0.2 : 0.156), left: cx - textW / 2, width: textW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 * U }}>
        <Small at={s + 0.4} size={Math.max(46, 84 * U * (land ? 1.75 : 1))} white>{c.kicker || 'Había una vez…'}</Small>
        {ls.map((l, i) => <Gloss key={i} text={l} at={s + 0.9 + i * 0.25} size={fit(l, textW, land ? 200 : 250)} bright />)}
      </div>
      <div style={{ position: 'absolute', left: land ? W * 0.62 : 0, width: land ? W * 0.34 : '100%', top: land ? H * 0.18 : H * 0.552, textAlign: 'center', fontSize: (land ? H * 0.5 : H * 0.22), lineHeight: 1, transform: `scale(${k}) translateY(${Math.sin(t * 2.4) * 18 * U}px)`, filter: 'drop-shadow(0 30px 24px #0005)' }}>{c.emoji || '📖'}</div>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: 'absolute', left: [0.1, 0.8, 0.14, 0.78, 0.45, 0.65][i] * W, top: [0.11, 0.14, 0.47, 0.51, 0.78, 0.81][i] * H, fontSize: 90 * U * 1.1, opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i)), transform: `rotate(${t * 40 + i * 50}deg) scale(${0.8 + 0.3 * Math.sin(t * 3 + i)})` }}>✨</div>)}
    </AbsoluteFill>
  );
};

const TheEnd = ({ sc, s }) => {
  const t = useT(), c = sc.theend || {}, lt = Math.max(0, t - s), emojis = c.emojis || ['🎉', '✨', '⭐', '🎈', '💖'], { W, H, U } = dims();
  const sub = (c.sub ?? 'Colorín colorado, este cuento se ha acabado');
  return (
    <AbsoluteFill>
      <World world={c.world || 'night'} />
      <AbsoluteFill style={{ background: '#0004' }} />
      {Array.from({ length: 30 * Math.max(1, Math.round(W / H * 0.6)) }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W - 80), top: (((lt * R(i + 3, 200, 420) * U * 1.1 + R(i + 9, 0, H * 1.1)) % (H * 1.1)) - 120), fontSize: R(i + 5, 50, 110) * Math.max(0.7, U * 1.2), transform: `rotate(${lt * R(i + 7, -200, 200)}deg)` }}>{emojis[i % emojis.length]}</div>)}
      <div style={{ position: 'absolute', top: H * 0.3, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 * U }}>
        <Gloss text={c.text || 'FIN'} at={s + 0.3} size={Math.min(460, H * 0.26) * (c.text && c.text.length > 4 ? 0.6 : 1)} bright />
        {sub !== '' && sub.split(',').map((l, i, a) => <Small key={i} at={s + 1.2 + i * 0.3} size={Math.max(44, 66 * U * 1.2)} white>{l.trim() + (i < a.length - 1 ? ',' : '')}</Small>)}
      </div>
    </AbsoluteFill>
  );
};

const Moral = ({ sc, s }) => {
  const t = useT(), c = sc.moral || {}, words = (c.text || '').split(' '), a = s + 0.9, b = Math.max(a + 1, sc.to - 0.6), { W, H, land, U } = dims();
  const cw = land ? W * 0.58 : W - 180, cx = land ? W * 0.34 : W / 2;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff3d6, #e8c98f)' }}>
      <div style={{ position: 'absolute', left: cx - cw / 2, top: land ? H * 0.12 : H * 0.17, width: cw, minHeight: land ? H * 0.76 : H * 0.52, background: '#fff8e8', borderRadius: 60 * U * 1.2, border: '10px solid #8a5a2b', boxShadow: '0 24px 40px #0004', padding: `${70 * U * 1.1}px ${60 * U * 1.1}px`, transform: `scale(${pop(t, s, 0.5)})` }}>
        <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 120 * U * (land ? 1.75 : 1), letterSpacing: '-0.04em', textAlign: 'center', transform: 'skewX(-9deg)' }}>{c.title || 'MORALEJA'}</div>
        <div style={{ ...txt((words.length > 14 ? 62 : 72) * U * (land ? 2.0 : 1)), marginTop: 50 * U, textAlign: 'center' }}>
          {words.map((w, i) => { const kk = fade(t, a + ((b - a) * i) / words.length, 0.25); return <span key={i} style={{ opacity: kk, display: 'inline-block', marginRight: 16, transform: `translateY(${(1 - kk) * 16}px)` }}>{w}</span>; })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: land ? W * 0.68 : 0, width: land ? W * 0.28 : '100%', top: land ? H * 0.3 : H * 0.755, textAlign: 'center', fontSize: (land ? H * 0.42 : 300), lineHeight: 1, transform: `translateY(${-Math.abs(Math.sin(t * 3)) * 40 * U}px)`, opacity: fade(t, s + 0.6) }}>{c.emoji || '🦉'}</div>
    </AbsoluteFill>
  );
};

// --- speech: diálogo entre dos personajes ---------------------------------------------------------------------------------------------
const Speech = ({ sc, s }) => {
  const t = useT(), c = sc.speech || {}, lines = c.lines || [], { W, H, S, U, land } = dims();
  const active = (who) => lines.some((l, i) => l.who === who && t >= l.at && t < (lines[i + 1]?.at ?? sc.to));
  const side = (who, x, flip) => ({ emoji: (c[who] || {}).emoji || '🐻', x, y: 0.74, size: 400, flip, move: active(who) ? 'bounce' : 'sway', at: s });
  const lx = land ? 0.3 : 0.25, rx = land ? 0.7 : 0.76, bs = Math.max(34, 52 * S);
  return (
    <AbsoluteFill>
      <World world={c.world || 'forest'} />
      <Actors actors={[side('left', lx, true), side('right', rx, false)]} />
      {lines.map((l, i) => <Bubble key={i} text={l.text} x={(l.who === 'left' ? lx : rx) * W} y={H * (land ? 0.22 : 0.32) + (l.who === 'left' ? 0 : 60 * U)} W={W} at={l.at} dur={Math.max(1.6, (lines[i + 1]?.at ?? sc.to) - l.at - 0.2)} size={bs} />)}
      {['left', 'right'].map((who) => c[who]?.name && <div key={who} style={{ position: 'absolute', left: (who === 'left' ? lx : rx) * W - 160, top: H * 0.88, width: 320, textAlign: 'center', ...txt(Math.max(34, 54 * U * 1.2), '#fff', 800), textShadow: '0 4px 0 #0007' }}>{c[who].name}</div>)}
    </AbsoluteFill>
  );
};

// --- counting / letter / shapes (educativo) ---------------------------------------------------------------------------------------------
const Counting = ({ sc, s }) => {
  const t = useT(), c = sc.counting || {}, n = c.n ?? 5, em = c.emoji || '🍎', step = c.step ?? 0.7, { W, H, land, U } = dims();
  const shown = Array.from({ length: n }, (_, i) => t >= s + 0.5 + i * step).filter(Boolean).length;
  const cols = land ? Math.min(n, 5) : n <= 3 ? n : n <= 6 ? 3 : 4, sz = land ? Math.min(230, (W - 260) / cols) : (n <= 4 ? 300 : n <= 6 ? 250 : 200);
  const rows = Math.ceil(n / cols);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #fff3c4, #ffd9a0)' }}>
      <div style={{ position: 'absolute', top: H * (land ? 0.03 : 0.09), left: 0, right: 0, textAlign: 'center', ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: (land ? H * 0.36 : 420), lineHeight: 1, transform: `skewX(-9deg) scale(${1 + 0.1 * (1 - fade(t, s + 0.5 + (shown - 1) * step, 0.3)) * (shown > 0 ? 1 : 0)})`, display: 'block' }}>{shown}</div>
      {c.label && <div style={{ position: 'absolute', top: H * (land ? 0.36 : 0.33), left: 0, right: 0, textAlign: 'center', ...txt(land ? H * 0.075 : 84, '#7a4a12', 800), opacity: fade(t, s + 0.6) }}>{c.label}</div>}
      <div style={{ position: 'absolute', top: H * (land ? 0.47 : 0.43), left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sz}px)`, gap: 20 }}>
          {Array.from({ length: n }, (_, i) => { const a = s + 0.5 + i * step, k = pop(t, a); return (
            <div key={i} style={{ width: sz, height: sz, position: 'relative', display: 'grid', placeItems: 'center', fontSize: sz * 0.72, transform: `scale(${k}) rotate(${(1 - k) * 40}deg)`, filter: 'drop-shadow(0 12px 10px #0003)' }}>
              {em}
              <div style={{ position: 'absolute', right: 6, top: 6, width: sz * 0.24, height: sz * 0.24, borderRadius: sz * 0.12, background: TH.accent, color: '#fff', ...txt(sz * 0.15, '#fff', 800), display: 'grid', placeItems: 'center', opacity: k }}>{i + 1}</div>
            </div>); })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Letter = ({ sc, s }) => {
  const t = useT(), c = sc.letter || {}, L = (c.letter || 'A').toString(), word = c.word || '', k = pop(t, s + 0.15, 0.5), { W, H, land, U } = dims();
  const cardW = land ? W * 0.46 : W - 120, cardH = land ? H * 0.8 : H * 0.47, cardX = land ? W * 0.05 : 60, cardY = land ? H * 0.1 : H * 0.083;
  const rx = land ? W * 0.52 : 0, rw = land ? W * 0.44 : W;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #c9f0ff, #fff3c4)' }}>
      <div style={{ position: 'absolute', top: cardY, left: cardX, width: cardW, height: cardH, borderRadius: 80 * U * 1.2, background: '#fff', border: `12px solid ${TH.accent}`, boxShadow: '0 24px 40px #0003', transform: `scale(${k})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: cardH * 0.69, letterSpacing: '-0.05em', lineHeight: 1 }}>{L.toUpperCase()}<span style={{ fontSize: cardH * 0.51 }}>{L.toLowerCase()}</span></div>
      </div>
      <div style={{ position: 'absolute', top: land ? H * 0.12 : H * 0.568, left: rx, width: rw, textAlign: 'center', fontSize: land ? H * 0.38 : H * 0.172, lineHeight: 1, transform: `translateY(${-Math.abs(Math.sin(t * 3.2)) * 50 * U}px) scale(${pop(t, s + 0.9)})` }}>{c.emoji}</div>
      <div style={{ position: 'absolute', top: land ? H * 0.62 : H * 0.78, left: rx, width: rw, textAlign: 'center', ...txt(land ? H * 0.2 : 170, '#3a2a1a', 800) }}>
        {word.split('').map((ch, i) => { const kk = pop(t, s + 1.2 + i * 0.18, 0.3); return <span key={i} style={{ display: 'inline-block', color: i === 0 ? TH.accent : '#3a2a1a', transform: `scale(${kk}) translateY(${(1 - kk) * 40}px)` }}>{ch}</span>; })}
      </div>
    </AbsoluteFill>
  );
};

const SHAPES = {
  circle: (s) => <circle cx={s / 2} cy={s / 2} r={s * 0.42} />, square: (s) => <rect x={s * 0.1} y={s * 0.1} width={s * 0.8} height={s * 0.8} rx={s * 0.06} />, rect: (s) => <rect x={s * 0.04} y={s * 0.25} width={s * 0.92} height={s * 0.5} rx={s * 0.05} />,
  oval: (s) => <ellipse cx={s / 2} cy={s / 2} rx={s * 0.46} ry={s * 0.3} />, triangle: (s) => <path d={`M${s / 2} ${s * 0.1} L${s * 0.92} ${s * 0.86} L${s * 0.08} ${s * 0.86}Z`} strokeLinejoin="round" />,
  diamond: (s) => <path d={`M${s / 2} ${s * 0.06} L${s * 0.92} ${s / 2} L${s / 2} ${s * 0.94} L${s * 0.08} ${s / 2}Z`} />,
  star: (s) => <path d={Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? s * 0.2 : s * 0.46, a = (Math.PI / 5) * i - Math.PI / 2; return `${i ? 'L' : 'M'}${s / 2 + r * Math.cos(a)} ${s / 2 + r * Math.sin(a)}`; }).join(' ') + 'Z'} />,
  heart: (s) => <path d={`M${s / 2} ${s * 0.86} C ${s * 0.05} ${s * 0.55} ${s * 0.1} ${s * 0.12} ${s * 0.32} ${s * 0.12} C ${s * 0.42} ${s * 0.12} ${s * 0.5} ${s * 0.2} ${s / 2} ${s * 0.28} C ${s / 2} ${s * 0.2} ${s * 0.58} ${s * 0.12} ${s * 0.68} ${s * 0.12} C ${s * 0.9} ${s * 0.12} ${s * 0.95} ${s * 0.55} ${s / 2} ${s * 0.86}Z`} />,
};
const SHAPE_ES = { circle: 'Círculo', square: 'Cuadrado', rect: 'Rectángulo', oval: 'Óvalo', triangle: 'Triángulo', diamond: 'Rombo', star: 'Estrella', heart: 'Corazón' };
const PALETTE = ['#ff4d5e', '#ffb02e', '#ffe14d', '#3ecf70', '#3aa0ff', '#8a5cff', '#ff7ac8'];
const Shapes = ({ sc, s }) => {
  const t = useT(), items = (sc.shapes?.items || []).map((x) => (typeof x === 'string' ? { shape: x } : x)), n = items.length, { W, H, land, U } = dims();
  const cols = land ? (n <= 4 ? n : Math.ceil(n / 2)) : n <= 2 ? n : n <= 4 ? 2 : 3;
  const sz = land ? Math.min(380, (W - 160) / cols - 50, (H - 300) / Math.ceil(n / cols) - 90) : (cols === 1 ? 560 : cols === 2 ? 400 : 290);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #d9f3ff, #fff0c9)' }}>
      <div style={{ position: 'absolute', top: land ? H * 0.1 : H * 0.156, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sz + 40}px)`, gap: 40 * U * 1.1, justifyItems: 'center' }}>
          {items.map((it, i) => { const k = pop(t, s + 0.4 + i * 0.6, 0.45), col = it.color || PALETTE[i % PALETTE.length], f = SHAPES[it.shape] || SHAPES.circle; return (
            <div key={i} style={{ textAlign: 'center', transform: `scale(${k}) rotate(${(1 - k) * 90}deg)` }}>
              <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ filter: 'drop-shadow(0 14px 12px #0003)' }}><g fill={col} stroke="#fff" strokeWidth="12">{f(sz)}</g></svg>
              <div style={{ ...txt(Math.max(38, sz * 0.22), '#3a2a1a', 800), marginTop: 6 }}>{it.label || SHAPE_ES[it.shape] || ''}</div>
            </div>); })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- journey: mapa del tesoro con recorrido ---------------------------------------------------------------------------------------------
const Journey = ({ sc, s }) => {
  const t = useT(), c = sc.journey || {}, { W, H, U, land } = dims();
  const mx = W * 0.07, my = H * 0.12, ex = land ? 1.2 : 1.1;
  const pts = (c.points || []).map((p) => ({ ...p, X: mx + p.x * (W - mx * 2), Y: my + p.y * (H - my * 2.2) }));
  const total = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.X - pts[i].X, p.Y - pts[i].Y), 0) || 1;
  const p = prog(t, s + 0.8, Math.max(s + 1.5, sc.to - 0.6), Easing.inOut(Easing.cubic)) * total;
  let acc = 0, pos = pts[0] ? [pts[0].X, pts[0].Y] : [0, 0];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].X - pts[i - 1].X, pts[i].Y - pts[i - 1].Y); if (p <= acc + d) { const f = (p - acc) / d; pos = [pts[i - 1].X + (pts[i].X - pts[i - 1].X) * f, pts[i - 1].Y + (pts[i].Y - pts[i - 1].Y) * f]; break; } acc += d; pos = [pts[i].X, pts[i].Y]; }
  const path = pts.map((q, i) => `${i ? 'L' : 'M'}${q.X} ${q.Y}`).join(' ');
  const es = 150 * U * ex;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fbe9bd, #e6c98a)' }}>
      <div style={{ position: 'absolute', inset: 40, border: '14px solid #8a5a2b', borderRadius: 40 }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <path d={path} pathLength="1" fill="none" stroke="#c0392b" strokeWidth="14" strokeLinecap="round" strokeDasharray="0.012 0.02" strokeDashoffset={1 - Math.min(1, p / total)} opacity=".9" />
      </svg>
      {pts.map((q, i) => { const k = pop(t, s + 0.3 + i * 0.35); return (
        <div key={i} style={{ position: 'absolute', left: q.X - es * 0.6, top: q.Y - es * 0.67, width: es * 1.2, textAlign: 'center', transform: `scale(${k})` }}>
          <div style={{ fontSize: es, lineHeight: 1, filter: 'drop-shadow(0 8px 6px #0004)' }}>{q.emoji || '📍'}</div>
          {q.label && <div style={{ ...txt(Math.max(30, 42 * U * ex), '#5a3a12', 800), background: '#fff8e8cc', borderRadius: 16, padding: '2px 12px', marginTop: 4 }}>{q.label}</div>}
        </div>); })}
      <div style={{ position: 'absolute', left: pos[0] - es * 0.55, top: pos[1] - es * 1.25 - Math.abs(Math.sin(t * 8)) * 18 * U, fontSize: es * 1.13, lineHeight: 1, transform: 'scaleX(-1)', filter: 'drop-shadow(0 10px 8px #0005)' }}>{c.traveler || '🧒'}</div>
    </AbsoluteFill>
  );
};

// --- magic: aparición mágica ------------------------------------------------------------------------------------------------------------------------
const Magic = ({ sc, s }) => {
  const t = useT(), c = sc.magic || {}, lt = Math.max(0, t - s), k = pop(t, s + 0.6, 0.7), { W, H, U } = dims();
  const cx = W / 2, cy = H * 0.47, big = Math.max(W, H) * 0.9;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, #6a3fd1, #1a0f3a 70%)' }}>
      <div style={{ position: 'absolute', left: cx - big / 2, top: cy - big / 2, width: big, height: big, borderRadius: '50%', background: `repeating-conic-gradient(from ${lt * 25}deg, #ffffff22 0deg 8deg, transparent 8deg 24deg)`, opacity: fade(t, s + 0.3) }} />
      {Array.from({ length: 34 }, (_, i) => { const a = R(i, 0, Math.PI * 2), d = prog(t, s + 0.5 + R(i + 40, 0, 0.5), s + 1.8) * R(i + 20, 250, 700) * Math.max(0.6, U * 1.3), o = 1 - prog(t, s + 1.6, s + 2.6); return <div key={i} style={{ position: 'absolute', left: cx + Math.cos(a) * d * (W > H ? 1.6 : 1) - 30, top: cy + Math.sin(a) * d - 30, fontSize: R(i + 7, 40, 90) * Math.max(0.7, U * 1.2), opacity: o, transform: `rotate(${lt * 120 + i * 30}deg)` }}>{i % 3 ? '✨' : '⭐'}</div>; })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy - H * 0.17, textAlign: 'center', fontSize: H * 0.29, lineHeight: 1, transform: `scale(${k}) rotate(${(1 - k) * 160}deg)`, filter: 'drop-shadow(0 0 60px #ffd96699)' }}>{c.emoji || '🦄'}</div>
      {c.text && <div style={{ position: 'absolute', left: 0, right: 0, top: cy + H * 0.2, display: 'flex', justifyContent: 'center' }}><Gloss text={c.text} at={s + 1.4} size={Math.min(190 * Math.max(0.7, U * 1.3), 900 / Math.max(4, c.text.length * 0.7))} bright /></div>}
    </AbsoluteFill>
  );
};


// --- choose: «¿qué color elegirías?» con los objetos generados por código ------------------------------------------------------------
const Choose = ({ sc, s }) => {
  const t = useT(), c = sc.choose || {}, items = c.items || [], { W, H, U, land } = dims(), assets = useAssets();
  const sz = Math.min(land ? 380 : 330, (W - 120) / Math.max(1, items.length) - 40);
  return (
    <AbsoluteFill>
      <World world={c.world || 'park'} stream={c.stream} />
      <AbsoluteFill style={{ background: '#0003' }} />
      <div style={{ position: 'absolute', top: H * (land ? 0.1 : 0.12), left: '6%', right: '6%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 * U }}>
        {(c.text || '¿Cuál eliges?').split(/(?<=\?)\s+/).map((l, i) => <Gloss key={i} text={l} at={s + 0.3 + i * 0.3} size={fit(l, W * 0.88, land ? 130 : 150)} bright />)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: H * (land ? 0.42 : 0.44), display: 'flex', justifyContent: 'center', gap: 30 }}>
        {items.map((it, i) => { const k = pop(t, s + 0.8 + i * 0.3, 0.5), bob = Math.abs(Math.sin(t * 3 + i * 1.3)) * 26 * U; return (
          <div key={i} style={{ textAlign: 'center', transform: `translateY(${-bob}px) scale(${k})` }}>
            <div style={{ background: '#ffffffcc', borderRadius: 40, padding: 22, border: `8px solid ${it.color}`, boxShadow: '0 16px 24px #0004' }}>{it.asset ? <GenAsset spec={assets[it.asset]} params={{ color: it.color, ...(it.params || {}) }} t={t} size={sz * 0.8} /> : <Prop kind={it.kind || 'paperBoat'} color={it.color} size={sz * 0.8} t={t} />}</div>
            {it.label && <div style={{ ...txt(Math.max(34, 54 * U * 1.1), '#fff', 800), textShadow: '0 4px 0 #0007', marginTop: 12 }}>{it.label}</div>}
          </div>); })}
      </div>
    </AbsoluteFill>
  );
};

// --- assetsheet: vista previa de los elementos generados (nombre, animación y variantes de color) ----------------------------------------------
const AssetSheet = ({ sc, s }) => {
  const t = useT(), assets = useAssets(), c = sc.assetsheet || {}, names = c.names || Object.keys(assets), { W, H, land } = dims();
  const cols = land ? Math.min(4, names.length) : Math.min(2, names.length), rows = Math.ceil(names.length / cols);
  const cw = (W - 60) / cols, ch = Math.min(cw * 1.15, (H - 60) / rows);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f4f1ff, #e6f4ff)' }}>
      {names.map((n, i) => {
        const spec = assets[n], cx = 30 + (i % cols) * cw, cy = 30 + Math.floor(i / cols) * ch, k = pop(t, s + 0.1 + i * 0.15, 0.4);
        const cols2 = (c.colors || spec?.variants || []).slice(0, 3);
        return (
          <div key={i} style={{ position: 'absolute', left: cx, top: cy, width: cw - 20, height: ch - 20, background: '#fff', borderRadius: 28, border: '5px solid #cfc8ee', boxShadow: '0 10px 20px #0002', transform: `scale(${k})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <GenAsset spec={spec} t={t} size={Math.min(cw * 0.34, ch * 0.42)} />
              {cols2.map((cc, j) => <GenAsset key={j} spec={spec} params={{ color: cc }} t={t + j} size={Math.min(cw * 0.15, ch * 0.2)} />)}
            </div>
            <div style={{ ...txt(Math.max(26, ch * 0.075), '#3a2a1a', 800) }}>{n}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const STORY_LAYOUTS = { assetsheet: AssetSheet, choose: Choose, scene: Scene, storybook: Storybook, title: Title, theend: TheEnd, moral: Moral, speech: Speech, counting: Counting, letter: Letter, shapes: Shapes, journey: Journey, magic: Magic };
export const FULL_LAYOUTS = ['assetsheet', 'choose', 'scene', 'storybook', 'title', 'theend', 'moral', 'speech', 'counting', 'letter', 'shapes', 'journey', 'magic'];
