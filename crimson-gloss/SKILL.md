---
name: crimson-gloss
description: Edita el video de una persona hablando a cámara (vertical 9:16) de forma automática y explicada. Dos modos — NORMAL (limpio y rápido - corta silencios, subtítulos palabra a palabra, zooms de énfasis, rótulo con nombre, llamada a la acción, música baja y volumen -14 LUFS) y CRIMSON (estilo "Crimson Gloss" - texto rojo cristal 3D al ritmo de la voz, tarjetas y cintas que salen por detrás de la persona, píxeles, halftone y escenas inserto que ilustran lo que se dice). Usar cuando el usuario dé un video suyo y pida "edítalo", "ponle subtítulos", "quítale los silencios", "hazlo estilo crimson / tipo crimson / crimson gloss", "texto rojo 3D alrededor mío", "edítalo como el reel de nikhilmotion", o /crimson-gloss.
---

# Crimson Gloss (modo normal + modo crimson)

El usuario entrega **un video suyo hablando a cámara**. Tú lo conviertes en un reel terminado y **le explicas todo lo que se hizo y por qué**. Referencia visual completa del estilo Crimson: `reference/style.md`. Documentación para humanos: `docs/COMO_FUNCIONA.md`.

`SKILL_DIR` = carpeta de este archivo. Usa el Python que tenga `faster-whisper` y `numpy` (en Windows: `python`). Trabaja siempre en una carpeta `work/` junto al video del usuario, nunca dentro de `SKILL_DIR`. Requisitos: Python 3.10+, Node 18+, ffmpeg. La primera ejecución instala Remotion en `~/.crimson-gloss/runtime` (1–2 min, una sola vez).

## 0. Elegir el modo
| Si el usuario pide… | Modo |
|---|---|
| "edítalo", "subtítulos", "quita los silencios", "déjalo listo para redes" (sin mencionar estilo) | **normal** |
| "estilo crimson", "tipo crimson", "texto rojo 3D", "como el reel de nikhilmotion" | **crimson** |
Si no está claro, **normal** y ofrécele crimson al final. Ambos usan el mismo motor y se pueden mezclar (subtítulos dentro de un plan crimson, si lo pide).

---
## MODO NORMAL — automático, 3 comandos
```
python "SKILL_DIR/scripts/prepare.py" "RUTA/video.mp4" --out work --mode normal [--lang es]
python "SKILL_DIR/scripts/autoplan.py" work [--name "Nombre" --role "Rol"] [--cta "Síguenos"] [--fix "Mal=Bien,..."] [--accent "#ffd11a"]
python "SKILL_DIR/scripts/render.py" work --out final.mp4
```
1. **prepare** — pasa el video a 1080x1920/30 fps, transcribe en local (`faster-whisper`; el audio no sale de la máquina) y **corta los silencios** (pausas > 0,45 s). Esto cambia el video y reajusta los tiempos de las palabras.
2. **Antes de `autoplan`: lee `work/transcript.json`** y busca palabras mal entendidas (marcas, nombres propios, siglas). Pásalas en `--fix "Dereo=Video,Core=Code"`. Si dudas de un nombre, pregúntale al usuario. Pregunta también (una sola vez) si quiere rótulo con su nombre/rol y llamada a la acción; si no contesta, omítelos.
3. **autoplan** — escribe `plan.json`: subtítulos de 3 palabras con la palabra hablada resaltada, palabras de énfasis en color (números y palabras largas), un **zoom de énfasis** al empezar cada frase larga, rótulo y CTA opcionales. Ajustes útiles: `--per 2|3|4` (palabras por línea), `--y 1330` (altura de los subtítulos, sube si tapan algo), `--no-punch`.
4. **Revisa antes del render final**: `python "SKILL_DIR/scripts/render.py" work --still 1 4 8` y abre `work/qa_*.png`. Los subtítulos no deben tapar la cara ni las manos; si lo hacen, cambia `--y`.
5. **render** — genera `work/final.mp4` a -14 LUFS y `work/informe.md`.

---
## MODO CRIMSON — Claude diseña las escenas a partir del guion
```
python "SKILL_DIR/scripts/prepare.py" "RUTA/video.mp4" --out work [--lang es] [--matte auto|white|none]
```
Genera `work/input.mp4`, `transcript.json`, `cutout.webm` (silueta con alfa si el fondo es liso: permite que tarjetas y cintas salgan **por detrás** de la persona), `music.wav`, `frame.jpg`, `sheet.jpg`, `prepare.json`. Si `matte` sale `none`, avisa al usuario: sin fondo liso las tarjetas irán por delante (el resto del estilo funciona igual).

### Decidir y escribir `work/plan.json`
- Abre `frame.jpg` y `sheet.jpg`. **`headTop`** = píxeles (sobre 1920) donde empieza la cabeza. Referencia: cabeza a media altura → ~780. Todas las posiciones se calculan desde ahí.
- Lee `transcript.json` completo y **corrige mal-entendidos** en los textos que escribas (no copies errores de Whisper).
- Divide el guion en **4–7 escenas** de 1,5–3,5 s. Una escena = una idea. Cada texto entra en `at` = segundo en que se **dice** la palabra (`words[].s`) menos ~0,1.

**El contenido sale del guion, nunca de una plantilla.** Ilustra las ideas así, por orden de preferencia:
1. Imágenes que el usuario dio o están en `work/assets/` (`"image": "assets/x.png"`).
2. Un **emoji/sticker que represente la idea** (dinero → 💰, crecimiento → 📈, tiempo → ⏳, idea → 💡…). Por significado, no por costumbre.
3. Texto grande en una tarjeta (`"text": "42\nSKILLS"`).
Si el guion habla de cosas muy concretas que un emoji no cubre, pregunta si quiere subir imágenes antes de renderizar. **Nunca** metas un astronauta, cohete o cielo si el guion no habla de eso.

