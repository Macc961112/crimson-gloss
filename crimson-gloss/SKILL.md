---
name: crimson-gloss
description: Edita el video de una persona hablando a cámara (vertical 9:16) de forma automática y explicada. Cuatro modos — NORMAL (limpio y rápido - corta silencios, subtítulos palabra a palabra, zooms de énfasis, rótulo con nombre, llamada a la acción, música baja y volumen -14 LUFS), PERSONAJE (sin video - un presentador animado por código con sincronía labial, gestos y cámara, a partir de un guion o una voz) CUENTO (cuentos infantiles ilustrados por código: páginas con lectura resaltada, mundos, personajes animados, moraleja y FIN) y CRIMSON (estilo "Crimson Gloss" - texto rojo cristal 3D al ritmo de la voz, tarjetas y cintas que salen por detrás de la persona, píxeles, halftone y escenas inserto que ilustran lo que se dice). Funciona en vertical (9:16) y horizontal (16:9). Usar cuando el usuario dé un video suyo o un guion/idea y pida "edítalo", "ponle subtítulos", "quítale los silencios", "hazlo estilo crimson / tipo crimson / crimson gloss", "texto rojo 3D alrededor mío", "edítalo como el reel de nikhilmotion", "hazme un video sobre X con un muñeco / personaje / presentador animado", "video sin cámara", "cuento infantil", "cuento para niños", "video educativo para niños (contar, letras, formas)", o /crimson-gloss.
---

# Crimson Gloss (modo normal + modo crimson + modo personaje)

El usuario entrega **un video suyo hablando a cámara** (modos normal y crimson) **o solo un guion/idea/voz** (modo personaje). Tú lo conviertes en un reel terminado y **le explicas todo lo que se hizo y por qué**. Referencia visual completa del estilo Crimson: `reference/style.md`. Documentación para humanos: `docs/COMO_FUNCIONA.md`.

`SKILL_DIR` = carpeta de este archivo. Usa el Python que tenga `faster-whisper` y `numpy` (en Windows: `python`). Trabaja siempre en una carpeta `work/` junto al video del usuario, nunca dentro de `SKILL_DIR`. Requisitos: Python 3.10+, Node 18+, ffmpeg; modo personaje además `edge-tts` (`pip install edge-tts`). La primera ejecución instala Remotion en `~/.crimson-gloss/runtime` (1–2 min, una sola vez).

## 0. Elegir el modo
| Si el usuario pide… | Modo |
|---|---|
| "edítalo", "subtítulos", "quita los silencios", "déjalo listo para redes" (sin mencionar estilo) | **normal** |
| "estilo crimson", "tipo crimson", "texto rojo 3D", "como el reel de nikhilmotion" (con su video) | **crimson** |
| "cuento", "cuento infantil", "historia para niños", "fábula", contenido educativo para niños | **cuento** |
| NO hay video: "hazme un video sobre…", "con un muñeco / personaje / avatar", "sin cámara", da un guion o una voz | **personaje** |
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
## MODO PERSONAJE — sin cámara: un presentador animado por código
Para quien no tiene video: parte de **un guion** (o una voz grabada) y produce el reel completo con un personaje 2D hecho en código. Como las capas son nuestras, las tarjetas y cintas salen **siempre por detrás** del personaje (no hace falta fondo liso).

### Qué anima el personaje (todo automático)
- **Sincronía labial por visemas**: cada palabra se convierte en formas de boca (A, E, I, O, U, M/B/P, F/V…) con sus tiempos reales. No es una boca que se abre al azar.
- **Vida**: parpadeo irregular, mirada, respiración, balanceo, cabeceo en comas y puntos, cejas que suben en cada palabra clave.
- **Gestos de brazos y manos** con cinemática (hombro-codo-muñeca): `open`, `point`, `count` (1–5 dedos), `chop`, `shrug`, `wave`. Se eligen solos: números → cuenta con los dedos, «tú» → señala, «hola» → saluda, «no/nunca» → encoge los hombros, palabra clave → gesto de énfasis.
- **Cámara**: tomas por escena (`zoom` 1.0–1.15; evita valores >1.2 con texto `top`), empuje lento, parallax entre pared/props/personaje.
- **Set**: `studio` (claro) o `night` (azul con luces desenfocadas); lámpara, planta, alfombra con tu color de acento.

