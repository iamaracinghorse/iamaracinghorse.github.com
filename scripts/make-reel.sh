#!/usr/bin/env bash
#
# make-reel.sh — Cut a vertical Instagram Reel (1080x1920) from a YouTube video.
#
# Two phases, so a human (or Claude) can pick the best moments in the middle:
#
#   ./make-reel.sh prep   https://youtu.be/XXXXXXXXXXX
#       Installs tools, downloads the video into ./source/, transcribes it
#       locally with whisper -> transcript.txt, samples a frame every 5s into
#       ./frames/, and builds ./frames/contact_sheet_*.jpg. Then STOPS.
#
#   --- review transcript.txt + the contact sheet, pick 4-6 moments,       ---
#   --- write them into segments.txt (see format below) ---
#
#   ./make-reel.sh cut
#       Reads segments.txt, cuts + concats + reframes to 1080x1920
#       (center-crop, no letterbox), re-encodes ONCE, and writes
#       ./out/reel.mp4 (H.264 / AAC 128k / ~8 Mbps / 30fps, < 90s total).
#
# segments.txt format — one segment per line, "IN OUT", blank lines and
# lines starting with # ignored. Timestamps are SS(.ms), MM:SS, or HH:MM:SS(.ms):
#
#   # in        out
#   00:12       00:19.5
#   1:04        1:11
#
# Env overrides:
#   WHISPER_MODEL   whisper model size (default: small). Options: tiny base
#                   small medium large-v3. Bigger = more accurate, slower.
#   VIDEO_BITRATE   target video bitrate (default: 8M)
#   MAX_SECONDS     hard cap on total Reel length (default: 90)
#
set -euo pipefail

# ------------------------------------------------------------------ paths
# All work happens relative to the CURRENT directory you run this from,
# so `./source`, `./frames`, `./out` land in your project folder.
SOURCE_DIR="./source"
FRAMES_DIR="./frames"
OUT_DIR="./out"
VENV_DIR="./.reel-venv"
TRANSCRIPT="./transcript.txt"
SEGMENTS="./segments.txt"

WHISPER_MODEL="${WHISPER_MODEL:-small}"
VIDEO_BITRATE="${VIDEO_BITRATE:-8M}"
MAX_SECONDS="${MAX_SECONDS:-90}"

# ------------------------------------------------------------------ pretty output
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GRN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; RST=$'\033[0m'
else
  BOLD=""; DIM=""; GRN=""; YEL=""; RED=""; RST=""
fi
say()  { printf "%s\n" "${BOLD}▶ $*${RST}"; }
ok()   { printf "%s\n" "${GRN}✓ $*${RST}"; }
warn() { printf "%s\n" "${YEL}! $*${RST}"; }
die()  { printf "%s\n" "${RED}✗ $*${RST}" >&2; exit 1; }

# ------------------------------------------------------------------ tool install (macOS brew / Linux apt)
ensure_cmd() {
  # ensure_cmd <command> <brew-formula> <apt-package>
  local cmd="$1" brew_pkg="$2" apt_pkg="$3"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd found ($($cmd --version 2>&1 | head -1))"
    return
  fi
  say "Installing $cmd ..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    command -v brew >/dev/null 2>&1 || die "Homebrew not found. Install it from https://brew.sh then re-run."
    brew install "$brew_pkg"
  else
    if command -v sudo >/dev/null 2>&1; then sudo apt-get update -qq && sudo apt-get install -y "$apt_pkg"
    else apt-get update -qq && apt-get install -y "$apt_pkg"; fi
  fi
  command -v "$cmd" >/dev/null 2>&1 || die "Failed to install $cmd."
  ok "$cmd installed."
}

ensure_python_venv() {
  command -v python3 >/dev/null 2>&1 || ensure_cmd python3 python python3
  if [ ! -d "$VENV_DIR" ]; then
    say "Creating Python venv for whisper ($VENV_DIR) ..."
    python3 -m venv "$VENV_DIR"
  fi
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  if ! python -c "import faster_whisper" >/dev/null 2>&1; then
    say "Installing faster-whisper into the venv ..."
    pip install -q --upgrade pip
    pip install -q faster-whisper
  fi
  ok "whisper ready (faster-whisper, model=$WHISPER_MODEL)."
}

