// Niños dibujados por código: identidad (pelo, ropa, color) + estados (quieto, corre, salta, triste, ríe, señala, anima, dobla, sostiene).
const R = (s, lo = 0, hi = 1) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return lo + (x - Math.floor(x)) * (hi - lo); };
const hexMix = (a, b, k) => {
  const p = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

export const KID_DEF = { skin: '#f2c6a0', hair: '#4a2e22', hairStyle: 'short', shirt: '#2f7de1', pants: '#3b3f6b', shoes: '#ffffff', dress: false };
export const KID_MODES = ['idle', 'run', 'jump', 'sad', 'laugh', 'cheer', 'point', 'fold', 'hold'];
export const KID_RATIO = 340 / 200; // alto / ancho

export const Kid = ({ cfg = {}, mode = 'idle', t = 0, size = 520 }) => {
  const C = { ...KID_DEF, ...cfg }, w = size / KID_RATIO;
  const shD = hexMix(C.shirt, '#000000', 0.22), shL = hexMix(C.shirt, '#ffffff', 0.25), skD = hexMix(C.skin, '#7a3a20', 0.25);
  const ph = t * 9, sw = Math.sin(ph);
  let aL = 8 + 4 * Math.sin(t * 2), aR = 8 - 4 * Math.sin(t * 2), lL = 0, lR = 0, dy = Math.sin(t * 2) * 2, tilt = 0, hd = 0, mouth = 'smile', eyes = 'open';
  if (mode === 'run') { aL = 18 + 48 * sw; aR = 18 - 48 * sw; lL = 36 * sw; lR = -36 * sw; dy = -Math.abs(sw) * 14; tilt = 5; mouth = 'open'; }
  else if (mode === 'jump') { aL = 150; aR = 150; lL = 10; lR = 10; dy = -Math.abs(Math.sin(t * 5)) * 50; mouth = 'open'; }
  else if (mode === 'cheer') { aL = 150 + 12 * Math.sin(t * 8); aR = 150 - 12 * Math.sin(t * 8); dy = -Math.abs(Math.sin(t * 6)) * 12; mouth = 'open'; }
  else if (mode === 'laugh') { dy = -Math.abs(Math.sin(t * 7)) * 10; aL = 30 + 16 * Math.sin(t * 7); aR = 30 - 16 * Math.sin(t * 7); mouth = 'open'; eyes = 'happy'; hd = Math.sin(t * 7) * 3; }
  else if (mode === 'sad') { aL = 4; aR = 4; dy = 5; hd = 9; mouth = 'sad'; eyes = 'sad'; }
  else if (mode === 'point') { aL = 8; aR = 100; mouth = 'open'; }
  else if (mode === 'fold') { aL = -42 + 6 * Math.sin(t * 6); aR = -42 - 6 * Math.sin(t * 6); mouth = 'smile'; hd = 4; }
  else if (mode === 'hold') { aL = -40; aR = -40; }
  const blink = Math.floor(t * 0.9 + R(7)) % 4 === 0 && (t * 0.9) % 1 > 0.92 ? 0.1 : 1;
  const limb = (x, y, len, ang, wd, col) => <line x1={x} y1={y} x2={x} y2={y + len} stroke={col} strokeWidth={wd} strokeLinecap="round" transform={`rotate(${ang} ${x} ${y})`} />;
  const hand = (x, y, len, ang) => { const a = (ang * Math.PI) / 180; return <circle cx={x - Math.sin(a) * len} cy={y + Math.cos(a) * len} r="11" fill={C.skin} stroke={skD} strokeWidth="1.5" />; };
  const hairBack = C.hairStyle === 'ponytail' ? <ellipse cx="152" cy="92" rx="15" ry="30" fill={C.hair} transform={`rotate(${Math.sin(t * 4) * 10 + (mode === 'run' ? 22 : 0)} 140 62)`} /> : null;
  const hairFront = {
    short: <path d="M52 72 Q48 20 100 18 Q152 20 148 72 Q134 44 100 46 Q66 44 52 72Z" fill={C.hair} />,
    bob: <path d="M44 100 Q36 16 100 14 Q164 16 156 100 L148 108 Q144 50 100 48 Q56 50 52 108Z" fill={C.hair} />,
    ponytail: <path d="M52 72 Q48 20 100 18 Q152 20 148 72 Q134 44 100 46 Q66 44 52 72Z" fill={C.hair} />,
    curly: <g fill={C.hair}>{[[56, 42], [78, 26], [102, 22], [126, 28], [146, 44], [62, 64], [140, 66]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="18" />)}</g>,
  }[C.hairStyle] || null;
  return (
    <svg width={w} height={size} viewBox="0 0 200 340" style={{ overflow: 'visible' }}>
      <g transform={`translate(0 ${dy}) rotate(${tilt} 100 220)`}>
        {!C.dress && <>{limb(86, 212, 100, lL, 22, C.pants)}{limb(114, 212, 100, -lR, 22, C.pants)}<ellipse cx={86 - Math.sin((lL * Math.PI) / 180) * 100} cy={216 + Math.cos((lL * Math.PI) / 180) * 100} rx="20" ry="10" fill={C.shoes} stroke="#0002" strokeWidth="2" /><ellipse cx={114 + Math.sin((lR * Math.PI) / 180) * 100} cy={216 + Math.cos((lR * Math.PI) / 180) * 100} rx="20" ry="10" fill={C.shoes} stroke="#0002" strokeWidth="2" /></>}
        {C.dress && <>{limb(88, 230, 84, lL, 14, C.skin)}{limb(112, 230, 84, -lR, 14, C.skin)}<ellipse cx="86" cy="316" rx="18" ry="9" fill={C.shoes} stroke="#0002" strokeWidth="2" /><ellipse cx="114" cy="316" rx="18" ry="9" fill={C.shoes} stroke="#0002" strokeWidth="2" /></>}
        {limb(68, 136, 72, aL, 20, C.shirt)}{limb(132, 136, 72, -aR, 20, C.shirt)}
        {C.dress
          ? <path d="M64 126 Q100 110 136 126 L164 240 Q100 256 36 240Z" fill={C.shirt} />
          : <><rect x="62" y="120" width="76" height="102" rx="26" fill={C.shirt} /><path d="M62 150 L138 150" stroke={shL} strokeWidth="9" opacity=".65" /></>}
        {C.dress && <path d="M46 214 Q100 232 154 214" fill="none" stroke={shL} strokeWidth="7" opacity=".7" />}
        <rect x="88" y="104" width="24" height="24" rx="8" fill={C.skin} />
        {hand(68, 136, 72, aL)}{hand(132, 136, 72, -aR)}
        <g transform={`rotate(${hd} 100 100)`}>
          {hairBack}
          <ellipse cx="100" cy="76" rx="48" ry="50" fill={C.skin} />
          <ellipse cx="54" cy="82" rx="8" ry="12" fill={C.skin} /><ellipse cx="146" cy="82" rx="8" ry="12" fill={C.skin} />
          {hairFront}
          <circle cx="72" cy="96" r="9" fill="#ff7a8a" opacity=".28" /><circle cx="128" cy="96" r="9" fill="#ff7a8a" opacity=".28" />
          {eyes === 'happy'
            ? <><path d="M68 78 Q80 66 92 78" stroke="#2a1a14" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M108 78 Q120 66 132 78" stroke="#2a1a14" strokeWidth="5" fill="none" strokeLinecap="round" /></>
            : <><ellipse cx="80" cy="78" rx="7" ry={8 * blink} fill="#2a1a14" /><ellipse cx="120" cy="78" rx="7" ry={8 * blink} fill="#2a1a14" />{blink > 0.5 && <><circle cx="82" cy="75" r="2.6" fill="#fff" /><circle cx="122" cy="75" r="2.6" fill="#fff" /></>}</>}
          {eyes === 'sad' && <><path d="M66 66 L90 72" stroke={C.hair} strokeWidth="4.5" strokeLinecap="round" /><path d="M134 66 L110 72" stroke={C.hair} strokeWidth="4.5" strokeLinecap="round" /></>}
          {mouth === 'smile' && <path d="M82 102 Q100 118 118 102" stroke="#8a2b35" strokeWidth="5" fill="none" strokeLinecap="round" />}
          {mouth === 'open' && <><path d="M80 100 Q100 132 120 100Z" fill="#6e1f2c" /><path d="M88 108 Q100 118 112 108 Q100 114 88 108Z" fill="#ff8a9a" /></>}
          {mouth === 'sad' && <path d="M84 112 Q100 98 116 112" stroke="#8a2b35" strokeWidth="5" fill="none" strokeLinecap="round" />}
          {mode === 'sad' && <ellipse cx="72" cy={100 + ((t * 40) % 40)} rx="4" ry="7" fill="#7ac7ff" opacity={1 - ((t * 40) % 40) / 40} />}
        </g>
      </g>
    </svg>
  );
};
