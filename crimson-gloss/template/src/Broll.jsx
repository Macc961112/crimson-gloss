// Catálogo de B-roll (escenas "inserto"): cada layout ilustra un tipo de idea distinto.
// Se elige con `layout` en la escena: phone, stat, chart, steps, checklist, compare, quote, chat, browser,
// terminal, grid, meter, rain, notifs, rating, image, clip.
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile } from 'remotion';
import { Gloss, Small, useT, prog, R, fit, F, glossFill, TH, stickerOutline, clamp, FPS } from './Cg';
import { STORY_LAYOUTS, FULL_LAYOUTS } from './Story';
import { GENERAL_LAYOUTS } from './General';

const pop = (t, at, d = 0.38) => interpolate(t, [at, at + d], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
const fade = (t, at, d = 0.3) => interpolate(t, [at, at + d], [0, 1], clamp);
const card = (o = {}) => ({ background: '#fff', borderRadius: 34, border: `7px solid ${TH.accent}`, boxShadow: '0 24px 50px #0004', ...o });
const txt = (size, color = '#16130f', w = 700) => ({ fontFamily: F, fontWeight: w, fontSize: size, color, letterSpacing: '-0.03em', lineHeight: 1.05 });
const isDark = (sc) => ['night', 'gold'].includes(sc.bg);
const when = (s, it, i, step = 0.6) => it.at ?? s + 0.55 + i * step;
const norm = (it) => (typeof it === 'string' ? { text: it } : it);
const Body = ({ children, top = 620, h = 1060, gap = 0 }) => <div style={{ position: 'absolute', left: 0, right: 0, top, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap }}>{children}</div>;

// Texto de cabecera (para todos los layouts menos phone)
const Header = ({ sc }) => {
  const lines = sc.lines || [];
  if (!lines.length) return null;
  return (
    <div style={{ position: 'absolute', top: 150, left: 70, width: 940, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {lines.map((l, i) => l.gloss
        ? <Gloss key={i} text={l.gloss} at={l.at} until={sc.to - 0.2} size={fit(l.gloss, 880, l.size ?? 200)} bright={isDark(sc)} />
        : <Small key={i} at={l.at} until={sc.to - 0.2} size={l.size ?? 56} white={isDark(sc)}>{l.small}</Small>)}
    </div>
  );
};

// --- phone: marco de móvil + objeto grande (el original) ---------------------------------
const Phone = ({ sc, s }) => {
  const t = useT();
  const p = prog(t, s, s + 0.4), phoneIn = prog(t, s + 0.1, s + 0.55);
  const obj = sc.object || {}, bob = Math.sin(t * 2.2) * 10, lines = sc.lines || [];
  return (
    <>
      <div style={{ position: 'absolute', left: 140, top: 260, width: 800, height: 1100, borderRadius: 120, border: `9px solid ${TH.soft}`, background: 'linear-gradient(160deg, #ffffff50, #ffffff12)', transform: `translateY(${(1 - phoneIn) * -300}px)`, opacity: phoneIn, boxShadow: `0 0 40px ${TH.soft}55` }}>
        <div style={{ position: 'absolute', left: 330, top: 28, width: 140, height: 34, borderRadius: 18, background: TH.accent }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * 500 + bob}px) scale(${0.9 + p * 0.1})`, filter: 'drop-shadow(0 30px 30px #0003)' }}>
        {obj.image ? <Img src={staticFile(obj.image)} style={{ height: 760, objectFit: 'contain' }} /> : <div style={{ fontSize: 560, lineHeight: 1 }}>{obj.emoji || '✨'}</div>}
      </div>
      {(sc.stickers || []).map((e, i) => <div key={i} style={{ position: 'absolute', left: [40, 800, 80, 810][i % 4], top: [1060, 1100, 1500, 1480][i % 4], fontSize: 150, textShadow: stickerOutline, transform: `translate(${Math.sin(t * 2 + i) * 10}px, ${Math.cos(t * 2.4 + i) * 12}px) rotate(${-8 + i * 9 + Math.sin(t * 3) * 4}deg)`, opacity: phoneIn }}>{e}</div>)}
      <div style={{ position: 'absolute', top: 400, width: 800, left: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {lines.map((l, i) => l.gloss
          ? <Gloss key={i} text={l.gloss} at={l.at} until={sc.to - 0.2} size={fit(l.gloss, 700, l.size ?? 160)} bright={isDark(sc)} />
          : <Small key={i} at={l.at} until={sc.to - 0.2} size={l.size ?? 60} white={isDark(sc)}>{l.small}</Small>)}
      </div>
    </>
  );
};

// --- stat: número grande que cuenta --------------------------------------------------------
const Stat = ({ sc, s }) => {
  const t = useT(), st = sc.stat || {};
  const p = prog(t, s + 0.3, s + 1.7, Easing.out(Easing.cubic)), k = pop(t, s + 0.1);
  const val = (st.from ?? 0) + ((st.value ?? 0) - (st.from ?? 0)) * p, dec = st.decimals ?? 0;
  const num = (st.prefix || '') + val.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (st.suffix || '');
  return (
    <Body>
      {st.emoji && <div style={{ fontSize: 200, transform: `scale(${k}) rotate(${(1 - k) * 30}deg)`, filter: 'drop-shadow(0 20px 20px #0003)' }}>{st.emoji}</div>}
      <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: fit(num, 920, 420), lineHeight: 1, letterSpacing: '-0.05em', whiteSpace: 'nowrap', transform: `skewX(-9deg) scale(${0.75 + 0.25 * k})`, filter: 'drop-shadow(0 20px 30px #0005)' }}>{num}</div>
      {st.label && <div style={{ ...txt(76, isDark(sc) ? '#fff' : '#16130f', 500), fontStyle: 'italic', marginTop: 10, opacity: fade(t, s + 0.8) }}>{st.label}</div>}
    </Body>
  );
};

// --- chart: línea / área / barras que se dibujan ------------------------------------------
const Chart = ({ sc, s }) => {
  const t = useT(), c = sc.chart || {}, up = c.up ?? true, kind = c.kind || 'line';
  const data = c.data || (up ? [10, 16, 13, 22, 20, 31, 36, 34, 47, 60] : [60, 52, 55, 41, 43, 30, 26, 28, 15, 8]);
  const W = 800, H = 560, pad = 36, mx = Math.max(...data), mn = Math.min(...data, 0);
  const xy = data.map((v, i) => [pad + (i * (W - 2 * pad)) / (data.length - 1), H - pad - ((v - mn) / (mx - mn || 1)) * (H - 2 * pad)]);
  const d = xy.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ');
  const draw = prog(t, s + 0.4, s + 1.9, Easing.inOut(Easing.cubic));
  const col = c.color || (up ? '#2fd27a' : '#ff4d5e');
  const f = draw * (data.length - 1), i0 = Math.min(data.length - 2, Math.floor(f)), fr = f - i0;
  const end = [lerp(xy[i0][0], xy[i0 + 1][0], fr), lerp(xy[i0][1], xy[i0 + 1][1], fr)];
  return (
    <Body>
      <div style={card({ padding: 30, width: W + 60 })}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs><linearGradient id="cgArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} stopOpacity=".35" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient><clipPath id="cgClip"><rect x="0" y="0" width={end[0] + 2} height={H} /></clipPath></defs>
          {[0, 1, 2, 3].map((g) => <line key={g} x1={pad} x2={W - pad} y1={pad + (g * (H - 2 * pad)) / 3} y2={pad + (g * (H - 2 * pad)) / 3} stroke="#00000014" strokeWidth="2" />)}
          {kind === 'bar'
            ? data.map((v, i) => { const hh = ((v - mn) / (mx - mn || 1)) * (H - 2 * pad) * pop(t, s + 0.4 + i * 0.12); return <rect key={i} x={xy[i][0] - 28} y={H - pad - hh} width="56" height={hh} rx="10" fill={i === data.length - 1 ? col : mixA(col)} />; })
            : <><path d={`${d} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z`} fill="url(#cgArea)" clipPath="url(#cgClip)" /><path d={d} pathLength="1" fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset={1 - draw} /><circle cx={end[0]} cy={end[1]} r={16 + 4 * Math.sin(t * 8)} fill={col} stroke="#fff" strokeWidth="5" /></>}
        </svg>
      </div>
      <div style={{ ...txt(120, col, 800), marginTop: 36, opacity: fade(t, s + 1.4), transform: `scale(${pop(t, s + 1.4)})` }}>{up ? '▲' : '▼'} {c.label || ''}</div>
    </Body>
  );
};
const lerp = (a, b, k) => a + (b - a) * k;
const mixA = (hex) => hex + '88';

// --- steps: pasos numerados ---------------------------------------------------------------
const Steps = ({ sc, s }) => {
  const t = useT(), items = (sc.steps || []).map(norm);
  return (
    <Body gap={14}>
      {items.map((it, i) => {
        const a = when(s, it, i, 0.75), k = pop(t, a);
        return (
          <div key={i} style={{ width: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {i > 0 && <div style={{ width: 8, height: 44 * fade(t, a - 0.2), background: TH.accent, borderRadius: 4 }} />}
            <div style={card({ width: 900, padding: '24px 34px', display: 'flex', alignItems: 'center', gap: 30, transform: `scale(${k}) translateX(${(1 - k) * 80}px)`, opacity: k })}>
              <div style={{ width: 100, height: 100, borderRadius: 50, background: TH.accent, color: '#fff', ...txt(66, '#fff', 800), display: 'grid', placeItems: 'center', flex: 'none' }}>{i + 1}</div>
              <div style={{ ...txt(it.text.length > 22 ? 50 : 60), flex: 1 }}>{it.text}</div>
              {it.emoji && <div style={{ fontSize: 84 }}>{it.emoji}</div>}
            </div>
          </div>
        );
      })}
    </Body>
  );
};

// --- checklist: ✅ / ❌ --------------------------------------------------------------------
const Checklist = ({ sc, s }) => {
  const t = useT(), items = (sc.items || []).map(norm), dark = isDark(sc);
  return (
    <Body gap={30}>
      {items.map((it, i) => {
        const a = when(s, it, i, 0.55), k = pop(t, a);
        return (
          <div key={i} style={{ width: 900, display: 'flex', alignItems: 'center', gap: 30, background: dark ? '#ffffff18' : '#ffffffcc', borderRadius: 30, padding: '22px 34px', border: `5px solid ${it.ok === false ? '#ff4d5e' : TH.accent}`, transform: `translateX(${(1 - k) * -300}px)`, opacity: k }}>
            <div style={{ fontSize: 90, transform: `scale(${pop(t, a + 0.25)})` }}>{it.ok === false ? '❌' : '✅'}</div>
            <div style={{ ...txt(it.text.length > 20 ? 56 : 68, dark ? '#fff' : '#16130f') }}>{it.text}</div>
          </div>
        );
      })}
    </Body>
  );
};

// --- compare: A vs B ---------------------------------------------------------------------------
const Compare = ({ sc, s }) => {
  const t = useT(), c = sc.compare || {};
  const col = (side, o, bad, x) => {
    const items = (o.items || []).map(norm), k = pop(t, s + (bad ? 0.2 : 0.55));
    return (
      <div style={{ width: 430, transform: `translateX(${(1 - k) * x}px)`, opacity: k }}>
        <div style={{ background: bad ? '#6b6b78' : TH.accent, borderRadius: '30px 30px 0 0', padding: '22px 10px', textAlign: 'center', ...txt(62, '#fff', 800) }}>{o.emoji || (bad ? '❌' : '✅')} {o.title}</div>
        <div style={{ background: '#fff', borderRadius: '0 0 30px 30px', border: `6px solid ${bad ? '#6b6b78' : TH.accent}`, borderTop: 0, padding: '18px 26px', minHeight: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {items.map((it, i) => <div key={i} style={{ ...txt(44, '#16130f', 600), opacity: fade(t, when(s, it, i + (bad ? 0 : 1), 0.5)), transform: `translateY(${(1 - fade(t, when(s, it, i + (bad ? 0 : 1), 0.5))) * 20}px)` }}>{bad ? '✕' : '✓'} {it.text}</div>)}
        </div>
      </div>
    );
  };
  return (
    <Body>
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', position: 'relative' }}>
        {col('l', c.left || {}, true, -260)}{col('r', c.right || {}, false, 260)}
        <div style={{ position: 'absolute', left: '50%', top: 170, width: 120, height: 120, marginLeft: -60, borderRadius: 60, background: '#16130f', border: `6px solid ${TH.accent}`, ...txt(54, '#fff', 800), display: 'grid', placeItems: 'center', transform: `scale(${pop(t, s + 0.8)})` }}>VS</div>
      </div>
    </Body>
  );
};

// --- quote: cita que aparece palabra a palabra -------------------------------------------------
const Quote = ({ sc, s }) => {
  const t = useT(), q = sc.quote || {}, words = (q.text || '').split(' ');
  const a = s + 0.4, b = Math.max(a + 0.8, sc.to - 0.7), dark = isDark(sc);
  return (
    <Body>
      <div style={{ width: 920, position: 'relative' }}>
        <div style={{ ...glossFill(), ...(dark ? { backgroundImage: 'linear-gradient(180deg, #ff9a9a, #ff4a4a)' } : {}), fontFamily: F, fontWeight: 800, fontSize: 380, lineHeight: 0.7, transform: `scale(${pop(t, s + 0.1)})`, transformOrigin: 'left top' }}>“</div>
        <div style={{ ...txt(words.length > 12 ? 64 : 80, dark ? '#fff' : '#16130f', 800), fontStyle: 'italic', marginTop: 10 }}>
          {words.map((w, i) => { const k = fade(t, a + ((b - a) * i) / words.length, 0.25); return <span key={i} style={{ opacity: k, display: 'inline-block', transform: `translateY(${(1 - k) * 18}px)`, marginRight: 18 }}>{w}</span>; })}
        </div>
        {q.author && <div style={{ ...txt(50, dark ? '#ffb3bd' : TH.accent, 600), marginTop: 36, opacity: fade(t, b) }}>— {q.author}</div>}
      </div>
    </Body>
  );
};

// --- chat: mensajes con indicador de escribiendo ---------------------------------------------------
const Chat = ({ sc, s }) => {
  const t = useT(), c = sc.chat || {}, msgs = c.messages || [];
  return (
    <Body>
      <div style={card({ width: 900, height: 1000, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' })}>
        <div style={{ background: TH.accent, padding: '24px 34px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 90, height: 90, borderRadius: 45, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 60 }}>{c.emoji || '🧑'}</div>
          <div style={txt(56, '#fff', 800)}>{c.name || 'Chat'}</div>
        </div>
        <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', gap: 24, background: '#f4f2f6' }}>
          {msgs.map((m, i) => {
            const a = m.at ?? s + 0.7 + i * 1.1, me = m.from === 'me', k = pop(t, a), typing = !me && t > a - 0.55 && t < a;
            return (
              <div key={i} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: 640 }}>
                {typing && <div style={{ background: '#e2dfe6', borderRadius: 30, padding: '20px 30px', ...txt(50), letterSpacing: 6 }}>{'•'.repeat(1 + (Math.floor(t * 6) % 3))}</div>}
                {t >= a && <div style={{ background: me ? TH.accent : '#fff', color: me ? '#fff' : '#16130f', borderRadius: me ? '34px 34px 6px 34px' : '34px 34px 34px 6px', padding: '22px 32px', ...txt(46, me ? '#fff' : '#16130f', 600), transform: `scale(${k})`, transformOrigin: me ? 'right bottom' : 'left bottom', boxShadow: '0 6px 14px #0002' }}>{m.text}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </Body>
  );
};

// --- browser: ventana de navegador con clic -------------------------------------------------------------
const Browser = ({ sc, s }) => {
  const t = useT(), b = sc.browser || {}, url = b.url || 'tusitio.com';
  const n = Math.floor(interpolate(t, [s + 0.3, s + 1.3], [0, url.length], clamp));
  const cx = interpolate(t, [s + 1.5, s + 2.5], [760, 560], { ...clamp, easing: Easing.out(Easing.cubic) }), cy = interpolate(t, [s + 1.5, s + 2.5], [820, 690], { ...clamp, easing: Easing.out(Easing.cubic) });
  const click = prog(t, s + 2.5, s + 3.0);
  return (
    <Body>
      <div style={card({ width: 920, height: 1000, padding: 0, overflow: 'hidden', position: 'relative' })}>
        <div style={{ background: '#e9e7ee', padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((cl) => <i key={cl} style={{ width: 26, height: 26, borderRadius: 13, background: cl }} />)}
          <div style={{ flex: 1, background: '#fff', borderRadius: 30, padding: '10px 28px', ...txt(38, '#555', 500), marginLeft: 20, whiteSpace: 'nowrap', overflow: 'hidden' }}>🔒 {url.slice(0, n)}<span style={{ opacity: Math.floor(t * 3) % 2 }}>|</span></div>
        </div>
        {b.image
          ? <Img src={staticFile(b.image)} style={{ width: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <div style={{ padding: 40 }}>
            <div style={{ height: 330, borderRadius: 30, background: `linear-gradient(135deg, ${TH.accent}, ${TH.dark})`, display: 'flex', alignItems: 'center', padding: 40, ...txt(78, '#fff', 800) }}>{b.title || 'Tu sitio web'}</div>
            {[0.9, 0.7, 0.8].map((w, i) => <div key={i} style={{ height: 26, width: `${w * 100}%`, borderRadius: 13, background: '#e4e1ea', marginTop: 30 }} />)}
            <div style={{ marginTop: 50, width: 360, background: TH.accent, borderRadius: 40, padding: '20px 0', textAlign: 'center', ...txt(50, '#fff', 800), transform: `scale(${1 - 0.06 * Math.sin(Math.PI * click)})` }}>{b.button || 'Empezar'}</div>
          </div>}
        <svg width="80" height="80" viewBox="0 0 24 24" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 4px 6px #0006)' }}><path d="M4 2l16 9-7 2-3 7z" fill="#16130f" stroke="#fff" strokeWidth="1.4" /></svg>
        {click > 0 && click < 1 && <div style={{ position: 'absolute', left: cx - 60, top: cy - 60, width: 120, height: 120, borderRadius: 60, border: `6px solid ${TH.accent}`, transform: `scale(${0.3 + click})`, opacity: 1 - click }} />}
      </div>
    </Body>
  );
};

// --- terminal: comandos que se escriben --------------------------------------------------------------------
const Terminal = ({ sc, s }) => {
  const t = useT(), tm = sc.terminal || {}, lines = (tm.lines || []).map(norm);
  let at = s + 0.4;
  const timed = lines.map((l) => { const a = l.at ?? at, d = l.kind === 'out' ? 0.35 : Math.max(0.6, l.text.length * 0.045); at = a + d + 0.25; return { ...l, a, d }; });
  return (
    <Body>
      <div style={{ width: 920, height: 900, background: '#0d0d12', borderRadius: 34, border: `7px solid ${TH.accent}`, boxShadow: '0 24px 50px #0006', overflow: 'hidden' }}>
        <div style={{ background: '#1b1b24', padding: '22px 28px', display: 'flex', gap: 14, alignItems: 'center' }}>{['#ff5f57', '#febc2e', '#28c840'].map((cl) => <i key={cl} style={{ width: 26, height: 26, borderRadius: 13, background: cl }} />)}<span style={{ ...txt(34, '#9a9aa8', 500), marginLeft: 20, fontFamily: 'monospace' }}>{tm.title || 'terminal'}</span></div>
        <div style={{ padding: 36, fontFamily: 'monospace', fontSize: 44, lineHeight: 1.5, color: '#e8e8f0' }}>
          {timed.map((l, i) => {
            if (t < l.a) return null;
            const n = l.kind === 'out' ? l.text.length : Math.floor(((t - l.a) / l.d) * l.text.length);
            const cur = i === timed.filter((x) => t >= x.a).length - 1;
            return <div key={i} style={{ color: l.kind === 'out' ? '#5af2a0' : '#e8e8f0', wordBreak: 'break-all' }}>{l.kind === 'out' ? '' : <span style={{ color: TH.light }}>$ </span>}{l.text.slice(0, n)}{cur && Math.floor(t * 3) % 2 === 0 ? '▍' : ''}</div>;
          })}
        </div>
      </div>
    </Body>
  );
};

// --- grid: cuadrícula de iconos ---------------------------------------------------------------------------------
const Grid = ({ sc, s }) => {
  const t = useT(), items = (sc.grid?.items || []).map((x) => (typeof x === 'string' ? { emoji: x } : x));
  const cols = sc.grid?.cols ?? (items.length <= 4 ? 2 : items.length <= 9 ? 3 : 4), sz = cols === 2 ? 380 : cols === 3 ? 270 : 210;
  return (
    <Body>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sz}px)`, gap: 26 }}>
        {items.map((it, i) => { const k = pop(t, s + 0.3 + i * 0.12); return (
          <div key={i} style={card({ width: sz, height: sz, borderRadius: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, transform: `scale(${k}) rotate(${(1 - k) * -12}deg)` })}>
            <div style={{ fontSize: sz * 0.5, lineHeight: 1 }}>{it.emoji}</div>
            {it.label && <div style={txt(sz * 0.14, '#16130f', 700)}>{it.label}</div>}
          </div>
        ); })}
      </div>
    </Body>
  );
};