# ------------------------------------------------------------------ helpers
seconds_of() {  # SS(.ms) | MM:SS | HH:MM:SS(.ms) -> float seconds
  awk -F: '{ if (NF==3) printf "%.3f", $1*3600+$2*60+$3;
             else if (NF==2) printf "%.3f", $1*60+$2;
             else printf "%.3f", $1 }' <<<"$1"
}

find_source() {
  ls -1 "$SOURCE_DIR"/video.* 2>/dev/null | grep -viE '\.(part|ytdl)$' | head -1
}

# ================================================================== PREP
cmd_prep() {
  local url="${1:-}"
  [ -n "$url" ] || die "Usage: $0 prep <youtube-url>"
  mkdir -p "$SOURCE_DIR" "$FRAMES_DIR" "$OUT_DIR"

  say "Step 1/4 — checking tools"
  ensure_cmd yt-dlp yt-dlp yt-dlp
  ensure_cmd ffmpeg ffmpeg ffmpeg
  ensure_cmd ffprobe ffmpeg ffmpeg

  say "Step 2/4 — downloading highest-quality video into $SOURCE_DIR"
  # bv*+ba/b = best video + best audio, fall back to best combined.
  # Let yt-dlp choose a compatible merge container (mp4, else mkv).
  yt-dlp -f "bv*+ba/b" \
         --no-playlist \
         -o "$SOURCE_DIR/video.%(ext)s" \
         "$url"
  local src; src="$(find_source)"
  [ -n "$src" ] || die "Download did not produce a file in $SOURCE_DIR."
  ok "Downloaded: $src"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
          -show_entries format=duration -of default=noprint_wrappers=1 "$src" | sed 's/^/    /'

  say "Step 3/4 — transcribing locally with whisper"
  ensure_python_venv
  local audio="$SOURCE_DIR/audio.wav"
  ffmpeg -y -loglevel error -i "$src" -vn -ac 1 -ar 16000 "$audio"
  ok "Extracted audio: $audio"
  WHISPER_MODEL="$WHISPER_MODEL" AUDIO="$audio" OUT="$TRANSCRIPT" python - <<'PY'
import os
from faster_whisper import WhisperModel
model_size = os.environ["WHISPER_MODEL"]; audio = os.environ["AUDIO"]; out = os.environ["OUT"]
def ts(s):
    h=int(s//3600); m=int((s%3600)//60); sec=s%60
    return f"{h:02d}:{m:02d}:{sec:06.3f}"
print(f"  loading model '{model_size}' (first run downloads weights)...")
model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, vad_filter=True, beam_size=5)
print(f"  detected language: {info.language} (p={info.language_probability:.2f})")
n=0
with open(out, "w") as f:
    for s in segments:
        f.write(f"[{ts(s.start)} --> {ts(s.end)}] {s.text.strip()}\n")
        n+=1
print(f"  wrote {n} lines -> {out}")
PY
  ok "Transcript: $TRANSCRIPT"

  say "Step 4/4 — sampling a frame every 5s into $FRAMES_DIR"
  rm -f "$FRAMES_DIR"/frame_*.jpg "$FRAMES_DIR"/contact_sheet_*.jpg
  # frame_0001 = 00:00, frame_0002 = 00:05, frame_N = (N-1)*5 seconds
  ffmpeg -y -loglevel error -i "$src" -vf "fps=1/5" -q:v 3 "$FRAMES_DIR/frame_%04d.jpg"
  local nframes; nframes=$(ls -1 "$FRAMES_DIR"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
  # contact sheet(s): 6 cols x 8 rows = 48 frames (4 min) per sheet
  ffmpeg -y -loglevel error -pattern_type glob -i "$FRAMES_DIR/frame_*.jpg" \
         -vf "scale=320:-1,tile=6x8" "$FRAMES_DIR/contact_sheet_%03d.jpg" || true
  ok "Sampled $nframes frames (frame_N = (N-1)*5s). Contact sheet(s): $FRAMES_DIR/contact_sheet_*.jpg"

  cat <<EOF

${GRN}${BOLD}PREP DONE.${RST} Now the human-in-the-loop step:

  1. Skim ${BOLD}$TRANSCRIPT${RST} and the contact sheet(s) in ${BOLD}$FRAMES_DIR/${RST}.
  2. Pick 4-6 moments for the Reel (keep total < ${MAX_SECONDS}s).
     Tip: paste $TRANSCRIPT (and drag a contact sheet) back to Claude and
     ask for candidate moments — then confirm/adjust.
  3. Write your chosen in/out times into ${BOLD}$SEGMENTS${RST}, e.g.:

        # in       out
        00:12      00:19
        01:04      01:11

  4. Run: ${BOLD}$0 cut${RST}
EOF
}

# ================================================================== CUT
cmd_cut() {
  local src; src="$(find_source)"
  [ -n "$src" ] || die "No source video in $SOURCE_DIR. Run '$0 prep <url>' first."
  [ -f "$SEGMENTS" ] || die "No $SEGMENTS found. Create it with your in/out times first (see '$0 prep' output)."
  mkdir -p "$OUT_DIR"
  ensure_cmd ffmpeg ffmpeg ffmpeg
  ensure_cmd ffprobe ffmpeg ffmpeg

  # Parse segments -> arrays, validate, sum duration.
  local -a ins=() outs=(); local total=0
  while IFS= read -r line; do
    line="${line%%#*}"; line="$(echo "$line" | xargs || true)"
    [ -z "$line" ] && continue
    local a b; a="$(echo "$line" | awk '{print $1}')"; b="$(echo "$line" | awk '{print $2}')"
    [ -n "$a" ] && [ -n "$b" ] || die "Bad segment line: '$line' (need 'IN OUT')."
    local sa sb; sa="$(seconds_of "$a")"; sb="$(seconds_of "$b")"
    awk "BEGIN{exit !($sb > $sa)}" || die "Segment OUT ($b) must be after IN ($a)."
    ins+=("$sa"); outs+=("$sb")
    total=$(awk "BEGIN{printf \"%.3f\", $total + ($sb - $sa)}")
  done < "$SEGMENTS"
  [ "${#ins[@]}" -gt 0 ] || die "No usable segments in $SEGMENTS."

  say "Planned Reel: ${#ins[@]} segment(s), total ${total}s"
  awk "BEGIN{exit !($total <= $MAX_SECONDS)}" || \
    die "Total ${total}s exceeds MAX_SECONDS=${MAX_SECONDS}s. Trim $SEGMENTS and re-run."

  # Build one filter_complex: trim each segment (frame-accurate), concat,
  # then scale-to-cover + center-crop to 1080x1920 at 30fps. ONE encode pass.
  local fc="" vlabels="" n="${#ins[@]}"
  for i in $(seq 0 $((n-1))); do
    fc+="[0:v]trim=start=${ins[$i]}:end=${outs[$i]},setpts=PTS-STARTPTS[v$i];"
    fc+="[0:a]atrim=start=${ins[$i]}:end=${outs[$i]},asetpts=PTS-STARTPTS[a$i];"
    vlabels+="[v$i][a$i]"
  done
  fc+="${vlabels}concat=n=${n}:v=1:a=1[vc][ac];"
  # scale to COVER 1080x1920 then center-crop -> fills frame, no letterbox.
  fc+="[vc]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p[vout]"

  say "Encoding -> $OUT_DIR/reel.mp4 (H.264 ~${VIDEO_BITRATE}, AAC 128k, 30fps, 1080x1920)"
  ffmpeg -y -loglevel error -stats -i "$src" \
    -filter_complex "$fc" -map "[vout]" -map "[ac]" \
    -c:v libx264 -preset medium -b:v "$VIDEO_BITRATE" \
    -maxrate "$VIDEO_BITRATE" -bufsize 16M -profile:v high -level 4.0 \
    -c:a aac -b:a 128k -ar 48000 \
    -movflags +faststart \
    "$OUT_DIR/reel.mp4"

  local dur size
  dur="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/reel.mp4")"
  size="$(du -h "$OUT_DIR/reel.mp4" | awk '{print $1}')"
  ok "Done."
  printf "\n%s\n" "${BOLD}Final Reel:${RST} $OUT_DIR/reel.mp4"
  printf "  duration : %s s\n" "$(printf '%.2f' "$dur")"
  printf "  size     : %s\n" "$size"
  printf "  format   : 1080x1920, H.264 high, AAC 128k, 30fps\n"
}

# ================================================================== dispatch
case "${1:-}" in
  prep) shift; cmd_prep "$@";;
  cut)  shift; cmd_cut  "$@";;
  *)    cat <<EOF
${BOLD}make-reel.sh${RST} — YouTube -> vertical Instagram Reel

  $0 prep <youtube-url>   download + transcribe + sample frames, then stop
  $0 cut                  cut segments.txt -> out/reel.mp4 (run after prep)

See the comments at the top of this script for segments.txt format and env vars.
EOF
    ;;
esac
