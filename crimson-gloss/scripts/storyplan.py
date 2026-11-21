"""Planificador de cuentos GENERAL: no sabe nada de un cuento concreto.
Lee el guion y decide, con reglas generales:
  · mundo y arroyo/río según los lugares que se nombran
  · personajes con nombre (palabras en mayúscula que se repiten) -> niños dibujados por código, con el color que el texto les asigne
  · animales/figuras -> emoji; objetos -> elementos generados (biblioteca + work/assets/gen) por alias, o dibujos integrados
  · colores junto a los objetos («azul», «roja») -> parámetro de color de ese objeto
  · estados de ánimo y acciones por verbos (triste, ríe, corre, señala, dobla, sostiene…), diálogos con raya o comillas
  · pregunta final -> pantalla para elegir entre las variantes que han aparecido
  · lista de objetos nombrados SIN dibujo -> work/needs_assets.json (para generarlos)
"""
import re, sys, os
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lexicon import ACTORS, WORLD_WORDS, STOP, actor_for, move_for, emoji_for, norm  # noqa: E402
from assets import load_specs, alias_map  # noqa: E402

_C = {'azul': '#2f7de1', 'rojo': '#e53935', 'amarillo': '#fbc02d', 'verde': '#43a047', 'naranja': '#fb8c00', 'morado': '#8e24aa', 'violeta': '#8e24aa',
      'rosa': '#ec407a', 'rosado': '#ec407a', 'blanco': '#f5f5f5', 'negro': '#2b2b33', 'marron': '#795548', 'celeste': '#4fc3f7', 'gris': '#9e9e9e', 'dorado': '#f9a825'}
COLORS = {}
for _k, _v in _C.items():
    stems = {_k, _k[:-1] + 'a', _k + 's', _k[:-1] + 'as', _k[:-1] + 'os', _k + 'es'}
    for _s in stems: COLORS[_s] = (_k, _v)
COLOR_ES = {'#2f7de1': 'Azul', '#e53935': 'Rojo', '#fbc02d': 'Amarillo', '#43a047': 'Verde', '#fb8c00': 'Naranja', '#8e24aa': 'Morado', '#ec407a': 'Rosa', '#f5f5f5': 'Blanco', '#2b2b33': 'Negro', '#795548': 'Marrón', '#4fc3f7': 'Celeste', '#9e9e9e': 'Gris', '#f9a825': 'Dorado'}
NUMS = {'un': 1, 'una': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5}
PROP_NOUNS = {'mochila': 'backpack', 'flor': 'flower', 'globo': 'balloon', 'pelota': 'ball', 'balon': 'ball', 'cometa': 'kite', 'papalote': 'kite', 'pez': 'fish', 'peces': 'fish',
              'arbol': 'tree', 'casa': 'house', 'corazon': 'heart', 'pastel': 'cake', 'tarta': 'cake', 'regalo': 'gift', 'paraguas': 'umbrella', 'papel': 'paper', 'hoja': 'leaf'}
WATER = {'arroyo', 'rio', 'lago', 'laguna', 'estanque', 'charco'}
ABSTRACT = set('parque agua pequeno pequena grande bonito bonita lindo linda hermoso nuevo nueva viejo idea ideas amistad dia dias manana tarde noche vez veces parte cosa cosas forma manera tiempo momento color colores carrera alegria risa risas cuidado lugar mundo vida historia cuento amigo amigos amiga amigas materiales extremo orilla delantera final entonces juntos mientras todas partes pronto'.split())
DET = set('un una unos unas el la los las mi mis su sus tu tus este esta estos estas ese esa'.split())
VERB_END = ('ar', 'er', 'ir', 'aron', 'ieron', 'ando', 'iendo', 'ado', 'ido', 'ia', 'an', 'en', 'mente', 'oso', 'osa')
MODES = [('sad', ('trist', 'llor', 'pena', 'detenid')), ('laugh', ('risa', 'rie', 'riendo', 'rieron', 'content', 'feliz', 'alegr')), ('cheer', ('celebr', 'ganar', 'gano', 'victori', 'hurra')),
         ('point', ('descubr', 'senal', 'mir', 'idea', 'vio', 'encontr')), ('fold', ('dobl', 'arregl', 'ayud', 'constru', 'prepar', 'pint')), ('run', ('corr', 'salt', 'vamos', 'sali', 'persegu')),
         ('hold', ('eligi', 'escog', 'tom', 'llev', 'trajo', 'busc', 'sostuv'))]

