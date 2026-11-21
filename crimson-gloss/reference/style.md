# Estilo: CRIMSON GLOSS

> **Nota de implementación (skill `crimson-gloss`):** las cintas rojas se dibujan **detrás** del presentador, como una curva suave desde su cuerpo hasta la tarjeta que sale; nunca cruzan la cara. Las escenas inserto (cielo/astronauta en la referencia) son solo un ejemplo: en la skill el fondo y el objeto salen de lo que dice el guion. Estilo inspirado en un reel de @nikhilmotion.vlc; este documento es un análisis propio y no contiene material del original.

> Cómo usarlo: dale este archivo a Claude y escribe **"hazme un video con el estilo Crimson Gloss: <tu guion o tema>"**. Con persona (presentador hablando) o sin persona (solo animaciones, ver §9).

Referencia estudiada: reel de @nikhilmotion.vlc (9,5 s, 1440x2560, **60 fps**, vp9, 4 escenas, 5 cortes). Hecho en After Effects: presentador grabado sobre fondo blanco de estudio + tipografía roja 3D brillante + tarjetas flotantes + píxeles + trama de puntos (halftone) + cintas rojas líquidas.

---
## 1. La idea en una frase
Un presentador sentado en un estudio blanco habla a cámara. Cada frase que dice **aparece escrita alrededor de su cuerpo** en rojo cristal (la palabra clave gigante, el resto diminuto), y las ideas se ilustran con **tarjetas con borde rojo** que vuelan, o con una **escena de fondo completamente distinta** (cielo con astronauta) metida como "inserto". Todo en rojo + blanco; solo el inserto añade azul.

## 2. Formato
- 9:16, 1080x1920 (original 1440x2560). **60 fps** (30 fps también funciona, pierde algo de suavidad en el motion blur).
- Duración ~1 s por cada 2,5 palabras habladas. Voz rápida, sin pausas largas.
- Pixel-safe: texto grande entre el 12 % y el 55 % de la altura (arriba de la cabeza) y entre el 62 % y el 72 % (sobre las piernas). La cara/pecho del presentador NUNCA se tapa; el texto pasa por detrás/delante del cuerpo pero respeta la cara.

## 3. Paleta
| Rol | Valor |
|---|---|
| Fondo estudio | `#ececf0` → `#f7f6f8` (degradado suave) + sombra de suelo elíptica `#00000014` |
| Rojo principal | `#e10600` |
| Rojo oscuro (parte alta del degradado) | `#7a0012` |
| Rojo claro (parte baja) | `#ff2a2a` |
| Rosa halftone / píxeles suaves | `#ff9aa8`, `#ffc2cb` |
| Texto fino sobre rojo | `#ffffff` con brillo rosa |
| Inserto cielo | `#6fb8cf` → `#bfe3ee`, nubes `#ffffff` |
Regla: **nada de negro puro** en gráficos; el único negro es la ropa del presentador.

## 4. Tipografía (la firma del estilo)
- **Palabra clave**: sans negra ultra-pesada, **cursiva (skew -8°)**, tracking muy apretado (`-0.05em`), línea de 0.9. Relleno con degradado vertical `#7a0012 → #d0000f 45% → #ff2a2a` + sombra suave abajo (`0 8px 12px #78001459`) y un destello blanco 20 % arriba → efecto "cristal rojo 3D". Candidata: Helvetica Neue Black Oblique / Archivo Black / Bricolage Grotesque 800.
- **Palabra secundaria**: misma familia en peso fino, cursiva, rojo `#c8102e`, 22–34 px, pegada a la palabra clave (arriba-izquierda: "My name is", "Who can edit our").
- **Pastillas** (pills): rectángulo redondeado rojo sólido, texto blanco cursiva, 36 px ("de", "pastilla", "nombre").
- **Palabra de cierre** de cada bloque: blanca fina con resplandor rosa, bajo la palabra roja ("launch" bajo "Brand").
- Texto largo (inserto cielo): rojo condensado, interlineado 0.82, centrado: línea 1 fina, línea 2 en negrita.

## 5. Animaciones de texto (ingeniería frame a frame, a 60 fps)
1. **Pixel-in (3–4 frames antes de cada texto)**: 3–6 cuadrados de 14–18 px, rojo/rosa, aparecen en una esquina superior en rejilla, parpadean (opacidad 0 → 1 → 0.3 cada 2 frames) y desaparecen cuando entra el texto. Funciona como "aviso" de que algo va a salir.
2. **Entrada palabra clave**: aparece **letra a letra** (typewriter 1 letra / 1–2 frames) con desenfoque horizontal decreciente (blur 24 → 0 px) y escala 1.15 → 1; mientras entra, el texto está inclinado un poco más (skew -14° → -8°).
3. **Palabras pequeñas**: fade + blur 8 → 0 px, desplazamiento 20 px, 6 frames.
4. **Salida**: todo el bloque hace **whip-blur** (blur horizontal 0 → 60 px, escala 1 → 1.25, opacidad → 0) en ~8 frames, o lo cubre el flash blanco (ver transición B).
5. **Continuidad**: la palabra clave de un bloque se queda hasta que entra la siguiente escena; el resto sale antes.

## 6. Tarjetas ("cards")
- Rectángulo con radio 28 px, **borde rojo 8 px**, interior foto/imagen, sombra `0 20px 40px #00000033`.
- Entrada: viene desde fuera por una **cinta roja** (ver §7), rota 6–10° y se asienta con spring (damping 14). Se apilan 2–3 con ligera rotación distinta (−5°, +4°, 0°).
- Etiqueta: pastilla roja encima ("nombre") y **icono en cuadrado rojo redondeado** (auriculares, reels, play) pegado a una esquina, rotado ~10°.
- La tarjeta de "pantalla" (tablet azul "SOCIAL MEDIA") lleva reflejo vidrio: gradiente blanco 25 % arriba.