// --- meter: medidor circular ----------------------------------------------------------------------------------------
const Meter = ({ sc, s }) => {
  const t = useT(), m = sc.meter || {}, v = m.value ?? 70, p = prog(t, s + 0.4, s + 1.9, Easing.out(Easing.cubic)), r = 280, C = 2 * Math.PI * r;
  const num = Math.round(v * p) + (m.suffix ?? '%');
  return (
    <Body>
      <svg width="700" height="700" viewBox="0 0 700 700" style={{ transform: `scale(${pop(t, s + 0.1)})` }}>
        <defs><linearGradient id="cgMeter" x1="0" x2="1"><stop offset="0" stopColor={TH.light} /><stop offset="1" stopColor={TH.dark} /></linearGradient></defs>
        <circle cx="350" cy="350" r={r} fill="#ffffff55" stroke="#00000018" strokeWidth="70" />
        <circle cx="350" cy="350" r={r} fill="none" stroke="url(#cgMeter)" strokeWidth="70" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (v / 100) * p)} transform="rotate(-90 350 350)" style={{ filter: `drop-shadow(0 0 16px ${TH.accent}88)` }} />
        <text x="350" y="395" textAnchor="middle" style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 190, fill: TH.accent, letterSpacing: '-0.05em' }}>{num}</text>
      </svg>
      {m.label && <div style={{ ...txt(70, isDark(sc) ? '#fff' : '#16130f', 600), fontStyle: 'italic', marginTop: 10, opacity: fade(t, s + 1) }}>{m.label}</div>}
    </Body>
  );
};