### Flujo
```
python "SKILL_DIR/scripts/character.py" init work --script-file guion.txt [--voice es-MX-JorgeNeural] [--rate +6%]     # o --audio voz.mp3
python "SKILL_DIR/scripts/character.py" plan work --look "hombre 30 años, barba, gafas, sudadera roja" [--brand brand.json] [--set studio|night] [--cta "Síguenos"] [--captions] [--fps 60]
python "SKILL_DIR/scripts/render.py" work --still 1 5 10 20            # revisar
python "SKILL_DIR/scripts/render.py" work --out final.mp4 --format both  # 9:16 + 1:1 + subtitulos.srt + informe.md
```
1. **Si el usuario solo da una idea** («hazme un video sobre X»): **escribe tú el guion** (25–60 s; frases cortas; gancho en la primera frase; una idea por frase; datos concretos; cierre con llamada a la acción) y **muéstraselo antes de generar la voz**.
2. **`init`** genera `voice.mp3` con `edge-tts` (voces: `es-MX-JorgeNeural`, `es-ES-AlvaroNeural`, `es-AR-TomasNeural` hombre; `es-MX-DaliaNeural`, `es-ES-ElviraNeural` mujer; ajusta `--rate`). **Avisa al usuario:** `edge-tts` envía el **texto** del guion a Microsoft para sintetizarlo; con `--audio` y su propia voz no se envía nada (la transcripción es local).
3. **`plan`** escribe `plan.json` con escenas automáticas guiadas por el guion (palabra clave gigante + emoji que la ilustra + B-roll del catálogo elegido según lo que se dice: cifras → `stat`/`meter`, «crece/cae» → `chart`, «primero/segundo/tercero» → `steps`, enlace → `browser`, comando → `terminal`, mensajes → `chat`, listas → `checklist`…), gestos y apariencia. `--look` entiende: hombre/mujer, barba (corta), gafas, calvo/tupé/largo/moño, traje/sudadera/camiseta (+ color), piel clara/morena/oscura, rubio/pelirrojo/canoso. Para control total: `--character c.json` con `{skin, hair, hairStyle(short|quiff|long|bun|bald), beard(none|stubble|full), glasses, top, outfit(hoodie|tee|suit), pants, shoes, chair, tie, lips, eyes}`. `--brand brand.json` fija colores (`accent`, `dark`, `light`, `ink`…), `set` y `character` de la marca.
4. **Revisa y mejora `plan.json` con criterio** — la heurística acierta bastante pero no entiende todo: ¿la palabra gigante es la importante de la frase?, ¿el emoji ilustra la idea (p. ej. «estudio» sale 📚 pero puede ser 🎙️)?, ¿hay demasiados o pocos insertos?, ¿falta un gesto en el dato clave? Edita `scenes[]` y `character.gestures[]` (`{at, dur, kind, n}`) a mano. Las escenas siguen el mismo esquema que el modo crimson (abajo).
5. **Renderiza**: primero `--still`, luego el final. `render.py` avisa del *lint* (textos que se pisan, escenas largas). `--fps 60` para movimiento más suave (render 2× más lento); `--format both` añade el cuadrado 1:1.

---
## MODO CUENTO — cuentos infantiles y educativos, todo por código
Sin presentador: una **narración** (voz sintética o grabada) sobre **ilustraciones animadas** hechas con mundos, personajes (emojis con movimiento) y globos de diálogo. Sirve para cuentos, fábulas, canciones y lecciones (contar, letras, formas).

