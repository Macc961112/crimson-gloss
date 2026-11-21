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
from lexicon import EMOJI, STOP, emoji_for, norm  # noqa: E402

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
    toks = text.split()
    if len(toks) == len(words):  # recupera la puntuación del guion (edge la quita): sirve para asentir en comas y puntos
        for w, t in zip(words, toks): w['w'] = t
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
        if not text: sys.exit('[crimson] dame un guion: --script "..." o --script-file guion.txt (o --audio voz.mp3)')
        text = re.sub(r'\s+', ' ', text)
        words = tts(text, a.voice, a.rate, p('voice.mp3'))
        tr = {'language': a.lang or 'es', 'text': text, 'words': words, 'sentences': sentences_from(words)}
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
        if len(k) < 4 and not k.isdigit(): continue
        if k in STOP: continue
        sc = len(k) + (6 if emoji_for(w['w']) else 0) + (5 if k.isdigit() else 0) + (2 if w['w'][:1].isupper() and i else 0) + 0.4 * i
        if k in used: sc -= 8
        if sc > bs: best, bs = i, sc
    return best

def auto_scenes(tr, dur):
    chs = chunks_of(tr['words'])
    scenes, used, n_ins, last_ins = [], [], 0, -9
    for ci, ch in enumerate(chs):
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
        is_ins = bool(emo) and ci - last_ins >= 4 and 0 < ci < len(chs) - 1 and (ch[-1]['e'] - t0) >= 1.8
        sc = {}
        if is_ins:
            last_ins = ci
            bg = BG_BY_EMOJI.get(emo) or BG_CYCLE[n_ins % len(BG_CYCLE)]; n_ins += 1
            others = [e for e in (emoji_for(w['w']) for w in ch) if e and e != emo][:2]
            lines = ([{'small': lead, 'at': round((lw[0] if lw else ch[0])['s'], 2), 'size': 56}] if lead else []) + [{'gloss': txt(kw), 'at': round(kw['s'], 2)}]
            sc = {'type': 'insert', 'bg': bg, 'object': {'emoji': emo}, 'stickers': others or ['✨'], 'lines': lines}
        else:
            els = []
            if lead: els.append({'kind': 'small', 'slot': 'tl', 'text': lead, 'at': round((lw[0] if lw else ch[0])['s'], 2), 'size': 50})
            if kw: els.append({'kind': 'gloss', 'slot': 'top', 'text': txt(kw), 'at': round(kw['s'], 2)})
            elif ch: els.append({'kind': 'small', 'slot': 'tl', 'text': ' '.join(w['w'] for w in ch[:4]), 'at': round(ch[0]['s'], 2), 'size': 50})
            if emo:
                side = ci % 2
                els.append({'kind': 'card', 'slot': 'right1' if side else 'left1', 'at': round(kw['s'] + 0.12, 2), 'content': {'emoji': emo},
                            **({} if side else {'x': 80, 'w': 230, 'h': 300, 'rot': -6, 'from': [330, 120]})})
            sc = {'type': 'presenter', 'zoom': ZOOMS[ci % len(ZOOMS)], 'elements': els}
        sc['from'] = 0.0 if ci == 0 else round(max(0.0, t0 - 0.18), 2)
        if sc['type'] == 'insert':
            first = min((l['at'] for l in sc['lines']), default=t0)
            sc['from'] = round(min(sc['from'], first - 0.2), 2)
        scenes.append(sc)
    for i, sc in enumerate(scenes):
        sc['to'] = round(scenes[i + 1]['from'] if i + 1 < len(scenes) else dur, 2)
        if sc['to'] <= sc['from'] + 0.4: sc['to'] = round(sc['from'] + 0.6, 2)
    # sin solapes
    for i in range(1, len(scenes)):
        if scenes[i]['from'] < scenes[i - 1]['to']: scenes[i - 1]['to'] = scenes[i]['from']
    return [s for s in scenes if s['to'] > s['from'] + 0.2]

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
    scenes = auto_scenes(tr, dur)
    plan = {
        'mode': 'personaje', 'duration': dur, 'fps': a.fps, 'voice': 'voice.mp3',
        'music': 'music.wav' if os.path.exists(os.path.join(work, 'music.wav')) else None, 'musicVolume': 0.07,
        'set': {'kind': a.set}, 'theme': theme,
        'character': {'cfg': cfg, 'words': tr['words'], 'gestures': auto_gestures(tr['words'], scenes)},
        'scenes': scenes,
    }
    if a.captions: plan['captions'] = {'words': tr['words'], 'perLine': 3, 'y': 1500, 'size': 70, 'activeText': '#ffffff'}
    if a.cta: plan['cta'] = {'text': a.cta, 'at': round(max(0.5, dur - 3.0), 2), 'y': 1700, 'activeText': '#ffffff'}
    json.dump(plan, open(os.path.join(work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ins = sum(1 for s in scenes if s['type'] == 'insert')
    print(f"[crimson] plan.json (personaje): {len(scenes)} escenas ({ins} insertos), {len(plan['character']['gestures'])} gestos, apariencia: {cfg or 'por defecto'}")

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
    a = ap.parse_args()
    {'init': cmd_init, 'plan': cmd_plan}[a.cmd](a)

if __name__ == '__main__':
    main()
