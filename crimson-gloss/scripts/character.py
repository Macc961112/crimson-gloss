#!/usr/bin/env python3
"""Modo PERSONAJE: un presentador animado por código. No necesita video: solo un guion (o una voz).

  python character.py init WORK --script "texto..." | --script-file guion.txt | --audio voz.mp3
                      [--voice es-MX-JorgeNeural] [--rate +8%] [--lang es] [--model small]
  python character.py plan WORK [--look "hombre 30 años, barba, gafas, sudadera roja"] [--character c.json]
                      [--brand brand.json] [--set studio|night] [--cta "Síguenos"] [--captions] [--fps 30|60]

`init` crea voice.mp3, transcript.json (palabras con tiempos) y music.wav.
`plan` escribe plan.json: escenas guiadas por el guion (palabra clave + emoji que la ilustra), gestos, cámara y apariencia.
Después se revisa y renderiza con render.py igual que los otros modos.
"""
import argparse, asyncio, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lexicon import EMOJI, STOP, ACTORS, WORLD_WORDS, actor_for, move_for, emoji_for, norm  # noqa: E402
from storyplan import story_scenes3  # noqa: E402

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"[crimson] falló {' '.join(cmd[:3])}...\n{r.stderr[-800:]}")
    return r.stdout

def probe_dur(path):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).strip())

# --- init: voz + transcripción -------------------------------------------------------
def tts(text, voice, rate, out_mp3):
    try:
        import edge_tts
    except ImportError:
        sys.exit('[crimson] falta edge-tts: pip install edge-tts   (o usa --audio con tu propia voz)')
    words = []
    async def go():
        c = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
        with open(out_mp3, 'wb') as f:
            async for ch in c.stream():
                if ch['type'] == 'audio': f.write(ch['data'])
                elif ch['type'] == 'WordBoundary':
                    words.append({'w': ch['text'], 's': round(ch['offset'] / 1e7, 2), 'e': round((ch['offset'] + ch['duration']) / 1e7, 2)})
    asyncio.run(go())
    return align_words(text.split(), words)

def align_words(toks, words):
    """Devuelve las palabras de la voz con el texto original del guion (rayas «—», puntuación, cifras) para detectar diálogos y frases."""
    merged, pend = [], ''
    for t in toks:
        if not norm(t): pend += t; continue
        merged.append(pend + t); pend = ''
    if len(merged) == len(words):
        for w, t in zip(words, merged): w['w'] = t
        return words
    j = 0
    for t in merged:
        nt = norm(t)
        for k in range(j, min(len(words), j + 4)):
            if norm(words[k]['w']) == nt: words[k]['w'] = t; j = k + 1; break
    return words

def sentences_from(words):
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        end = bool(re.search(r'[.!?]$', w['w'])) or (i + 1 < len(words) and words[i + 1]['s'] - w['e'] > 0.45) or i == len(words) - 1
        if end:
            out.append({'text': ' '.join(x['w'] for x in cur), 's': cur[0]['s'], 'e': cur[-1]['e']}); cur = []
    return out

