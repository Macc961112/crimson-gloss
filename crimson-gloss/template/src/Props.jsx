// Biblioteca de objetos dibujados por código (SVG) con parámetros: color, estado, tamaño.
// Sirve para lo que el guion nombra y no existe como emoji: «barquito azul», «papel rojo», «mochila», «hoja»…
const hexMix = (a, b, k) => {
  const p = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const dk = (c, k = 0.25) => hexMix(c, '#000000', k), lt = (c, k = 0.3) => hexMix(c, '#ffffff', k);

export const PROP_KINDS = ['paperBoat', 'paper', 'flower', 'backpack', 'leaf', 'balloon', 'ball', 'kite', 'fish', 'heart', 'star', 'tree', 'house', 'cake', 'gift', 'umbrella'];
// proporción alto/ancho de cada objeto (para colocarlos sobre el suelo o el agua)
export const PROP_RATIO = { paperBoat: 0.8, paper: 0.78, flower: 1.1, backpack: 1.2, leaf: 0.75, balloon: 1.4, ball: 1, kite: 1.4, fish: 0.6, heart: 0.92, star: 0.95, tree: 1.25, house: 0.95, cake: 0.9, gift: 1, umbrella: 1 };

export const Prop = ({ kind = 'paperBoat', color = '#e53935', size = 200, t = 0, state }) => {
  const h = size * (PROP_RATIO[kind] ?? 1), c = color, d = dk(c), l = lt(c);
  const wrap = (vb, body) => <svg width={size} height={h} viewBox={vb} style={{ overflow: 'visible' }}>{body}</svg>;
  switch (kind) {
    case 'paperBoat': {
      const crooked = state === 'crooked';
      return wrap('0 0 200 160', <g transform={crooked ? 'rotate(-8 100 100)' : undefined}>
        <ellipse cx="100" cy="146" rx="78" ry="8" fill="#0000001f" />
        <g transform={crooked ? 'skewX(-10) translate(14 0)' : undefined}>
          <path d="M18 98 L182 98 L150 142 L50 142Z" fill={c} /><path d="M18 98 L182 98 L170 112 L30 112Z" fill={l} opacity=".5" />
          <path d="M100 8 L168 98 L100 98Z" fill={d} /><path d="M100 8 L32 98 L100 98Z" fill={l} />
          <path d="M100 8 L100 98" stroke={dk(c, 0.45)} strokeWidth="2" opacity=".5" />
          <path d="M50 142 L150 142" stroke={dk(c, 0.4)} strokeWidth="3" opacity=".4" />
        </g>
      </g>);
    }
    case 'paper': {
      const fold = Math.min(1, Math.max(0, state === 'fold' ? (Math.sin(t * 3) + 1) / 2 : 0));
      return wrap('0 0 200 160', <g><rect x="22" y="14" width="156" height="130" rx="8" fill={c} transform={`rotate(${-4 + fold * 6} 100 80)`} /><path d={`M22 14 L${178 - fold * 70} 14 L22 ${144 - fold * 40}Z`} fill={l} opacity=".55" transform={`rotate(${-4 + fold * 6} 100 80)`} /><path d="M22 14 L178 144" stroke={d} strokeWidth="2" opacity=".35" /></g>);
    }
    case 'flower':
      return wrap('0 0 200 220', <g transform={`rotate(${Math.sin(t * 1.5) * 4} 100 210)`}>
        <path d="M100 210 L100 105" stroke="#3d9a4f" strokeWidth="8" strokeLinecap="round" /><path d="M100 170 Q70 150 62 130 Q92 132 100 160Z" fill="#4dbb63" /><path d="M100 150 Q130 132 140 112 Q110 114 100 140Z" fill="#4dbb63" />
        {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="100" cy="68" rx="19" ry="30" fill={c} transform={`rotate(${i * 60} 100 96)`} />)}
        <circle cx="100" cy="96" r="20" fill="#ffd54f" stroke={dk('#ffd54f', 0.2)} strokeWidth="3" />
      </g>);
    case 'backpack':
      return wrap('0 0 200 240', <g>
        <path d="M74 40 Q100 -4 126 40" fill="none" stroke={d} strokeWidth="10" strokeLinecap="round" />
        <rect x="42" y="36" width="116" height="184" rx="38" fill={c} /><path d="M42 74 Q100 110 158 74 L158 70 Q158 36 120 36 L80 36 Q42 36 42 70Z" fill={d} />
        <rect x="68" y="128" width="64" height="62" rx="14" fill={l} opacity=".75" /><rect x="78" y="116" width="44" height="10" rx="5" fill={d} />
        <path d="M32 90 Q22 140 40 180" fill="none" stroke={d} strokeWidth="9" strokeLinecap="round" /><path d="M168 90 Q178 140 160 180" fill="none" stroke={d} strokeWidth="9" strokeLinecap="round" />
      </g>);
    case 'leaf':
      return wrap('0 0 160 120', <g transform={`rotate(${Math.sin(t * 2) * 6} 80 60)`}><path d="M10 100 Q20 20 150 14 Q146 90 40 108Z" fill={c === '#e53935' ? '#43a047' : c} /><path d="M12 104 Q70 62 140 22" fill="none" stroke="#2e7d32" strokeWidth="5" strokeLinecap="round" /><path d="M60 78 L74 98 M86 58 L104 76 M108 42 L126 52" stroke="#2e7d32" strokeWidth="3.5" strokeLinecap="round" /></g>);
    case 'balloon':
      return wrap('0 0 140 196', <g transform={`rotate(${Math.sin(t * 1.6) * 5} 70 140)`}><path d="M70 140 Q60 170 74 196" fill="none" stroke="#777" strokeWidth="2.5" /><ellipse cx="70" cy="66" rx="50" ry="62" fill={c} /><ellipse cx="50" cy="42" rx="12" ry="20" fill="#fff" opacity=".35" /><path d="M62 128 L78 128 L70 138Z" fill={d} /></g>);
    case 'ball':
      return wrap('0 0 200 200', <g><defs><clipPath id={'cgb' + c}><circle cx="100" cy="100" r="88" /></clipPath></defs><circle cx="100" cy="100" r="88" fill={c} /><g clipPath={`url(#cgb${c})`}><rect x="0" y="40" width="200" height="30" fill="#fff" opacity=".85" transform={`rotate(${t * 40} 100 100)`} /><rect x="0" y="130" width="200" height="30" fill="#fff" opacity=".85" transform={`rotate(${t * 40} 100 100)`} /></g><ellipse cx="70" cy="64" rx="22" ry="14" fill="#fff" opacity=".35" /></g>);
    case 'kite':
      return wrap('0 0 140 196', <g transform={`rotate(${Math.sin(t * 2) * 8} 70 90)`}><path d="M70 0 L130 70 L70 150 L10 70Z" fill={c} /><path d="M70 0 L70 150 M10 70 L130 70" stroke={d} strokeWidth="3" /><path d="M70 150 Q50 168 70 182 Q90 196 70 212" fill="none" stroke="#e65100" strokeWidth="4" /></g>);
    case 'fish':
      return wrap('0 0 200 120', <g transform={`translate(${Math.sin(t * 5) * 3} 0)`}><path d="M150 60 L196 20 L196 100Z" fill={d} /><ellipse cx="90" cy="60" rx="76" ry="44" fill={c} /><path d="M40 60 Q90 30 140 60" fill="none" stroke={l} strokeWidth="4" opacity=".6" /><circle cx="52" cy="50" r="9" fill="#fff" /><circle cx="50" cy="50" r="4.5" fill="#222" /></g>);
    case 'heart':
      return wrap('0 0 200 184', <path d="M100 176 C10 110 14 24 66 24 C84 24 98 36 100 52 C102 36 116 24 134 24 C186 24 190 110 100 176Z" fill={c} stroke={d} strokeWidth="5" />);
    case 'star':
      return wrap('0 0 200 190', <path d={Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 40 : 92, a = (Math.PI / 5) * i - Math.PI / 2; return `${i ? 'L' : 'M'}${100 + r * Math.cos(a)} ${98 + r * Math.sin(a)}`; }).join(' ') + 'Z'} fill={c} stroke={d} strokeWidth="5" strokeLinejoin="round" />);
    case 'tree':
      return wrap('0 0 200 250', <g><rect x="88" y="150" width="24" height="96" rx="6" fill="#8d6e63" /><circle cx="100" cy="96" r="70" fill="#43a047" /><circle cx="60" cy="120" r="46" fill="#4caf50" /><circle cx="142" cy="116" r="48" fill="#388e3c" /><circle cx="84" cy="70" r="14" fill="#66bb6a" opacity=".6" /></g>);
    case 'house':
      return wrap('0 0 200 190', <g><rect x="30" y="86" width="140" height="96" fill={l} /><path d="M14 90 L100 16 L186 90Z" fill={c} /><rect x="84" y="128" width="34" height="54" rx="4" fill={d} /><rect x="44" y="108" width="30" height="28" fill="#bde6ff" stroke="#fff" strokeWidth="4" /><rect x="128" y="108" width="30" height="28" fill="#bde6ff" stroke="#fff" strokeWidth="4" /></g>);
    case 'cake':
      return wrap('0 0 200 180', <g><rect x="30" y="92" width="140" height="78" rx="10" fill={c} /><path d="M30 104 Q50 128 70 104 Q90 128 110 104 Q130 128 150 104 Q160 118 170 104 L170 92 L30 92Z" fill="#fff" /><rect x="96" y="56" width="8" height="38" fill="#ffd54f" /><path d="M100 54 Q92 40 100 28 Q108 40 100 54Z" fill="#ff9800" /></g>);
    case 'gift':
      return wrap('0 0 200 200', <g><rect x="24" y="76" width="152" height="112" rx="8" fill={c} /><rect x="16" y="56" width="168" height="34" rx="8" fill={d} /><rect x="88" y="56" width="24" height="132" fill="#ffd54f" /><path d="M100 56 Q60 8 52 38 Q56 62 100 56Z M100 56 Q140 8 148 38 Q144 62 100 56Z" fill="#ffd54f" /></g>);
    case 'umbrella':
      return wrap('0 0 200 200', <g><path d="M14 100 Q100 -20 186 100 Q164 88 146 100 Q124 84 100 100 Q76 84 54 100 Q36 88 14 100Z" fill={c} /><path d="M100 98 L100 176 Q100 192 84 190" fill="none" stroke="#555" strokeWidth="7" strokeLinecap="round" /></g>);
    default:
      return wrap('0 0 200 200', <circle cx="100" cy="100" r="80" fill={c} />);
  }
};
