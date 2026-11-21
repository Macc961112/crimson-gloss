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
        return {k: (('media/' + v) if k in ('video', 'cutout', 'music', 'voice', 'image') and isinstance(v, str) and v else prefix_media(v)) for k, v in o.items()}
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
    for key in ('video', 'cutout', 'music', 'voice'):
        if plan.get(key) and not os.path.exists(os.path.join(work, plan[key])): errs.append(f'no existe {plan[key]}')
    if errs:
        sys.exit('[crimson] plan inválido:\n  - ' + '\n  - '.join(errs))

def write_report(work, plan, final):
    """Informe en español de TODO lo que se hizo, para que el usuario entienda cada decisión."""
    pr = json.load(open(os.path.join(work, 'prepare.json'))) if os.path.exists(os.path.join(work, 'prepare.json')) else {}
    tr = json.load(open(os.path.join(work, 'transcript.json'), encoding='utf-8')) if os.path.exists(os.path.join(work, 'transcript.json')) else {}
    normal = bool(plan.get('captions')) and not plan.get('scenes')
    mode = 'personaje animado por código (Crimson Gloss)' if plan.get('character') else ('normal (limpio: subtítulos + zooms)' if normal else 'Crimson Gloss')
    L = ['# Informe de edición', '', f"**Modo:** {mode}", '']
    if plan.get('character'):
        ch = plan['character']
        L += ['## 0. Personaje', f"- Apariencia: {ch.get('cfg') or 'por defecto'}", f"- **Sincronía labial** por visemas (A, E, I, O, U, M/B/P, F/V…) calculados de cada palabra con sus tiempos reales; parpadeo, mirada y respiración automáticos; cejas que suben en cada palabra clave; cabeceo en comas y puntos.",
              f"- **{len(ch.get('gestures', []))} gestos** de brazos y manos: " + ', '.join(f"{g['kind']}@{g['at']}s" for g in ch.get('gestures', [])[:14]) + ('…' if len(ch.get('gestures', [])) > 14 else ''),
              f"- Cámara: tomas alternadas (zoom por escena) con empuje lento y parallax; set «{(plan.get('set') or {}).get('kind', 'studio')}»; {plan.get('fps', 30)} fps.", '']
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


def lint(plan):
    """Avisos de calidad antes del render: texto que tapa la cara, textos que se pisan, escenas muy largas sin nada."""
    warns = []
    ht0 = plan.get('headTop', 718 if plan.get('character') else 780)
    for i, sc in enumerate(plan.get('scenes', [])):
        if sc.get('type') == 'insert':
            if sc['to'] - sc['from'] > 6: warns.append(f'escena {i + 1}: inserto de {sc["to"] - sc["from"]:.1f}s (largo; considera dividirlo)')
            continue
        z = sc.get('zoom') or {'wide': 0.92, 'medium': 1, 'close': 1.3}.get(sc.get('shot'), 1)
        ht = 1920 - (1920 - ht0) * z
        face = (ht - 10, ht + 230 * z)
        boxes = []
        for e in sc.get('elements', []):
            if e['kind'] not in ('gloss', 'small'): continue
            y = e.get('y')
            if y is None:
                y = {'top': 130, 'second': 430, 'aboveHead': ht - 380, 'bottom': 1180, 'footer': 1620, 'tl': 62, 'tr': 62, 'lead': ht - 430, 'sub': 580}.get(e.get('slot'), 130)
            size = e.get('size') or (330 if e['kind'] == 'gloss' else 50)
            h = size * (0.95 if e['kind'] == 'gloss' else 1.2)
            if e['kind'] == 'gloss' and not e.get('size'): h = min(h, 300)
            boxes.append((y, y + h, e))
            if not plan.get('character') and not plan.get('video') is None and y < face[1] and y + h > face[0] and e['kind'] == 'gloss':
                warns.append(f"escena {i + 1}: «{e['text']}» (y {int(y)}-{int(y + h)}) puede tapar la cara ({int(face[0])}-{int(face[1])}); usa y más bajo o slot top")
        for a_ in range(len(boxes)):
            for b_ in range(a_ + 1, len(boxes)):
                A, B = boxes[a_], boxes[b_]
                if A[2]['kind'] == B[2]['kind'] == 'gloss' and A[0] < B[1] and B[0] < A[1]:
                    warns.append(f"escena {i + 1}: «{A[2]['text']}» y «{B[2]['text']}» se pisan")
        if sc['to'] - sc['from'] > 8: warns.append(f'escena {i + 1}: dura {sc["to"] - sc["from"]:.1f}s sin cambios')
    return warns

