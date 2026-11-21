// B-roll general (a partir de los tipos habituales: pantalla dividida, línea de tiempo, titular, fotos, precio, detalle/resaltado,
// progreso, cuenta atrás y reacciones).
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from 'remotion';
import { Gloss, useT, prog, R, F, glossFill, TH, clamp } from './Cg';

const pop = (t, at, d = 0.4) => interpolate(t, [at, at + d], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
const fade = (t, at, d = 0.3) => interpolate(t, [at, at + d], [0, 1], clamp);
const card = (o = {}) => ({ background: '#fff', borderRadius: 34, border: `7px solid ${TH.accent}`, boxShadow: '0 24px 50px #0004', ...o });
const txt = (size, color = '#16130f', w = 700) => ({ fontFamily: F, fontWeight: w, fontSize: size, color, letterSpacing: '-0.03em', lineHeight: 1.05 });
const dark = (sc) => ['night', 'gold'].includes(sc.bg);
const Body = ({ children, top = 620, h = 1060, gap = 0 }) => <div style={{ position: 'absolute', left: 0, right: 0, top, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap }}>{children}</div>;
const Visual = ({ v = {}, size }) => (v.image ? <Img src={staticFile(v.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v.emoji ? <div style={{ fontSize: size * 0.55, lineHeight: 1, display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>{v.emoji}</div> : <div style={{ ...txt(size * 0.16, TH.accent, 800), padding: 24, display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', whiteSpace: 'pre-line' }}>{v.text}</div>);

// --- split: pantalla dividida ---------------------------------------------------------------------------
const Split = ({ sc, s }) => {
  const t = useT(), c = sc.split || {}, h = c.dir === 'h', W = h ? 430 : 880, H = h ? 880 : 450;
  const panel = (v, i) => { const k = pop(t, s + 0.2 + i * 0.35); return (
    <div key={i} style={{ position: 'relative', transform: `translate${h ? 'Y' : 'X'}(${(1 - k) * (i ? 300 : -300)}px)`, opacity: k }}>
      <div style={card({ width: W, height: H, overflow: 'hidden', padding: 0 })}><Visual v={v || {}} size={Math.min(W, H)} /></div>
      {v?.label && <div style={{ position: 'absolute', left: 20, bottom: 20, background: TH.accent, color: '#fff', ...txt(46, '#fff', 800), padding: '4px 24px 8px', borderRadius: 16 }}>{v.label}</div>}
    </div>); };
  return <Body><div style={{ display: 'flex', flexDirection: h ? 'row' : 'column', gap: 30 }}>{panel(c.a, 0)}{panel(c.b, 1)}</div></Body>;
};

// --- timeline: línea de tiempo ---------------------------------------------------------------------------------
const Timeline = ({ sc, s }) => {
  const t = useT(), items = sc.timeline || [], n = items.length, rowH = 230;
  return (
    <Body gap={0}>
      <div style={{ position: 'relative', width: 920, height: n * rowH }}>
        <div style={{ position: 'absolute', left: 150, top: 40, width: 10, height: (n * rowH - 80) * prog(t, s + 0.3, s + 0.6 + n * 0.7, Easing.linear), background: TH.accent, borderRadius: 5 }} />
        {items.map((it, i) => { const a = it.at ?? s + 0.5 + i * 0.7, k = pop(t, a); return (
          <div key={i} style={{ position: 'absolute', left: 0, top: i * rowH, width: 920, height: rowH, display: 'flex', alignItems: 'center', transform: `translateX(${(1 - k) * 120}px)`, opacity: k }}>
            <div style={{ width: 120, ...txt(48, dark(sc) ? '#fff' : '#16130f', 800), textAlign: 'right', paddingRight: 8 }}>{it.label}</div>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: '#fff', border: `10px solid ${TH.accent}`, marginLeft: 14, flex: 'none', transform: `scale(${k})` }} />
            <div style={card({ marginLeft: 36, flex: 1, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 22 })}>{it.emoji && <div style={{ fontSize: 80 }}>{it.emoji}</div>}<div style={txt(it.text.length > 24 ? 44 : 54)}>{it.text}</div></div>
          </div>); })}
      </div>
    </Body>
  );
};

// --- headline: portada de periódico ----------------------------------------------------------------------------------
const Headline = ({ sc, s }) => {
  const t = useT(), c = sc.headline || {}, words = (c.title || '').split(' '), k = pop(t, s + 0.1, 0.5);
  return (
    <Body>
      <div style={{ width: 920, background: '#f4ecd6', border: '8px solid #2a2118', borderRadius: 8, padding: '34px 40px 44px', boxShadow: '0 30px 50px #0005', transform: `rotate(${(1 - k) * -8 - 1.5}deg) scale(${k})` }}>
        <div style={{ textAlign: 'center', ...txt(96, '#2a2118', 800), letterSpacing: 4, fontStyle: 'italic', borderBottom: '6px double #2a2118', paddingBottom: 10 }}>{c.paper || 'EL DIARIO'}</div>
        <div style={{ ...txt(34, '#4a3f2e', 600), display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #2a2118', padding: '8px 0' }}><span>{c.date || 'EDICIÓN ESPECIAL'}</span><span>{c.tag || '★ EXCLUSIVA ★'}</span></div>
        <div style={{ marginTop: 26, ...txt(words.length > 6 ? 84 : 104, '#2a2118', 800), textTransform: 'uppercase', lineHeight: 0.98 }}>
          {words.map((w, i) => { const kk = fade(t, s + 0.5 + i * 0.12, 0.2); return <span key={i} style={{ opacity: kk, display: 'inline-block', marginRight: 16, transform: `translateY(${(1 - kk) * 20}px)` }}>{w}</span>; })}
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 26, alignItems: 'center' }}>
          <div style={{ width: 300, height: 260, background: '#d8ceb4', border: '4px solid #2a2118', display: 'grid', placeItems: 'center', fontSize: 170 }}>{c.emoji || '📰'}</div>
          <div style={{ flex: 1 }}>{[0.95, 0.8, 0.9, 0.7, 0.85].map((w, i) => <div key={i} style={{ height: 16, width: `${w * 100}%`, background: '#7a6f58', borderRadius: 8, marginBottom: 16, opacity: fade(t, s + 1 + i * 0.15) }} />)}</div>
        </div>
        {c.sub && <div style={{ ...txt(44, '#4a3f2e', 600), fontStyle: 'italic', marginTop: 20, opacity: fade(t, s + 1.4) }}>{c.sub}</div>}
      </div>
    </Body>
  );
};

// --- polaroids: fotos que caen -------------------------------------------------------------------------------------------
const POS = [[60, 20, -8], [520, 0, 7], [40, 470, 6], [540, 500, -7], [290, 250, 2]];
const Polaroids = ({ sc, s }) => {
  const t = useT(), items = sc.polaroids || [];
  return (
    <Body><div style={{ position: 'relative', width: 960, height: 1000 }}>
      {items.slice(0, 5).map((it, i) => { const a = it.at ?? s + 0.3 + i * 0.5, k = pop(t, a, 0.5), [x, y, r] = POS[i]; return (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: 400, background: '#fff', padding: '22px 22px 70px', boxShadow: '0 20px 40px #0005', transform: `translateY(${(1 - k) * -900}px) rotate(${r + (1 - k) * 25}deg)`, borderRadius: 8 }}>
          <div style={{ width: 356, height: 356, background: 'linear-gradient(160deg,#ffe9ef,#e3f0ff)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}><Visual v={it} size={356} /></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', ...txt(40, '#2a2a2a', 700), fontStyle: 'italic' }}>{it.caption}</div>
        </div>); })}
    </div></Body>
  );
};

// --- price: etiqueta de oferta -----------------------------------------------------------------------------------------------
const Price = ({ sc, s }) => {
  const t = useT(), c = sc.price || {}, k = pop(t, s + 0.2, 0.55), N = 18;
  const star = Array.from({ length: N * 2 }, (_, i) => { const r = i % 2 ? 360 : 440, a = (Math.PI / N) * i; return `${i ? 'L' : 'M'}${450 + r * Math.cos(a)} ${450 + r * Math.sin(a)}`; }).join(' ') + 'Z';
  return (
    <Body>
      <div style={{ position: 'relative', width: 900, height: 900, transform: `scale(${k}) rotate(${(1 - k) * -40}deg)` }}>
        <svg width="900" height="900" viewBox="0 0 900 900" style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 24px 30px #0005)' }}><g transform={`rotate(${t * 12} 450 450)`}><path d={star} fill={TH.accent} stroke="#fff" strokeWidth="14" /></g></svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          {c.label && <div style={{ ...txt(84, '#fff', 800), letterSpacing: 2 }}>{c.label}</div>}
          {c.old && <div style={{ ...txt(100, '#ffffffcc', 700), position: 'relative' }}>{c.old}<div style={{ position: 'absolute', left: -10, right: -10, top: '52%', height: 12, background: '#16130f', borderRadius: 6, transform: `scaleX(${prog(t, s + 0.9, s + 1.2)}) rotate(-6deg)`, transformOrigin: 'left' }} /></div>}
          <div style={{ ...txt(270, '#fff', 800), letterSpacing: '-0.05em', transform: `scale(${0.8 + 0.2 * pop(t, s + 1.2)})`, textShadow: '0 10px 0 #0004' }}>{c.new || '$29'}</div>
          {c.note && <div style={{ ...txt(54, '#fff', 600), fontStyle: 'italic' }}>{c.note}</div>}
        </div>
      </div>
    </Body>
  );
};

// --- callout: detalle resaltado con anillo y flecha ---------------------------------------------------------------------------
const Callout = ({ sc, s }) => {
  const t = useT(), c = sc.callout || {}, ring = c.ring || { x: 0.62, y: 0.4, r: 150 }, d = prog(t, s + 0.8, s + 1.4);
  const W = 880, H = 880, cx = ring.x * W, cy = ring.y * H;
  return (
    <Body>
      <div style={{ position: 'relative', width: W, height: H, ...card({ padding: 0, overflow: 'hidden' }), transform: `scale(${pop(t, s + 0.1)})` }}>
        <Visual v={c} size={W} />
      </div>
      <svg width={W + 80} height={H} viewBox={`-40 0 ${W + 80} ${H}`} style={{ position: 'absolute', top: 90, left: (1080 - W - 80) / 2, overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={TH.accent} strokeWidth="14" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - d} transform={`rotate(-90 ${cx} ${cy})`} style={{ filter: `drop-shadow(0 0 12px ${TH.accent})` }} />
        <circle cx={cx} cy={cy} r={ring.r + 10 + 10 * Math.sin(t * 6)} fill="none" stroke={TH.accent} strokeWidth="4" opacity={0.5 * d} />
      </svg>
      {c.label && <div style={{ position: 'absolute', top: 90 + (ring.y > 0.5 ? 20 : H - 40), left: 0, right: 0, textAlign: 'center' }}><span style={{ background: TH.accent, color: '#fff', ...txt(56, '#fff', 800), padding: '8px 36px 12px', borderRadius: 40, display: 'inline-block', transform: `scale(${pop(t, s + 1.3)})` }}>{c.label}</span></div>}
    </Body>
  );
};

// --- progress / countdown / reaction ----------------------------------------------------------------------------------------------
const Progress = ({ sc, s }) => {
  const t = useT(), c = sc.progress || {}, v = c.value ?? 100, p = prog(t, s + 0.4, s + 2.2, Easing.inOut(Easing.cubic)) * v;
  return (
    <Body gap={30}>
      <div style={card({ width: 900, padding: '50px 50px 60px', transform: `scale(${pop(t, s + 0.1)})` })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...txt(60, '#16130f', 800) }}><span>{c.label || 'Cargando…'}</span><span style={{ color: TH.accent }}>{Math.round(p)}%</span></div>
        <div style={{ height: 70, background: '#00000014', borderRadius: 35, marginTop: 36, overflow: 'hidden' }}><div style={{ width: `${p}%`, height: '100%', background: `linear-gradient(90deg, ${TH.light}, ${TH.dark})`, borderRadius: 35 }} /></div>
        {p >= v - 0.5 && <div style={{ ...txt(76, '#1f9d55', 800), marginTop: 30, textAlign: 'center', transform: `scale(${pop(t, s + 2.2)})` }}>✓ {c.done || '¡Listo!'}</div>}
      </div>
    </Body>
  );
};

const Countdown = ({ sc, s }) => {
  const t = useT(), c = sc.countdown || {}, from = c.from ?? 5, lt = Math.max(0, t - (s + 0.2)), idx = Math.min(from, Math.floor(lt / 0.85)), cur = from - idx, fr = (lt % 0.85) / 0.85;
  return (
    <Body>
      {cur > 0 || lt < from * 0.85
        ? <div style={{ position: 'relative', width: 800, height: 800, display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${24 * (1 - fr) + 4}px solid ${TH.accent}`, transform: `scale(${0.6 + fr * 0.6})`, opacity: 1 - fr }} />
          <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 600, letterSpacing: '-0.05em', lineHeight: 1, transform: `skewX(-9deg) scale(${1.25 - 0.25 * Math.min(1, fr * 4)})` }}>{Math.max(1, cur)}</div>
        </div>
        : <div style={{ fontSize: 520, transform: `scale(${pop(t, s + 0.2 + from * 0.85)})` }}>{c.end || '🚀'}</div>}
    </Body>
  );
};

const Reaction = ({ sc, s }) => {
  const t = useT(), c = sc.reaction || {}, em = c.emojis || ['❤️', '🔥', '👏', '😍', '🎉'], lt = Math.max(0, t - s);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {Array.from({ length: 28 }, (_, i) => { const sp = R(i + 4, 260, 520), y = 2000 - ((lt * sp + R(i + 9, 0, 2000)) % 2300); return <div key={i} style={{ position: 'absolute', left: R(i, 40, 940) + 50 * Math.sin(lt * 2 + i), top: y, fontSize: R(i + 5, 70, 150), opacity: Math.min(1, y / 300), transform: `rotate(${15 * Math.sin(lt * 3 + i)}deg)` }}>{em[i % em.length]}</div>; })}
      <Body><div style={{ fontSize: 480, transform: `scale(${pop(t, s + 0.2) * (1 + 0.06 * Math.sin(t * 8))})`, filter: 'drop-shadow(0 30px 30px #0004)' }}>{c.center || em[0]}</div></Body>
    </AbsoluteFill>
  );
};

export const GENERAL_LAYOUTS = { split: Split, timeline: Timeline, headline: Headline, polaroids: Polaroids, price: Price, callout: Callout, progress: Progress, countdown: Countdown, reaction: Reaction };
