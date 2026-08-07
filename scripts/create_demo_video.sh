#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT/submission/demo-assets"
VOICEOVER="$ROOT/submission/demo-voiceover.txt"
VOICE="$ASSET_DIR/proofrank-demo-voice.aiff"
CONCAT="$ASSET_DIR/slides.txt"
VIDEO="$ROOT/submission/proofrank-demo.mp4"

required_images=(
  "01-overview.png"
  "02-claim-ledger.png"
  "03-proof-receipt.png"
  "04-bright-data-live.png"
  "05-field-map.png"
  "06-exports-ready.png"
)

for image in "${required_images[@]}"; do
  if [[ ! -f "$ASSET_DIR/$image" ]]; then
    echo "Missing $ASSET_DIR/$image"
    echo "Capture app screenshots first, then rerun this script."
    exit 1
  fi
done

if [[ ! -f "$VOICEOVER" ]]; then
  echo "Missing $VOICEOVER"
  exit 1
fi

duration_gt() {
  awk "BEGIN { exit !($1 > $2) }"
}

media_duration() {
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$1" 2>/dev/null || echo 0
}

voice_duration=0
if [[ -f "$VOICE" ]]; then
  voice_duration="$(media_duration "$VOICE")"
fi

if [[ -f "$VOICE" && "$VOICEOVER" -nt "$VOICE" ]]; then
  voice_duration=0
fi

if ! duration_gt "$voice_duration" 1; then
  say -r 174 -o "$VOICE" -f "$VOICEOVER"
  voice_duration="$(media_duration "$VOICE")"
fi

if ! duration_gt "$voice_duration" 1; then
  echo "Voiceover generation produced no usable audio samples."
  echo "On macOS, rerun this script outside a restricted sandbox or pre-create $VOICE."
  exit 1
fi

: > "$CONCAT"
add_slide() {
  local image="$1"
  local duration="$2"
  printf "file '%s'\n" "$ASSET_DIR/$image" >> "$CONCAT"
  printf "duration %s\n" "$duration" >> "$CONCAT"
}

add_slide "01-overview.png" 20
add_slide "02-claim-ledger.png" 21
add_slide "03-proof-receipt.png" 21
add_slide "04-bright-data-live.png" 19
add_slide "05-field-map.png" 18
add_slide "06-exports-ready.png" 22
printf "file '%s'\n" "$ASSET_DIR/06-exports-ready.png" >> "$CONCAT"

ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT" \
  -i "$VOICE" \
  -t "$voice_duration" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" \
  -r 30 \
  -c:v libx264 \
  -preset veryfast \
  -crf 22 \
  -c:a aac \
  -b:a 160k \
  -shortest \
  -movflags +faststart \
  "$VIDEO"

video_duration="$(media_duration "$VIDEO")"
if ! duration_gt "$video_duration" 1; then
  echo "Video generation failed or produced an empty output."
  exit 1
fi

echo "Created $VIDEO"
