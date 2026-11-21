#!/usr/bin/env bash
# Instala la skill crimson-gloss en Claude Code (Mac / Linux)
set -euo pipefail
DEST="$HOME/.claude/skills/crimson-gloss"
TMP="$(mktemp -d)"
echo "Descargando crimson-gloss..."
curl -fsSL https://github.com/Macc961112/crimson-gloss/archive/refs/heads/main.tar.gz | tar -xz -C "$TMP"
rm -rf "$DEST"; mkdir -p "$(dirname "$DEST")"
cp -r "$TMP/crimson-gloss-main/crimson-gloss" "$DEST"
rm -rf "$TMP"
missing=""
for c in python3 node ffmpeg; do command -v "$c" >/dev/null || missing="$missing $c"; done
if [ -n "$missing" ]; then echo "Te faltan:$missing. Instálalos y vuelve a ejecutar."; else python3 -m pip install --quiet faster-whisper numpy; fi
echo "Listo: $DEST. Reinicia Claude Code y escribe: /crimson-gloss"