def sub_names(text, words):
    """Palabras con mayúscula que se repiten y nunca aparecen en minúscula (nombres de personajes)."""
    toks = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", text)
    low = {t for t in toks if t[:1].islower()}
    cnt = Counter(t for t in toks if t[:1].isupper() and len(t) >= 3)
    return [n for n, c in cnt.items() if c >= 2 and n.lower() not in low and norm(n) not in STOP and norm(n) not in ABSTRACT and not actor_for(n)]

def kid_look(name, shirt, idx):
    girl = name.lower().endswith('a') and name.lower() not in ('luca', 'nikita')
    hairs = ['#4a2e22', '#7a4a1e', '#2a1a10', '#b5651d', '#1f1b16']
    return {'shirt': shirt, 'hairStyle': ('ponytail' if idx % 2 == 0 else 'bob') if girl else ('short' if idx % 2 == 0 else 'curly'), 'dress': girl,
            'hair': hairs[idx % len(hairs)], 'pants': '#3b3f6b', 'skin': ['#f2c6a0', '#e8b48a', '#d49a6a', '#f6d2b0'][idx % 4]}

def story_scenes3(tr, dur, work=None, title=None, layout='mixed', end=True, sentences_from=None):
    words = tr['words']
    text = ' '.join(w['w'] for w in words)
    specs = load_specs(work); amap = alias_map(specs)
    names = sub_names(text, words)
    sents = tr.get('sentences') or (sentences_from(words) if sentences_from else [])
    merged = []
    lq = next((i for i in range(len(sents) - 1, max(-1, len(sents) - 4), -1) if sents[i]['text'].strip().endswith('?')), -1)  # pregunta final: va en su propia pantalla
    for si_, sn in enumerate(sents):
        if merged and si_ != lq and (sn['e'] - sn['s'] < 2.2 or merged[-1]['e'] - merged[-1]['s'] < 1.6) and sn['e'] - merged[-1]['s'] < 8:
            merged[-1] = {'text': merged[-1]['text'] + ' ' + sn['text'], 's': merged[-1]['s'], 'e': sn['e']}
        else: merged.append(dict(sn))
    # colores de ropa: frase con un nombre y un color -> ese color es de esa persona
    shirt = {}
    for sn in sents:
        ns = [n for n in names if re.search(r'\b' + re.escape(n) + r'\b', sn['text'])]
        cs = [COLORS[norm(w)] for w in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", sn['text']) if norm(w) in COLORS]
        if len(ns) == 1 and cs and ns[0] not in shirt: shirt[ns[0]] = cs[0][1]
    palette = ['#2f7de1', '#e53935', '#fbc02d', '#43a047', '#8e24aa', '#fb8c00']
    kids = {n: kid_look(n, shirt.get(n) or [c for c in palette if c not in shirt.values()][i % 6], i) for i, n in enumerate(names)}
    needs, seen_nouns = Counter(), {}
    scenes, world, stream, page, k, last_named, present = [], 'forest', False, 0, 0, None, []
    recent = []   # (asset, color) vistos, para la pregunta final
    t_start, first_narr = 0.0, True
    if title:
        title_to = max(3.2, round(merged[0]['e'] + 0.1, 2)) if merged else 3.2
        if merged and merged[0]['e'] <= title_to: merged = merged[1:]
        scenes.append({'type': 'insert', 'layout': 'title', 'from': 0.0, 'to': title_to, 'title': {'kicker': 'Había una vez…', 'text': title, 'emoji': next((actor_for(w['w']) for w in words if actor_for(w['w'])), '📖'), 'world': 'castle'}, 'lines': []})
        t_start = title_to
    for si, sn in enumerate(merged):
        sw = [w for w in words if w['s'] >= sn['s'] - 0.01 and w['e'] <= sn['e'] + 0.05]
        if not sw: continue
        text_s = sn['text']; frm = max(t_start, sn['s'] - 0.15) if first_narr else round(sn['s'] - 0.15, 2); first_narr = False
        toks = [norm(w['w']) for w in sw]
        m = re.match(r'\s*(moraleja|moral)\b[:,.\s-]*(.*)', text_s, re.I)
        if m:
            scenes.append({'type': 'insert', 'layout': 'moral', 'from': round(frm, 2), 'moral': {'title': 'MORALEJA', 'text': m.group(2).strip() or text_s, 'emoji': '🦉'}, 'lines': [], 'words': sw}); continue
        for w in sw:
            wk = WORLD_WORDS.get(norm(w['w']))
            if wk: world = wk; stream = stream and wk in ('forest', 'park', 'farm', 'jungle', 'castle')
            if norm(w['w']) == 'parque': world = 'park'
            if norm(w['w']) in WATER and world in ('forest', 'park', 'farm', 'jungle', 'castle'): stream = True
            if norm(w['w']) in WATER and world not in ('park', 'forest', 'farm', 'jungle', 'castle'): world, stream = 'park', True
        if any(t in ('magia', 'hechizo', 'varita', 'abracadabra') for t in toks):
            scenes.append({'type': 'insert', 'layout': 'magic', 'from': round(frm, 2), 'magic': {'emoji': '✨', 'text': '¡MAGIA!'}, 'lines': [], 'words': sw}); continue
        # pregunta final -> elegir entre variantes
        if si >= len(merged) - 2 and '?' in text_s and len(recent) >= 2 and not any(x.get('layout') == 'choose' for x in scenes):
            nm = max(Counter(a for a, _ in recent).items(), key=lambda x: x[1])[0]
            cols = []
            for a, c in recent:
                if a == nm and c not in cols: cols.append(c)
            if len(cols) >= 2:
                scenes.append({'type': 'insert', 'layout': 'choose', 'from': round(frm, 2), 'choose': {'world': world, 'stream': stream, 'text': re.sub(r'\s*[¡!].*$', '', text_s.strip()) or text_s.strip(), 'items': [{'asset': nm, 'color': c, 'label': COLOR_ES.get(c, '')} for c in cols[:4]]}, 'lines': [], 'words': sw})
                continue
        named = [n for n in names if re.search(r'\b' + re.escape(n) + r'\b', text_s)]
        plural = any(t in ('amigos', 'amigas', 'ninos', 'ellos', 'juntos', 'todos', 'todas') for t in toks) or bool(re.search(r'\b\d\b', text_s))
        if named: present = list(dict.fromkeys(present + named))[-4:]; last_named = named[0]
        elif not plural and not present: present = []
        mode_of = lambda ws: next((md for md, st in MODES if any(norm(x).startswith(s_) for x in ws for s_ in st)), None)
        sent_mode = mode_of([w['w'] for w in sw])
        # diálogo
        dlg = re.search(r'[«“"]([^»”"]{2,70})[»”"]', text_s) or re.search(r'[—–]\s*([^—–]{3,110}?)(?=\s*[—–]|$)', text_s)
        xs = {0: [], 1: [0.5], 2: [0.3, 0.7], 3: [0.2, 0.5, 0.8], 4: [0.14, 0.38, 0.62, 0.86]}[min(len(present), 4)]
        kid_y = 0.70 if stream else 0.8
        acts = []
        for j, (n, x) in enumerate(zip(present, xs)):
            md = (mode_of([w['w'] for w in sw if re.search(r'\b' + re.escape(n) + r'\b', ' '.join(x_['w'] for x_ in sw))]) if n in named else None) or (sent_mode if n in named or not named else None)
            if md in ('run',): a = {'kid': kids[n], 'name': n, 'x': 0.1 + 0.2 * j, 'to': 0.6 + 0.12 * j, 'y': kid_y, 'size': 460, 'move': 'walk', 'dur': max(2, sn['e'] - sn['s'] - 0.6), 'at': round(frm + 0.1, 2)}
            else: a = {'kid': kids[n], 'name': n, 'x': x, 'y': kid_y, 'size': 480 if len(present) <= 3 else 400, 'move': 'sway', 'pose': md or 'idle', 'at': round(frm + 0.1, 2)}
            acts.append(a)
        if dlg and acts:
            sp = next((a for a in acts if a['name'] == last_named), acts[0])
            qw = next((w for w in sw if dlg.group(1).split()[0].strip('.,¡!¿?—') in w['w']), sw[0])
            sp['say'] = dlg.group(1).strip(); sp['sayAt'] = round(qw['s'] - 0.1, 2); sp['sayDur'] = max(1.8, min(3.6, sn['e'] - qw['s']))
        # animales / figuras (emoji)
        used_e = []
        for w in sw:
            e = actor_for(w['w'])
            if e and e not in used_e and norm(w['w']) not in names: used_e.append(e)
        for e, x in zip(used_e[:2], [0.25, 0.75]):
            acts.append({'emoji': e, 'x': x, 'y': 0.74, 'size': 300, 'move': sent_mode == 'run' and 'walk' or 'sway', 'at': round(frm + 0.2, 2)})
        # objetos: elementos generados por alias, o dibujos integrados
        i = 0; objs = 0
        while i < len(sw):
            w = sw[i]; k1 = norm(w['w']); k2 = (k1 + ' ' + norm(sw[i + 1]['w'])) if i + 1 < len(sw) else ''; k3 = (k2 + ' ' + norm(sw[i + 2]['w'])) if i + 2 < len(sw) else ''
            sing = lambda x: x[:-1] if x.endswith('s') else x
            hit = next(((amap[c], n_) for kk, n_ in ((k3, 3), (k2, 2), (k1, 1)) for c in (kk, sing(kk), kk[:-2] if kk.endswith('es') else kk) if c in amap), None)
            prop = (PROP_NOUNS.get(k1) or PROP_NOUNS.get(sing(k1)) or PROP_NOUNS.get(k1[:-2] if k1.endswith('es') else k1)) if not hit else None
            if hit or prop:
                name, consumed = hit if hit else (prop, 1)
                win = sw[max(0, i - 3): i + consumed + 3]
                col = next((COLORS[norm(x['w'])][1] for x in win if norm(x['w']) in COLORS), None)
                if not col:  # «el barquito de Mateo»: el color de su dueño
                    col = next((kids[n]['shirt'] for n in names if any(re.fullmatch(re.escape(n), x['w'].strip('.,;:¡!¿?—'), re.I) for x in win)), None)
                st = None
                if sp_ := (specs.get(name) if hit else None):
                    for sn_, sw_ in (sp_.get('state_words') or {}).items():
                        if any(norm(x['w']).startswith(norm(z)) for x in sw for z in sw_): st = sn_
                cnt = next((NUMS[norm(x['w'])] if norm(x['w']) in NUMS else int(x['w']) for x in sw[max(0, i - 2):i] if norm(x['w']) in NUMS or re.fullmatch(r'\d', x['w'])), 1)
                if cnt == 1 and (k1.endswith('s') and len(k1) > 4) and hit: cnt = 3 if len(kids) >= 3 else 2
                cnt = min(cnt, 4)
                sp = specs.get(name) if hit else None
                surface = (sp or {}).get('surface', 'ground')
                cols = [col] if col else ([kids[n]['shirt'] for n in list(kids)[:cnt]] if cnt > 1 and hit else [None] * cnt)
                cols = (cols * cnt)[:cnt] if col else cols
                for q in range(cnt):
                    c_ = cols[q] if q < len(cols) else None
                    if hit:
                        recent.append((name, c_ or (sp.get('params') or {}).get('color')))
                        y = (0.84 + 0.035 * q) if (surface == 'water' and stream) else (0.4 if surface == 'air' else (0.88 if not stream else 0.8))
                        a = {'asset': {'name': name, **({'color': c_} if c_ else {}), **({'state': st} if st else {})}, 'x': 0.1 + 0.05 * q, 'y': y, 'size': (sp or {}).get('size', 250), 'at': round(w['s'] - 0.1, 2)}
                        if surface == 'water' and stream: a.update({'move': 'sail', 'to': 0.82 - 0.08 * q, 'dur': max(2.5, sn['e'] - w['s'])})
                        elif surface == 'air': a.update({'move': 'fly', 'to': 0.85, 'dur': max(2.5, sn['e'] - w['s'])})
                        else: a.update({'x': 0.25 + 0.2 * q, 'move': 'none'})
                    else:
                        a = {'prop': {'kind': name, **({'color': c_} if c_ else {})}, 'x': 0.2 + 0.25 * q + 0.05 * objs, 'y': 0.88 if not stream else 0.78, 'size': 200, 'at': round(w['s'] - 0.1, 2), 'noShadow': False}
                    # un niño que «encuentra/elige/toma» el objeto lo sostiene
                    if sent_mode == 'hold' and named and q == 0 and acts and acts[0].get('kid'):
                        acts[0]['holding'] = ({'asset': name} if hit else {'kind': name}); acts[0]['holding'].update({'color': c_} if c_ else {}); acts[0]['pose'] = 'hold'
                    else: acts.append(a)
                objs += 1; i += consumed; continue
            # candidatos sin dibujo
            if i and norm(sw[i - 1]['w']) in DET and len(k1) >= 4 and k1 not in STOP and k1 not in ABSTRACT and k1 not in COLORS and not k1.endswith(VERB_END) and k1 not in WATER and k1 not in WORLD_WORDS and not actor_for(w['w']) and w['w'][:1].islower():
                needs[k1] += 1; seen_nouns.setdefault(k1, text_s)
            i += 1
        use_book = layout == 'storybook' or (layout == 'mixed' and k % 3 != 2)
        world_name = world
        if use_book:
            page += 1
            sc = {'type': 'insert', 'layout': 'storybook', 'story': {'world': world_name, 'stream': stream, 'actors': acts, 'text': text_s, 'page': page}, 'words': sw, 'lines': []}
        else:
            sc = {'type': 'insert', 'layout': 'scene', 'scene': {'world': world_name, 'stream': stream, 'actors': acts, 'caption': text_s if len(text_s) < 70 else ''}, 'words': sw, 'lines': []}
        sc['from'] = round(frm, 2); scenes.append(sc); k += 1
    last_end = words[-1]['e'] if words else dur
    if end: scenes.append({'type': 'insert', 'layout': 'theend', 'from': round(last_end + 0.3, 2), 'theend': {'text': 'FIN', 'world': 'night'}, 'lines': []})
    total = max(dur, last_end + (3.4 if end else 0.6))
    for i, sc in enumerate(scenes):
        sc['to'] = round(scenes[i + 1]['from'] if i + 1 < len(scenes) else total, 2)
        if sc['to'] <= sc['from'] + 0.5: sc['to'] = round(sc['from'] + 0.8, 2)
    for i in range(1, len(scenes)):
        if scenes[i]['from'] < scenes[i - 1]['to']: scenes[i - 1]['to'] = scenes[i]['from']
    need_list = [{'word': w, 'count': c, 'example': seen_nouns[w][:120], 'suggested_name': w} for w, c in needs.most_common(14)]
    return scenes, total, {'names': names, 'kids': kids, 'needs': need_list, 'assets_found': sorted({a['asset']['name'] for sc in scenes for a in (sc.get('story') or sc.get('scene') or {}).get('actors', []) if 'asset' in a})}