// --- rain: lluvia de emojis ---------------------------------------------------------------------------------------------
const Rain = ({ sc, s }) => {
  const t = useT(), r = sc.rain || {}, e = r.emoji || '💰', n = r.count ?? 34, lt = Math.max(0, t - s);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {Array.from({ length: n }, (_, i) => {
        const sp = R(i + 7, 380, 760), size = R(i + 31, 90, 190), y = ((lt * sp + R(i + 51, 0, 2400)) % 2500) - 250;
        return <div key={i} style={{ position: 'absolute', left: R(i, -20, 980), top: y, fontSize: size, transform: `rotate(${lt * R(i + 3, -120, 120) + R(i + 9, 0, 360)}deg)`, opacity: 0.9, filter: `blur(${size > 160 ? 2 : 0}px)` }}>{e}</div>;
      })}
      {r.center && <Body><div style={{ fontSize: 520, filter: 'drop-shadow(0 30px 30px #0004)', transform: `scale(${pop(t, s + 0.3)})` }}>{r.center}</div></Body>}
    </AbsoluteFill>
  );
};

// --- notifs: notificaciones que llegan ------------------------------------------------------------------------------------------
const Notifs = ({ sc, s }) => {
  const t = useT(), items = sc.notifs || [];
  return (
    <Body top={600} h={1100} gap={26}>
      {items.map((n, i) => { const a = n.at ?? s + 0.5 + i * 0.8, k = pop(t, a); return (
        <div key={i} style={card({ width: 900, padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 28, borderRadius: 40, transform: `translateY(${(1 - k) * -260}px) scale(${0.9 + 0.1 * k})`, opacity: k })}>
          <div style={{ width: 110, height: 110, borderRadius: 30, background: TH.accent, display: 'grid', placeItems: 'center', fontSize: 70, flex: 'none' }}>{n.app || '🔔'}</div>
          <div><div style={txt(48, '#16130f', 800)}>{n.title}</div><div style={{ ...txt(40, '#555', 500), marginTop: 6 }}>{n.body}</div></div>
        </div>
      ); })}
    </Body>
  );
};

