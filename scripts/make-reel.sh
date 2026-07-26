#!/usr/bin/env bash
#
# make-reel.sh — Auto/curated rapid beat-synced vertical Reel (1080x1920) from
#                a live-performance video.
#
# Commands:
#   ./make-reel.sh prep  <youtube-url>   download + analyze -> plan.json
#   ./make-reel.sh sheets [START END]    timestamped contact sheet(s) for curation
#   ./make-reel.sh cut                   render plan.json -> out/reel.mp4
#
# Selection modes (prep):
#   * Automatic (default): ranks moments by motion + audio energy, spread over
#     time and picked for VISUAL variety (farthest-point on frame signatures).
#   * Curated / hybrid: if ./picks.txt exists, those source moments are placed
#     across the timeline; any leftover slots are auto-filled. Great for
#     forcing in specific shots and fixing framing per-shot.
#
# Soundtrack:
#   * Default: continuous audio bed = highest-energy stretch of the source.
#   * External: set AUDIO=/path/song.wav (studio version), optionally
#     AUDIO_START / AUDIO_END (mm:ss or seconds). Tempo + beats are detected
#     from THAT file and it becomes the soundtrack; video is cut to its grid.
#
# picks.txt format — one moment per line: "TS [CROP_X]"
#   TS      = source in-point (mm:ss, h:mm:ss, or seconds)
#   CROP_X  = optional 0..1 horizontal crop center (0=left, .5=center, 1=right)
#   Repeat a TS on consecutive lines to make that shot linger across more beats.
#   # comments and blank lines ignored.
#
# Overlay a PNG (e.g. a story frame): set OVERLAY=/path/overlay.png. It fades in
# at OVERLAY_START (default 2s) over OVERLAY_FADE (default 0.2s) and stays; set
# OVERLAY_END to fade it back out. Transparency is preserved.
#
# Env: REEL_SECONDS(75,cap90) CUT_SECONDS(0.7) VIDEO_BITRATE(8M) ANALYZE_FPS(3)
#      SEED(0) AUDIO AUDIO_START AUDIO_END OVERLAY OVERLAY_START OVERLAY_FADE OVERLAY_END
#
set -euo pipefail

SOURCE_DIR="./source"; OUT_DIR="./out"; FRAMES_DIR="./frames"; VENV_DIR="./.reel-venv"
PLAN="./plan.json"; PICKS="./picks.txt"
REEL_SECONDS="${REEL_SECONDS:-75}"; CUT_SECONDS="${CUT_SECONDS:-0.7}"
VIDEO_BITRATE="${VIDEO_BITRATE:-8M}"; ANALYZE_FPS="${ANALYZE_FPS:-3}"; SEED="${SEED:-0}"
AUDIO="${AUDIO:-}"; AUDIO_START="${AUDIO_START:-0}"; AUDIO_END="${AUDIO_END:-}"
MAX_SECONDS=90

if [ -t 1 ]; then BOLD=$'\033[1m'; GRN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; RST=$'\033[0m'
else BOLD=""; GRN=""; YEL=""; RED=""; RST=""; fi
say(){ printf "%s\n" "${BOLD}▶ $*${RST}"; }
ok(){ printf "%s\n" "${GRN}✓ $*${RST}"; }
warn(){ printf "%s\n" "${YEL}! $*${RST}"; }
die(){ printf "%s\n" "${RED}✗ $*${RST}" >&2; exit 1; }

ensure_cmd(){ local c="$1" b="$2" a="$3"
  if command -v "$c" >/dev/null 2>&1; then ok "$c found"; return; fi
  say "Installing $c ..."
  if [[ "$(uname -s)" == "Darwin" ]]; then
    command -v brew >/dev/null 2>&1 || die "Homebrew not found — install from https://brew.sh then re-run."
    brew install "$b"
  else if command -v sudo >/dev/null 2>&1; then sudo apt-get update -qq && sudo apt-get install -y "$a"
       else apt-get update -qq && apt-get install -y "$a"; fi; fi
  command -v "$c" >/dev/null 2>&1 || die "Failed to install $c."; ok "$c installed."; }

