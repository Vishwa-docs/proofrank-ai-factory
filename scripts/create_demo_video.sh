#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT/submission/demo-assets"
VOICEOVER="$ROOT/submission/demo-voiceover.txt"
VOICE="$ASSET_DIR/proofrank-demo-voice.aiff"
MUSIC="$ASSET_DIR/proofrank-demo-bed.wav"
CONCAT="$ASSET_DIR/slides.txt"
VIDEO="$ROOT/submission/proofrank-demo.mp4"

required_images=(
  "01-overview.png"
  "02-draft-card.png"
  "03-claim-ledger.png"
  "04-proof-receipt.png"
  "05-bright-data-live.png"
  "06-pitch-check.png"
  "07-field-map.png"
  "08-exports-ready.png"
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
  awk -v left="${1:-0}" -v right="${2:-0}" 'BEGIN {
    if (left !~ /^[0-9]+([.][0-9]+)?$/) left = 0
    if (right !~ /^[0-9]+([.][0-9]+)?$/) right = 0
    exit !(left > right)
  }'
}

media_duration() {
  local duration
  duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$1" 2>/dev/null || true)"
  if [[ "$duration" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    echo "$duration"
  else
    echo 0
  fi
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

add_slide "01-overview.png" 5
add_slide "02-draft-card.png" 5
add_slide "03-claim-ledger.png" 5
add_slide "04-proof-receipt.png" 5
add_slide "05-bright-data-live.png" 5
add_slide "06-pitch-check.png" 5
add_slide "07-field-map.png" 5
add_slide "08-exports-ready.png" 5
printf "file '%s'\n" "$ASSET_DIR/08-exports-ready.png" >> "$CONCAT"

fade_start="$(awk -v duration="$voice_duration" 'BEGIN { value = duration - 2.5; if (value < 0) value = 0; printf "%.3f", value }')"

ffmpeg -y \
  -f lavfi -i "sine=frequency=146.83:sample_rate=44100:duration=$voice_duration" \
  -f lavfi -i "sine=frequency=220:sample_rate=44100:duration=$voice_duration" \
  -filter_complex "[0:a]volume=0.018,afade=t=in:st=0:d=1,afade=t=out:st=$fade_start:d=2.5[a0];[1:a]volume=0.010,afade=t=in:st=0:d=1,afade=t=out:st=$fade_start:d=2.5[a1];[a0][a1]amix=inputs=2:duration=first:normalize=0[m]" \
  -map "[m]" \
  "$MUSIC"

ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT" \
  -i "$VOICE" \
  -i "$MUSIC" \
  -t "$voice_duration" \
  -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=0.8[music];[voice][music]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v \
  -map "[a]" \
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

if duration_gt "$video_duration" 59.5; then
  echo "Video is ${video_duration}s, which exceeds the 59.5s submission guard."
  exit 1
fi

echo "Created $VIDEO"
