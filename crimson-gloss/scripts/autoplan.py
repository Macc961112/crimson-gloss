#!/usr/bin/env python3
"""Modo NORMAL, paso 2 (automático, sin intervención de Claude): escribe work/plan.json
a partir de la transcripción: subtítulos palabra a palabra, zooms de énfasis, rótulo y llamada a la acción.

  python autoplan.py work [--name "Macc" --role "Creador"] [--cta "Síguenos"] [--fix "Dereo=Video"] [--accent "#ffd11a"] [--per 3] [--y 1330]
"""
import argparse, json, os, re

STOP = set('para como pero porque cuando donde entonces también aunque desde hasta sobre entre'.split()) | set('because through between should would could about their there which while'.split())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('work')
    ap.add_argument('--name'); ap.add_argument('--role')
    ap.add_argument('--cta'); ap.add_argument('--cta-secs', type=float, default=2.6)
    ap.add_argument('--accent', default='#ffd11a'); ap.add_argument('--active-text', default='#111111')
    ap.add_argument('--per', type=int, default=3, help='palabras por línea de subtítulo')
    ap.add_argument('--y', type=int, default=None, help='altura de los subtítulos en px del lienzo (por defecto, 69 %% de la altura)')
    ap.add_argument('--size', type=int, default=None)
    ap.add_argument('--fix', help='corrige la transcripción: "Dereo=Video,Core=Code"')
    ap.add_argument('--no-punch', action='store_true'); ap.add_argument('--no-music', action='store_true')
    a = ap.parse_args()

    tr = json.load(open(os.path.join(a.work, 'transcript.json'), encoding='utf-8'))
    pp = os.path.join(a.work, 'prepare.json')
    orientation = json.load(open(pp, encoding='utf-8')).get('orientation', 'vertical') if os.path.exists(pp) else 'vertical'
    dur, words = tr['duration'], tr['words']
    if not words:
        raise SystemExit('[crimson] no hay palabras en transcript.json (¿el video no tiene voz?)')

    if a.fix:  # correcciones palabra a palabra (marcas y nombres que Whisper no conoce)
        fx = {k.strip().lower(): v.strip() for k, v in (x.split('=', 1) for x in a.fix.split(',') if '=' in x)}
        for w in words:
            k = re.sub(r'[^\wáéíóúüñ]', '', w['w'].lower())
            if k in fx:
                w['w'] = w['w'].replace(re.sub(r'[.,;:!?]+$', '', w['w']), fx[k])
        json.dump(tr, open(os.path.join(a.work, 'transcript.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    clean = lambda w: re.sub(r'[^\wáéíóúüñ]', '', w.lower())
    emphasis = sorted({clean(w['w']) for w in words if (any(c.isdigit() for c in w['w']) or len(clean(w['w'])) >= 9) and clean(w['w']) not in STOP})[:14]

    punches = []
    if not a.no_punch:
        for i, sn in enumerate(tr['sentences']):
            if sn['e'] - sn['s'] >= 1.4 and sn['s'] > 0.3:
                punches.append({'at': round(sn['s'] - 0.05, 2), 'dur': round(min(1.6, sn['e'] - sn['s']), 2), 'scale': 1.10 if i % 2 else 1.14})

    plan = {
        'mode': 'normal', 'duration': dur, 'video': 'input.mp4', 'cutout': None,
        'music': 'music.wav' if (not a.no_music and os.path.exists(os.path.join(a.work, 'music.wav'))) else None, 'musicVolume': 0.06,
        'introFade': False, 'headTop': 780, 'orientation': orientation,
        'theme': {'accent': a.accent},
        'captions': {'words': words, 'perLine': a.per, 'activeText': a.active_text, 'emphasis': emphasis, **({'y': a.y} if a.y else {}), **({'size': a.size} if a.size else {})},
        'punches': punches, 'scenes': [],
    }
    if a.name:
        plan['lower'] = {'name': a.name, 'role': a.role, 'at': 0.5, 'dur': 3.2, 'activeText': a.active_text}
    if a.cta:
        plan['cta'] = {'text': a.cta, 'at': round(max(0.5, dur - a.cta_secs), 2), 'activeText': a.active_text}
    json.dump(plan, open(os.path.join(a.work, 'plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"[crimson] plan.json (modo normal): {len(words)} palabras, {len(punches)} zooms, énfasis: {', '.join(emphasis) or '-'}")

if __name__ == '__main__':
    main()
