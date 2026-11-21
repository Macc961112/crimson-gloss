# Cómo funciona Crimson Gloss (explicado completo)

## 1. La idea
Un video de una persona hablando es solo imagen + voz. La skill **entiende lo que dices** (transcripción con tiempos por palabra) y usa esos tiempos para que todo lo que aparece en pantalla entre **justo cuando lo dices**. Todo se dibuja con código (Remotion, que es React fotograma a fotograma), no con un editor manual.

## 2. Los tres pasos

### Paso 1 · `prepare.py` (preparar)
```
python prepare.py VIDEO --out work [--mode normal|crimson] [--lang es] [--model small] [--matte auto|white|none|file:RUTA] [--gap 0.45] [--no-trim] [--no-music]
```
1. **Normaliza** el video a 1080×1920, 30 fps, H.264 + AAC (si no es vertical, recorta al centro y avisa).
2. **Transcribe** con `faster-whisper` en tu CPU (`int8`), con tiempos por palabra. Guarda `transcript.json` con `words[]` (`w`, `s`, `e`) y `sentences[]`. El audio **no sale de tu máquina**.
3. **Modo normal — corta silencios:** agrupa las palabras separadas por menos de `--gap` s (0,45 por defecto), deja 0,1 s de margen antes y 0,2 s después, corta lo demás con ffmpeg (`trim` + `concat`) y **reajusta los tiempos** de todas las palabras para que sigan sincronizadas.
4. **Modo crimson — recorte de silueta:** si la esquina del video es un color liso y claro, usa `colorkey` para hacerlo transparente y guarda `cutout.webm` (VP9 con alfa). Esa silueta se dibuja **encima** de las tarjetas, y por eso las tarjetas parecen salir de detrás de ti.
5. Genera `music.wav` (pad + pulso suave sintetizados), `frame.jpg`, `sheet.jpg` y `prepare.json` (duración original, segundos recortados, idioma, color del fondo).

### Paso 2 · el plan (`plan.json`)
Es un archivo con **todas** las decisiones de edición. Quién lo escribe depende del modo:

- **Normal → `autoplan.py`** (automático):
  - **Subtítulos:** palabras del `transcript.json` en bloques de 3 (se corta antes si hay punto/coma o pausa); la palabra que estás diciendo se resalta con el color de acento.
  - **Énfasis:** números y palabras de 9+ letras salen en color.
  - **Zooms de énfasis:** al empezar cada frase de más de 1,4 s, el video sube un 10–14 % y vuelve.
  - **Rótulo** (`--name`, `--role`) y **llamada a la acción** (`--cta`) opcionales.
  - `--fix "Dereo=Video"` corrige palabras mal transcritas.
- **Crimson → Claude:** lee el guion transcrito y decide escenas. Cada escena es una idea de 1,5–3,5 s. **El contenido sale de lo que dices**: elige el emoji, la imagen o el texto que ilustra cada idea, y el fondo de los insertos. No hay plantillas fijas.

### Paso 3 · `render.py`
```
python render.py work [--plan plan.json] [--out final.mp4] [--still 1.2 3.5 ...]
```
- Valida el plan (tiempos fuera de rango, ficheros que faltan).
- Instala la plantilla Remotion **una sola vez** en `~/.crimson-gloss/runtime` (ruta corta porque Windows limita a 260 caracteres).
- `--still` renderiza solo esos segundos a `work/qa_*.png` para revisar **antes** del render completo.
- Render completo → mezcla con tu voz → **normaliza a -14 LUFS** (volumen estándar de Reels/TikTok/Shorts) → `final.mp4`.
- Escribe `informe.md` con todo lo que se hizo.

## 3. Esquema de `plan.json`

```json
{
  "duration": 17.8,
  "video": "input.mp4",
  "cutout": "cutout.webm",
  "music": "music.wav", "musicVolume": 0.08,
  "headTop": 780,
  "floorY": 1580,
  "bg": ["#f1f0f2", "#e2e1e6"],
  "theme": { "accent": "#e10600", "dark": "#7a0012", "light": "#ff2a2a", "soft": "#ff9aa8", "ink": "#c8102e" },
  "introFade": true,
  "scenes": [ ... ],
  "captions": { "words": [...], "perLine": 3, "y": 1330, "size": 84, "activeText": "#111", "emphasis": ["42"] },
  "punches":  [ { "at": 5.2, "dur": 1.4, "scale": 1.12 } ],
  "lower":    { "name": "Macc", "role": "Creador", "at": 0.5, "dur": 3.2, "y": 1080 },
  "cta":      { "text": "Síguenos", "at": 11.2, "y": 1640 }
}
```
- `headTop`: píxel (sobre 1920) donde empieza tu cabeza. Todas las posiciones del texto crimson se calculan desde ahí.
- `bg` se rellena solo con el degradado real de tu fondo (evita un rectángulo cuando el video se aleja).