ensure_venv(){
  command -v python3 >/dev/null 2>&1 || ensure_cmd python3 python python3
  [ -d "$VENV_DIR" ] || { say "Creating analysis venv ($VENV_DIR) ..."; python3 -m venv "$VENV_DIR"; }
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  if ! python -c "import librosa, numpy, PIL" >/dev/null 2>&1; then
    say "Installing analysis libs (numpy, librosa, pillow) — first run only, a few min ..."
    pip install -q --upgrade pip; pip install -q numpy librosa pillow
  fi
  ok "analysis stack ready."
}
find_source(){ ls -1 "$SOURCE_DIR"/video.* 2>/dev/null | grep -viE '\.(part|ytdl)$' | head -1; }

# ------------------------------------------------------------------ PREP
cmd_prep(){
  local url="${1:-}"; [ -n "$url" ] || die "Usage: $0 prep <youtube-url>"
  mkdir -p "$SOURCE_DIR" "$OUT_DIR"
  say "Step 1 — tools"; ensure_cmd yt-dlp yt-dlp yt-dlp; ensure_cmd ffmpeg ffmpeg ffmpeg; ensure_cmd ffprobe ffmpeg ffmpeg
  say "Step 2 — download highest-quality into $SOURCE_DIR"
  yt-dlp -f "bv*+ba/b" --no-playlist -o "$SOURCE_DIR/video.%(ext)s" "$url"
  local src; src="$(find_source)"; [ -n "$src" ] || die "Download produced no file."
  ok "Downloaded: $src"
  say "Step 3 — analyze + build $PLAN"
  ensure_venv
  SRC="$src" PLAN="$PLAN" PICKS="$PICKS" REEL_SECONDS="$REEL_SECONDS" CUT_SECONDS="$CUT_SECONDS" \
    ANALYZE_FPS="$ANALYZE_FPS" MAX_SECONDS="$MAX_SECONDS" SEED="$SEED" \
    AUDIO="$AUDIO" AUDIO_START="$AUDIO_START" AUDIO_END="$AUDIO_END" \
    OVERLAY="${OVERLAY:-}" OVERLAY_START="${OVERLAY_START:-2}" OVERLAY_FADE="${OVERLAY_FADE:-0.2}" OVERLAY_END="${OVERLAY_END:-}" \
    python - <<'PY'
import os, json, subprocess, sys
import numpy as np
SRC=os.environ["SRC"]; PLAN=os.environ["PLAN"]; PICKS=os.environ["PICKS"]
REEL=min(float(os.environ["REEL_SECONDS"]), float(os.environ["MAX_SECONDS"]))
CUTLEN=float(os.environ["CUT_SECONDS"]); AFPS=float(os.environ["ANALYZE_FPS"])
SEED=int(os.environ["SEED"]); rng=np.random.default_rng(SEED)
AUDIO=os.environ.get("AUDIO",""); A_START=os.environ.get("AUDIO_START","0"); A_END=os.environ.get("AUDIO_END","")
SR=22050; W,H=160,90

def ts2s(t):
    t=str(t).strip()
    if not t: return 0.0
    p=t.split(":")
    return float(p[0])*3600+float(p[1])*60+float(p[2]) if len(p)==3 else \
           float(p[0])*60+float(p[1]) if len(p)==2 else float(p[0])
def dur(path):
    o=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",path],capture_output=True,text=True)
    return float(o.stdout.strip())
def decode(path,ss=None,to=None):
    cmd=["ffmpeg","-v","error"]
    if ss is not None: cmd+=["-ss",str(ss)]
    if to is not None: cmd+=["-to",str(to)]
    cmd+=["-i",path,"-ac","1","-ar",str(SR),"-f","f32le","-"]
    return np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,dtype=np.float32).copy()
