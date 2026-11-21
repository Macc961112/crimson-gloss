#!/usr/bin/env python3
"""Genera work/plan.json con UNA escena de cada tipo de B-roll (para ver el catálogo completo o copiar la forma de cada layout).
   python catalog_plan.py WORK [vertical|horizontal]
Opcional: WORK/assets/catalog_image.png (layout image) y WORK/assets/catalog_clip.mp4 (layout clip)."""
import json, os, sys

work = sys.argv[1] if len(sys.argv) > 1 else 'work'
os.makedirs(work, exist_ok=True)
has = lambda f: os.path.exists(os.path.join(work, 'assets', f))
D = 2.9
H = lambda small, gloss: [{'small': small, 'at': 0.25}, {'gloss': gloss, 'at': 0.5}]  # cabecera; los `at` se desplazan por escena

def ins(layout, bg, lines, **kw):
    return {'type': 'insert', 'layout': layout, 'bg': bg, '_lines': lines, **kw}

specs = [
    ins('phone', 'sky', H('layout', 'PHONE'), object={'emoji': '🚀'}, stickers=['✨', '💡']),
    ins('stat', 'gold', H('layout', 'STAT'), stat={'value': 300, 'prefix': '+', 'suffix': '%', 'label': 'más rápido', 'emoji': '🚀'}),
    ins('chart', 'mint', H('layout', 'CHART'), chart={'up': True, 'label': '+312%'}),
    ins('chart', 'night', H('layout', 'BARRAS'), chart={'kind': 'bar', 'up': False, 'label': '-40%', 'data': [60, 55, 48, 40, 36, 30, 22]}),
    ins('steps', 'sunset', H('layout', 'STEPS'), steps=[{'text': 'Escribes el guion', 'emoji': '📝'}, {'text': 'Pones la voz', 'emoji': '🎙️'}, {'text': 'Renderizas', 'emoji': '🎬'}]),
    ins('checklist', 'rose', H('layout', 'CHECKLIST'), items=[{'text': 'Sin cámara'}, {'text': 'Sin estudio'}, {'text': 'Sin editores'}, {'text': 'Con costes', 'ok': False}]),
    ins('compare', 'paper', H('layout', 'COMPARE'), compare={'left': {'title': 'ANTES', 'items': ['Horas editando', 'Pagar editor', 'Esperar días']}, 'right': {'title': 'AHORA', 'items': ['5 minutos', 'Gratis', 'Al instante']}}),
    ins('quote', 'night', H('layout', 'QUOTE'), quote={'text': 'La mejor inversión es la que haces en ti mismo', 'author': 'Warren Buffett'}),
    ins('chat', 'mint', H('layout', 'CHAT'), chat={'name': 'Cliente', 'emoji': '🧑', 'messages': [{'from': 'them', 'text': '¿Puedes hacerme un reel?'}, {'from': 'me', 'text': '¡Claro! Listo en 5 minutos 🚀'}]}),
    ins('browser', 'sky', H('layout', 'BROWSER'), browser={'url': 'tusitio.com/oferta', 'title': 'Tu oferta aquí', 'button': 'Empezar'}),
    ins('terminal', 'night', H('layout', 'TERMINAL'), terminal={'title': 'claude', 'lines': [{'text': '/crimson-gloss mi-video.mp4'}, {'text': '✓ transcrito · 18 escenas', 'kind': 'out'}, {'text': '✓ render listo', 'kind': 'out'}]}),
    ins('grid', 'sunset', H('layout', 'GRID'), grid={'items': [{'emoji': '🎬', 'label': 'Video'}, {'emoji': '✂️', 'label': 'Cortes'}, {'emoji': '🎙️', 'label': 'Voz'}, {'emoji': '📝', 'label': 'Subs'}, {'emoji': '🎵', 'label': 'Música'}, {'emoji': '📊', 'label': 'Datos'}]}),
    ins('meter', 'gold', H('layout', 'METER'), meter={'value': 87, 'label': 'de retención'}),
    ins('rain', 'night', H('layout', 'RAIN'), rain={'emoji': '💰', 'center': '🤑'}),
    ins('notifs', 'rose', H('layout', 'NOTIFS'), notifs=[{'app': '💬', 'title': 'Nuevo mensaje', 'body': 'Quiero comprar'}, {'app': '💰', 'title': 'Venta nueva', 'body': '+$49,00'}, {'app': '⭐', 'title': 'Reseña 5 estrellas', 'body': '«Increíble»'}]),
    ins('rating', 'gold', H('layout', 'RATING'), rating={'stars': 5, 'score': '4.9', 'label': '+2.000 reseñas'}),
]
if has('catalog_image.png'): specs.append(ins('image', 'paper', H('layout', 'IMAGE'), image={'src': 'assets/catalog_image.png'}))
if has('catalog_clip.mp4'): specs.append(ins('clip', 'night', H('layout', 'CLIP'), clip={'src': 'assets/catalog_clip.mp4'}))

scenes = [{'type': 'presenter', 'from': 0, 'to': 2.0, 'zoom': 1.05, 'elements': [{'kind': 'small', 'slot': 'tl', 'text': 'Catálogo de', 'at': 0.2}, {'kind': 'gloss', 'slot': 'top', 'text': 'B-ROLL', 'at': 0.5}]}]
t = 2.0
for sp in specs:
    sc = {k: v for k, v in sp.items() if k != '_lines'}
    sc['from'], sc['to'] = round(t, 2), round(t + D, 2)
    sc['lines'] = [{**l, 'at': round(t + 0.12 + l['at'], 2)} for l in sp['_lines']]
    scenes.append(sc); t += D
plan = {'mode': 'personaje', 'duration': round(t + 0.5, 2), 'fps': 30, 'set': {'kind': 'studio'}, 'music': None, 'character': {'cfg': {'beard': 'full', 'glasses': True}, 'words': [], 'gestures': []}, 'scenes': scenes}
plan['orientation'] = sys.argv[2] if len(sys.argv) > 2 else 'vertical'  # vertical | horizontal
json.dump(plan, open(os.path.join(work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(specs), 'layouts,', plan['duration'], 's')