### Escenas
**`presenter`** (tú + elementos): `from`, `to`, `zoom` (<1 aleja el video), `elements[]`:

| `kind` | Qué es | `slot` |
|---|---|---|
| `gloss` | Palabra clave gigante, rojo cristal, entra letra a letra. **Una por bloque.** | `top`, `second`, `aboveHead`, `bottom`, `footer` |
| `small` | Palabra fina cursiva | `tl`, `tr`, `lead`, `sub`, `bottom` |
| `pill` | Pastilla roja | `left`, `right`, `url` |
| `card` | Tarjeta con borde rojo que sale **por detrás** de ti | `aboveHead`, `left1`, `left2`, `left3`, `right1`, `right2` |

Todos llevan `at` (segundo en que entra); `until` opcional (por defecto salen al acabar la escena con un desenfoque de movimiento). El tamaño de `gloss` se ajusta solo al ancho; `x`, `y`, `align:"center"`, `size` lo fuerzan.

Contenido de una `card`: `{ "emoji": "💡" }`, `{ "image": "assets/foto.png" }`, `{ "text": "42\nSKILLS" }` o `{ "colors": ["#e10600","#7a0012"] }`; con `label` y `icon` opcionales.

**`insert`** (un fondo que tapa la escena 2–3 s para ilustrar la idea): `bg` (`sky` `sunset` `night` `mint` `gold` `paper` `rose`), `object` (`{emoji}` o `{image}`), `stickers` (hasta 4 emojis), `lines` (texto pequeño/gloss que entra en `at`).

## 4. El estilo Crimson, en una lista
- Texto **rojo cristal**: degradado vertical oscuro→claro, cursiva, muy apretado, sombra suave.
- **Píxeles** que parpadean 3 fotogramas antes de cada texto, como aviso.
- **Halftone**: trama de puntos rosa que explota al cambiar de escena.
- **Cintas rojas** (curva suave del cuerpo a la tarjeta, siempre detrás de ti, nunca cruzan la cara).
- **Desenfoque de movimiento** en cada corte; destello blanco antes/después de un inserto.
- Rojo y blanco únicamente; una sola palabra gigante por escena. Detalle completo en [`crimson-gloss/reference/style.md`](../crimson-gloss/reference/style.md).

## 5. El informe (`informe.md`)
Lo escribe `render.py` en español: duración original → final, silencios cortados, idioma y palabras transcritas, cada subtítulo/zoom/escena con su segundo, música, ajuste de volumen y archivos. Claude te lo cuenta en lenguaje llano al entregar.

## 6. Solución de problemas
| Síntoma | Causa | Arreglo |
|---|---|---|
| `plan inválido: …` | Tiempos fuera de la escena o fichero que falta | Corrige el `plan.json` como indica el mensaje |
| Palabras mal escritas en subtítulos | Whisper no conoce marcas/nombres | `autoplan.py --fix "Mal=Bien"` o `--model medium` en `prepare.py` |
| Subtítulos tapan la cara o las manos | Altura por defecto (1330) | `autoplan.py --y 1450` (o más bajo) |
| Huecos en la ropa en modo crimson | `colorkey` quita también tonos parecidos al fondo | `--matte none` o fondo de otro color |
| Tarjetas por delante, no por detrás | No hay `cutout.webm` (fondo no liso) | Graba con fondo liso o acepta el efecto por delante |
| Falla `npm install` en Windows | Ruta demasiado larga | La skill ya usa `~/.crimson-gloss/runtime` (ruta corta); no muevas esa carpeta a una ruta larga |
| `faster-whisper` no lee el audio | Incompatibilidad de PyAV | Ya está resuelto: la skill decodifica el audio ella misma |
| Emojis se ven feos | Fuente de emojis del sistema | Pon imágenes en `work/assets/` y usa `{ "image": ... }` |


## 8. Modo personaje (sin cámara)

```
character.py init work --script-file guion.txt          # voz + transcripción con tiempos + música
character.py plan work --look "hombre barba gafas"      # escenas automáticas, gestos, apariencia
render.py work --still 1 5 10  →  render.py work --out final.mp4 --format both
```