def norm(x):
    x=np.asarray(x,float); r=x.max()-x.min(); return (x-x.min())/r if r>1e-9 else np.zeros_like(x)

DUR=dur(SRC); print(f"  source duration: {DUR:.1f}s")
import librosa

# ---- soundtrack + beat grid ------------------------------------------------
if AUDIO:
    a_start=ts2s(A_START); a_end=ts2s(A_END) if A_END else a_start+REEL
    y=decode(AUDIO,a_start,a_end)
    if y.size==0: sys.exit(f"No audio decoded from {AUDIO}")
    tempo,bf=librosa.beat.beat_track(y=y,sr=SR); beats=librosa.frames_to_time(bf,sr=SR)
    grid_start,grid_end=(float(beats[0]),float(beats[-1])) if len(beats)>=4 else (0.0,y.size/SR)
    audio_meta={"file":os.path.abspath(AUDIO),"start":round(a_start+grid_start,3),"end":round(a_start+grid_end,3)}
    print(f"  external soundtrack: {AUDIO} [{a_start:.1f}->{a_end:.1f}s]")
else:
    y=decode(SRC)
    if y.size==0: sys.exit("No audio in source.")
    tempo,bf=librosa.beat.beat_track(y=y,sr=SR); beats=librosa.frames_to_time(bf,sr=SR)
    NS=int(np.floor(min(DUR,y.size/SR)))
    hop=512; rms=librosa.feature.rms(y=y,hop_length=hop)[0]
    rt=librosa.frames_to_time(np.arange(len(rms)),sr=SR,hop_length=hop)
    aud_sec=np.array([rms[(rt>=s)&(rt<s+1)].mean() if ((rt>=s)&(rt<s+1)).any() else 0 for s in range(NS)])
    win=int(round(REEL))
    if win>=NS: bs=0.0
    else:
        cs=np.concatenate([[0],np.cumsum(aud_sec)]); bs=float(np.argmax(cs[win:]-cs[:-win]))
    bs=max(0.0,min(bs,max(0.0,DUR-REEL)))
    bin_=[b for b in beats if bs<=b<=bs+REEL]
    if len(bin_)<4: bin_=list(beats[:max(4,int(REEL*float(np.atleast_1d(tempo)[0])/60))])
    grid_start,grid_end=float(bin_[0]),float(bin_[-1]); beats=np.array(bin_)
    audio_meta={"file":None,"start":round(grid_start,3),"end":round(grid_end,3)}
tempo=float(np.atleast_1d(tempo)[0]); print(f"  tempo: {tempo:.1f} BPM")

# beats that fall in the grid, as reel-timeline offsets
gb=[b for b in beats if grid_start-1e-6<=b<=grid_end+1e-6] or [grid_start,grid_end]
beat_dur=60.0/tempo; bpc=max(1,int(round(CUTLEN/beat_dur)))
bounds=gb[::bpc]
if bounds[-1]<grid_end-1e-3: bounds.append(grid_end)
slots=[(bounds[i]-grid_start,bounds[i+1]-bounds[i]) for i in range(len(bounds)-1)]
slots=[(a,b) for a,b in slots if b>0.05]
nslots=len(slots)
print(f"  audio bed span: {grid_end-grid_start:.1f}s, cuts: {nslots} (~{CUTLEN}s, {bpc} beat/cut)")

# ---- motion + frame signatures across the whole video ----------------------
NS=int(np.floor(DUR))
raw=subprocess.run(["ffmpeg","-v","error","-i",SRC,"-vf",f"fps={AFPS},scale={W}:{H},format=gray",
    "-f","rawvideo","-pix_fmt","gray","-"],capture_output=True).stdout
