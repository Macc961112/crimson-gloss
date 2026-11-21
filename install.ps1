# Instala la skill crimson-gloss en Claude Code (Windows)
$ErrorActionPreference = 'Stop'
$dest = Join-Path $env:USERPROFILE '.claude\skills\crimson-gloss'
$tmp  = Join-Path $env:TEMP 'crimson-gloss-install'
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $tmp | Out-Null
Write-Host 'Descargando crimson-gloss...'
Invoke-WebRequest 'https://github.com/Macc961112/crimson-gloss/archive/refs/heads/main.zip' -OutFile "$tmp\r.zip"
Expand-Archive "$tmp\r.zip" $tmp
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory (Split-Path $dest) -Force | Out-Null
Copy-Item "$tmp\crimson-gloss-main\crimson-gloss" $dest -Recurse
$missing = @('python', 'node', 'ffmpeg') | Where-Object { -not (Get-Command $_ -ErrorAction SilentlyContinue) }
if ($missing) { Write-Warning ("Te faltan: " + ($missing -join ', ') + ". Instálalos y vuelve a ejecutar.") }
else { python -m pip install --quiet faster-whisper numpy edge-tts }
Remove-Item $tmp -Recurse -Force
Write-Host "Listo: $dest. Reinicia Claude Code y escribe: /crimson-gloss"