// --- rating: estrellas ---------------------------------------------------------------------------------------------------------------
const Rating = ({ sc, s }) => {
  const t = useT(), r = sc.rating || {}, stars = r.stars ?? 5;
  return (
    <Body gap={20}>
      <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: stars }, (_, i) => <div key={i} style={{ fontSize: 150, transform: `scale(${pop(t, s + 0.3 + i * 0.18)}) rotate(${(1 - pop(t, s + 0.3 + i * 0.18)) * 90}deg)`, filter: 'drop-shadow(0 10px 12px #0003)' }}>⭐</div>)}</div>
      <div style={{ ...glossFill(), fontFamily: F, fontWeight: 800, fontSize: 330, letterSpacing: '-0.05em', lineHeight: 1, transform: `skewX(-9deg) scale(${0.8 + 0.2 * pop(t, s + 1.2)})`, opacity: fade(t, s + 1.2) }}>{r.score || '5.0'}</div>
      {r.label && <div style={{ ...txt(64, isDark(sc) ? '#fff' : '#16130f', 600), fontStyle: 'italic', opacity: fade(t, s + 1.6) }}>{r.label}</div>}
    </Body>
  );
};

// --- image: imagen a pantalla completa con zoom lento (Ken Burns) ---------------------------------------------------------------------
const ImageFull = ({ sc, s }) => {
  const t = useT(), im = sc.image || {}, z = 1 + (im.zoom ?? 0.12) * prog(t, s, sc.to, Easing.linear);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${z}) translate(${(im.pan ?? 0) * (z - 1) * 100}px, 0)` }}><Img src={staticFile(im.src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #000a 0%, transparent 32%, transparent 68%, #000a 100%)' }} />
    </AbsoluteFill>
  );
};

// --- clip: video del usuario en marco ------------------------------------------------------------------------------------------------------
const Clip = ({ sc, s }) => {
  const t = useT(), c = sc.clip || {}, k = pop(t, s + 0.1);
  return (
    <Body>
      <div style={card({ width: 900, height: 1200, padding: 0, overflow: 'hidden', transform: `scale(${k}) rotate(${(1 - k) * 6}deg)` })}>
        <OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round((c.start ?? 0) * FPS)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </Body>
  );
};

const CORE = { phone: Phone, stat: Stat, chart: Chart, steps: Steps, checklist: Checklist, compare: Compare, quote: Quote, chat: Chat, browser: Browser, terminal: Terminal, grid: Grid, meter: Meter, rain: Rain, notifs: Notifs, rating: Rating, image: ImageFull, clip: Clip };
export const LAYOUTS = { ...CORE, ...GENERAL_LAYOUTS, ...STORY_LAYOUTS };
export const isFull = (sc) => FULL_LAYOUTS.includes(sc.layout) || sc.layout === 'image';

export const BrollBody = ({ sc, s }) => {
  const L = LAYOUTS[sc.layout || 'phone'] || Phone;
  return <>{(sc.layout || 'phone') !== 'phone' && <L sc={sc} s={s} />}{(sc.layout || 'phone') === 'phone' && <L sc={sc} s={s} />}{(sc.layout || 'phone') !== 'phone' && <Header sc={sc} />}</>;
};
