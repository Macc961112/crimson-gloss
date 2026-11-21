// Motor de cuentos infantiles y contenido educativo: mundos con parallax, personajes (emojis) con movimiento,
// globos de diálogo, página de cuento con lectura resaltada, portada, "FIN", moraleja, contar, letras, formas, mapa y magia.
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Gloss, Small, useT, prog, R, F, glossFill, TH, clamp, fit } from './Cg';

const pop = (t, at, d = 0.4) => interpolate(t, [at, at + d], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
const fade = (t, at, d = 0.3) => interpolate(t, [at, at + d], [0, 1], clamp);
const txt = (size, color = '#3a2a1a', w = 800) => ({ fontFamily: F, fontWeight: w, fontSize: size, color, letterSpacing: '-0.02em', lineHeight: 1.1 });

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
  candy: { sky: ['#ffc2e6', '#fff0fa'], ground: ['#ffd1ea', '#ff9fd0'], h: 0.64, sun: '🍭', far: ['🧁', '🍰', '🍭'], near: ['🍬', '🍩', '🍭'], fx: 'sparkles' },
};
export const WORLD_NAMES = Object.keys(WORLDS);

export const World = ({ world = 'forest', W = 1080, H = 1920, pan = 0 }) => {
  const t = useT(), w = WORLDS[world] || WORLDS.forest, hy = H * w.h;
  const wrap = (x0, d, size) => { const span = W + size * 2; return ((((x0 * W - t * pan * d) % span) + span) % span) - size; };
  const farSize = W * 0.2, nearSize = W * 0.27, night = w.fx === 'stars' || world === 'night';
  const water = w.water, fxN = 26;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: `linear-gradient(180deg, ${w.sky[0]}, ${w.sky[1]})` }}>
      {night && Array.from({ length: 44 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W), top: R(i + 50, 0, hy * 0.9), width: R(i + 9, 3, 8), height: R(i + 9, 3, 8), borderRadius: '50%', background: '#fff', opacity: 0.35 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)) }} />)}
      {w.sun && <div style={{ position: 'absolute', left: W * 0.74, top: H * 0.06, fontSize: W * 0.17, lineHeight: 1, transform: `rotate(${w.sun === '☀️' ? t * 8 : 0}deg)`, filter: w.sun === '🌙' ? 'drop-shadow(0 0 30px #fff8)' : undefined }}>{w.sun}</div>}
      {(w.fx === 'clouds' || w.fx === 'sun') && [0, 1, 2, 3].map((i) => <div key={i} style={{ position: 'absolute', left: ((((R(i, 0, 1) * W + t * (14 + i * 6)) % (W + 300)) + W + 300) % (W + 300)) - 200, top: H * (0.06 + 0.07 * i) + 10 * Math.sin(t + i), fontSize: W * (0.2 + 0.04 * (i % 2)), lineHeight: 1, opacity: 0.9 }}>☁️</div>)}
      <div style={{ position: 'absolute', left: -W * 0.2, top: hy - H * 0.05, width: W * 0.9, height: H * 0.2, borderRadius: '50%', background: (w.ground || w.water || ['#fff'])[0], opacity: 0.55 }} />
      <div style={{ position: 'absolute', left: W * 0.35, top: hy - H * 0.035, width: W * 0.95, height: H * 0.18, borderRadius: '50%', background: (w.ground || w.water || ['#fff'])[0], opacity: 0.7 }} />
      {w.far.map((e, i) => <div key={'f' + i} style={{ position: 'absolute', left: wrap((i + 0.5) / w.far.length, 0.25, farSize), top: hy - farSize * 0.82 + R(i + 4, -10, 10), fontSize: farSize, lineHeight: 1, opacity: 0.92 }}>{e}</div>)}
      {water
        ? <svg width={W} height={H - hy} style={{ position: 'absolute', left: 0, top: hy }} viewBox={`0 0 ${W} ${H - hy}`} preserveAspectRatio="none">
          <defs><linearGradient id={'cgW' + world} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={water[0]} /><stop offset="1" stopColor={water[1]} /></linearGradient></defs>
          {[0, 1, 2].map((k) => <path key={k} d={`M0 ${40 + k * 90} ${Array.from({ length: 13 }, (_, i) => `L${(i * W) / 12} ${40 + k * 90 + 18 * Math.sin(i * 1.3 + t * 2 + k)}`).join(' ')} L${W} ${H} L0 ${H}Z`} fill={`url(#cgW${world})`} opacity={0.55 + 0.2 * k} />)}
        </svg>
        : <div style={{ position: 'absolute', left: 0, top: hy, width: W, height: H - hy, background: `linear-gradient(180deg, ${w.ground[0]}, ${w.ground[1]})` }} />}
      {w.water && w.ground && <div style={{ position: 'absolute', left: 0, top: hy + (H - hy) * 0.55, width: W, height: (H - hy) * 0.45, background: `linear-gradient(180deg, ${w.ground[0]}, ${w.ground[1]})` }} />}
      {w.near.map((e, i) => <div key={'n' + i} style={{ position: 'absolute', left: wrap((i + 0.3) / w.near.length + R(i + 2, -0.05, 0.05), 0.7, nearSize), top: hy + (H - hy) * (0.38 + 0.18 * (i % 2)), fontSize: nearSize * (0.7 + 0.35 * R(i + 7)), lineHeight: 1 }}>{e}</div>)}
      {w.fx === 'snow' && Array.from({ length: fxN }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 30 * Math.sin(t + i), top: (((t * R(i + 3, 60, 140) + R(i + 9, 0, H)) % (H + 80)) - 40), fontSize: R(i + 5, 24, 56), opacity: 0.9 }}>❄️</div>)}
      {w.fx === 'bubbles' && Array.from({ length: fxN }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 20 * Math.sin(t * 2 + i), top: H - (((t * R(i + 3, 50, 130) + R(i + 9, 0, H)) % (H + 80)) - 40), width: R(i + 5, 18, 52), height: R(i + 5, 18, 52), borderRadius: '50%', border: '4px solid #ffffffaa', background: '#ffffff33' }} />)}
      {w.fx === 'leaves' && Array.from({ length: 14 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W) + 60 * Math.sin(t + i), top: (((t * R(i + 3, 50, 110) + R(i + 9, 0, H)) % (H + 80)) - 40), fontSize: R(i + 5, 36, 70), transform: `rotate(${t * 60 + i * 40}deg)` }}>🍃</div>)}
      {w.fx === 'sparkles' && Array.from({ length: 24 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, W), top: R(i + 20, 0, H), fontSize: R(i + 5, 30, 66), opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)), transform: `scale(${0.7 + 0.3 * Math.sin(t * 3 + i)})` }}>✨</div>)}
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
      <div style={{ background: '#fff', border: '6px solid #3a2a1a', borderRadius: 40, padding: '18px 26px', ...txt(size, '#3a2a1a', 700), textAlign: 'center', boxShadow: '0 10px 18px #0003' }}>{text.slice(0, n)}<span style={{ opacity: 0 }}>{text.slice(n)}</span></div>
      <div style={{ position: 'absolute', left: Math.max(30, Math.min(w - 60, x - (cx - w / 2) - 22)), bottom: -34, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: '38px solid #3a2a1a' }} />
      <div style={{ position: 'absolute', left: Math.max(36, Math.min(w - 54, x - (cx - w / 2) - 16)), bottom: -24, width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '28px solid #fff' }} />
    </div>
  );
};

