#!/usr/bin/env python3
"""Crimson Gloss, paso 3: renderiza plan.json -> mp4 final.

  python render.py WORKDIR [--plan plan.json] [--out final.mp4] [--still SEGUNDOS ...]

Instala la plantilla Remotion una sola vez en ~/.crimson-gloss/runtime (ruta corta: Windows limita a 260 caracteres).
--still 1.2 3.5  renderiza solo esos fotogramas a WORKDIR/qa_*.png (para revisar antes del render completo).
"""
import argparse, hashlib, json, os, shutil, subprocess, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNTIME = os.path.join(os.path.expanduser('~'), '.crimson-gloss', 'runtime')
FPS = 30

def sh(cmd, cwd=None):
    r = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        sys.exit(f'[crimson] falló: {cmd}\n{(r.stdout + r.stderr)[-1800:]}')
    return r.stdout

def tree_hash(d):
    h = hashlib.md5()
    for root, _, files in sorted(os.walk(d)):
        for f in sorted(files):
            h.update(open(os.path.join(root, f), 'rb').read())
    return h.hexdigest()

def install_runtime():
    tpl = os.path.join(SKILL, 'template')
    os.makedirs(RUNTIME, exist_ok=True)
    stamp = os.path.join(RUNTIME, '.stamp')
    cur = tree_hash(tpl)
    if not os.path.exists(stamp) or open(stamp).read() != cur:
        for sub in ('src', 'public'):
            dst = os.path.join(RUNTIME, sub)
            if os.path.isdir(dst) and sub == 'src':
                shutil.rmtree(dst)
            shutil.copytree(os.path.join(tpl, sub), dst, dirs_exist_ok=True)
        shutil.copy(os.path.join(tpl, 'package.json'), RUNTIME)
        open(stamp, 'w').write(cur)
    if not os.path.isdir(os.path.join(RUNTIME, 'node_modules')):
        print('[crimson] instalando Remotion (solo la primera vez, ~1-2 min)...')
        sh('npm install --no-audit --no-fund', RUNTIME)

def prefix_media(o):
    """Las rutas de medios del plan son relativas a WORKDIR; en el runtime viven en public/media/."""
    if isinstance(o, dict):
        return {k: (('media/' + v) if k in ('video', 'cutout', 'music', 'image') and isinstance(v, str) and v else prefix_media(v)) for k, v in o.items()}
    if isinstance(o, list):
        return [prefix_media(x) for x in o]
    return o

def validate(plan, work):
    errs = []
    if plan.get('duration', 0) <= 0: errs.append('falta duration')
    prev = 0
    for i, sc in enumerate(plan.get('scenes', [])):
        if sc['from'] < prev - 0.01: errs.append(f'escena {i}: empieza antes de que acabe la anterior')
        if sc['to'] <= sc['from']: errs.append(f'escena {i}: to <= from')
        if sc['to'] > plan['duration'] + 0.05: errs.append(f'escena {i}: termina después de duration')
        prev = sc['to']
        for e in sc.get('elements', []):
            if not (sc['from'] - 0.3 <= e['at'] <= sc['to']): errs.append(f"escena {i}: '{e.get('text', e.get('kind'))}' entra en {e['at']}s, fuera de la escena")
    for key in ('video', 'cutout', 'music'):
        if plan.get(key) and not os.path.exists(os.path.join(work, plan[key])): errs.append(f'no existe {plan[key]}')
    if errs:
        sys.exit('[crimson] plan inválido:\n  - ' + '\n  - '.join(errs))

