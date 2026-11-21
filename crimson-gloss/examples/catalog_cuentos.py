#!/usr/bin/env python3
"""work/plan.json con una escena de cada layout de CUENTOS y EDUCATIVOS + generales nuevos.
   python catalog_cuentos.py WORK"""
import json, os, sys

work = sys.argv[1] if len(sys.argv) > 1 else 'work'
os.makedirs(work, exist_ok=True)
D = 3.2

def shift(o, dt):
    """Los `at` / `sayAt` se escriben relativos a la escena; aquí se pasan a tiempo absoluto."""
    if isinstance(o, dict): return {k: (round(v + dt, 2) if k in ('at', 'sayAt') and isinstance(v, (int, float)) else shift(v, dt)) for k, v in o.items()}
    if isinstance(o, list): return [shift(x, dt) for x in o]
    return o

def ins(layout, bg=None, lines=None, **kw):
    return {'type': 'insert', 'layout': layout, **({'bg': bg} if bg else {}), '_lines': lines or [], **kw}

H = lambda small, gloss: [{'small': small, 'at': 0.25}, {'gloss': gloss, 'at': 0.5}]
specs = [
    ins('title', title={'kicker': 'Había una vez…', 'text': 'El conejo valiente', 'emoji': '🐰', 'world': 'castle'}),
    ins('scene', scene={'world': 'forest', 'pan': 40, 'actors': [{'emoji': '🐰', 'x': 0.12, 'to': 0.62, 'y': 0.74, 'size': 340, 'move': 'walk', 'at': 0.2, 'dur': 2.6}, {'emoji': '🦊', 'x': 0.84, 'y': 0.76, 'size': 300, 'move': 'sway', 'at': 0.5, 'say': '¡Hola, amigo!', 'sayAt': 1.2}], 'caption': 'Un día, en el bosque…'}),
    ins('scene', scene={'world': 'ocean', 'actors': [{'emoji': '🐠', 'x': 0.3, 'y': 0.7, 'size': 220, 'move': 'swim', 'at': 0.2}, {'emoji': '🐙', 'x': 0.7, 'y': 0.78, 'size': 320, 'move': 'sway', 'at': 0.4}, {'emoji': '🐳', 'x': 0.5, 'y': 0.58, 'size': 380, 'move': 'float', 'at': 0.1}]}),
    ins('scene', scene={'world': 'space', 'actors': [{'emoji': '🚀', 'x': 0.1, 'to': 0.85, 'y': 0.5, 'size': 300, 'move': 'fly', 'at': 0.2, 'dur': 2.8}, {'emoji': '👽', 'x': 0.74, 'y': 0.78, 'size': 300, 'move': 'bounce', 'at': 0.6, 'say': '¡Bienvenidos!', 'sayAt': 1.4}]}),
    ins('scene', scene={'world': 'snow', 'actors': [{'emoji': '⛄', 'x': 0.28, 'y': 0.74, 'size': 380, 'move': 'sway', 'at': 0.2}, {'emoji': '🐧', 'x': 0.72, 'y': 0.78, 'size': 300, 'move': 'bounce', 'at': 0.5}]}),
    ins('storybook', story={'world': 'farm', 'page': 1, 'text': 'La vaca y el cerdito jugaban todo el día en la granja.', 'actors': [{'emoji': '🐮', 'x': 0.3, 'y': 0.72, 'size': 330, 'move': 'bounce', 'at': 0.3}, {'emoji': '🐷', 'x': 0.7, 'y': 0.76, 'size': 280, 'move': 'sway', 'at': 0.6}]}),
    ins('speech', speech={'world': 'forest', 'left': {'emoji': '🐻', 'name': 'Oso'}, 'right': {'emoji': '🐰', 'name': 'Conejo'}, 'lines': [{'who': 'left', 'text': '¿Quieres jugar?', 'at': 0.3}, {'who': 'right', 'text': '¡Sí, vamos al río!', 'at': 1.7}]}),
    ins('counting', counting={'emoji': '🍎', 'n': 5, 'label': 'manzanas'}),
    ins('letter', letter={'letter': 'A', 'word': 'Árbol', 'emoji': '🌳'}),
    ins('shapes', shapes={'items': ['circle', 'square', 'triangle', 'star', 'heart', 'oval']}),
    ins('journey', journey={'traveler': '🧒', 'points': [{'x': 0.12, 'y': 0.85, 'emoji': '🏠', 'label': 'Casa'}, {'x': 0.5, 'y': 0.6, 'emoji': '🌲', 'label': 'Bosque'}, {'x': 0.2, 'y': 0.38, 'emoji': '⛰️', 'label': 'Montaña'}, {'x': 0.7, 'y': 0.12, 'emoji': '🏰', 'label': 'Castillo'}]}),
    ins('magic', magic={'emoji': '🦄', 'text': '¡MAGIA!'}),
    ins('moral', moral={'title': 'MORALEJA', 'text': 'Ser amable siempre vale la pena', 'emoji': '🦉'}),
    ins('theend', theend={'text': 'FIN', 'world': 'night'}),
    ins('split', 'sky', H('layout', 'SPLIT'), split={'dir': 'v', 'a': {'emoji': '🏚️', 'label': 'Antes'}, 'b': {'emoji': '🏡', 'label': 'Después'}}),
    ins('timeline', 'mint', H('layout', 'TIMELINE'), timeline=[{'label': '2019', 'text': 'Empecé desde cero', 'emoji': '🌱'}, {'label': '2022', 'text': 'Primer cliente', 'emoji': '🤝'}, {'label': '2025', 'text': 'Equipo de 10', 'emoji': '🚀'}]),
    ins('headline', 'paper', H('layout', 'HEADLINE'), headline={'paper': 'EL DIARIO', 'title': 'El conejo salva el bosque', 'emoji': '🐰', 'sub': 'Los vecinos lo celebran'}),
    ins('polaroids', 'rose', H('layout', 'POLAROIDS'), polaroids=[{'emoji': '🏖️', 'caption': 'Verano'}, {'emoji': '🎂', 'caption': 'Cumple'}, {'emoji': '🐶', 'caption': 'Max'}, {'emoji': '⛰️', 'caption': 'Viaje'}]),
    ins('price', 'gold', H('layout', 'PRICE'), price={'label': 'OFERTA', 'old': '$99', 'new': '$29', 'note': 'solo hoy'}),
    ins('callout', 'night', H('layout', 'CALLOUT'), callout={'emoji': '🗺️', 'label': 'Aquí está el tesoro', 'ring': {'x': 0.66, 'y': 0.42, 'r': 140}}),
    ins('progress', 'sunset', H('layout', 'PROGRESS'), progress={'label': 'Renderizando', 'value': 100, 'done': '¡Video listo!'}),
    ins('countdown', 'night', H('layout', 'COUNTDOWN'), countdown={'from': 3, 'end': '🚀'}),
    ins('reaction', 'rose', H('layout', 'REACTION'), reaction={'emojis': ['❤️', '🔥', '👏', '😍'], 'center': '❤️'}),
]
t = 0.0
scenes = []
for sp in specs:
    sc = {k: v for k, v in sp.items() if k != '_lines'}
    sc = shift(sc, t + 0.12)
    sc['from'], sc['to'] = round(t, 2), round(t + D, 2)
    sc['lines'] = [{**l, 'at': round(t + 0.12 + l['at'], 2)} for l in sp['_lines']]
    scenes.append(sc); t += D
plan = {'mode': 'cuento', 'duration': round(t + 0.3, 2), 'fps': 30, 'set': {'kind': 'studio'}, 'music': None, 'character': None, 'scenes': scenes}
json.dump(plan, open(os.path.join(work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(specs), 'layouts,', plan['duration'], 's')
