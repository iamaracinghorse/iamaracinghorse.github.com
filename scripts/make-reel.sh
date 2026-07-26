#!/usr/bin/env bash
#
# make-reel.sh — Auto-cut a rapid, beat-synced vertical Instagram Reel (1080x1920)
#                from a live-performance YouTube video.
#
# Strategy (no transcript — this is for music/performance footage):
#   * librosa detects tempo + beat times  -> cuts land on the beat
#   * audio RMS finds the single best high-energy stretch -> continuous audio bed
#   * frame-difference motion + audio energy across the whole show -> ranks the
#     most exciting moments, spaced out over time for shot/angle variety
#   * visuals quick-cut over the continuous audio bed; ONE final re-encode
#
# Two phases:
#   ./make-reel.sh prep <youtube-url>
#       install tools, download into ./source/, analyze, and write ./plan.json
#       (the edit decision list) + print a summary. Then STOP.
#
#   --- review/tweak plan.json if you like, then: ---
#
#   ./make-reel.sh cut
#       render plan.json -> ./out/reel.mp4
#       (H.264 / AAC 128k / ~8 Mbps / 30fps, 1080x1920, < 90s)
#
# Env overrides (all optional):
#   REEL_SECONDS   target reel length, seconds        (default 75, hard cap 90)
#   CUT_SECONDS    approx length of each cut, seconds  (default 0.7 = rapid)
#   VIDEO_BITRATE  target video bitrate                (default 8M)
#   ANALYZE_FPS    motion-analysis sampling rate       (default 3)
#   SEED           RNG seed for tie-breaks/variety     (default 0)
#
set -euo pipefail

# ------------------------------------------------------------------ paths / config
SOURCE_DIR="./source"
OUT_DIR="./out"
VENV_DIR="./.reel-venv"
PLAN="./plan.json"

REEL_SECONDS="${REEL_SECONDS:-75}"
CUT_SECONDS="${CUT_SECONDS:-0.7}"
VIDEO_BITRATE="${VIDEO_BITRATE:-8M}"
ANALYZE_FPS="${ANALYZE_FPS:-3}"
SEED="${SEED:-0}"
MAX_SECONDS=90

# ------------------------------------------------------------------ pretty output
if [ -t 1 ]; then
  BOLD=$'\033[1m'; GRN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; RST=$'\033[0m'
else
  BOLD=""; GRN=""; YEL=""; RED=""; RST=""
fi
say()  { printf "%s\n" "${BOLD}▶ $*${RST}"; }
ok()   { printf "%s\n" "${GRN}✓ $*${RST}"; }
warn() { printf "%s\n" "${YEL}! $*${RST}"; }
die()  { printf "%s\n" "${RED}✗ $*${RST}" >&2; exit 1; }

# ------------------------------------------------------------------ tool install
ensure_cmd() {  # ensure_cmd <cmd> <brew-formula> <apt-package>
  local cmd="$1" brew_pkg="$2" apt_pkg="$3"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd found"
    return
  fi
  say "Installing $cmd ..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    command -v brew >/dev/null 2>&1 || die "Homebrew not found — install from https://brew.sh then re-run."
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
    say "Creating Python venv for analysis ($VENV_DIR) ..."
    python3 -m venv "$VENV_DIR"
  fi
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  if ! python -c "import librosa, numpy" >/dev/null 2>&1; then
    say "Installing analysis libs (numpy, librosa) — first run only, takes a few min ..."
    pip install -q --upgrade pip
    pip install -q numpy librosa
  fi
  ok "analysis stack ready (numpy + librosa)."
}

find_source() { ls -1 "$SOURCE_DIR"/video.* 2>/dev/null | grep -viE '\.(part|ytdl)$' | head -1; }