def write_srt(work, plan):
    ws = (plan.get('character') or {}).get('words') or (plan.get('captions') or {}).get('words')
    if not ws:
        tp = os.path.join(work, 'transcript.json')
        ws = json.load(open(tp, encoding='utf-8'))['words'] if os.path.exists(tp) else []
    if not ws: return None
    ts = lambda x: '%02d:%02d:%02d,%03d' % (x // 3600, x % 3600 // 60, x % 60, round((x % 1) * 1000))
    out, cur, n = [], [], 1
    for i, w in enumerate(ws):
        cur.append(w)
        nxt = ws[i + 1] if i + 1 < len(ws) else None
        if not nxt or len(cur) >= 7 or w['w'][-1:] in '.!?,;' or nxt['s'] - w['e'] > 0.5:
            out.append(f"{n}\n{ts(cur[0]['s'])} --> {ts(cur[-1]['e'])}\n{' '.join(x['w'] for x in cur)}\n"); n += 1; cur = []
    path = os.path.join(work, 'subtitulos.srt')
    open(path, 'w', encoding='utf-8').write('\n'.join(out))
    return path

def make_square(final):
    """1:1 sin recortar el texto: el reel entero centrado sobre su propio fondo desenfocado."""
    sq = final.replace('.mp4', '_1x1.mp4')
    sh(f'ffmpeg -v error -y -i "{final}" -filter_complex "[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,boxblur=30:6[b];[0:v]scale=-2:1080[f];[b][f]overlay=(W-w)/2:0" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "{sq}"')
    return sq

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('work'); ap.add_argument('--plan', default='plan.json'); ap.add_argument('--out', default='final.mp4')
    ap.add_argument('--still', nargs='*', type=float)
    ap.add_argument('--fps', type=int, choices=[30, 60], help='60 = movimiento más suave (render 2x más lento)')
    ap.add_argument('--format', choices=['reel', 'square', 'both'], default='reel')
    ap.add_argument('--strict', action='store_true', help='abortar si el lint encuentra avisos')
    a = ap.parse_args()
    work = os.path.abspath(a.work)
    plan = json.load(open(os.path.join(work, a.plan), encoding='utf-8'))
    if 'bg' not in plan and os.path.exists(os.path.join(work, 'prepare.json')):  # degradado real del estudio
        plan['bg'] = json.load(open(os.path.join(work, 'prepare.json'))).get('bg')
    validate(plan, work)
    if a.fps: plan['fps'] = a.fps
    warns = lint(plan)
    for w_ in warns: print('[crimson] aviso:', w_)
    if warns and a.strict: sys.exit('[crimson] lint con avisos (--strict)')
    install_runtime()

    media = os.path.join(RUNTIME, 'public', 'media')
    shutil.rmtree(media, ignore_errors=True)
    os.makedirs(media)
    for f in os.listdir(work):
        src = os.path.join(work, f)
        if os.path.isfile(src) and f.split('.')[-1].lower() in ('mp4', 'webm', 'wav', 'mp3', 'png', 'jpg', 'jpeg', 'webp'):
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
    srt = write_srt(work, plan)
    extra = ''
    if a.format in ('square', 'both'):
        extra = '  + ' + os.path.basename(make_square(final))
    if srt: extra += '  + subtitulos.srt'
    print('[crimson] extras:' + (extra or ' ninguno'))
    print('[crimson] listo: ' + final + '  (informe: informe.md)')

if __name__ == '__main__':
    main()
