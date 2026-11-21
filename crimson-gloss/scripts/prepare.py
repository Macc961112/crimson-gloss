#!/usr/bin/env python3
"""Crimson Gloss, paso 1: prepara el video del usuario.

  python prepare.py VIDEO [--out work] [--matte auto|white|none|file:RUTA] [--lang es] [--model small] [--no-music]

Salida en --out:
  input.mp4        9:16, 1080x1920, 30 fps (con audio original)
  transcript.json  palabras con tiempos (faster-whisper local; el audio no sale de la máquina)
  cutout.webm      silueta del presentador con alfa (solo si el fondo es liso) -> permite que las tarjetas salgan por detrás
  music.wav        pad + beat suave sintetizado
  frame.jpg, sheet.jpg   para decidir headTop y revisar el encuadre
  prepare.json     resumen
"""
import argparse, json, os, subprocess, sys, wave

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit(f"[crimson] falló: {' '.join(map(str, cmd[:4]))}...\n{r.stderr[-1200:]}")
    return r.stdout

def probe(path):
    o = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', path]))
    v = next(s for s in o['streams'] if s['codec_type'] == 'video')
    return float(o['format']['duration']), v['width'], v['height'], any(s['codec_type'] == 'audio' for s in o['streams'])

def corner_color(path, y=0):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '1', '-i', path, '-frames:v', '1', '-vf', f'crop=60:60:0:{y},scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return tuple(raw[:3]) if len(raw) >= 3 else (255, 255, 255)