## 7. Efectos propios del estilo (los que lo hacen parecer After Effects)
| Efecto | Receta |
|---|---|
| **Cinta roja líquida** | Trazo SVG/Bézier en S, grosor 6→14→0 px, color rojo con glow (`drop-shadow(0 0 12px #e10600)`) y núcleo blanco de 2 px. Se dibuja con `stroke-dashoffset` en 10 frames y se desvanece. Cruza el cuerpo del presentador y conecta con la tarjeta que va a entrar. |
| **Halftone ring** | Trama de puntos (`radial-gradient(circle,#ff6a7a 2px,transparent 2.6px)`, celda 16 px, y un 2º patrón de 10 px) enmascarada con un anillo (`radial-gradient` transparent 40 % → negro 55 % → transparent 75 %), rosa → rojo. Crece de 0.6 → 1.4 de escala en 12 frames mientras hace fade. Se usa como "explosión" al cambiar de escena o al aparecer una tarjeta. |
| **Píxeles** | Ver §5.1. |
| **Whiteout + blur** | Transición B: 6 frames de blur 0→80 px + overlay blanco 0→0.9→0 y la escena siguiente entra con blur 80→0. |
| **Corte sobre blur** | Transición A: el contenido sale con whip-blur y la nueva escena ya está debajo (corte exacto en el frame de máximo blur). |
| **Shake** | Ninguno: este estilo es *limpio*. El movimiento viene de blur y springs, no de temblor. |
| **Sombra de suelo** | Elipse oscura difusa bajo la silla; el presentador está recortado (keying) sobre un fondo blanco real de estudio. |
| **Motion blur direccional** | A todo lo que se mueve rápido (texto entrando, tarjetas, cámara). |

## 8. Estructura de escenas (de la referencia, 9.5 s → plantilla)
| # | Tiempo | Qué hay | Técnica |
|---|---|---|---|
| 0 | 0.0–0.3 | Fondo gris que se aclara; píxeles rojos y un fantasma desenfocado del presentador | fade desde gris `#8a8a90` → estudio |
| 1 | 0.3–1.7 | "Mi nombre es" (pequeño) → **NOMBRE** grande → apellido diminuto | pixel-in + typewriter; salida con whip-blur y cinta roja sobre las piernas |
| 2 | 1.7–3.0 | Aparece **tarjeta con otra persona** + halftone ring detrás; **CEO** gigante, pastillas "of" / "personal", **Brand** rojo + "launch" blanco | tarjeta sale de la cinta; texto por letras |
| 3 | 3.0–4.8 | Transición blur; "The socials" pequeño, 2 tarjetas-móvil + tablet azul, **Marketing Agency** en 2 líneas y "media" arriba-derecha | cintas llevan cada tarjeta; letras se escriben con blur |
| 4 | 4.8–7.9 | Whiteout → **inserto cielo**: astronauta trabajando en teclado entre nubes, marco de móvil translúcido con muesca roja, cohete sticker, icono reels. Texto "Currently we are looking for / HARDWORKING / and / COMMITED EDITORS" | halftone ring de entrada; texto línea a línea; cohete flota (sin 4° / bob 12 px) |
| 5 | 7.9–9.5 | Vuelve el presentador: "Who can edit our" + **Clients** grande, tarjeta "nombre" + 2ª tarjeta detrás con icono de auriculares | cinta → tarjeta con spring |
Ritmo: un evento visual nuevo cada **0.3–0.5 s**. Cada palabra clave entra 2–3 frames ANTES de oírse.

## 9. Variante sin persona
Sustituye al presentador por un **personaje 2D/vectorial** (como el del video de Video Studio) o por un objeto/mascota centrado sobre la misma sombra de suelo. Todo lo demás (texto rojo, cintas, píxeles, halftone, tarjetas, inserto de escena) es idéntico. Si no hay presentador, sube 15 % el tamaño del texto y deja la palabra clave en el centro.

## 10. Audio
- Voz en off (o la del presentador) sin música alta; música sutil 8–10 % (pad + beat suave 100 bpm).
- SFX: *tick* digital en cada pixel-in, *whoosh* corto en cada cinta/transición, *pop* suave cuando una tarjeta se asienta, *swish* de blur en las salidas.
- Normalizar a -14 LUFS.

## 11. Receta de producción (Remotion)
1. Guion en bloques de 3–5 palabras. Marca la palabra clave de cada bloque.
2. Voz + tiempos por palabra (edge-tts WordBoundary / whisper).
3. Escenas como componentes: `Presenter` (o personaje), `GlossWord`, `Pill`, `Card`, `Ribbon`, `Halftone`, `Pixels`, `WhiteFlash`, `SkyInsert`.
4. Cada texto entra en `(t_palabra - 3 frames)`; la salida en la palabra clave siguiente.
5. Postproceso: leve viñeta 0 % (el estilo es claro, sin viñeta), grano 4 %, sharpen 0.3.
6. Exportar H.264 yuv420p, 1080x1920.

## 12. Errores a evitar
- Texto negro o azul: todo el texto es rojo/blanco.
- Fondo con color: el estudio es blanco-lila casi neutro.
- Más de 1 palabra clave gigante a la vez.
- Tapar la cara.
- Transiciones con temblor o zoom exagerado: aquí solo blur + corte limpio.