# ================================================================== PREP
cmd_prep() {
  local url="${1:-}"
  [ -n "$url" ] || die "Usage: $0 prep <youtube-url>"
  mkdir -p "$SOURCE_DIR" "$OUT_DIR"

  say "Step 1 — tools"
  ensure_cmd yt-dlp yt-dlp yt-dlp
  ensure_cmd ffmpeg ffmpeg ffmpeg
  ensure_cmd ffprobe ffmpeg ffmpeg

  say "Step 2 — downloading highest-quality video into $SOURCE_DIR"
  yt-dlp -f "bv*+ba/b" --no-playlist -o "$SOURCE_DIR/video.%(ext)s" "$url"
  local src; src="$(find_source)"
  [ -n "$src" ] || die "Download produced no file in $SOURCE_DIR."
  ok "Downloaded: $src"

  say "Step 3 — analyzing (beats, energy, motion) and building $PLAN"
  ensure_python_venv
  SRC="$src" PLAN="$PLAN" REEL_SECONDS="$REEL_SECONDS" CUT_SECONDS="$CUT_SECONDS" \
    ANALYZE_FPS="$ANALYZE_FPS" MAX_SECONDS="$MAX_SECONDS" SEED="$SEED" \
    python - <<'PY'
import os, json, subprocess, sys
import numpy as np

SRC=os.environ["SRC"]; PLAN=os.environ["PLAN"]
REEL=float(os.environ["REEL_SECONDS"]); CUTLEN=float(os.environ["CUT_SECONDS"])
AFPS=float(os.environ["ANALYZE_FPS"]); CAP=float(os.environ["MAX_SECONDS"])
SEED=int(os.environ["SEED"]); rng=np.random.default_rng(SEED)
REEL=min(REEL, CAP)

def probe_duration(path):
    out=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",path],capture_output=True,text=True)
    return float(out.stdout.strip())

DUR=probe_duration(SRC)
print(f"  source duration: {DUR:.1f}s")

# ---- audio: decode mono f32 @ SR via ffmpeg pipe -------------------------
SR=22050
p=subprocess.run(["ffmpeg","-v","error","-i",SRC,"-ac","1","-ar",str(SR),
    "-f","f32le","-"],capture_output=True)
y=np.frombuffer(p.stdout,dtype=np.float32).copy()
if y.size==0: sys.exit("No audio decoded from source.")
print(f"  decoded audio: {y.size/SR:.1f}s @ {SR}Hz")

import librosa
# beats + tempo
tempo,beat_frames=librosa.beat.beat_track(y=y,sr=SR)
beat_times=librosa.frames_to_time(beat_frames,sr=SR)
tempo=float(np.atleast_1d(tempo)[0])
print(f"  tempo: {tempo:.1f} BPM, {len(beat_times)} beats")
if len(beat_times)<8: sys.exit("Too few beats detected — is there music in this video?")

# per-second audio energy (RMS)
hop=512
rms=librosa.feature.rms(y=y,hop_length=hop)[0]
rms_t=librosa.frames_to_time(np.arange(len(rms)),sr=SR,hop_length=hop)
def energy_per_sec(nsec):
    e=np.zeros(nsec)
    for s in range(nsec):
        m=(rms_t>=s)&(rms_t<s+1)
        e[s]=rms[m].mean() if m.any() else 0.0
    return e
NSEC=int(np.floor(min(DUR, y.size/SR)))
aud=energy_per_sec(NSEC)

# ---- motion: grayscale 160x90 frames @ AFPS via ffmpeg pipe --------------
W,H=160,90
p=subprocess.run(["ffmpeg","-v","error","-i",SRC,"-vf",f"fps={AFPS},scale={W}:{H},format=gray",
    "-f","rawvideo","-pix_fmt","gray","-"],capture_output=True)
buf=np.frombuffer(p.stdout,dtype=np.uint8)
nfr=buf.size//(W*H)
frames=buf[:nfr*W*H].reshape(nfr,H*W).astype(np.float32)
d=np.abs(np.diff(frames,axis=0)).mean(axis=1) if nfr>1 else np.zeros(1)
mot_t=np.arange(len(d))/AFPS
mot=np.zeros(NSEC)
for s in range(NSEC):
    m=(mot_t>=s)&(mot_t<s+1)
    mot[s]=d[m].mean() if m.any() else 0.0
print(f"  motion sampled: {nfr} frames @ {AFPS}fps")

def norm(x):
    x=np.asarray(x,float); r=x.max()-x.min()
    return (x-x.min())/r if r>1e-9 else np.zeros_like(x)

# ---- pick continuous audio bed: window of REEL secs with max mean energy --
win=int(round(REEL))
if win>=NSEC:
    bed_start=0.0
else:
    csum=np.concatenate([[0],np.cumsum(aud)])
    sums=csum[win:]-csum[:-win]           # energy over each window
    bed_start=float(np.argmax(sums))
bed_start=max(0.0,min(bed_start, max(0.0,DUR-REEL)))
# snap bed to the beat grid
beats_in=[b for b in beat_times if bed_start<=b<=bed_start+REEL]
if len(beats_in)<4:                        # fallback: nearest beats
    beats_in=list(beat_times[:max(4,int(REEL*tempo/60))])
grid_start,grid_end=beats_in[0],beats_in[-1]
print(f"  audio bed: {grid_start:.2f}s -> {grid_end:.2f}s ({grid_end-grid_start:.1f}s)")

# ---- build cut slots on the beat grid ------------------------------------
beat_dur=60.0/tempo
bpc=max(1,int(round(CUTLEN/beat_dur)))     # beats per cut
boundaries=beats_in[::bpc]
if boundaries[-1]<grid_end-1e-3: boundaries.append(grid_end)
slots=[(boundaries[i],boundaries[i+1]) for i in range(len(boundaries)-1)]
slots=[(a,b) for a,b in slots if b-a>0.05]
nslots=len(slots)
print(f"  cuts: {nslots} slots (~{CUTLEN:.2f}s each, {bpc} beat(s)/cut)")

# ---- rank exciting source moments (motion + energy), spaced for variety --
exc=0.6*norm(mot)+0.4*norm(aud)
order=list(np.argsort(-exc))               # most exciting second first
chosen=[]; MINGAP=max(2,int(CUTLEN*2))     # keep picks apart for variety
for sec in order:
    if all(abs(sec-c)>=MINGAP for c in chosen):
        chosen.append(int(sec))
    if len(chosen)>=nslots: break
# if the show is short, relax spacing / allow reuse to fill all slots
i=0
while len(chosen)<nslots:
    chosen.append(int(order[i%len(order)])); i+=1
chosen=sorted(chosen[:nslots])             # walk forward through the show

# ---- assemble plan: each slot gets a source clip of the slot's length ----
cuts=[]
for (s0,s1),src_sec in zip(slots,chosen):
    dur=s1-s0
    src=float(min(src_sec, max(0.0,DUR-dur)))   # clamp so clip fits
    cuts.append({"src_start":round(src,3),"dur":round(dur,3),
                 "excite":round(float(exc[min(src_sec,NSEC-1)]),3)})

plan={"source":SRC,"tempo":round(tempo,1),
      "bed_start":round(grid_start,3),"bed_end":round(grid_end,3),
      "reel_seconds":round(grid_end-grid_start,3),"n_cuts":len(cuts),"cuts":cuts}
json.dump(plan,open(PLAN,"w"),indent=2)
print(f"  wrote {PLAN}: {len(cuts)} cuts, {plan['reel_seconds']:.1f}s reel")
PY
  ok "Plan: $PLAN"
  cat <<EOF

${GRN}${BOLD}PREP DONE.${RST}
  Reviewed the plan? Tweak ${BOLD}$PLAN${RST} if you want (each cut = {src_start, dur}),
  then render:  ${BOLD}$0 cut${RST}
EOF
}