def cmd_init(a):
    work = os.path.abspath(a.work); os.makedirs(work, exist_ok=True)
    p = lambda n: os.path.join(work, n)
    if a.audio:
        run(['ffmpeg', '-v', 'error', '-y', '-i', a.audio, '-vn', '-ac', '1', '-ar', '44100', '-b:a', '160k', p('voice.mp3')])
        run(['ffmpeg', '-v', 'error', '-y', '-i', p('voice.mp3'), '-ac', '1', '-ar', '16000', p('audio.wav')])
        from prepare import transcribe
        tr = transcribe(p('audio.wav'), a.lang, a.model)
    else:
        text = open(a.script_file, encoding='utf-8').read().strip() if a.script_file else a.script
        title = None
        lines = [l for l in (text or '').splitlines() if l.strip()]
        if lines and lines[0].lstrip().startswith('#'):  # «### Título» -> portada y primera frase hablada
            title = re.sub(r'^[#\s*_]+|[*_\s]+$', '', lines[0]); text = (title + '. ' + ' '.join(lines[1:])) if len(lines) > 1 else title
        text = re.sub(r'[*_]{1,3}', '', text or '')
        if not text: sys.exit('[crimson] dame un guion: --script "..." o --script-file guion.txt (o --audio voz.mp3)')
        text = re.sub(r'\s+', ' ', text)
        words = tts(text, a.voice, a.rate, p('voice.mp3'))
        tr = {'language': a.lang or 'es', 'text': text, 'words': words, 'sentences': sentences_from(words), **({'title': title} if title else {})}
    dur = probe_dur(p('voice.mp3'))
    tr['duration'] = round(dur + 1.0, 2)
    json.dump(tr, open(p('transcript.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    try:
        from prepare import music
        music(p('music.wav'), tr['duration'])
    except Exception as e:  # la música es opcional
        print('[crimson] sin música:', e)
    print(f"[crimson] voice.mp3 ({dur:.1f}s), transcript.json ({len(tr['words'])} palabras), music.wav")

# --- apariencia ---------------------------------------------------------------------------
COLORS = {'rojo': '#d62828', 'roja': '#d62828', 'azul': '#1f4e9c', 'verde': '#1f7a4d', 'negro': '#111114', 'negra': '#111114', 'blanco': '#f1f1f4', 'blanca': '#f1f1f4',
          'gris': '#5b5f6a', 'morado': '#6a2fb0', 'morada': '#6a2fb0', 'amarillo': '#e6b422', 'amarilla': '#e6b422', 'naranja': '#e8742a', 'rosa': '#e86aa0'}
HAIRC = {'rubio': '#c9a46a', 'rubia': '#c9a46a', 'pelirrojo': '#a8431f', 'pelirroja': '#a8431f', 'canoso': '#b9b9bf', 'castano': '#5a3a28', 'negro': '#1c1410'}

def parse_look(look):
    c = {}
    t = [norm(x) for x in re.split(r'[\s,]+', look or '') if x]
    s = ' '.join(t)
    if 'mujer' in t or 'femenino' in t: c.update(hairStyle='long', beard='none', lips='#c0405a')
    if 'barba' in t: c['beard'] = 'stubble' if 'corta' in t else 'full'
    if 'sin' in t and 'barba' in t: c['beard'] = 'none'
    if 'gafas' in t or 'lentes' in t: c['glasses'] = True
    if 'calvo' in t: c['hairStyle'] = 'bald'
    if 'quiff' in t or 'tupe' in t: c['hairStyle'] = 'quiff'
    if 'largo' in t: c['hairStyle'] = 'long'
    if 'mono' in t or 'mono' in s: c['hairStyle'] = 'bun'
    if 'traje' in t: c.update(outfit='suit', top='#1d3a5c')
    if 'hoodie' in t or 'sudadera' in t: c['outfit'] = 'hoodie'
    if 'camiseta' in t or 'playera' in t: c['outfit'] = 'tee'
    if 'clara' in t and 'piel' in t: c['skin'] = '#f1c9ad'
    if 'oscura' in t and 'piel' in t: c['skin'] = '#8a5a3c'
    if 'morena' in t or 'moreno' in t: c['skin'] = '#b9825e'
    for i, w in enumerate(t):
        if w in HAIRC and (i > 0 and t[i - 1] in ('pelo', 'cabello') or w in ('rubio', 'rubia', 'pelirrojo', 'pelirroja', 'canoso')): c['hair'] = HAIRC[w]
        if w in COLORS and i > 0 and t[i - 1] in ('sudadera', 'hoodie', 'camiseta', 'playera', 'traje', 'chaqueta'): c['top'] = COLORS[w]
    return c

# --- escenas automáticas guiadas por el guion --------------------------------------------------------
BG_BY_EMOJI = {'💰': 'gold', '🏆': 'gold', '💎': 'gold', '📈': 'mint', '📉': 'night', '🌎': 'night', '🚀': 'night', '❤️': 'rose', '🔥': 'sunset', '🧠': 'sky', '📚': 'sky', '💡': 'sunset', '🤝': 'night'}
BG_CYCLE = ['night', 'sunset', 'mint', 'gold', 'sky', 'rose']
ZOOMS = [1.08, 1.0, 1.12, 1.04, 1.0]
NUMS = {'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5}

def chunks_of(words):
    """Trozos de 1,2-3,6 s: cortan en puntuación fuerte, pausas o a las 10 palabras."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        dur = cur[-1]['e'] - cur[0]['s']
        hard = bool(re.search(r'[.!?]$', w['w'])) or (nxt and nxt['s'] - w['e'] > 0.4)
        soft = bool(re.search(r'[,;:]$', w['w'])) and dur > 1.6
        if not nxt or ((hard or soft) and dur > 0.9) or dur > 3.6 or len(cur) >= 10:
            out.append(cur); cur = []
    return out

def keyword_idx(ch, used):
    best, bs = None, -1
    for i, w in enumerate(ch):
        k = norm(w['w'])
        if re.search(r'[a-z]\.[a-z]', w['w']): continue  # direcciones web: no son palabra clave
        if len(k) < 4 and not k.isdigit(): continue
        if k in STOP: continue
        sc = len(k) + (6 if emoji_for(w['w']) else 0) + (5 if k.isdigit() else 0) + (2 if w['w'][:1].isupper() and i else 0) + 0.4 * i
        if k in used: sc -= 8
        if sc > bs: best, bs = i, sc
    return best

UP = set('crecimiento crecer crece subir sube suben ganancia ganancias aumento aumentar exito ingresos ventas beneficio beneficios resultados mejorar mejora multiplicar escalar'.split())
DOWN = set('perdida perdidas caida caer baja bajar riesgo deuda gasto gastos perder quiebra'.split())
WEB = set('enlace link sitio web pagina internet url dominio tienda landing'.split())
CODE = set('codigo comando programar terminal instalar script github clonar'.split())
CHAT = set('mensaje mensajes dm whatsapp chat comentario comentarios responder escribir escribeme contactar'.split())
STAR = set('resena resenas estrella estrellas calificacion review opinion testimonio testimonios'.split())
MONEY = set('dinero billete billetes rico riqueza millonario millonarios efectivo cash'.split())
NOTIF = set('notificacion notificaciones alerta aviso'.split())
ORD = {'primero': 1, 'segundo': 2, 'tercero': 3, 'cuarto': 4, 'quinto': 5, 'first': 1, 'second': 2, 'third': 3, 'fourth': 4}
NWORDS = {'diez': 10, 'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'cien': 100, 'mil': 1000, 'millon': 1000000}
LABEL_SKIP = set('en de a solo un una el la los las al del por con y o e ciento porciento sobre hasta'.split())
NOUNS = set('pasos minutos dias horas segundos semanas meses anos veces clientes personas videos skills herramientas'.split())
BG_FOR = {'stat': 'gold', 'meter': 'gold', 'rating': 'gold', 'steps': 'sunset', 'checklist': 'rose', 'browser': 'sky', 'chat': 'mint', 'terminal': 'night', 'grid': 'sunset', 'rain': 'night', 'notifs': 'rose', 'quote': 'night'}

def parse_num(w):
    t = w.replace('%', '')
    m = re.fullmatch(r'[$€]?(\d+(?:[.,]\d+)?)', t)
    if m:
        txt = m.group(1)
        if re.fullmatch(r'\d{1,3}([.,]\d{3})+', txt): return float(re.sub(r'[.,]', '', txt)), 0
        v = float(txt.replace(',', '.'))
        return v, (len(txt.split(',')[-1]) if (',' in txt or '.' in txt) and not txt.endswith(('.', ',')) else 0)
    k = norm(w)
    return (float(NWORDS[k]), 0) if k in NWORDS else None

def ordinal_steps(words):
    """«Primero… Segundo… Tercero…» -> una sola escena de pasos."""
    starts = []
    for i, w in enumerate(words):
        k = norm(w['w'])
        if k in ORD and (i == 0 or re.search(r'[.!?]$', words[i - 1]['w'])): starts.append(i)
    if len(starts) < 2: return None, set()
    steps, end_i = [], starts[-1]
    for n, i in enumerate(starts):
        j = starts[n + 1] if n + 1 < len(starts) else min(len(words), i + 9)
        body = []
        for x in words[i + 1:j][:8]:  # hasta la primera «y»/coma/punto (mín. 2 palabras), máx. 6
            if body and len(body) >= 2 and (norm(x['w']) in ('y', 'e', 'and') or re.search(r'[,;.!?]$', body[-1]['w'])): break
            body.append(x)
            if len(body) >= 6: break
        text = re.sub(r'[,;:.!?]+$', '', ' '.join(x['w'] for x in body)).strip()
        steps.append({'text': text[:1].upper() + text[1:], 'at': round(words[i]['s'] + 0.1, 2)})
        end_i = j - 1
    emo = [emoji_for(x['text'].split()[-1]) or emoji_for(x['text'].split()[0]) for x in steps]
    for st, e in zip(steps, emo):
        if e: st['emoji'] = e
    return {'type': 'insert', 'layout': 'steps', 'bg': 'sunset', 'steps': steps, 'lines': [],
            'from': round(max(0, words[starts[0]]['s'] - 0.2), 2), 'to': round(words[end_i]['e'] + 0.4, 2)}, set(range(starts[0], end_i + 1))

def list_items(ch):
    segs, cur = [], []
    for w in ch:
        cur.append(w)
        if re.search(r'[,;]$', w['w']) or norm(w['w']) in ('y', 'e', 'and', 'o'):
            if norm(w['w']) in ('y', 'e', 'and', 'o'): cur.pop()
            if cur: segs.append(cur)
            cur = []
    if cur: segs.append(cur)
    segs = [sg for sg in segs if sg]
    if len(segs) < 3: return None
    items = []
    for sg in segs[-4:]:
        sg = sg[-2:] if len(sg) > 2 else sg
        txt = re.sub(r'[,;:.!?]+$', '', ' '.join(x['w'] for x in sg)).strip()
        if txt: items.append({'text': txt[:1].upper() + txt[1:], 'at': round(sg[0]['s'], 2)})
    return items if len(items) >= 3 else None

def pick_broll(ch, ki, lead, emo, prev_layout, url, after=()):
    """Devuelve (layout, params, lineas_extra) según lo que dice el trozo; None si no encaja ninguno."""
    ks = [norm(w['w']) for w in ch]
    cands = []
    for i, w in enumerate(ch):
        nv = parse_num(w['w'])
        if nv and norm(w['w']) != 'y':
            val, dec = nv
            pct = '%' in w['w'] or (i + 1 < len(ch) and ks[i + 1] in ('porciento', 'por')) or (i + 2 < len(ch) and ks[i + 1] == 'por' and ks[i + 2].startswith('ciento'))
            nxt = [x for x in (list(ch[i + 1:]) + list(after))[:5] if norm(x['w']) not in LABEL_SKIP][:2]
            label = re.sub(r'[,;:.!?]+$', '', ' '.join(x['w'] for x in nxt))
            if pct and val <= 100: cands.append(('meter', {'meter': {'value': val, 'label': label or lead}}))
            elif val >= 10 or pct or (i + 1 < len(ch) and ks[i + 1] in NOUNS):
                st = {'value': val, 'decimals': dec, 'label': label}
                if pct: st['suffix'] = '%'
                if i and ks[i - 1] in ('mas', 'hasta'): st['prefix'] = '+'
                e = emoji_for(label.split()[-1]) if label else None
                if e: st['emoji'] = e
                cands.append(('stat', {'stat': st}))
            break
    sset = set(ks)
    if sset & UP: cands.append(('chart', {'chart': {'up': True, 'label': ''}}))
    if sset & DOWN: cands.append(('chart', {'chart': {'up': False, 'label': ''}}))
    dom = next((w['w'].strip('.,;:') for w in ch if re.fullmatch(r'[\w-]+(\.[\w-]+)+[\w/-]*', w['w'].strip('.,;:')) and not w['w'][0].isdigit()), None)
    if dom or sset & WEB: cands.append(('browser', {'browser': {'url': dom or url or 'tusitio.com', 'title': 'Tu sitio web', 'button': 'Empezar'}}))
    if sset & CODE:
        txt = ' '.join(w['w'] for w in ch)[:44]
        cands.append(('terminal', {'terminal': {'title': 'terminal', 'lines': [{'text': txt}, {'text': '✓ listo', 'kind': 'out'}]}}))
    if sset & CHAT:
        txt = re.sub(r'\s+', ' ', ' '.join(w['w'] for w in ch))[:70]
        cands.append(('chat', {'chat': {'name': 'Chat', 'emoji': '💬', 'messages': [{'from': 'them', 'text': txt, 'at': round(ch[0]['s'] + 0.3, 2)}, {'from': 'me', 'text': '¡Listo! ✅', 'at': round(ch[0]['s'] + 1.5, 2)}]}}))
    if sset & STAR: cands.append(('rating', {'rating': {'stars': 5, 'score': '5.0', 'label': ''}}))
    if sset & MONEY: cands.append(('rain', {'rain': {'emoji': '💰', 'center': '🤑'}}))
    if sset & NOTIF: cands.append(('notifs', {'notifs': [{'app': emo or '🔔', 'title': (ch[ki]['w'] if ki is not None else 'Aviso').strip('.,;:'), 'body': lead or ''}]}))
    items = list_items(ch)
    if items: cands.append(('checklist', {'items': items}))
    es = []
    for w in ch:
        e = emoji_for(w['w'])
        if e and e not in [x['emoji'] for x in es]: es.append({'emoji': e, 'label': re.sub(r'[,;:.!?]+$', '', w['w']).capitalize()})
    if len(es) >= 3: cands.append(('grid', {'grid': {'items': es[:9]}}))
    if emo: cands.append(('phone', {'object': {'emoji': emo}, 'stickers': [e['emoji'] for e in es if e['emoji'] != emo][:2] or ['✨']}))
    for lay, params in cands:
        if lay != prev_layout: return lay, params
    return cands[0] if cands else None

def auto_scenes(tr, dur, url=None, broll=True):
    words = tr['words']
    idx = {id(w): i for i, w in enumerate(words)}
    steps_sc, consumed = ordinal_steps(words) if broll else (None, set())
    chs = chunks_of(words)
    scenes, used, n_ins, last_ins, prev_layout, steps_done = [], [], 0, -9, None, False
    for ci, ch in enumerate(chs):
        inside = sum(1 for w in ch if idx[id(w)] in consumed)
        if steps_sc and inside > len(ch) / 2:
            if not steps_done: scenes.append(steps_sc); steps_done = True; last_ins = ci; prev_layout = 'steps'
            continue
        if steps_sc and inside:  # trozo que solo roza la escena de pasos: se quita lo que ya es de esa escena
            ch = [w for w in ch if idx[id(w)] not in consumed]
            if not ch: continue
        ki = keyword_idx(ch, used)
        t0 = ch[0]['s']
        kw = ch[ki] if ki is not None else None
        lw = ch[max(0, (ki or 0) - 4):(ki or 0)] if ki else []
        for j in range(len(lw) - 1, -1, -1):  # solo las palabras posteriores al último punto
            if re.search(r'[.!?]$', lw[j]['w']): lw = lw[j + 1:]; break
        lead = ' '.join(re.sub(r'[,;:.!?]+$', '', w['w']) for w in lw)
        txt = lambda w: re.sub(r'[^\wÁÉÍÓÚÜÑáéíóúüñ%$€\- ]', '', w['w']).upper()
        emo = emoji_for(kw['w']) if kw else None
        if kw: used = (used + [norm(kw['w'])])[-6:]
        pick = pick_broll(ch, ki, lead, emo, prev_layout, url, words[idx[id(ch[-1])] + 1: idx[id(ch[-1])] + 6]) if (broll and 0 < ci < len(chs) - 1 and (ch[-1]['e'] - t0) >= 1.8) else None
        if pick and not (ci - last_ins >= 3 or (pick[0] in ('stat', 'meter') and ci - last_ins >= 2)): pick = None  # los números son lo más visual: admiten menos espacio
        sc = {}
        if pick:
            lay, params = pick
            last_ins = ci; prev_layout = lay
            if lay == 'phone': bg = BG_BY_EMOJI.get(emo) or BG_CYCLE[n_ins % len(BG_CYCLE)]
            elif lay == 'chart': bg = 'mint' if params['chart']['up'] else 'night'
            else: bg = BG_FOR.get(lay, BG_CYCLE[n_ins % len(BG_CYCLE)])
            n_ins += 1
            ls = [{'small': lead, 'at': round((lw[0] if lw else ch[0])['s'], 2), 'size': 56}] if lead else []
            if lay not in ('stat', 'meter', 'rating', 'steps') and kw: ls.append({'gloss': txt(kw), 'at': round(kw['s'], 2)})
            if lay == 'phone' and ls and 'size' not in ls[-1]: pass
            sc = {'type': 'insert', 'layout': lay, 'bg': bg, **params, 'lines': ls}
            if lay == 'stat' and params['stat'].get('label') and not ls: sc['lines'] = []
        else:
            els = []
            if lead: els.append({'kind': 'small', 'slot': 'tl', 'text': lead, 'at': round((lw[0] if lw else ch[0])['s'], 2), 'size': 50})
            if kw: els.append({'kind': 'gloss', 'slot': 'top', 'text': txt(kw), 'at': round(kw['s'], 2)})
            elif ch: els.append({'kind': 'small', 'slot': 'tl', 'text': ' '.join(w['w'] for w in ch[:4]), 'at': round(ch[0]['s'], 2), 'size': 50})
            if emo:
                side = ci % 2
                els.append({'kind': 'card', 'slot': 'right1' if side else 'left1', 'at': round(kw['s'] + 0.12, 2), 'content': {'emoji': emo}})
            sc = {'type': 'presenter', 'zoom': ZOOMS[ci % len(ZOOMS)], 'elements': els}
        sc['from'] = 0.0 if ci == 0 else round(max(0.0, t0 - 0.18), 2)
        if sc['type'] == 'insert':
            first = min([l['at'] for l in sc.get('lines', [])] + [t0 + 0.1])
            sc['from'] = round(min(sc['from'], first - 0.2), 2)
        scenes.append(sc)
    if steps_sc and not steps_done: scenes.append(steps_sc)
    scenes.sort(key=lambda x: x['from'])
    for i, sc in enumerate(scenes):
        nxt = scenes[i + 1]['from'] if i + 1 < len(scenes) else dur
        sc['to'] = round(min(sc.get('to', nxt), nxt) if sc.get('layout') == 'steps' else nxt, 2)
        if sc['to'] <= sc['from'] + 0.4: sc['to'] = round(sc['from'] + 0.6, 2)
    for i in range(1, len(scenes)):
        if scenes[i]['from'] < scenes[i - 1]['to']: scenes[i - 1]['to'] = scenes[i]['from']
    for sc in scenes:  # ningún texto puede quedar fuera de su escena
        if sc.get('elements'): sc['elements'] = [e for e in sc['elements'] if sc['from'] - 0.3 <= e['at'] <= sc['to'] - 0.05]
    return [x for x in scenes if x['to'] > x['from'] + 0.2 and (x['type'] == 'insert' or x.get('elements'))]

def auto_gestures(words, scenes):
    cand, kinds = [], ['chop', 'open']
    for w in words:
        k = norm(w['w'])
        if k.isdigit() and 1 <= int(k) <= 5: cand.append((w['s'] - 0.1, 'count', 1.5, int(k)))
        elif k in NUMS: cand.append((w['s'] - 0.1, 'count', 1.4, NUMS[k]))
        elif k in ('tu', 'ti', 'usted', 'ustedes', 'you'): cand.append((w['s'] - 0.1, 'point', 1.2, 1))
        elif k in ('hola', 'hey', 'hello') and w['s'] < 3: cand.append((w['s'], 'wave', 1.7, 1))
        elif k in ('no', 'nunca', 'nada', 'jamas'): cand.append((w['s'] - 0.05, 'shrug', 1.0, 1))
    gi = 0
    for sc in scenes:
        for el in sc.get('elements', []) + sc.get('lines', []):
            if el.get('kind') == 'gloss' or 'gloss' in el:
                cand.append((el['at'] - 0.25, kinds[gi % 2], 1.3, 1)); gi += 1
    cand.sort()
    out, end = [], 0
    for at, kind, d, n in cand:
        if at >= end + 0.15 and at > 0.1:
            out.append({'at': round(at, 2), 'dur': d, 'kind': kind, **({'n': n} if kind == 'count' else {})}); end = at + d
    return out

def story_scenes(tr, dur, title=None, layout='mixed', end=True):
    """Cuento infantil: sin presentador. Una escena por frase (página de cuento con lectura resaltada o ilustración a pantalla completa),
    portada, moraleja y FIN. Mundo, personajes y movimiento salen de las palabras del guion."""
    words = tr['words']
    sents = [s_ for s_ in tr.get('sentences') or sentences_from(words)]
    # unir frases muy cortas
    merged = []
    for sn in sents:
        if merged and (sn['e'] - sn['s'] < 2.2 or merged[-1]['e'] - merged[-1]['s'] < 1.6) and sn['e'] - merged[-1]['s'] < 8:
            merged[-1] = {'text': merged[-1]['text'] + ' ' + sn['text'], 's': merged[-1]['s'], 'e': sn['e']}
        else:
            merged.append(dict(sn))
    scenes, world, page, k = [], 'forest', 0, 0
    t_start = 0.0
    if title:
        title_to = max(3.2, round(merged[0]['e'] + 0.1, 2)) if merged else 3.2  # la portada cubre la frase inicial («Había una vez…»)
        if merged and merged[0]['e'] <= title_to: merged = merged[1:]
        scenes.append({'type': 'insert', 'layout': 'title', 'from': 0.0, 'to': title_to, 'title': {'kicker': 'Había una vez…', 'text': title, 'emoji': next((actor_for(w['w']) for w in words if actor_for(w['w'])), '📖'), 'world': 'castle'}, 'lines': []})
        t_start = title_to
    first_narr = True
    for sn in merged:
        sw = [w for w in words if w['s'] >= sn['s'] - 0.01 and w['e'] <= sn['e'] + 0.05]
        if not sw: continue
        text = sn['text']
        frm = max(t_start, sn['s'] - 0.15) if first_narr else round(sn['s'] - 0.15, 2)
        first_narr = False
        low = ' '.join(norm(w['w']) for w in sw)
        # moraleja
        m = re.match(r'\s*(moraleja|moral)\b[:,.\s-]*(.*)', text, re.I)
        if m:
            scenes.append({'type': 'insert', 'layout': 'moral', 'from': round(frm, 2), 'moral': {'title': 'MORALEJA', 'text': m.group(2).strip() or text, 'emoji': '🦉'}, 'lines': [], 'words': sw}); continue
        # mundo
        for w in sw:
            wk = WORLD_WORDS.get(norm(w['w']))
            if wk: world = wk
        # personajes (en orden de aparición, sin repetir)
        seen, actors = [], []
        for w in sw:
            e = actor_for(w['w'])
            if e and e not in seen: seen.append(e); actors.append((e, w['s']))
        actors = actors[:3]
        mv = move_for([w['w'] for w in sw])
        # magia
        if any(norm(w['w']) in ('magia', 'hechizo', 'varita', 'abracadabra', 'magico', 'magica') for w in sw):
            kw = next((w for w in sw if norm(w['w']) in ('magia', 'hechizo', 'varita', 'abracadabra', 'magico', 'magica')), sw[0])
            scenes.append({'type': 'insert', 'layout': 'magic', 'from': round(frm, 2), 'magic': {'emoji': actors[0][0] if actors else '✨', 'text': '¡MAGIA!'}, 'lines': [], 'words': sw}); continue
        n_xs = {1: [0.5], 2: [0.28, 0.72], 3: [0.2, 0.5, 0.8]}.get(len(actors), [])
        acts = []
        for j, ((e, at), x) in enumerate(zip(actors, n_xs)):
            move = (mv if j == 0 and mv else ('bounce' if j % 2 else 'sway'))
            if move == 'walk' and len(actors) == 1: a = {'emoji': e, 'x': 0.12, 'to': 0.62, 'y': 0.74, 'size': 360, 'move': 'walk', 'dur': max(2, sn['e'] - sn['s'] - 0.5)}
            elif move == 'fly': a = {'emoji': e, 'x': 0.1, 'to': 0.8, 'y': 0.5, 'size': 320, 'move': 'fly', 'dur': max(2, sn['e'] - sn['s'] - 0.5)}
            elif move == 'swim': a = {'emoji': e, 'x': x, 'y': 0.72, 'size': 300, 'move': 'swim'}
            else: a = {'emoji': e, 'x': x, 'y': 0.74, 'size': 340 if len(actors) == 1 else 300, 'move': move}
            a['at'] = round(max(frm + 0.1, at - 0.2), 2)
            acts.append(a)
        # diálogo entre comillas -> globo
        mq = re.search(r'[«“"]([^»”"]{2,60})[»”"]', text)
        if mq and acts:
            qw = next((w for w in sw if mq.group(1).split()[0].strip('.,¡!¿?') in w['w']), sw[0])
            acts[0]['say'] = mq.group(1).strip(); acts[0]['sayAt'] = round(qw['s'] - 0.1, 2); acts[0]['sayDur'] = max(1.8, min(3.4, (sn['e'] - qw['s'])))
        use_book = layout == 'storybook' or (layout == 'mixed' and k % 3 != 2)
        if use_book:
            page += 1
            sc = {'type': 'insert', 'layout': 'storybook', 'story': {'world': world, 'actors': acts, 'text': text, 'page': page}, 'words': sw, 'lines': []}
        else:
            sc = {'type': 'insert', 'layout': 'scene', 'scene': {'world': world, 'pan': 30 if mv == 'walk' else 0, 'actors': acts, 'caption': text if len(text) < 70 else ''}, 'words': sw, 'lines': []}
        sc['from'] = round(frm, 2); scenes.append(sc); k += 1
    last_end = words[-1]['e'] if words else dur
    if end:
        scenes.append({'type': 'insert', 'layout': 'theend', 'from': round(last_end + 0.3, 2), 'theend': {'text': 'FIN', 'world': 'night'}, 'lines': []})
    total = max(dur, last_end + (3.4 if end else 0.6))
    for i, sc in enumerate(scenes):
        sc['to'] = round(scenes[i + 1]['from'] if i + 1 < len(scenes) else total, 2)
        if sc['to'] <= sc['from'] + 0.5: sc['to'] = round(sc['from'] + 0.8, 2)
    for i in range(1, len(scenes)):
        if scenes[i]['from'] < scenes[i - 1]['to']: scenes[i - 1]['to'] = scenes[i]['from']
    return scenes, total

def speech_spans(words):
    out = []
    for w in words:
        if out and w['s'] - out[-1][1] < 0.6: out[-1][1] = w['e']
        else: out.append([w['s'], w['e']])
    return out

def cmd_plan(a):
    work = os.path.abspath(a.work)
    tr = json.load(open(os.path.join(work, 'transcript.json'), encoding='utf-8'))
    dur = tr['duration']
    cfg = {}
    if a.character: cfg.update(json.load(open(a.character, encoding='utf-8')))
    cfg.update(parse_look(a.look))
    theme = {}
    if a.brand:
        b = json.load(open(a.brand, encoding='utf-8'))
        theme = {k: b[k] for k in ('accent', 'dark', 'mid', 'light', 'soft', 'ink', 'outline') if k in b}
        if b.get('set'): a.set = b['set']
        if b.get('character'): cfg = {**b['character'], **cfg}
    if a.story:
        scenes, dur, info = story_scenes3(tr, dur, work, a.title or tr.get('title'), a.layout, not a.no_end, sentences_from)
        json.dump(info['needs'], open(os.path.join(work, 'needs_assets.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f"[crimson] personajes con nombre: {', '.join(info['names']) or '-'} · elementos encontrados: {', '.join(info['assets_found']) or '-'}")
        if info['needs']: print('[crimson] SIN DIBUJO (needs_assets.json): ' + ', '.join(f"{n['word']}×{n['count']}" for n in info['needs']) + '  -> genéralos como elementos (ver SKILL.md «Generador de elementos»)')
        plan = {'mode': 'cuento', 'orientation': a.orientation, 'duration': round(dur, 2), 'fps': a.fps, 'voice': 'voice.mp3', 'music': 'music.wav' if os.path.exists(os.path.join(work, 'music.wav')) else None, 'musicVolume': 0.09,
                'theme': theme, 'speech': speech_spans(tr['words']), 'character': None, 'scenes': scenes}
        if a.captions: plan['captions'] = {'words': tr['words'], 'perLine': 3, 'activeText': '#ffffff'}
        json.dump(plan, open(os.path.join(work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f"[crimson] plan.json (cuento): {len(scenes)} escenas ({', '.join(sorted({x['layout'] for x in scenes}))}), {round(dur, 1)}s")
        return
    scenes = auto_scenes(tr, dur, a.url, not a.no_broll)
    plan = {
        'mode': 'personaje', 'orientation': a.orientation, 'duration': dur, 'fps': a.fps, 'voice': 'voice.mp3',
        'music': 'music.wav' if os.path.exists(os.path.join(work, 'music.wav')) else None, 'musicVolume': 0.07,
        'set': {'kind': a.set}, 'theme': theme,
        'character': {'cfg': cfg, 'words': tr['words'], 'gestures': auto_gestures(tr['words'], scenes)},
        'scenes': scenes,
    }
    if a.captions: plan['captions'] = {'words': tr['words'], 'perLine': 3, 'activeText': '#ffffff'}
    if a.cta: plan['cta'] = {'text': a.cta, 'at': round(max(0.5, dur - 3.0), 2), 'activeText': '#ffffff'}
    json.dump(plan, open(os.path.join(work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ins = sum(1 for s in scenes if s['type'] == 'insert')
    kinds = sorted({s.get('layout', 'phone') for s in scenes if s['type'] == 'insert'})
    print(f"[crimson] plan.json (personaje): {len(scenes)} escenas ({ins} B-roll: {', '.join(kinds) or '-'}), {len(plan['character']['gestures'])} gestos, apariencia: {cfg or 'por defecto'}")

def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    i = sp.add_parser('init'); i.add_argument('work')
    i.add_argument('--script'); i.add_argument('--script-file'); i.add_argument('--audio')
    i.add_argument('--voice', default='es-MX-JorgeNeural'); i.add_argument('--rate', default='+6%')
    i.add_argument('--lang'); i.add_argument('--model', default='small')
    q = sp.add_parser('plan'); q.add_argument('work')
    q.add_argument('--look', default=''); q.add_argument('--character'); q.add_argument('--brand')
    q.add_argument('--set', default='studio', choices=['studio', 'night']); q.add_argument('--cta'); q.add_argument('--captions', action='store_true')
    q.add_argument('--fps', type=int, default=30, choices=[30, 60])
    q.add_argument('--orientation', default='vertical', choices=['vertical', 'horizontal'], help='vertical 1080x1920 o horizontal 1920x1080')
    q.add_argument('--url', help='enlace que se mostrará en las escenas de navegador')
    q.add_argument('--no-broll', action='store_true', help='sin escenas inserto (solo presentador)')
    q.add_argument('--story', action='store_true', help='cuento infantil: sin presentador, páginas ilustradas con lectura resaltada')
    q.add_argument('--title', help='título del cuento (crea portada)')
    q.add_argument('--layout', default='mixed', choices=['mixed', 'storybook', 'scene'], help='cuento: página con texto, ilustración a pantalla completa o mezcla')
    q.add_argument('--no-end', action='store_true', help='cuento: sin escena FIN')
    a = ap.parse_args()
    {'init': cmd_init, 'plan': cmd_plan}[a.cmd](a)

if __name__ == '__main__':
    main()