```
python "SKILL_DIR/scripts/character.py" init work --script-file cuento.txt --voice es-MX-DaliaNeural --rate=-4%     # o --audio narracion.mp3
python "SKILL_DIR/scripts/character.py" plan work --story --title "El conejo valiente" [--layout mixed|storybook|scene] [--no-end] [--captions]
python "SKILL_DIR/scripts/render.py" work --still 2 6 12 20        # revisar
python "SKILL_DIR/scripts/render.py" work --out cuento.mp4 --format both
```
- **Voz para niños:** `es-MX-DaliaNeural` o `es-ES-ElviraNeural` con `--rate=-4%` (¡con `=`, o argparse lo toma por una opción!). Avisa: `edge-tts` envía el texto a Microsoft; con `--audio` no se envía nada.
- Si el usuario solo da una idea: **escribe tú el cuento** (≈ 10 frases, una idea por frase, personajes con nombre de animal/oficio, un problema y una solución; en fábulas, termina con «Moraleja: …») y **enséñaselo antes de generar la voz**. Una frase = una lámina (~10 láminas).
- **`plan --story`** hace solo: portada («Había una vez…» + título) que cubre la primera frase; una escena por frase (alterna **página de cuento** con lectura resaltada y **ilustración a pantalla completa**); **mundo** según el lugar (bosque, selva, mar, playa, castillo, espacio, granja, desierto, ciudad, nieve, noche, dulces); **personajes** según los animales/personas nombrados (oso, conejo, zorro, hada, dragón, sirena, unicornio…, ~80); **movimiento** según el verbo (camina → anda, vuela → vuela, nada → nada, salta → rebota, baila/canta → se mece, duerme → flota); **diálogos entre comillas** → globo de texto; «magia/varita/hechizo» → escena `magic`; «Moraleja: …» → `moral`; y **FIN**.
- **Revisa y mejora `plan.json`**: ¿el mundo y los personajes encajan?, ¿falta un personaje (el emoji sale del léxico `lexicon.py`; si un animal no está, añade el actor a mano `{ "emoji":"🦔","x":0.3,"y":0.74,"size":320,"move":"sway","at":T }`)?, ¿conviene una escena `counting`, `letter`, `shapes` o `journey` en medio? Los actores usan **el mismo emoji para el mismo personaje** en todo el cuento (consistencia).
- Educativo: para «cuenta del 1 al 5» pon una escena `counting` (`{"emoji":"🍎","n":5,"label":"manzanas"}`); para el abecedario, una `letter` por letra; para figuras, `shapes`.

---
## ORIENTACIÓN: vertical (9:16) y horizontal (16:9)
Todos los modos funcionan en las dos orientaciones. Pregunta al usuario **dónde lo va a publicar** (Reels/TikTok/Shorts → vertical; YouTube, presentaciones, TV → horizontal) y, si no sabe, usa vertical.

| Modo | Vertical 1080×1920 | Horizontal 1920×1080 |
|---|---|---|
| **cuento** | nativo | **nativo**: mundos más anchos con decorado repetido, página de cuento con la ilustración a la izquierda y el texto a la derecha, portada/moraleja/FIN recompuestos |
| **B-roll** (`insert`) | nativo | **dos columnas**: el texto grande a la izquierda y el visual (gráfica, chat, navegador…) a la derecha; `rain`, `reaction`, `image` a pantalla completa |
| **normal** | nativo | **nativo**: subtítulos, zooms y rótulo escalados a la altura; el video se normaliza a 1920×1080 |
| **crimson / personaje** | nativo | el presentador y su texto se componen en el lienzo vertical y se **encajan por altura** en el horizontal sobre un fondo ampliado (video desenfocado o el set del personaje) |