const Actor = ({ a, W, H }) => {
  const t = useT(), at = a.at ?? 0;
  if (t < at) return null;
  const lt = t - at, k = pop(t, at, 0.45), size = a.size ?? 280, dur = a.dur ?? 3, mv = a.move || 'none';
  const x0 = a.x ?? 0.5, y = a.y ?? 0.72;
  let x = x0, dy = 0, rot = 0, sx = a.flip ? -1 : 1, sc = 1;
  const to = a.to ?? x0 + 0.35;
  if (mv === 'walk') { const p = Math.min(1, lt / dur); x = x0 + (to - x0) * p; dy = -Math.abs(Math.sin(lt * 7)) * 22 * (p < 1 ? 1 : 0.2); rot = Math.sin(lt * 7) * 5 * (p < 1 ? 1 : 0.2); if (!a.flip) sx = to > x0 ? -1 : 1; }
  else if (mv === 'bounce') dy = -Math.abs(Math.sin(lt * 5)) * 110;
  else if (mv === 'float') { dy = Math.sin(lt * 1.8) * 30; x = x0 + Math.sin(lt * 0.9) * 0.02; }
  else if (mv === 'fly') { const p = Math.min(1, lt / dur); x = x0 + (to - x0) * p + Math.sin(lt * 1.1) * 0.04; dy = Math.sin(lt * 3) * 50; if (!a.flip) sx = to > x0 ? -1 : 1; }
  else if (mv === 'swim') { x = x0 + Math.sin(lt * 1.2) * 0.14; dy = Math.sin(lt * 2.4) * 28; if (!a.flip) sx = Math.cos(lt * 1.2) > 0 ? -1 : 1; }
  else if (mv === 'sway') rot = Math.sin(lt * 3) * 12;
  else if (mv === 'spin') rot = lt * 180;
  else if (mv === 'pulse') sc = 1 + 0.08 * Math.sin(lt * 5);
  const ground = ['walk', 'bounce', 'none', 'sway', 'pulse'].includes(mv) && a.shadow !== false;
  return (
    <>
      {ground && <div style={{ position: 'absolute', left: x * W - size * 0.38, top: y * H + size * 0.42, width: size * 0.76, height: size * 0.12, borderRadius: '50%', background: '#000', opacity: 0.18 * k * (1 + dy / 400), filter: 'blur(5px)' }} />}
      <div style={{ position: 'absolute', left: x * W - size / 2, top: y * H - size / 2 + dy, width: size, height: size, fontSize: size * 0.9, lineHeight: `${size}px`, textAlign: 'center', transform: `scale(${k * sx * sc}, ${k * sc}) rotate(${rot}deg)`, filter: 'drop-shadow(0 12px 12px #0003)' }}>{a.emoji}</div>
      {a.say && <Bubble text={a.say} x={x * W} y={y * H - size * 0.55 + dy - 190} W={W} at={a.sayAt ?? at + 0.6} dur={a.sayDur ?? 2.6} />}
    </>
  );
};
export const Actors = ({ actors = [], W = 1080, H = 1920 }) => <>{actors.map((a, i) => <Actor key={i} a={a} W={W} H={H} />)}</>;