# ================================================================== CUT
cmd_cut() {
  local src; src="$(find_source)"
  [ -n "$src" ] || die "No source video in $SOURCE_DIR. Run '$0 prep <url>' first."
  [ -f "$PLAN" ] || die "No $PLAN. Run '$0 prep <url>' first."
  mkdir -p "$OUT_DIR"
  ensure_cmd ffmpeg ffmpeg ffmpeg
  ensure_cmd ffprobe ffmpeg ffmpeg

  # Build the ffmpeg filter_complex from plan.json (pure python, no deps).
  local fc; fc="$(SRC="$src" PLAN="$PLAN" VIDEO_BITRATE="$VIDEO_BITRATE" python3 - <<'PY'
import os,json
plan=json.load(open(os.environ["PLAN"]))
cuts=plan["cuts"]; bs=plan["bed_start"]; be=plan["bed_end"]
parts=[]; labels=""
for i,c in enumerate(cuts):
    s=c["src_start"]; e=s+c["dur"]
    parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];")
    labels+=f"[v{i}]"
# concat video-only, then reframe once: scale-to-cover + center-crop, 30fps
parts.append(f"{labels}concat=n={len(cuts)}:v=1:a=0[vc];")
parts.append("[vc]scale=1080:1920:force_original_aspect_ratio=increase,"
             "crop=1080:1920,fps=30,format=yuv420p[vout];")
# continuous audio bed
parts.append(f"[0:a]atrim=start={bs}:end={be},asetpts=PTS-STARTPTS[aout]")
print("".join(parts))
PY
)"
  [ -n "$fc" ] || die "Failed to build filter from $PLAN."

  local ncuts reel
  ncuts="$(python3 -c "import json;print(json.load(open('$PLAN'))['n_cuts'])")"
  reel="$(python3 -c "import json;print(json.load(open('$PLAN'))['reel_seconds'])")"
  awk "BEGIN{exit !($reel <= $MAX_SECONDS)}" || die "Plan reel ${reel}s exceeds ${MAX_SECONDS}s cap."

  say "Rendering $ncuts cuts -> $OUT_DIR/reel.mp4 (H.264 ~$VIDEO_BITRATE, AAC 128k, 30fps, 1080x1920)"
  ffmpeg -y -loglevel error -stats -i "$src" \
    -filter_complex "$fc" -map "[vout]" -map "[aout]" -shortest \
    -c:v libx264 -preset medium -b:v "$VIDEO_BITRATE" \
    -maxrate "$VIDEO_BITRATE" -bufsize 16M -profile:v high -level 4.0 \
    -c:a aac -b:a 128k -ar 48000 -movflags +faststart \
    "$OUT_DIR/reel.mp4"

  local dur size
  dur="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/reel.mp4")"
  size="$(du -h "$OUT_DIR/reel.mp4" | awk '{print $1}')"
  ok "Done."
  printf "\n%s\n" "${BOLD}Final Reel:${RST} $OUT_DIR/reel.mp4"
  printf "  duration : %.2f s\n" "$dur"
  printf "  size     : %s\n" "$size"
  printf "  format   : 1080x1920, H.264 high, AAC 128k, 30fps, %s cuts\n" "$ncuts"
}

# ================================================================== dispatch
case "${1:-}" in
  prep) shift; cmd_prep "$@";;
  cut)  shift; cmd_cut  "$@";;
  *) cat <<EOF
${BOLD}make-reel.sh${RST} — YouTube performance -> rapid beat-synced vertical Reel

  $0 prep <youtube-url>   download + analyze (beats/energy/motion) -> plan.json
  $0 cut                  render plan.json -> out/reel.mp4

Env: REEL_SECONDS CUT_SECONDS VIDEO_BITRATE ANALYZE_FPS SEED (see header comments)
EOF
    ;;
esac