**1. Voz y tiempos.** `edge-tts` genera `voice.mp3` y el tiempo de **cada palabra** (los guarda en `transcript.json`; la puntuación se recupera del guion para saber dónde asentir). Con `--audio` usas tu propia voz y se transcribe en local.

**2. Sincronía labial.** En el render, cada palabra se descompone en letras → *visemas*: `A E I O U` (vocales, con su abertura y redondez), `M` (labios cerrados: b/m/p), `F` (dientes sobre el labio: f/v) y `C` (consonante genérica); h y q son mudas. El tiempo de la palabra se reparte entre sus visemas según su peso (las vocales duran más) y la boca **interpola** entre una forma y la siguiente en 60 ms. Se dibuja con curvas: interior, dientes, lengua y labios según los parámetros.

**3. Vida.** Parpadeo en intervalos aleatorios (a veces doble), mirada con deriva suave, respiración (el torso sube/baja cada 3,4 s), balanceo, cabeceo de ~3,6° en comas y puntos, y cejas que suben (hasta 7 px) en cada palabra clave.

**4. Brazos y manos con cinemática.** Cada brazo tiene hombro→codo→muñeca (longitudes 78 y 58) y se calcula con dos ángulos. Un gesto es un par de poses (derecho/izquierdo) con una mano (`open`, `point`, `count n`, `fist`); entra en 0,28 s, se mantiene y sale en 0,3 s. `chop` y `wave` añaden oscilación. El brazo izquierdo es el derecho **espejado**.

**5. Escenas automáticas (`character.py plan`).** Divide el guion en trozos de 1–3,6 s (frases, comas, pausas), elige la **palabra clave** de cada trozo (puntúa longitud, números, mayúsculas y si está en el léxico de emojis, y penaliza repetidas), pone las palabras previas como texto pequeño y, si la palabra tiene emoji, añade una tarjeta que sale por detrás; cada ~4 trozos con un emoji claro crea un **inserto** a pantalla completa. Alterna la cámara (`zoom` 1,0–1,12). Los gestos se derivan de números, pronombres y palabras clave.

**6. Cámara y set.** El zoom parte del suelo (la cabeza sube al acercar) y hay un empuje lento del 3 % por escena. Pared, props y personaje se escalan con distinta profundidad (0,5 / 0,8 / 1,0): **parallax**. Set `studio` o `night`; alfombra con el color de acento.

**7. Revisión automática (`render.py`).** Antes de renderizar avisa de textos que se pisan, textos sobre la cara (modos con video) y escenas largas sin cambios. Con `--strict` aborta.

**8. Extras.** `--fps 60`; `--format both` (9:16 + 1:1 con fondo desenfocado, sin recortar texto); `subtitulos.srt`; música que **baja un 62 %** mientras se habla (*ducking*); `--brand brand.json` para colores y personaje de marca.

### `character.json` (apariencia)
```json
{ "skin": "#e2ad8d", "hair": "#2b1d16", "hairStyle": "short|quiff|long|bun|bald",
  "beard": "none|stubble|full", "glasses": true, "glassesColor": "#1b1b22",
  "outfit": "hoodie|tee|suit", "top": "#111114", "pants": "#1c1c22", "shoes": "#ffffff",
  "chair": "#6b3a26", "tie": "#e10600", "lips": "#b4586a", "eyes": "#3a2a20" }
```
### `brand.json`
```json
{ "accent": "#e10600", "dark": "#7a0012", "light": "#ff2a2a", "ink": "#c8102e",
  "set": "studio", "character": { "outfit": "suit", "top": "#1d3a5c" } }
```
### Gestos en `plan.json`
`"character": { "gestures": [ { "at": 3.2, "dur": 1.3, "kind": "chop" }, { "at": 19.2, "dur": 1.5, "kind": "count", "n": 3 } ] }` — tipos: `open`, `point`, `count`, `chop`, `shrug`, `wave`.

### Límites del modo personaje
- Es 2D ilustrado; no hay giro de cabeza ni cambio de ángulo, y las manos son simples.
- La sincronía es por letras (muy buena en español, aproximada en inglés).
- La voz de `edge-tts` necesita internet y envía el texto a Microsoft.

## 9. Límites generales
- Probado en Windows con un clip limpio en español, no con un video real filmado.
- No detecta repeticiones/tomas falsas: solo corta **silencios**.
- La transcripción local se equivoca con nombres propios; hay que corregirlos.
- Un solo presentador, vertical 9:16.
