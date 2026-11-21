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

## 9. Catálogo de B-roll (37 layouts)

Una escena `insert` cubre al presentador 2–4 s. Se compone de: **fondo** (`bg`), **cabecera** (`lines`) y un **layout**. Hay 17:

| `layout` | Cuándo usarlo | Parámetros |
|---|---|---|
| `phone` | idea genérica con un objeto (por defecto) | `object:{emoji\|image}`, `stickers:[emoji]` |
| `stat` | una cifra: «300%», «42 skills», «3 meses» | `stat:{value, prefix, suffix, decimals, label, emoji}` (cuenta hasta el valor) |
| `chart` | crece/sube o cae/baja | `chart:{up, kind:'line'\|'bar', data:[n…], label:'+312%'}` |
| `steps` | «primero… segundo… tercero…», procesos | `steps:[{text, emoji, at}]` (hasta 5) |
| `checklist` | enumeraciones, «sin A, sin B y sin C» | `items:[{text, ok:true\|false, at}]` |
| `compare` | antes/después, mito/realidad | `compare:{left:{title, items[]}, right:{title, items[]}}` |
| `quote` | una cita o frase fuerte | `quote:{text, author}` |
| `chat` | mensajes, clientes, DM | `chat:{name, emoji, messages:[{from:'me'\|'them', text, at}]}` |
| `browser` | web, enlace, tienda | `browser:{url, title, button, image}` (escribe la URL y hace clic) |
| `terminal` | comandos, código, instalar | `terminal:{title, lines:[{text, kind:'cmd'\|'out', at}]}` |
| `grid` | varias cosas a la vez (herramientas, funciones) | `grid:{items:[{emoji,label}], cols}` |
| `meter` | porcentaje ≤ 100 («87 % de retención») | `meter:{value, label, suffix}` |
| `rain` | dinero, celebración | `rain:{emoji, count, center}` |
| `notifs` | avisos, ventas, alertas | `notifs:[{app, title, body, at}]` |
| `rating` | reseñas, prueba social | `rating:{stars, score, label}` |
| `image` | foto o captura del usuario a pantalla completa | `image:{src:'assets/x.png', zoom:0.12}` (Ken Burns) |
| `clip` | clip de video del usuario | `clip:{src:'assets/x.mp4', start:0}` |


**Cómo elige el modo personaje** (`character.py plan`), por orden de prioridad en cada trozo del guion: cifra (`stat` o `meter` si es un porcentaje ≤ 100) → «crece/cae» (`chart`) → enlace o dirección web (`browser`, con la URL dicha o `--url`) → comando/código (`terminal`) → mensajes (`chat`) → reseñas (`rating`) → dinero (`rain`) → enumeración de 3+ elementos (`checklist`) → 3+ conceptos con emoji (`grid`) → objeto con emoji (`phone`). «Primero, segundo, tercero» se agrupa en **una** escena `steps`. Nunca repite el mismo layout dos veces seguidas y limita la frecuencia (1 cada 3 trozos; las cifras, cada 2). `image`, `clip`, `compare` y `quote` los pones tú en `plan.json`.

**Qué es automático y qué conviene revisar:** la elección del layout y sus textos salen de las palabras del guion (nada se inventa: el chat usa tu frase, el terminal también), pero la etiqueta de una cifra puede quedar rara («ellos vuelve»); corrígela a mano.

## 10. Modo cuento

`character.py plan --story` (sin presentador): la narración manda y todo lo demás sale de las palabras del guion.

1. **Frases → láminas.** Cada frase es una escena (las muy cortas se unen). La primera, si hay `--title`, queda cubierta por la portada.
2. **Mundo.** Se detecta por palabras del lugar (`bosque`, `mar`, `castillo`, `espacio`, `granja`, `nieve`, `noche`…) y se mantiene hasta que cambia.
3. **Personajes.** Cada animal o personaje nombrado (≈ 80, en `lexicon.py`) pasa a ser un actor (emoji). Aparece cuando se dice su nombre. Hasta 3 por escena; el mismo emoji siempre para el mismo personaje.
4. **Movimiento por verbo.** `camina/corre` → `walk`; `vuela` → `fly`; `nada` → `swim`; `salta/brinca` → `bounce`; `baila/canta` → `sway`; `duerme` → `float`.
5. **Diálogo.** El texto entre comillas se muestra como globo sobre el primer personaje en el momento exacto en que se dice.
6. **Páginas con lectura.** El layout `storybook` resalta cada palabra con sus tiempos reales (`words`), una de cada tres láminas pasa a pantalla completa (`scene`) para dar ritmo (`--layout` lo cambia).
7. **Especiales.** «magia, varita, hechizo» → `magic`; «Moraleja: …» → `moral`; al final, `theend` («FIN») con confeti.
8. **Educativo.** `counting`, `letter`, `shapes`, `journey` los añades tú en `plan.json` (ver catálogo).

El **mundo** se dibuja con capas: cielo (degradado, sol o estrellas), nubes que se desplazan, colinas, decorado lejano y cercano con *parallax* (`pan`), suelo o agua con olas, y efectos (nieve, burbujas, hojas, destellos).

**Límites:** son ilustraciones de emojis (consistentes pero no personalizadas); un animal que no esté en el léxico no aparece hasta que lo añadas; no hay giro de los personajes salvo reflejarlos al moverse.

## 11. Orientación vertical y horizontal

El plan lleva `"orientation": "vertical"` (1080×1920, por defecto) u `"horizontal"` (1920×1080). Por dentro:
- La plantilla Remotion expone el tamaño del lienzo a todos los componentes (`useDims()`); Root lo fija con `calculateMetadata`.
- **Cuentos:** todo se calcula con porcentajes de la altura y la anchura. El decorado (árboles, edificios…) se **repite a lo ancho** en horizontal; los personajes se escalan por la altura; la página de cuento pasa a dos columnas.
- **B-roll:** los layouts se diseñaron a 1080 de ancho; en horizontal se escalan y se colocan en la columna derecha, y las líneas de cabecera (la palabra grande) van a la izquierda, centradas. Si no hay cabecera, el visual queda centrado. `rain`, `reaction` e `image` ocupan toda la pantalla.
- **Normal:** el video se recorta a 1920×1080 y los subtítulos, el rótulo y el CTA se escalan con la altura.
- **Crimson y personaje:** el texto, las tarjetas y el personaje están pensados para una columna vertical; en horizontal esa columna se **encaja por altura** y el fondo se rellena (video desenfocado o el set del personaje). Es honesto pero no es una recomposición nativa: si necesitas un crimson horizontal "de verdad", grábate en horizontal y pide el modo normal, o usa B-roll y cuentos que sí son nativos.

## 12. Límites generales
- Probado en Windows con un clip limpio en español, no con un video real filmado.
- No detecta repeticiones/tomas falsas: solo corta **silencios**.
- La transcripción local se equivoca con nombres propios; hay que corregirlos.
- Un solo presentador, vertical 9:16.