def write_report(work, plan, final):
    """Informe en español de TODO lo que se hizo, para que el usuario entienda cada decisión."""
    pr = json.load(open(os.path.join(work, 'prepare.json'))) if os.path.exists(os.path.join(work, 'prepare.json')) else {}
    tr = json.load(open(os.path.join(work, 'transcript.json'), encoding='utf-8')) if os.path.exists(os.path.join(work, 'transcript.json')) else {}
    normal = bool(plan.get('captions')) and not plan.get('scenes')
    L = ['# Informe de edición', '', f"**Modo:** {'normal (limpio: subtítulos + zooms)' if normal else 'Crimson Gloss'}", '']
    L += ['## 1. Entrada', f"- Duración original: {pr.get('original_duration', '?')} s -> final: {plan['duration']} s",
          f"- Idioma detectado: {pr.get('language') or tr.get('language') or '?'} · palabras transcritas: {len(tr.get('words', []))}"]
    if pr.get('cuts'):
        L.append(f"- Silencios cortados: {pr['cuts']} cortes, {pr['trimmed']} s menos (pausas > 0,45 s). Así el video queda con ritmo y sin aire muerto.")
    L += ['', '## 2. Edición aplicada']
    if plan.get('captions'):
        c = plan['captions']
        L += [f"- **Subtítulos** palabra a palabra, {c.get('perLine', 3)} por línea, la palabra que dices se resalta con el color de acento ({plan.get('theme', {}).get('accent', '')}).",
              f"- Palabras de énfasis en color: {', '.join(c.get('emphasis', [])) or 'ninguna'}"]
    if plan.get('punches'):
        L.append(f"- **{len(plan['punches'])} zooms de énfasis** al empezar frases (suben ~10-14 % y vuelven): " + ', '.join(f"{p['at']}s" for p in plan['punches']))
    if plan.get('lower'):
        L.append(f"- **Rótulo** con tu nombre: «{plan['lower']['name']}» {('· ' + plan['lower']['role']) if plan['lower'].get('role') else ''} a los {plan['lower'].get('at', 0.4)} s.")
    if plan.get('cta'):
        L.append(f"- **Llamada a la acción** «{plan['cta']['text']}» desde {plan['cta']['at']} s.")
    for i, sc in enumerate(plan.get('scenes', [])):
        if sc.get('type') == 'insert':
            o = sc.get('object', {})
            L.append(f"- Escena {i + 1} ({sc['from']}–{sc['to']} s) **inserto** fondo «{sc.get('bg')}» con {o.get('emoji') or o.get('image')} que ilustra lo que dices.")
        else:
            txt = ' / '.join(e.get('text') or ('tarjeta ' + str((e.get('content') or {}).get('emoji', ''))) for e in sc.get('elements', []))
            L.append(f"- Escena {i + 1} ({sc['from']}–{sc['to']} s) presentador: {txt}")
    if plan.get('cutout'):
        L.append('- Tarjetas y cintas salen **por detrás de ti** (se recortó tu silueta por el fondo liso).')
    L += ['', '## 3. Audio', f"- Tu voz original, normalizada a -14 LUFS (volumen estándar de Reels/TikTok/Shorts).", f"- Música de fondo: {'sí, muy baja' if plan.get('music') else 'no'}. Efectos de sonido en transiciones y textos.", '',
          '## 4. Archivos', f"- Video final: `{os.path.basename(final)}` (1080x1920, 30 fps, H.264)", '- `plan.json`: todas las decisiones; edítalo y vuelve a renderizar para cambiar cualquier cosa.',
          '- `transcript.json`: lo que se entendió de tu voz (corrige errores allí o en `plan.json`).']
    open(os.path.join(work, 'informe.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('work'); ap.add_argument('--plan', default='plan.json'); ap.add_argument('--out', default='final.mp4')
    ap.add_argument('--still', nargs='*', type=float)
    a = ap.parse_args()
    work = os.path.abspath(a.work)
    plan = json.load(open(os.path.join(work, a.plan), encoding='utf-8'))
    if 'bg' not in plan and os.path.exists(os.path.join(work, 'prepare.json')):  # degradado real del estudio
        plan['bg'] = json.load(open(os.path.join(work, 'prepare.json'))).get('bg')
    validate(plan, work)
    install_runtime()

    media = os.path.join(RUNTIME, 'public', 'media')
    shutil.rmtree(media, ignore_errors=True)
    os.makedirs(media)
    for f in os.listdir(work):
        src = os.path.join(work, f)
        if os.path.isfile(src) and f.split('.')[-1].lower() in ('mp4', 'webm', 'wav', 'png', 'jpg', 'jpeg', 'webp'):
            shutil.copy(src, media)
    if os.path.isdir(os.path.join(work, 'assets')):
        shutil.copytree(os.path.join(work, 'assets'), os.path.join(media, 'assets'))
    props = os.path.join(RUNTIME, 'props.json')
    json.dump({'plan': prefix_media(plan)}, open(props, 'w', encoding='utf-8'), ensure_ascii=False)

    if a.still:
        for s in a.still:
            out = os.path.join(work, f'qa_{s:g}.png')
            sh(f'npx remotion still src/index.js Cg "{out}" --props="{props}" --frame={int(s * FPS)}', RUNTIME)
            print('[crimson] ' + out)
        return
    raw = os.path.join(RUNTIME, 'raw.mp4')
    print('[crimson] renderizando...')
    sh(f'npx remotion render src/index.js Cg "{raw}" --props="{props}" --concurrency=4', RUNTIME)
    final = os.path.join(work, a.out)
    sh(f'ffmpeg -v error -y -i "{raw}" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "{final}"')
    write_report(work, plan, final)
    print('[crimson] listo: ' + final + '  (informe: informe.md)')

if __name__ == '__main__':
    main()