- **Cómo se elige:** `prepare.py … --orientation vertical|horizontal|auto` (auto: horizontal si el video es más ancho que alto), `character.py plan … --orientation horizontal`, o cambiarlo al renderizar con `render.py work --orientation horizontal` (reescribe el plan; sirve para sacar las dos versiones del mismo plan).
- `plan.json` guarda `"orientation": "horizontal"`. `autoplan.py` la hereda de `prepare.json`.
- **Subtítulos/rótulo/CTA** se colocan por porcentaje de la altura (69 % / 57 % / 85 %) si no fijas `y`; no pongas `y` en píxeles en un plan que vayas a renderizar en las dos orientaciones.
- Un video **vertical** de entrada renderizado en **horizontal** se ve como columna centrada con fondo desenfocado; para un horizontal de verdad, graba en horizontal.
- `--format square|both` genera además el 1:1 (en horizontal, el video entero sobre su propio fondo desenfocado).
- Los layouts de cuento no necesitan cambios al pasar de una orientación a otra: usan porcentajes del lienzo.

---
## CATÁLOGO DE B-ROLL (escenas `insert`)
Un `insert` tapa al presentador 2–4 s con un fondo (`bg`: `sky` `sunset` `night` `mint` `gold` `paper` `rose`) y un **layout** que ilustra la idea. Elige el layout **por lo que se dice**, no por costumbre, y no repitas el mismo dos veces seguidas. Texto de cabecera con `lines` (`{small}` / `{gloss}` + `at`). En modo personaje, `character.py plan` los elige solo; tú puedes cambiarlos en `plan.json`.

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

Ejemplo: `{ "type":"insert", "layout":"chart", "bg":"mint", "from":7.8, "to":10.7, "chart":{"up":true,"label":"+312%"}, "lines":[{"small":"Resultados","at":7.9},{"gloss":"EN 3 MESES","at":8.2}] }`.
Plan con **todos** los layouts para copiar: `python "SKILL_DIR/examples/catalog_plan.py" work` (genera `work/plan.json`; para `image` y `clip` pon `work/assets/catalog_image.png` y `catalog_clip.mp4`).

**Cuentos y educativos** (pantalla completa, sin fondo de nube; usa `world` y `actors`):

| `layout` | Qué es | Parámetros |
|---|---|---|
| `scene` | Ilustración a pantalla completa con personajes que se mueven | `scene:{world, pan, actors:[…], caption}` |
| `storybook` | Página de cuento: ilustración enmarcada + texto con lectura resaltada | `story:{world, actors:[…], text, page}` + `words:[{w,s,e}]` (tiempos reales; si falta, reparte el tiempo) |
| `title` | Portada «Había una vez…» con marco dorado | `title:{kicker, text, emoji, world}` |
| `theend` | «FIN» con confeti | `theend:{text, sub, world, emojis}` |
| `moral` | Pergamino con la moraleja | `moral:{title, text, emoji}` |
| `speech` | Diálogo entre dos personajes con globos | `speech:{world, left:{emoji,name}, right:{emoji,name}, lines:[{who:'left'\|'right', text, at}]}` |
| `counting` | Contar objetos 1…n con número gigante | `counting:{emoji, n, label, step}` |
| `letter` | Letra grande + objeto + palabra deletreada | `letter:{letter, word, emoji}` |
| `shapes` | Formas y colores | `shapes:{items:['circle','square','triangle','star','heart','oval','rect','diamond' o {shape,color,label}]}` |
| `journey` | Mapa del tesoro con un viajero que recorre puntos | `journey:{traveler, points:[{x,y,emoji,label}]}` (x,y entre 0 y 1) |
| `magic` | Aparición mágica con destellos | `magic:{emoji, text}` |

**Mundos** (`world`): `forest` `jungle` `ocean` `beach` `castle` `space` `farm` `desert` `city` `snow` `night` `candy`.
**Actor** (`actors[]`): `{emoji, x, y (0-1), size, move, at, to, dur, flip, say, sayAt, sayDur}`; `move`: `walk` `bounce` `float` `fly` `swim` `sway` `spin` `pulse` `none`. `at` es el segundo **absoluto** en que entra; `say` muestra un globo de texto.

**Generales** (con fondo y cabecera `lines`):