const Caption = ({ text, at, to, dark = true }) => {
  const t = useT();
  if (!text) return null;
  const k = fade(t, at, 0.3) * (1 - fade(t, to - 0.3, 0.3));
  return <div style={{ position: 'absolute', left: 60, right: 60, top: 130, textAlign: 'center', ...txt(62, '#fff', 800), textShadow: '0 4px 0 #0008, 0 0 24px #000a', opacity: k, transform: `translateY(${(1 - k) * -20}px)` }}>{text}</div>;
};

// --- scene: ilustración a pantalla completa --------------------------------------------------------
const Scene = ({ sc, s }) => {
  const c = sc.scene || {};
  return (
    <AbsoluteFill>
      <World world={c.world} pan={c.pan ?? 0} />
      <Actors actors={c.actors} />
      <Caption text={c.caption} at={s + 0.3} to={sc.to} />
    </AbsoluteFill>
  );
};

// --- storybook: página de cuento con lectura resaltada --------------------------------------------------------
const ReadAlong = ({ text, words, from, to }) => {
  const t = useT();
  const ws = words && words.length ? words : (() => { const a = (text || '').split(/\s+/).filter(Boolean), d = (to - from) / Math.max(1, a.length); return a.map((w, i) => ({ w, s: from + i * d, e: from + (i + 1) * d })); })();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', justifyContent: 'center' }}>
      {ws.map((w, i) => {
        const on = t >= w.s && t < w.e, done = t >= w.e;
        return <span key={i} style={{ ...txt(ws.length > 22 ? 56 : 66, '#3a2a1a', 800), opacity: done || on ? 1 : 0.38, background: on ? '#ffd966' : 'transparent', borderRadius: 14, padding: '0 10px', transform: `scale(${on ? 1.08 : 1})`, display: 'inline-block' }}>{w.w}</span>;
      })}
    </div>
  );
};