Alterna escenas `presenter` con una escena `insert` cada 2–3 escenas como máximo, en la idea central o el dato más visual.

#### Esquema de `plan.json`
```json
{
  "duration": 17.8,                 // = transcript.duration
  "video": "input.mp4",
  "cutout": "cutout.webm",          // o null si matte=none
  "music": "music.wav", "musicVolume": 0.08,
  "headTop": 780, "floorY": 1580,
  "theme": { "accent": "#e10600" }, // opcional: accent, dark, light, soft, bg, ink
  "scenes": [
    { "type": "presenter", "from": 0, "to": 1.8, "zoom": 1, "elements": [
        { "kind": "small", "slot": "lead", "text": "Mi nombre es", "at": 0.1 },
        { "kind": "gloss", "slot": "aboveHead", "text": "MACC", "at": 0.7 } ] },
    { "type": "presenter", "from": 1.8, "to": 3.8, "zoom": 0.86, "elements": [
        { "kind": "gloss", "slot": "top", "text": "CEO", "at": 2.3 },
        { "kind": "pill", "slot": "left", "text": "de", "at": 2.6 },
        { "kind": "card", "slot": "aboveHead", "at": 2.1, "content": { "emoji": "👔" } } ] },
    { "type": "insert", "from": 6.4, "to": 10.0, "bg": "sunset", "object": { "emoji": "💰" },
      "stickers": ["✨", "📈"], "lines": [ { "small": "Hoy ganas", "at": 6.6 }, { "gloss": "MÁS", "at": 7.0 } ] }
  ]
}
```
- **gloss** (palabra clave gigante, rojo cristal; **una por bloque**): `slot` = `top` `second` `aboveHead` `bottom` `footer`; el tamaño se ajusta solo al ancho; `align:"center"`, `x`/`y` para forzar.
- **small** (palabra fina cursiva): `slot` = `tl` `tr` `lead` `sub` `bottom`.
- **pill** (pastilla roja): `slot` = `left` `right` `url`.
- **card** (tarjeta con borde rojo que sale por detrás): `slot` = `aboveHead` `left1` `left2` `left3` `right1` `right2`; `content` = `{emoji}` | `{image}` | `{text}` | `{colors:[a,b]}`; `label`, `icon` (`play`, `headphones` o un emoji).
- **insert** `bg`: `sky` `sunset` `night` `mint` `gold` `paper` `rose` (elige el que pegue con el tema); `object`: `{emoji}` o `{image}`; `stickers`: hasta 4 emojis.
- `zoom` < 1 aleja el video (deja sitio arriba al texto grande, p. ej. 0.86). Cada texto sale solo (whip-blur) al terminar su escena.
- Extras (también válidos en crimson): `captions`, `punches`, `lower`, `cta` (ver `scripts/autoplan.py` para su forma).

#### Reglas de diseño
- Solo rojo y blanco (azul únicamente en insertos). Nada de negro.
- **Una sola palabra gigante por escena**; el resto, pequeño.
- No tapes la cara: usa `top`/`aboveHead` y `bottom`/`footer`; tarjetas junto a los hombros.
- Cada texto debe coincidir con lo que se oye en ese instante.
- Si el guion termina con una llamada a la acción (enlace, "comenta X"), úsala como último `gloss` + `pill` `url`.

### Revisar y renderizar
```
python "SKILL_DIR/scripts/render.py" work --still 0.9 2.5 5 8      # abre work/qa_*.png y corrige plan.json
python "SKILL_DIR/scripts/render.py" work --out final.mp4
```
Mira especialmente: texto cortado, tarjetas sobre la cara, inserto ilustrando la idea correcta, nada que no se diga.

---
## Al entregar (los dos modos): explicar TODO
1. Lee `work/informe.md` (lo escribe `render.py`) y **cuéntaselo al usuario en lenguaje llano**: cuánto se acortó y por qué, qué subtítulos/zooms/escenas se pusieron y en qué segundos, qué se corrigió de la transcripción, cómo se ajustó el audio.
2. Dile cómo cambiar algo: editar `plan.json` y volver a ejecutar `render.py` (no hace falta repetir `prepare.py`).
3. Termina con lo que **no** pudiste comprobar (p. ej. no oíste el resultado entero, el recorte no probado en ropa blanca).
4. Si usaste modo normal, ofrece el estilo crimson; si usaste crimson, ofrece subtítulos.

## Si algo falla
- `plan inválido`: `render.py` indica escena/elemento; corrige tiempos.
- Cinta rara cruzando la cara: solo ocurre sin `cutout`; pon `"cutout": null` (se desactivan las cintas).
- Recorte feo (huecos en ropa blanca): `--matte none` o graba con fondo de otro color.
- Transcripción con errores: usa `--model medium` en `prepare.py` o `--fix` en `autoplan.py`.
- Subtítulos tapan algo: `--y` más alto/bajo.
- Los emojis usan la fuente del sistema; para calidad máxima pide imágenes en `work/assets/`.

## Probado / no probado
Probado en Windows con un clip limpio de presentador (español, 18 s): transcripción local, corte de silencios, recorte por fondo liso, render completo en ambos modos. **No probado con un video real filmado por el usuario**: el recorte por color puede dejar huecos en ropa blanca.