def transcribe(audio, lang, model_name):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit('[crimson] falta faster-whisper: pip install faster-whisper')
    import numpy as np
    with wave.open(audio) as wf:  # se decodifica aquí: evita el decodificador PyAV de faster-whisper (roto en algunas versiones)
        pcm = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segs, info = model.transcribe(pcm, word_timestamps=True, language=lang, vad_filter=True)
    words, sents = [], []
    for sg in segs:
        sents.append({'text': sg.text.strip(), 's': round(sg.start, 2), 'e': round(sg.end, 2)})
        for w in sg.words or []:
            words.append({'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)})
    return {'language': info.language, 'text': ' '.join(s['text'] for s in sents), 'words': words, 'sentences': sents}

def music(path, dur):
    try:
        import numpy as np
    except ImportError:
        return False
    sr = 44100
    n = int((dur + 1) * sr)
    t = np.arange(n) / sr
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    f = lambda m: 440 * 2 ** ((m - 69) / 12)
    x = np.zeros(n)
    for i, ch in enumerate(chords * (int(dur / 8) + 2)):
        a, b = int(i * 2 * sr), int(min(n, (i + 1) * 2 * sr))
        if a >= n: break
        tt = t[a:b] - t[a]
        env = np.minimum(1, tt / 0.4) * np.minimum(1, (tt[-1] - tt) / 0.4)
        x[a:b] += sum(np.sin(2 * np.pi * f(m) * tt) for m in ch) * env * 0.1
    for k in range(int((dur + 1) / 0.6)):  # pulso suave
        a = int(k * 0.6 * sr); tt = np.arange(int(0.18 * sr)) / sr
        seg = np.sin(2 * np.pi * (55 + 90 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 14) * 0.5
        x[a:a + len(seg)] += seg[: max(0, n - a)] if a < n else 0
    x *= np.minimum(1, (n / sr - t) / 1.5)
    x = (x / max(1e-9, np.abs(x).max()) * 0.8 * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(x.tobytes())
    return True

def speech_segments(words, dur, gap, pad=0.1):
    """Tramos con voz: une palabras separadas por menos de `gap` s; lo demás (silencios) se corta."""
    spans, cs, ce = [], words[0]['s'], words[0]['e']
    for w in words[1:]:
        if w['s'] - ce > gap:
            spans.append([cs, ce]); cs = w['s']
        ce = max(ce, w['e'])
    spans.append([cs, ce])
    out = []
    for s, e in spans:
        s, e = max(0.0, s - pad), min(dur, e + pad + 0.1)
        if out and s <= out[-1][1] + 0.05: out[-1][1] = max(out[-1][1], e)
        else: out.append([s, e])
    return out

def remap(t, segs):
    """Tiempo original -> tiempo tras cortar los silencios."""
    off = 0.0
    for s, e in segs:
        if t <= e: return off + max(0.0, t - s)
        off += e - s
    return off

def cut_video(src, segs, dst):
    parts = [f'[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS[a{i}]' for i, (s, e) in enumerate(segs)]
    graph = ';'.join(parts) + ';' + ''.join(f'[v{i}][a{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[v][a]'
    script = dst + '.graph.txt'
    open(script, 'w').write(graph)  # fichero: evita el límite de longitud de la línea de comandos
    base = ['ffmpeg', '-v', 'error', '-y', '-i', src]
    tail = ['-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', dst]
    for flag in ('-/filter_complex', '-filter_complex_script'):  # ffmpeg >=7 / anterior
        if subprocess.run(base + [flag, script] + tail, capture_output=True).returncode == 0:
            os.remove(script); return
    sys.exit('[crimson] no se pudo cortar los silencios con ffmpeg')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('--out', default='work')
    ap.add_argument('--matte', default='auto'); ap.add_argument('--lang'); ap.add_argument('--model', default='small')
    ap.add_argument('--no-music', action='store_true')
    ap.add_argument('--mode', choices=['crimson', 'normal'], default='crimson')
    ap.add_argument('--orientation', choices=['auto', 'vertical', 'horizontal'], default='auto', help='vertical 1080x1920 / horizontal 1920x1080 (auto: según el video)')
    ap.add_argument('--no-trim', action='store_true', help='modo normal: no cortar silencios')
    ap.add_argument('--gap', type=float, default=0.45, help='silencio mínimo (s) que se corta')
    a = ap.parse_args()
    out = os.path.abspath(a.out); os.makedirs(out, exist_ok=True)
    p = lambda n: os.path.join(out, n)

    dur, W, H, has_audio = probe(a.video)
    ori = a.orientation if a.orientation != 'auto' else ('horizontal' if W / H > 1.2 else 'vertical')
    OW, OH = (1920, 1080) if ori == 'horizontal' else (1080, 1920)
    if abs(W / H - OW / OH) > 0.02:
        print(f'[crimson] aviso: el video es {W}x{H}, no {OW}:{OH}. Se recorta al centro; mejor graba en {ori}.')
    run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vf', f'scale={OW}:{OH}:force_original_aspect_ratio=increase,crop={OW}:{OH},fps=30,format=yuv420p',
         '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-movflags', '+faststart', p('input.mp4')])
    print('[crimson] input.mp4 listo')

    if has_audio:
        run(['ffmpeg', '-v', 'error', '-y', '-i', p('input.mp4'), '-vn', '-ac', '1', '-ar', '16000', p('audio.wav')])
        tr = transcribe(p('audio.wav'), a.lang, a.model)
    else:
        tr = {'language': None, 'text': '', 'words': [], 'sentences': []}
        print('[crimson] aviso: el video no tiene audio; no hay transcripción. Escribe el guion a mano en plan.json.')
    orig_dur, trimmed, ncuts = dur, 0.0, 0
    if a.mode == 'normal' and not a.no_trim and len(tr['words']) > 3:
        segs = speech_segments(tr['words'], dur, a.gap)
        trimmed = dur - sum(e - s for s, e in segs)
        if trimmed > 0.4:
            ncuts = len(segs) - 1
            cut_video(p('input.mp4'), segs, p('cut.mp4'))
            os.replace(p('cut.mp4'), p('input.mp4'))
            for w in tr['words']: w['s'], w['e'] = round(remap(w['s'], segs), 2), round(remap(w['e'], segs), 2)
            for q in tr['sentences']: q['s'], q['e'] = round(remap(q['s'], segs), 2), round(remap(q['e'], segs), 2)
            dur = probe(p('input.mp4'))[0]
            print(f'[crimson] silencios cortados: {ncuts} cortes, {trimmed:.1f}s menos ({orig_dur:.1f}s -> {dur:.1f}s)')
        else:
            trimmed = 0.0
    tr['duration'] = round(dur, 2)
    json.dump(tr, open(p('transcript.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"[crimson] transcript.json: {len(tr['words'])} palabras, idioma {tr['language']}")

    r, g, b = corner_color(p('input.mp4'))
    bright = min(r, g, b) > 185 and max(r, g, b) - min(r, g, b) < 40
    matte = a.matte if a.matte != 'auto' else ('white' if bright and a.mode == 'crimson' else 'none')  # el modo normal no necesita recorte
    if matte == 'white':
        key = '0x%02X%02X%02X' % (r, g, b)
        run(['ffmpeg', '-v', 'error', '-y', '-i', p('input.mp4'), '-vf', f'colorkey={key}:0.13:0.07,format=yuva420p', '-an', '-c:v', 'libvpx-vp9',
             '-pix_fmt', 'yuva420p', '-crf', '26', '-b:v', '0', '-auto-alt-ref', '0', '-deadline', 'realtime', '-cpu-used', '5', p('cutout.webm')])
        print(f'[crimson] cutout.webm (fondo liso {key})')
    elif matte.startswith('file:'):
        import shutil; shutil.copy(matte[5:], p('cutout.webm')); print('[crimson] cutout.webm copiado')
    else:
        matte = 'none'
        print('[crimson] sin recorte (' + ('modo normal: no hace falta' if a.mode == 'normal' else 'el fondo no es liso') + ')' + ('' if a.mode == 'normal' else ' Las tarjetas irán por delante en vez de por detrás. Para el efecto completo graba sobre fondo blanco/liso.'))

    if not a.no_music and music(p('music.wav'), dur):
        print('[crimson] music.wav listo')

    run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', p('input.mp4'), '-frames:v', '1', '-vf', 'scale=540:-1', p('frame.jpg')])
    run(['ffmpeg', '-v', 'error', '-y', '-i', p('input.mp4'), '-vf', f'fps=12/{dur:.2f},scale={216 if ori == "vertical" else 384}:{384 if ori == "vertical" else 216},tile={6 if ori == "vertical" else 4}x{2 if ori == "vertical" else 3}:padding=3', '-frames:v', '1', p('sheet.jpg')])
    hx = lambda c: '#%02x%02x%02x' % c
    json.dump({'orientation': ori, 'mode': a.mode, 'original_duration': round(orig_dur, 2), 'trimmed': round(trimmed, 2), 'cuts': ncuts, 'language': tr['language'], 'duration': round(dur, 2), 'matte': matte, 'corner': [r, g, b], 'bg': [hx((r, g, b)), hx(corner_color(p('input.mp4'), OH - 60))], 'words': len(tr['words'])}, open(p('prepare.json'), 'w'), indent=1)
    print(f'[crimson] listo en {out}. Siguiente: mira frame.jpg y transcript.json, y escribe plan.json (ver SKILL.md).')

if __name__ == '__main__':
    main()