const Storybook = ({ sc, s }) => {
  const t = useT(), c = sc.story || {}, k = pop(t, s, 0.5), PW = 960, PH = 1040;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff3d6, #f0d9a8)' }}>
      <div style={{ position: 'absolute', left: 60, top: 110, width: PW, height: PH, borderRadius: 44, border: '14px solid #8a5a2b', overflow: 'hidden', boxShadow: '0 24px 40px #0005', transform: `scale(${k}) rotate(${(1 - k) * -4}deg)`, background: '#000' }}>
        <World world={c.world} W={PW} H={PH} pan={c.pan ?? 0} />
        <Actors actors={c.actors} W={PW} H={PH} />
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1230, opacity: fade(t, s + 0.3) }}><ReadAlong text={c.text} words={sc.words} from={s + 0.3} to={sc.to - 0.2} /></div>
      {c.page && <div style={{ position: 'absolute', bottom: 70, width: '100%', textAlign: 'center', ...txt(46, '#8a5a2b', 700) }}>— {c.page} —</div>}
    </AbsoluteFill>
  );
};

// --- title / theend / moral ---------------------------------------------------------------------------------------------
const Title = ({ sc, s }) => {
  const t = useT(), c = sc.title || {}, k = pop(t, s + 0.2, 0.6);
  return (
    <AbsoluteFill>
      <World world={c.world || 'castle'} pan={20} />
      <AbsoluteFill style={{ background: 'radial-gradient(circle, #0000 30%, #0006 100%)' }} /><AbsoluteFill style={{ background: 'linear-gradient(180deg, #0008 0%, #0000 45%)' }} />
      <div style={{ position: 'absolute', inset: 70, border: '14px solid #ffd966', borderRadius: 70, boxShadow: '0 0 40px #ffd96688 inset, 0 0 40px #ffd96688', opacity: fade(t, s, 0.5) }} />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
        <Small at={s + 0.4} size={84} white>{c.kicker || 'Había una vez…'}</Small>
        {(() => { const ws = (c.text || 'Mi cuento').split(' '); let best = ws.length, bi = ws.length; for (let i = 1; i < ws.length; i++) { const d = Math.abs(ws.slice(0, i).join(' ').length - ws.slice(i).join(' ').length); if (d < best) { best = d; bi = i; } } const ls = ws.length > 2 || (c.text || '').length > 12 ? [ws.slice(0, bi).join(' '), ws.slice(bi).join(' ')].filter(Boolean) : [c.text || 'Mi cuento']; return ls.map((l, i) => <Gloss key={i} text={l} at={s + 0.9 + i * 0.25} size={fit(l, 900, 250)} bright />); })()}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', fontSize: 420, lineHeight: 1, transform: `scale(${k}) translateY(${Math.sin(t * 2.4) * 18}px)`, filter: 'drop-shadow(0 30px 24px #0005)' }}>{c.emoji || '📖'}</div>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: 'absolute', left: [110, 880, 160, 850, 480, 700][i], top: [220, 260, 900, 980, 1500, 1560][i], fontSize: 90, opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i)), transform: `rotate(${t * 40 + i * 50}deg) scale(${0.8 + 0.3 * Math.sin(t * 3 + i)})` }}>✨</div>)}
    </AbsoluteFill>
  );
};

const TheEnd = ({ sc, s }) => {
  const t = useT(), c = sc.theend || {}, lt = Math.max(0, t - s), emojis = c.emojis || ['🎉', '✨', '⭐', '🎈', '💖'];
  return (
    <AbsoluteFill>
      <World world={c.world || 'night'} />
      <AbsoluteFill style={{ background: '#0004' }} />
      {Array.from({ length: 30 }, (_, i) => <div key={i} style={{ position: 'absolute', left: R(i, 0, 1000), top: (((lt * R(i + 3, 200, 420) + R(i + 9, 0, 2000)) % 2100) - 120), fontSize: R(i + 5, 50, 110), transform: `rotate(${lt * R(i + 7, -200, 200)}deg)` }}>{emojis[i % emojis.length]}</div>)}
      <div style={{ position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
        <Gloss text={c.text || 'FIN'} at={s + 0.3} size={460} bright />
        {c.sub !== '' && (c.sub ?? 'Colorín colorado, este cuento se ha acabado').split(',').map((l, i) => <Small key={i} at={s + 1.2 + i * 0.3} size={66} white>{l.trim() + (i === 0 && (c.sub ?? 'x,').includes(',') ? ',' : '')}</Small>)}
      </div>
    </AbsoluteFill>
  );
};

const Moral = ({ sc, s }) => {
  const t = useT(), c = sc.moral || {}, words = (c.text || '').split(' '), a = s + 0.9, b = Math.max(a + 1, sc.to - 0.6);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fff3d6, #e8c98f)' }}>
      <div style={{ position: 'absolute', left: 90, top: 330, width: 900, minHeight: 1000, background: '#fff8e8', borderRadius: 60, border: '10px solid #8a5a2b', boxShadow: '0 24px 40px #0004', padding: '70px 60px', transform: `scale(${pop(t, s, 0.5)})` }}>
        <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 120, letterSpacing: '-0.04em', textAlign: 'center', transform: 'skewX(-9deg)' }}>{c.title || 'MORALEJA'}</div>
        <div style={{ ...txt(words.length > 14 ? 62 : 72), marginTop: 50, textAlign: 'center' }}>
          {words.map((w, i) => { const kk = fade(t, a + ((b - a) * i) / words.length, 0.25); return <span key={i} style={{ opacity: kk, display: 'inline-block', marginRight: 16, transform: `translateY(${(1 - kk) * 16}px)` }}>{w}</span>; })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1450, textAlign: 'center', fontSize: 300, lineHeight: 1, transform: `translateY(${-Math.abs(Math.sin(t * 3)) * 40}px)`, opacity: fade(t, s + 0.6) }}>{c.emoji || '🦉'}</div>
    </AbsoluteFill>
  );
};