| `layout` | Cuándo usarlo | Parámetros |
|---|---|---|
| `split` | mostrar dos cosas a la vez, antes/después | `split:{dir:'v'\|'h', a:{emoji\|image\|text,label}, b:{…}}` |
| `timeline` | historia, hitos, años | `timeline:[{label, text, emoji, at}]` |
| `headline` | noticia, «portada», prueba social | `headline:{paper, title, emoji, sub, date, tag}` |
| `polaroids` | recuerdos, fotos, galería | `polaroids:[{emoji\|image, caption}]` (hasta 5) |
| `price` | oferta, precio | `price:{label, old, new, note}` |
| `callout` | resaltar un detalle de una imagen | `callout:{emoji\|image, label, ring:{x,y,r}}` |
| `progress` | cargando, completado | `progress:{label, value, done}` |
| `countdown` | cuenta atrás, lanzamiento | `countdown:{from, end}` |
| `reaction` | «me gusta», celebración en directo | `reaction:{emojis[], center}` |

Plan de ejemplo con todos los nuevos: `python "SKILL_DIR/examples/catalog_cuentos.py" work`. Guía de cuándo usar cada B-roll y cuánto (con fuentes): `reference/broll-guide.md`.

**Regla de uso:** máximo ~1 B-roll cada 3 escenas; los números y las cifras (`stat`, `meter`) son lo más visual: úsalos siempre que el guion dé una cifra. `image` y `clip` solo si el usuario aporta material. No inventes datos: en `chart`, `stat` o `rating` usa solo cifras que el usuario dijo o te dio.

---
## Al entregar (todos los modos): explicar TODO
1. Lee `work/informe.md` (lo escribe `render.py`) y **cuéntaselo al usuario en lenguaje llano**: cuánto se acortó y por qué, qué subtítulos/zooms/escenas se pusieron y en qué segundos, qué se corrigió de la transcripción, cómo se ajustó el audio.
2. Dile cómo cambiar algo: editar `plan.json` y volver a ejecutar `render.py` (no hace falta repetir `prepare.py`).
3. Termina con lo que **no** pudiste comprobar (p. ej. no oíste el resultado entero, el recorte no probado en ropa blanca).
4. Si usaste modo normal, ofrece el estilo crimson; si usaste crimson, ofrece subtítulos; si usaste personaje, ofrece cambiar apariencia, set (`night`) o versión 1:1.

## Si algo falla
- `plan inválido`: `render.py` indica escena/elemento; corrige tiempos.
- Cinta rara cruzando la cara: solo ocurre sin `cutout`; pon `"cutout": null` (se desactivan las cintas).
- Recorte feo (huecos en ropa blanca): `--matte none` o graba con fondo de otro color.
- Transcripción con errores: usa `--model medium` en `prepare.py` o `--fix` en `autoplan.py`.
- Subtítulos tapan algo: `--y` más alto/bajo.
- **Video oscuro / selfie en primer plano** (probado con un video real): no uses `top`/`aboveHead` si la cara ocupa la parte alta; pon el texto bajo la barbilla con `y` explícito (≈ 880 para la palabra gloss, 800 para la pequeña) y `align:"center"`. Sube el contraste con `theme`: `{"dark":"#e0102a","mid":"#ff3b3b","light":"#ff8a8a","outline":"2px #ffffff","ink":"#ffd0d6"}`. Pon `"halo": false` en las escenas para que la trama de puntos no cubra la cara.
- Videos largos (≥ 1 min): una escena por frase clave (≈ 20-25), sin dejar tramos largos sin texto; los insertos solo en las ideas centrales (3-4 en 90 s).
- Los emojis usan la fuente del sistema; para calidad máxima pide imágenes en `work/assets/`.

## Probado / no probado
Probado en Windows: cuento infantil de 34 s de punta a punta (voz, mundos, personajes, moraleja, FIN); clip limpio de presentador (español, 18 s) en modos normal y crimson; video real de 93 s (selfie oscuro) en modo crimson; modo personaje de punta a punta desde un guion de 30 s. **No probado con un video real filmado por el usuario**: el recorte por color puede dejar huecos en ropa blanca.