buf=np.frombuffer(raw,dtype=np.uint8); nfr=buf.size//(W*H)
fr=buf[:nfr*W*H].reshape(nfr,H,W).astype(np.float32)
d=np.abs(np.diff(fr.reshape(nfr,-1),axis=0)).mean(axis=1) if nfr>1 else np.zeros(1)
ft=np.arange(len(d))/AFPS
mot=np.array([d[(ft>=s)&(ft<s+1)].mean() if ((ft>=s)&(ft<s+1)).any() else 0 for s in range(NS)])
# 8x8 signature per second (for visual-variety selection)
sig=np.zeros((NS,64))
for s in range(NS):
    idx=int(min(s*AFPS,nfr-1)); f=fr[idx][:88,:160].reshape(8,11,8,20).mean(axis=(1,3))
    sig[s]=f.flatten()
if not AUDIO:
    ae=np.interp(np.arange(NS),np.arange(len(aud_sec)),aud_sec) if len(aud_sec)>1 else np.zeros(NS)
else:
    ae=np.zeros(NS)
exc=0.6*norm(mot)+0.4*norm(ae)
print(f"  motion sampled: {nfr} frames @ {AFPS}fps")

# ---- parse picks.txt -------------------------------------------------------
picks=[]
if os.path.exists(PICKS):
    for ln in open(PICKS):
        ln=ln.split("#")[0].strip()
        if not ln: continue
        parts=ln.split()
        t=ts2s(parts[0]); cx=float(parts[1]) if len(parts)>1 else 0.5
        picks.append((t,max(0.0,min(1.0,cx))))
    print(f"  picks.txt: {len(picks)} curated moment(s)")

# ---- choose a source moment (sec) + crop_x for every slot ------------------
assigned=[None]*nslots
used=[]
if picks:
    if len(picks)>=nslots:
        # enough curated moments to fill every slot: use them IN ORDER
        for i in range(nslots): assigned[i]=picks[i]; used.append(int(picks[i][0]))
    else:
        # fewer picks than slots: spread them evenly (order-preserving), auto-fill gaps
        npk=len(picks)
        for i in range(npk):
            idx=(i*nslots)//npk
            while assigned[idx] is not None: idx=(idx+1)%nslots
            assigned[idx]=picks[i]; used.append(int(picks[i][0]))
# auto-fill remaining slots: farthest-point on signatures, weighted by excite
free=[i for i in range(nslots) if assigned[i] is None]
if free:
    MINGAP=max(2,int(CUTLEN*2))
    cand=[s for s in np.argsort(-exc) if all(abs(s-u)>=MINGAP for u in used)]
    chosen=[]
    if cand:
        chosen.append(cand[0])
        while len(chosen)<len(free) and len(chosen)<len(cand):
            best,bscore=None,-1
            for s in cand:
                if s in chosen: continue
                dmin=min(np.linalg.norm(sig[s]-sig[c]) for c in chosen)
                sc=0.5*exc[s]+0.5*(dmin/(np.linalg.norm(sig).mean()+1e-6))
                if sc>bscore: best,bscore=s,sc
            if best is None: break
            chosen.append(best)
    i=0
    while len(chosen)<len(free): chosen.append(int((cand or [0])[i%len(cand or [0])])); i+=1
    order=sorted(zip(free,sorted(chosen[:len(free)])))
    for slot_i,sec in order: assigned[slot_i]=(float(sec),0.5)

cuts=[]
for (s0,slen),a in zip(slots,assigned):
    sec,cx=a; s=float(min(sec,max(0.0,DUR-slen)))
    cuts.append({"src_start":round(s,3),"dur":round(slen,3),"crop_x":round(cx,3),
                 "excite":round(float(exc[int(min(sec,NS-1))]),3)})

OVL=os.environ.get("OVERLAY","")
overlay_meta=None
if OVL:
    overlay_meta={"file":os.path.abspath(OVL),
                  "start":float(os.environ.get("OVERLAY_START") or 2),
                  "fade":float(os.environ.get("OVERLAY_FADE") or 0.2),
                  "end":(float(os.environ["OVERLAY_END"]) if os.environ.get("OVERLAY_END") else None)}
    print(f"  overlay: {OVL} @ {overlay_meta['start']}s, {overlay_meta['fade']*1000:.0f}ms fade-in")