// --- speech: diálogo entre dos personajes ---------------------------------------------------------------------------------------------
const Speech = ({ sc, s }) => {
  const t = useT(), c = sc.speech || {}, lines = c.lines || [];
  const active = (who) => lines.some((l, i) => l.who === who && t >= l.at && t < (lines[i + 1]?.at ?? sc.to));
  const side = (who, x, flip) => ({ emoji: (c[who] || {}).emoji || '🐻', x, y: 0.74, size: 400, flip, move: active(who) ? 'bounce' : 'sway', at: s });
  return (
    <AbsoluteFill>
      <World world={c.world || 'forest'} />
      <Actors actors={[side('left', 0.25, true), side('right', 0.76, false)]} />
      {lines.map((l, i) => <Bubble key={i} text={l.text} x={(l.who === 'left' ? 0.25 : 0.76) * 1080} y={620 + (l.who === 'left' ? 0 : 60)} W={1080} at={l.at} dur={Math.max(1.6, (lines[i + 1]?.at ?? sc.to) - l.at - 0.2)} size={52} />)}
      {['left', 'right'].map((who) => c[who]?.name && <div key={who} style={{ position: 'absolute', left: (who === 'left' ? 0.25 : 0.76) * 1080 - 160, top: 1690, width: 320, textAlign: 'center', ...txt(54, '#fff', 800), textShadow: '0 4px 0 #0007' }}>{c[who].name}</div>)}
    </AbsoluteFill>
  );
};

