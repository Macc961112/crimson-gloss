# Crimson Gloss — skill para Claude Code

Dale a Claude Code **un video tuyo hablando a cámara** y te devuelve el reel **ya editado**, con un informe que te explica **todo lo que hizo y por qué**.

Tiene dos modos:

| | **Normal** | **Crimson** |
|---|---|---|
| Para qué | Dejar un video listo para redes, rápido y limpio | Un reel con estilo de motion design (texto 3D rojo, tarjetas, efectos) |
| Quién lo decide | Todo automático (3 comandos) | Claude diseña las escenas **a partir de lo que dices** |
| Qué hace | Corta silencios · subtítulos palabra a palabra · zooms de énfasis · rótulo con tu nombre · llamada a la acción · música baja · volumen -14 LUFS | Texto rojo cristal 3D al ritmo de la voz · tarjetas y cintas que salen **por detrás de ti** · píxeles y halftone · escenas inserto que ilustran lo que dices |
| Demo | ![normal](docs/demo-normal.gif) | ![crimson](docs/demo-crimson.gif) |

> Las demos usan un presentador dibujado con código (no una persona real) para no usar material de nadie. Con tu video, la persona eres tú.

---

## Instalar (1 comando)

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/Macc961112/crimson-gloss/main/install.ps1 | iex
```
**Mac / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/Macc961112/crimson-gloss/main/install.sh | bash
```
Instala la skill en `~/.claude/skills/crimson-gloss` y las dependencias de Python. **Necesitas** tener ya: Python 3.10+, Node 18+ y FFmpeg. Reinicia Claude Code después.

Instalación manual: copia la carpeta [`crimson-gloss/`](crimson-gloss) a `~/.claude/skills/` y ejecuta `pip install -r requirements.txt`.

## Usar

En Claude Code, dale la ruta de tu video:

- `Edítame este video: C:\videos\yo.mp4` → modo **normal**
- `Ponle subtítulos y quítale los silencios` → modo **normal**
- `Hazlo estilo crimson` / `tipo crimson` → modo **crimson**
- `/crimson-gloss C:\videos\yo.mp4`

Claude hace el resto: prepara el video, planifica, **te enseña unos fotogramas de prueba**, renderiza y te **explica todo** con `informe.md`. Para cambiar algo, se edita `plan.json` y se vuelve a renderizar (no hace falta repetir todo).

**Mejor resultado:** graba en vertical, con buena voz y poco ruido. Para el modo Crimson, **fondo blanco o liso**: así las tarjetas pueden salir por detrás de ti.

## Qué pasa por dentro (resumen)

```
 tu video ──► prepare.py ──► transcript.json + input.mp4 (+ cutout.webm en crimson)
                              │   · pasa a 1080x1920 · transcribe en TU máquina (faster-whisper)
                              │   · (normal) corta silencios y reajusta los tiempos
                              ▼
                   plan.json  ◄── autoplan.py (normal, automático)
                              ◄── Claude lee la transcripción y diseña las escenas (crimson)
                              ▼
                          render.py ──► final.mp4 (-14 LUFS) + informe.md
                              (Remotion = React que dibuja cada fotograma + ffmpeg)
```
Explicación completa, esquema de `plan.json`, posiciones y solución de problemas: [docs/COMO_FUNCIONA.md](docs/COMO_FUNCIONA.md).

## Privacidad
La transcripción es **local**: tu audio no se sube a ningún servicio. Todo el render ocurre en tu ordenador.

## Límites (honestos)
- Probado en **Windows** con un clip limpio en español. **No probado todavía con un video real filmado**: el recorte por color puede dejar huecos si llevas ropa del mismo color que el fondo.
- La transcripción local (`small`) se equivoca con **marcas y nombres propios**; Claude las corrige leyendo el contexto (y te pregunta si duda). Opción `--model medium` para más precisión.
- Sin fondo liso, en modo Crimson las tarjetas van **por delante** de ti, no por detrás.
- Los emojis de las escenas usan la fuente del sistema. Para la mejor calidad, dale imágenes propias.
- La primera vez instala Remotion (1–2 min) y descarga el modelo de voz.

## Estructura
```
crimson-gloss/
  SKILL.md            instrucciones que sigue Claude (los dos modos)
  scripts/prepare.py  video → input.mp4 + transcripción + (corte de silencios | recorte)
  scripts/autoplan.py modo normal: plan automático
  scripts/render.py   plan → final.mp4 + informe.md
  template/           proyecto Remotion (Cg.jsx = todo el estilo)
  reference/style.md  análisis del estilo Crimson Gloss
  examples/           plan.example.json
docs/COMO_FUNCIONA.md documentación completa
```

## Créditos y licencia
Estilo Crimson Gloss inspirado en un reel de @nikhilmotion.vlc; este repo contiene un análisis propio y código original, sin material del reel. Código bajo licencia [MIT](LICENSE). Hecho con [Remotion](https://remotion.dev) (revisa su [licencia](https://remotion.dev/license) si lo usas en una empresa) y [faster-whisper](https://github.com/SYSTRAN/faster-whisper).