plan={"source":os.path.abspath(SRC),"audio":audio_meta,"overlay":overlay_meta,"tempo":round(tempo,1),
      "reel_seconds":round(grid_end-grid_start,3),"n_cuts":len(cuts),"cuts":cuts}
json.dump(plan,open(PLAN,"w"),indent=2)
print(f"  wrote {PLAN}: {len(cuts)} cuts, {plan['reel_seconds']:.1f}s reel"
      + (f", ext-audio" if audio_meta['file'] else "")
      + (f", {len(picks)} curated" if picks else ""))
PY
  ok "Plan: $PLAN"
  printf "\n%s\n  Tweak %s if you want, then: %s\n" "${GRN}${BOLD}PREP DONE.${RST}" "${BOLD}$PLAN${RST}" "${BOLD}$0 cut${RST}"
}

# ------------------------------------------------------------------ SHEETS
cmd_sheets(){
  local src; src="$(find_source)"; [ -n "$src" ] || die "No source video. Run '$0 prep <url>' first."
  ensure_cmd ffmpeg ffmpeg ffmpeg; ensure_cmd ffprobe ffmpeg ffmpeg; ensure_venv
  mkdir -p "$FRAMES_DIR"
  say "Building timestamped contact sheet(s) -> $FRAMES_DIR"
  SRC="$src" FRAMES_DIR="$FRAMES_DIR" ANALYZE_FPS="$ANALYZE_FPS" \
    RANGE_START="${1:-}" RANGE_END="${2:-}" python - <<'PY'
import os, subprocess, math
import numpy as np
SRC=os.environ["SRC"]; OUT=os.environ["FRAMES_DIR"]; AFPS=float(os.environ["ANALYZE_FPS"])
RS=os.environ.get("RANGE_START",""); RE=os.environ.get("RANGE_END","")
W,H=160,90
def ts2s(t):
    p=str(t).split(":"); return float(p[0])*3600+float(p[1])*60+float(p[2]) if len(p)==3 else \
        float(p[0])*60+float(p[1]) if len(p)==2 else float(p[0])
def dur(p):
    o=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",p],capture_output=True,text=True); return float(o.stdout)
def hms(s): return f"{int(s//3600):d}:{int(s%3600//60):02d}:{int(s%60):02d}" if s>=3600 else f"{int(s//60):d}:{int(s%60):02d}"
D=dur(SRC)
if RS:  # coverage sheet of a range
    a,b=ts2s(RS),ts2s(RE) if RE else ts2s(RS)+60; step=max(1.0,(b-a)/48)
    secs=list(np.arange(a,b,step)); tag="range"
else:   # candidate sheet: top motion+energy moments, spaced, chronological
    raw=subprocess.run(["ffmpeg","-v","error","-i",SRC,"-vf",f"fps={AFPS},scale={W}:{H},format=gray",
        "-f","rawvideo","-pix_fmt","gray","-"],capture_output=True).stdout
    buf=np.frombuffer(raw,np.uint8); nfr=buf.size//(W*H)
    fr=buf[:nfr*W*H].reshape(nfr,-1).astype(np.float32)
    d=np.abs(np.diff(fr,axis=0)).mean(axis=1) if nfr>1 else np.zeros(1)
    NS=int(D); ft=np.arange(len(d))/AFPS
    mot=np.array([d[(ft>=s)&(ft<s+1)].mean() if ((ft>=s)&(ft<s+1)).any() else 0 for s in range(NS)])
    order=np.argsort(-mot); chosen=[]
    for s in order:
        if all(abs(s-c)>=4 for c in chosen): chosen.append(int(s))
        if len(chosen)>=96: break
    secs=sorted(chosen); tag="candidates"
# Extract plain thumbnails with ffmpeg, then label + tile with Pillow.
# (Avoids ffmpeg's drawtext/freetype, which some ffmpeg builds lack.)
import shutil
from PIL import Image, ImageDraw, ImageFont
def get_font(size):
    for p in ["/System/Library/Fonts/Supplemental/Arial.ttf","/Library/Fonts/Arial.ttf",
              "/System/Library/Fonts/Helvetica.ttc",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        try: return ImageFont.truetype(p,size)
        except Exception: pass
    try: return ImageFont.load_default(size=size)   # Pillow >= 10
    except TypeError: return ImageFont.load_default()
TW,TH,COLS,PAD,per=320,180,6,4,48
font=get_font(22)
tmp=os.path.join(OUT,".thumbs")
if os.path.isdir(tmp): shutil.rmtree(tmp)
os.makedirs(tmp,exist_ok=True)
def label_thumb(path,sec):
    im=Image.open(path).convert("RGB").resize((TW,TH))
    d=ImageDraw.Draw(im); txt=hms(sec)
    x0,y0,x1,y1=d.textbbox((0,0),txt,font=font)
    d.rectangle([3,3,3+(x1-x0)+10,3+(y1-y0)+8],fill=(0,0,0))
    d.text((8,5),txt,fill=(255,235,0),font=font)
    return im
sheets=0
for k in range(0,len(secs),per):
    grp=secs[k:k+per]; rows=math.ceil(len(grp)/COLS)
    canvas=Image.new("RGB",(COLS*TW+(COLS+1)*PAD, rows*TH+(rows+1)*PAD),(0,0,0))
    for j,s in enumerate(grp):
        tp=os.path.join(tmp,f"t{j:04d}.jpg")
        subprocess.run(["ffmpeg","-v","error","-y","-ss",f"{s}","-i",SRC,
            "-frames:v","1","-vf",f"scale={TW}:{TH}",tp],check=False)
        if not os.path.exists(tp): continue
        im=label_thumb(tp,s); r,c=divmod(j,COLS)
        canvas.paste(im,(PAD+c*(TW+PAD), PAD+r*(TH+PAD)))
    outp=os.path.join(OUT,f"{tag}_{sheets+1:02d}.jpg")
    canvas.save(outp,quality=90); sheets+=1
    print(f"  wrote {outp} ({len(grp)} thumbs)")
shutil.rmtree(tmp,ignore_errors=True)
print(f"  timestamps are the source in-points — reference them in picks.txt")
PY
  ok "Contact sheet(s) in $FRAMES_DIR/ — send them over and I'll build picks.txt"
}

# ------------------------------------------------------------------ CUT
cmd_cut(){
  local src; src="$(find_source)"; [ -n "$src" ] || die "No source video. Run '$0 prep <url>' first."
  [ -f "$PLAN" ] || die "No $PLAN. Run '$0 prep <url>' first."
  mkdir -p "$OUT_DIR"; ensure_cmd ffmpeg ffmpeg ffmpeg; ensure_cmd ffprobe ffmpeg ffmpeg
  # Build filter graph + ordered input list from plan.json (pure python, no deps).
  # Input order is fixed: video(0), [ext audio], [overlay]. Python computes the
  # matching stream indices so the graph and the -i flags stay in sync.
  local meta; meta="$(PLAN="$PLAN" SRC="$src" python3 - <<'PY'
import os,json
p=json.load(open(os.environ["PLAN"])); cuts=p["cuts"]; a=p["audio"]; ov=p.get("overlay")
src=os.environ["SRC"]; parts=[]; labels=""; idx=1
a_idx=0
if a["file"]: a_idx=idx; idx+=1
o_idx=None
if ov: o_idx=idx; idx+=1
for i,c in enumerate(cuts):
    s=c["src_start"]; e=s+c["dur"]; cx=c.get("crop_x",0.5)
    # per-clip: trim -> scale to cover -> horizontal-offset crop -> normalize SAR
    parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS,"
                 f"scale=1080:1920:force_original_aspect_ratio=increase,"
                 f"crop=1080:1920:(iw-1080)*{cx}:0,setsar=1[v{i}];")
    labels+=f"[v{i}]"
parts.append(f"{labels}concat=n={len(cuts)}:v=1:a=0[vc];")
parts.append("[vc]fps=30,format=yuv420p[vbase];")
vlabel="vbase"
if ov:
    end=ov.get("end")
    f=(f"[{o_idx}:v]format=rgba,scale=1080:1920:force_original_aspect_ratio=decrease,"
       f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black@0.0,"
       f"fade=t=in:st={ov['start']}:d={ov['fade']}:alpha=1")
    if end: f+=f",fade=t=out:st={end}:d={ov['fade']}:alpha=1"
    f+="[ov];"
    parts.append(f)
    # shortest=1 so the looped-overlay input ends with the main video (avoids hang)
    parts.append("[vbase][ov]overlay=0:0:format=auto:shortest=1,format=yuv420p[vout];")
    vlabel="vout"
src_a = f"{a_idx}:a" if a["file"] else "0:a"
parts.append(f"[{src_a}]atrim=start={a['start']}:end={a['end']},asetpts=PTS-STARTPTS[aout]")
print(json.dumps({"fc":"".join(parts),"vlabel":vlabel,"audio":a["file"] or "",
                  "overlay":(ov["file"] if ov else ""),"n":len(cuts),"reel":p["reel_seconds"]}))
PY
)"
  local fc vlabel extaudio overlay ncuts reel
  fc="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['fc'])" "$meta")"
  vlabel="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['vlabel'])" "$meta")"
  extaudio="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['audio'])" "$meta")"
  overlay="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['overlay'])" "$meta")"
  ncuts="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['n'])" "$meta")"
  reel="$(python3 -c "import json,sys;print(json.loads(sys.argv[1])['reel'])" "$meta")"
  awk "BEGIN{exit !($reel <= $MAX_SECONDS)}" || die "Reel ${reel}s exceeds ${MAX_SECONDS}s cap."
  say "Rendering $ncuts cuts -> $OUT_DIR/reel.mp4 (H.264 ~$VIDEO_BITRATE, AAC 128k, 30fps, 1080x1920)${overlay:+ + overlay}"
  # inputs in the fixed order python assumed: video, [ext audio], [overlay(looped)]
  local -a inputs=(-i "$src")
  [ -n "$extaudio" ] && inputs+=(-i "$extaudio")
  # bound the looped overlay to the reel length so the input is finite (fast + terminates)
  [ -n "$overlay" ] && inputs+=(-loop 1 -t "$reel" -i "$overlay")
  ffmpeg -y -loglevel error -stats "${inputs[@]}" \
    -filter_complex "$fc" -map "[$vlabel]" -map "[aout]" -shortest \
    -t "$reel" \
    -c:v libx264 -preset medium -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize 16M \
    -profile:v high -level 4.0 -c:a aac -b:a 128k -ar 48000 -movflags +faststart \
    "$OUT_DIR/reel.mp4"
  local d sz
  d="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/reel.mp4")"
  sz="$(du -h "$OUT_DIR/reel.mp4" | awk '{print $1}')"
  ok "Done."
  printf "\n%sFinal Reel:%s %s/reel.mp4\n  duration : %.2f s\n  size     : %s\n  format   : 1080x1920, H.264 high, AAC 128k, 30fps, %s cuts\n" \
    "$BOLD" "$RST" "$OUT_DIR" "$d" "$sz" "$ncuts"
}

case "${1:-}" in
  prep)   shift; cmd_prep "$@";;
  sheets) shift; cmd_sheets "$@";;
  cut)    shift; cmd_cut "$@";;
  *) cat <<EOF
${BOLD}make-reel.sh${RST} — live performance -> rapid beat-synced vertical Reel
  $0 prep <youtube-url>    download + analyze -> plan.json
  $0 sheets [START END]    timestamped contact sheet(s) for curation
  $0 cut                   render plan.json -> out/reel.mp4
Curate: create picks.txt (TS [CROP_X] per line). Ext audio: AUDIO=song.wav AUDIO_START=mm:ss AUDIO_END=mm:ss
EOF
  ;;
esac