// --- counting / letter / shapes (educativo) ---------------------------------------------------------------------------------------------
const Counting = ({ sc, s }) => {
  const t = useT(), c = sc.counting || {}, n = c.n ?? 5, em = c.emoji || '🍎', step = c.step ?? 0.7;
  const shown = Array.from({ length: n }, (_, i) => t >= s + 0.5 + i * step).filter(Boolean).length;
  const cols = n <= 3 ? n : n <= 6 ? 3 : 4, sz = n <= 4 ? 300 : n <= 6 ? 250 : 200;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #fff3c4, #ffd9a0)' }}>
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center', ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 420, lineHeight: 1, transform: `skewX(-9deg) scale(${1 + 0.1 * (1 - fade(t, s + 0.5 + (shown - 1) * step, 0.3)) * (shown > 0 ? 1 : 0)})`, display: 'block' }}>{shown}</div>
      {c.label && <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', ...txt(84, '#7a4a12', 800), opacity: fade(t, s + 0.6) }}>{c.label}</div>}
      <div style={{ position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sz}px)`, gap: 20 }}>
          {Array.from({ length: n }, (_, i) => { const a = s + 0.5 + i * step, k = pop(t, a); return (
            <div key={i} style={{ width: sz, height: sz, position: 'relative', display: 'grid', placeItems: 'center', fontSize: sz * 0.72, transform: `scale(${k}) rotate(${(1 - k) * 40}deg)`, filter: 'drop-shadow(0 12px 10px #0003)' }}>
              {em}
              <div style={{ position: 'absolute', right: 6, top: 6, width: 70, height: 70, borderRadius: 35, background: TH.accent, color: '#fff', ...txt(46, '#fff', 800), display: 'grid', placeItems: 'center', opacity: k }}>{i + 1}</div>
            </div>); })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Letter = ({ sc, s }) => {
  const t = useT(), c = sc.letter || {}, L = (c.letter || 'A').toString(), word = c.word || '', k = pop(t, s + 0.15, 0.5);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #c9f0ff, #fff3c4)' }}>
      <div style={{ position: 'absolute', top: 160, left: 60, right: 60, height: 900, borderRadius: 80, background: '#fff', border: `12px solid ${TH.accent}`, boxShadow: '0 24px 40px #0003', transform: `scale(${k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 620, letterSpacing: '-0.05em', lineHeight: 1 }}>{L.toUpperCase()}<span style={{ fontSize: 460 }}>{L.toLowerCase()}</span></div>
      </div>
      <div style={{ position: 'absolute', top: 1090, left: 0, right: 0, textAlign: 'center', fontSize: 330, lineHeight: 1, transform: `translateY(${-Math.abs(Math.sin(t * 3.2)) * 50}px) scale(${pop(t, s + 0.9)})` }}>{c.emoji}</div>
      <div style={{ position: 'absolute', top: 1500, left: 0, right: 0, textAlign: 'center', ...txt(170, '#3a2a1a', 800) }}>
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
  const t = useT(), items = (sc.shapes?.items || []).map((x, i) => (typeof x === 'string' ? { shape: x } : x)), n = items.length, cols = n <= 2 ? n : n <= 4 ? 2 : 3, sz = cols === 1 ? 560 : cols === 2 ? 400 : 290;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #d9f3ff, #fff0c9)' }}>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sz + 40}px)`, gap: 40, justifyItems: 'center' }}>
          {items.map((it, i) => { const k = pop(t, s + 0.4 + i * 0.6, 0.45), col = it.color || PALETTE[i % PALETTE.length], f = SHAPES[it.shape] || SHAPES.circle; return (
            <div key={i} style={{ textAlign: 'center', transform: `scale(${k}) rotate(${(1 - k) * 90}deg)` }}>
              <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ filter: 'drop-shadow(0 14px 12px #0003)' }}><g fill={col} stroke="#fff" strokeWidth="12">{f(sz)}</g></svg>
              <div style={{ ...txt(66, '#3a2a1a', 800), marginTop: 6 }}>{it.label || SHAPE_ES[it.shape] || ''}</div>
            </div>); })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- journey: mapa del tesoro con recorrido ---------------------------------------------------------------------------------------------
const Journey = ({ sc, s }) => {
  const t = useT(), c = sc.journey || {}, pts = (c.points || []).map((p) => ({ ...p, X: p.x * 1000 + 40, Y: p.y * 1500 + 200 }));
  const total = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.X - pts[i].X, p.Y - pts[i].Y), 0) || 1;
  const p = prog(t, s + 0.8, Math.max(s + 1.5, sc.to - 0.6), Easing.inOut(Easing.cubic)) * total;
  let acc = 0, pos = pts[0] ? [pts[0].X, pts[0].Y] : [0, 0];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].X - pts[i - 1].X, pts[i].Y - pts[i - 1].Y); if (p <= acc + d) { const f = (p - acc) / d; pos = [pts[i - 1].X + (pts[i].X - pts[i - 1].X) * f, pts[i - 1].Y + (pts[i].Y - pts[i - 1].Y) * f]; break; } acc += d; pos = [pts[i].X, pts[i].Y]; }
  const path = pts.map((q, i) => `${i ? 'L' : 'M'}${q.X} ${q.Y}`).join(' ');
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #fbe9bd, #e6c98a)' }}>
      <div style={{ position: 'absolute', inset: 50, border: '14px solid #8a5a2b', borderRadius: 40 }} />
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        <path d={path} pathLength="1" fill="none" stroke="#c0392b" strokeWidth="14" strokeLinecap="round" strokeDasharray="0.012 0.02" strokeDashoffset={1 - Math.min(1, p / total)} opacity=".9" />
      </svg>
      {pts.map((q, i) => { const k = pop(t, s + 0.3 + i * 0.35); return (
        <div key={i} style={{ position: 'absolute', left: q.X - 90, top: q.Y - 100, width: 180, textAlign: 'center', transform: `scale(${k})` }}>
          <div style={{ fontSize: 150, lineHeight: 1, filter: 'drop-shadow(0 8px 6px #0004)' }}>{q.emoji || '📍'}</div>
          {q.label && <div style={{ ...txt(42, '#5a3a12', 800), background: '#fff8e8cc', borderRadius: 16, padding: '2px 12px', marginTop: 4 }}>{q.label}</div>}
        </div>); })}
      <div style={{ position: 'absolute', left: pos[0] - 80, top: pos[1] - 190 - Math.abs(Math.sin(t * 8)) * 18, fontSize: 170, lineHeight: 1, transform: 'scaleX(-1)', filter: 'drop-shadow(0 10px 8px #0005)' }}>{c.traveler || '🧒'}</div>
    </AbsoluteFill>
  );
};

