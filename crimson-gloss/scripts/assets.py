#!/usr/bin/env python3
"""Generador de elementos (assets) por código: validar, listar, previsualizar y guardar en la biblioteca.

  python assets.py template WORK NOMBRE        crea work/assets/gen/NOMBRE.json con un esqueleto para rellenar
  python assets.py validate FICHERO.json...    comprueba forma y seguridad (lista blanca de etiquetas SVG)
  python assets.py list [WORK]                 biblioteca de la skill + elementos de este proyecto
  python assets.py preview WORK NOMBRE...      hoja con el elemento, su animación y variantes de color -> WORK/_preview/qa_2.png
  python assets.py promote WORK NOMBRE         copia el elemento del proyecto a la biblioteca de la skill (para reutilizarlo)

Un elemento es un JSON declarativo (sin código ejecutable):
  { "name": "paper-boat", "aliases": ["barquito", "barco de papel"], "viewBox": "0 0 200 160", "surface": "water",
    "params": {"color": "#e53935"}, "variants": ["#2f7de1", "#fbc02d"],
    "layers": [ {"id": "hull", "svg": "<path d='...' fill='{{color}}'/>", "anim": [{"type": "bob", "amp": 4, "speed": 0.5}]} ],
    "states": {"crooked": {"hull": {"transform": "skewX(-10)"}}} }
  Colores: {{color}} {{color:dark}} {{color:light}} {{c2}}… (cualquier parámetro hexadecimal #rrggbb).
  Animaciones: bob slide sway spin pulse blink flap  (amp, speed en ciclos/s, phase, origin "x y").
"""
import html.parser, json, os, re, subprocess, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(SKILL, 'assets_library')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lexicon import norm  # noqa: E402

TAGS = {'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'text', 'tspan'}
ANIMS = {'bob', 'slide', 'sway', 'spin', 'pulse', 'blink', 'flap'}
SURFACES = {'water', 'ground', 'air'}
OK_ATTR_FORBID = re.compile(r'^(on\w+|href|xlink:href|style)$', re.I)

class Scan(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.errs = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() not in TAGS: self.errs.append(f'etiqueta no permitida <{tag}>')
        for k, v in attrs:
            if OK_ATTR_FORBID.match(k): self.errs.append(f'atributo no permitido {k}')
            if v and re.search(r'javascript:|data:|https?:|url\((?!#)', v, re.I): self.errs.append(f'valor no permitido en {k}')
    handle_startendtag = handle_starttag

def validate(spec, name='?'):
    errs, warns = [], []
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,40}', str(spec.get('name', ''))): errs.append('name: minúsculas, números y guiones (2-41 caracteres)')
    vb = str(spec.get('viewBox', '')).split()
    if len(vb) != 4 or not all(re.fullmatch(r'-?\d+(\.\d+)?', x) for x in vb): errs.append('viewBox: "minx miny ancho alto"')
    elif float(vb[2]) <= 0 or float(vb[3]) <= 0: errs.append('viewBox: ancho y alto > 0')
    layers = spec.get('layers')
    if not isinstance(layers, list) or not 1 <= len(layers) <= 40: errs.append('layers: lista de 1 a 40 capas')
    params = spec.get('params', {})
    for k, v in params.items():
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', str(v)): errs.append(f'params.{k}: color #rrggbb')
    ids, used = set(), set()
    for i, L in enumerate(layers or []):
        if not isinstance(L, dict) or not L.get('id') or not isinstance(L.get('svg'), str): errs.append(f'capa {i}: necesita "id" y "svg"'); continue
        if L['id'] in ids: errs.append(f"capa {i}: id repetido «{L['id']}»")
        ids.add(L['id'])
        if len(L['svg']) > 8000: errs.append(f"capa «{L['id']}»: svg > 8 KB")
        sc = Scan(); sc.feed(L['svg']); errs += [f"capa «{L['id']}»: {e}" for e in sc.errs]
        used |= set(re.findall(r'\{\{(\w+)', L['svg']))
        for a in L.get('anim', []):
            if a.get('type') not in ANIMS: errs.append(f"capa «{L['id']}»: animación «{a.get('type')}» desconocida (válidas: {', '.join(sorted(ANIMS))})")
    for u in used - set(params): warns.append(f'se usa {{{{{u}}}}} pero no está en params (saldrá gris)')
    if spec.get('surface') and spec['surface'] not in SURFACES: errs.append('surface: water | ground | air')
    for sn, ov in (spec.get('states') or {}).items():
        for lid in ov:
            if lid not in ids: errs.append(f'states.{sn}: la capa «{lid}» no existe')
    if not spec.get('aliases'): warns.append('sin aliases: el guion no podrá encontrarlo por su nombre (añade p. ej. ["barquito", "barco"])')
    return errs, warns

def load_specs(work=None):
    out = {}
    for d in (LIB, os.path.join(work, 'assets', 'gen') if work else None):
        if d and os.path.isdir(d):
            for f in sorted(os.listdir(d)):
                if f.endswith('.json'):
                    try:
                        sp = json.load(open(os.path.join(d, f), encoding='utf-8')); out[sp.get('name') or f[:-5]] = sp
                    except Exception:
                        pass
    return out

def alias_map(specs):
    """palabra normalizada -> nombre del elemento (incluye plurales sencillos)."""
    m = {}
    for n, sp in specs.items():
        for a in [n.replace('-', ' ')] + list(sp.get('aliases', [])):
            k = norm(a)
            if k: m[k] = n
            if k.endswith('s') and len(k) > 4: m.setdefault(k[:-1], n)
    return m

TEMPLATE = {
    'name': 'NOMBRE', 'aliases': ['palabra que dice el guion'], 'viewBox': '0 0 200 160', 'surface': 'ground',
    'params': {'color': '#e53935'}, 'variants': ['#2f7de1', '#fbc02d'],
    'layers': [
        {'id': 'sombra', 'svg': "<ellipse cx='100' cy='148' rx='70' ry='8' fill='#0000001f'/>"},
        {'id': 'cuerpo', 'svg': "<rect x='40' y='40' width='120' height='100' rx='24' fill='{{color}}'/><rect x='40' y='40' width='120' height='30' rx='14' fill='{{color:light}}'/>", 'anim': [{'type': 'bob', 'amp': 4, 'speed': 0.5}]},
    ],
    'states': {},
}

def cmd_template(work, name):
    d = os.path.join(work, 'assets', 'gen'); os.makedirs(d, exist_ok=True)
    spec = dict(TEMPLATE, name=name)
    path = os.path.join(d, name + '.json')
    if os.path.exists(path): sys.exit(f'ya existe {path}')
    json.dump(spec, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(path)

def cmd_validate(files):
    bad = 0
    for f in files:
        try: spec = json.load(open(f, encoding='utf-8'))
        except Exception as e: print(f'✗ {f}: JSON inválido ({e})'); bad += 1; continue
        errs, warns = validate(spec)
        print(('✓ ' if not errs else '✗ ') + f"{spec.get('name', f)}: {len(spec.get('layers', []))} capas")
        for e in errs: print('   error:', e)
        for w in warns: print('   aviso:', w)
        bad += bool(errs)
    sys.exit(1 if bad else 0)

def cmd_list(work):
    for label, d in (('biblioteca de la skill', LIB), ('este proyecto', os.path.join(work, 'assets', 'gen') if work else None)):
        print(f'== {label} ==')
        if not d or not os.path.isdir(d): print('   (vacío)'); continue
        for f in sorted(os.listdir(d)):
            if f.endswith('.json'):
                sp = json.load(open(os.path.join(d, f), encoding='utf-8'))
                print(f"   {sp.get('name', f):18s} {sp.get('surface', '-'):7s} alias: {', '.join(sp.get('aliases', []))}  params: {', '.join(sp.get('params', {}))}")
    print('== integrados (dibujados en la plantilla) ==\n   niños (kid): pelo, ropa, vestido, estados idle/run/jump/sad/laugh/cheer/point/fold/hold\n   objetos (prop): paperBoat paper flower backpack leaf balloon ball kite fish heart star tree house cake gift umbrella')

def cmd_preview(work, names):
    work = os.path.abspath(work)
    pv = os.path.join(work, '_preview'); os.makedirs(os.path.join(pv, 'assets', 'gen'), exist_ok=True)
    specs = load_specs(work)
    for n in names:
        if n not in specs: sys.exit(f'no existe el elemento «{n}»')
        errs, _ = validate(specs[n])
        if errs: sys.exit(f'«{n}» no valida: {errs[0]}')
        json.dump(specs[n], open(os.path.join(pv, 'assets', 'gen', n + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    plan = {'mode': 'cuento', 'orientation': 'vertical', 'duration': 3.3, 'fps': 30, 'music': None, 'character': None,
            'scenes': [{'type': 'insert', 'layout': 'assetsheet', 'from': 0, 'to': 3.2, 'assetsheet': {'names': names}, 'lines': []}]}
    json.dump(plan, open(os.path.join(pv, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    r = subprocess.run([sys.executable, os.path.join(SKILL, 'scripts', 'render.py'), pv, '--still', '2.0'], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode: sys.exit(r.stdout[-800:] + r.stderr[-800:])
    print(os.path.join(pv, 'qa_2.png'))

def cmd_promote(work, name):
    src = os.path.join(work, 'assets', 'gen', name + '.json')
    if not os.path.exists(src): sys.exit(f'no existe {src}')
    errs, _ = validate(json.load(open(src, encoding='utf-8')))
    if errs: sys.exit('no valida: ' + errs[0])
    os.makedirs(LIB, exist_ok=True)
    import shutil; shutil.copy(src, os.path.join(LIB, name + '.json')); print('guardado en la biblioteca:', os.path.join(LIB, name + '.json'))

def main():
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    c = a[0]
    if c == 'template' and len(a) == 3: cmd_template(a[1], a[2])
    elif c == 'validate' and len(a) >= 2: cmd_validate(a[1:])
    elif c == 'list': cmd_list(a[1] if len(a) > 1 else None)
    elif c == 'preview' and len(a) >= 3: cmd_preview(a[1], a[2:])
    elif c == 'promote' and len(a) == 3: cmd_promote(a[1], a[2])
    else: sys.exit(__doc__)

if __name__ == '__main__':
    main()