// --- magic: aparición mágica ------------------------------------------------------------------------------------------------------------------------
const Magic = ({ sc, s }) => {
  const t = useT(), c = sc.magic || {}, lt = Math.max(0, t - s), k = pop(t, s + 0.6, 0.7);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, #6a3fd1, #1a0f3a 70%)' }}>
      <div style={{ position: 'absolute', left: -300, top: 200, width: 1680, height: 1680, borderRadius: '50%', background: `repeating-conic-gradient(from ${lt * 25}deg, #ffffff22 0deg 8deg, transparent 8deg 24deg)`, opacity: fade(t, s + 0.3) }} />
      {Array.from({ length: 34 }, (_, i) => { const a = R(i, 0, Math.PI * 2), d = prog(t, s + 0.5 + R(i + 40, 0, 0.5), s + 1.8) * R(i + 20, 250, 700), o = 1 - prog(t, s + 1.6, s + 2.6); return <div key={i} style={{ position: 'absolute', left: 540 + Math.cos(a) * d - 30, top: 900 + Math.sin(a) * d - 30, fontSize: R(i + 7, 40, 90), opacity: o, transform: `rotate(${lt * 120 + i * 30}deg)` }}>{i % 3 ? '✨' : '⭐'}</div>; })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontSize: 560, lineHeight: 1, transform: `scale(${k}) rotate(${(1 - k) * 160}deg)`, filter: 'drop-shadow(0 0 60px #ffd96699)' }}>{c.emoji || '🦄'}</div>
      {c.text && <div style={{ position: 'absolute', left: 0, right: 0, top: 1350, display: 'flex', justifyContent: 'center' }}><Gloss text={c.text} at={s + 1.4} size={Math.min(190, 900 / Math.max(4, c.text.length * 0.7))} bright /></div>}
    </AbsoluteFill>
  );
};

export const STORY_LAYOUTS = { scene: Scene, storybook: Storybook, title: Title, theend: TheEnd, moral: Moral, speech: Speech, counting: Counting, letter: Letter, shapes: Shapes, journey: Journey, magic: Magic };
export const FULL_LAYOUTS = ['scene', 'storybook', 'title', 'theend', 'moral', 'speech', 'counting', 'letter', 'shapes', 'journey', 'magic'];
