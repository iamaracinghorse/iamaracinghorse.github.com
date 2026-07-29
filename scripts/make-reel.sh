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
# OVERLAY_END to fade it back out. Transparency is preserved. OVERLAY_BLEND picks
# a blend mode (exclusion, screen, difference, addition, lighten, ...) instead of
# plain alpha; the lighten-family modes work cleanly with transparent PNGs.
#
# Cut pace: CUT_SECONDS targets a cut length; BEATS_PER_CUT forces an exact
# number of beats per cut (e.g. BEATS_PER_CUT=2) and overrides CUT_SECONDS.
#
# Framing / motion:
#   * picks.txt CROP_X can be a single center (0.6) OR a pan "0.3>0.7" that
#     slides the crop across the shot (great for horizontal->vertical footage).
#   * PAN=0.2 adds a gentle auto-drift around each shot's center (alternating
#     direction) for subtle life on otherwise-static crops.
#
# Creative look: LOOK=<preset> or FILTER="<raw ffmpeg filter chain>".
#   presets: bw punch warm cool vignette dramatic film vhs
#   LOOK_SCOPE=footage (default) or =all (grade the overlay too).
#   LOOK_INTENSITY=1 (default); >1 pushes the preset harder (e.g. 1.6 = more VHS).
#
# Motion / feel:
#   FPS=30 (default; try 15 for a choppier, grittier cadence)
#   SHAKE=0 (px of handheld vertical/horizontal jitter, e.g. 12)
#   SLOWMO=0 (auto-pick this many shots to play slowed) SLOWMO_RATE=2 (2 = half speed)
#   LENGTH_JITTER=0 (0..1 chance each cut gets ±1 beat — subtle on-beat variety)
#   AUTOCENTER=0 (=1 detects the main subject per shot and centers on them; needs OpenCV)
#
# Env: REEL_SECONDS(75,cap90) CUT_SECONDS(0.7) BEATS_PER_CUT VIDEO_BITRATE(8M)
#      ANALYZE_FPS(3) SEED(0) PAN LOOK FILTER LOOK_SCOPE LOOK_INTENSITY
#      FPS SHAKE SLOWMO SLOWMO_RATE LENGTH_JITTER AUTOCENTER
#      AUDIO AUDIO_START AUDIO_END OVERLAY OVERLAY_START OVERLAY_FADE OVERLAY_END OVERLAY_BLEND
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
ensure_cv(){  # OpenCV (pinned to 4.x — v5 dropped the classic detectors), for AUTOCENTER
  if ! python -c "import cv2; cv2.CascadeClassifier" >/dev/null 2>&1; then
    say "Installing OpenCV for auto-centering (~40MB wheel, first run only) — Python $(python -c 'import sys;print(".".join(map(str,sys.version_info[:2])))')"
    # --only-binary so pip never silently BUILDS FROM SOURCE (that's the hang);
    # it downloads a wheel fast, or fails fast if none exists for this Python.
    pip install --progress-bar on --only-binary=:all: "opencv-python-headless>=4.8,<5" \
      || warn "No OpenCV wheel for this Python — auto-center skipped (rest still runs). Tell Claude your Python version."
  fi
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
  [ "${AUTOCENTER:-}" = "1" ] && ensure_cv
  SRC="$src" PLAN="$PLAN" PICKS="$PICKS" REEL_SECONDS="$REEL_SECONDS" CUT_SECONDS="$CUT_SECONDS" \
    ANALYZE_FPS="$ANALYZE_FPS" MAX_SECONDS="$MAX_SECONDS" SEED="$SEED" \
    AUDIO="$AUDIO" AUDIO_START="$AUDIO_START" AUDIO_END="$AUDIO_END" \
    OVERLAY="${OVERLAY:-}" OVERLAY_START="${OVERLAY_START:-2}" OVERLAY_FADE="${OVERLAY_FADE:-0.2}" OVERLAY_END="${OVERLAY_END:-}" \
    OVERLAY_BLEND="${OVERLAY_BLEND:-}" BEATS_PER_CUT="${BEATS_PER_CUT:-}" \
    LOOK="${LOOK:-}" FILTER="${FILTER:-}" LOOK_SCOPE="${LOOK_SCOPE:-}" PAN="${PAN:-}" \
    FPS="${FPS:-30}" SHAKE="${SHAKE:-0}" SLOWMO="${SLOWMO:-0}" SLOWMO_RATE="${SLOWMO_RATE:-2}" \
    LENGTH_JITTER="${LENGTH_JITTER:-0}" LOOK_INTENSITY="${LOOK_INTENSITY:-1}" AUTOCENTER="${AUTOCENTER:-0}" \
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

# ---- cache (so re-runs that only change picks/look/pan/etc. are fast) ------
import hashlib
CACHE="./.reel-cache"; os.makedirs(CACHE,exist_ok=True)
def ckey(*p): return hashlib.md5("|".join(map(str,p)).encode()).hexdigest()
def mtime(p):
    try: return round(os.path.getmtime(p),1)
    except Exception: return 0

# ---- soundtrack + beat grid (cached on audio inputs) -----------------------
akey=ckey("aud2",os.path.abspath(AUDIO) if AUDIO else os.path.abspath(SRC),
          mtime(AUDIO or SRC),A_START,A_END,round(REEL,2),bool(AUDIO))
apath=os.path.join(CACHE,akey+".npz")
if os.path.exists(apath):
    z=np.load(apath,allow_pickle=True)
    tempo=float(z["tempo"]); beats=z["beats"]; grid_start=float(z["gs"]); grid_end=float(z["ge"])
    audio_meta=z["meta"].item(); aud_sec=z["aud_sec"]; print("  soundtrack: cached")
else:
    if AUDIO:
        a_start=ts2s(A_START); a_end=ts2s(A_END) if A_END else a_start+REEL
        y=decode(AUDIO,a_start,a_end)
        if y.size==0: sys.exit(f"No audio decoded from {AUDIO}")
        tempo,bf=librosa.beat.beat_track(y=y,sr=SR); beats=librosa.frames_to_time(bf,sr=SR)
        grid_start,grid_end=(float(beats[0]),float(beats[-1])) if len(beats)>=4 else (0.0,y.size/SR)
        audio_meta={"file":os.path.abspath(AUDIO),"start":round(a_start+grid_start,3),"end":round(a_start+grid_end,3)}
        aud_sec=np.zeros(1); print(f"  external soundtrack: {AUDIO} [{a_start:.1f}->{a_end:.1f}s]")
    else:
        y=decode(SRC)
        if y.size==0: sys.exit("No audio in source.")
        tempo,bf=librosa.beat.beat_track(y=y,sr=SR); beats=librosa.frames_to_time(bf,sr=SR)
        NSa=int(np.floor(min(DUR,y.size/SR)))
        hop=512; rms=librosa.feature.rms(y=y,hop_length=hop)[0]
        rt=librosa.frames_to_time(np.arange(len(rms)),sr=SR,hop_length=hop)
        aud_sec=np.array([rms[(rt>=s)&(rt<s+1)].mean() if ((rt>=s)&(rt<s+1)).any() else 0 for s in range(NSa)])
        win=int(round(REEL))
        if win>=NSa: bs=0.0
        else:
            cs=np.concatenate([[0],np.cumsum(aud_sec)]); bs=float(np.argmax(cs[win:]-cs[:-win]))
        bs=max(0.0,min(bs,max(0.0,DUR-REEL)))
        bin_=[b for b in beats if bs<=b<=bs+REEL]
        if len(bin_)<4: bin_=list(beats[:max(4,int(REEL*float(np.atleast_1d(tempo)[0])/60))])
        grid_start,grid_end=float(bin_[0]),float(bin_[-1]); beats=np.array(bin_)
        audio_meta={"file":None,"start":round(grid_start,3),"end":round(grid_end,3)}
    tempo=float(np.atleast_1d(tempo)[0])
    np.savez(apath,tempo=tempo,beats=np.asarray(beats),gs=grid_start,ge=grid_end,
             meta=np.array(audio_meta,dtype=object),aud_sec=aud_sec)
print(f"  tempo: {tempo:.1f} BPM")

# beats within the grid; build cut boundaries (optionally length-jittered on-beat)
gb=[b for b in beats if grid_start-1e-6<=b<=grid_end+1e-6] or [grid_start,grid_end]
beat_dur=60.0/tempo
_bpc_env=os.environ.get("BEATS_PER_CUT","").strip()
bpc=int(_bpc_env) if _bpc_env else max(1,int(round(CUTLEN/beat_dur)))
JIT=float(os.environ.get("LENGTH_JITTER") or 0)   # 0..1 chance a cut gets ±1 beat
if JIT>0 and len(gb)>bpc+1:
    bounds=[gb[0]]; i=0
    while i<len(gb)-1:
        step=bpc+(int(rng.choice([-1,1])) if rng.random()<JIT else 0)
        step=max(1,step); i=min(i+step,len(gb)-1); bounds.append(gb[i])
else:
    bounds=list(gb[::bpc])
if bounds[-1]<grid_end-1e-3: bounds.append(grid_end)
slots=[(bounds[i]-grid_start,bounds[i+1]-bounds[i]) for i in range(len(bounds)-1)]
slots=[(a,b) for a,b in slots if b>0.05]
nslots=len(slots)
print(f"  audio bed span: {grid_end-grid_start:.1f}s, cuts: {nslots} ({bpc} beat/cut{', jittered' if JIT>0 else ''})")

# ---- motion + frame signatures across the whole video (cached on source) ---
mkey=ckey("mot2",os.path.abspath(SRC),mtime(SRC),AFPS,int(DUR))
mpath=os.path.join(CACHE,mkey+".npz")
if os.path.exists(mpath):
    z=np.load(mpath); mot=z["mot"]; sig=z["sig"]; NS=int(z["ns"]); print("  motion: cached")
else:
    NS=int(np.floor(DUR))
    raw=subprocess.run(["ffmpeg","-v","error","-i",SRC,"-vf",f"fps={AFPS},scale={W}:{H},format=gray",
        "-f","rawvideo","-pix_fmt","gray","-"],capture_output=True).stdout
    buf=np.frombuffer(raw,dtype=np.uint8); nfr=buf.size//(W*H)
    fr=buf[:nfr*W*H].reshape(nfr,H,W).astype(np.float32)
    d=np.abs(np.diff(fr.reshape(nfr,-1),axis=0)).mean(axis=1) if nfr>1 else np.zeros(1)
    ft=np.arange(len(d))/AFPS
    mot=np.array([d[(ft>=s)&(ft<s+1)].mean() if ((ft>=s)&(ft<s+1)).any() else 0 for s in range(NS)])
    sig=np.zeros((NS,64))
    for s in range(NS):
        idx=int(min(s*AFPS,nfr-1)); f=fr[idx][:88,:160].reshape(8,11,8,20).mean(axis=(1,3))
        sig[s]=f.flatten()
    np.savez(mpath,mot=mot,sig=sig,ns=NS); print(f"  motion sampled: {nfr} frames @ {AFPS}fps")
if (not AUDIO) and aud_sec.size>1:
    ae=np.interp(np.arange(NS),np.arange(len(aud_sec)),aud_sec)
else:
    ae=np.zeros(NS)
exc=0.6*norm(mot)+0.4*norm(ae)

# ---- parse picks.txt -------------------------------------------------------
# frame field: "0.6" static crop center, or "0.3>0.7" pan from left->right.
PAN=float(os.environ.get("PAN") or 0)
def clip01(v): return max(0.0,min(1.0,v))
picks=[]
if os.path.exists(PICKS):
    for ln in open(PICKS):
        ln=ln.split("#")[0].strip()
        if not ln: continue
        parts=ln.split()
        t=ts2s(parts[0]); manual=len(parts)>1
        if len(parts)>1 and ">" in parts[1]:
            a,b=parts[1].split(">"); cx0,cx1,is_pan=clip01(float(a)),clip01(float(b)),True
        elif len(parts)>1:
            cx0=cx1=clip01(float(parts[1])); is_pan=False
        else:
            cx0=cx1=0.5; is_pan=False
        picks.append((t,cx0,cx1,is_pan,manual))
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
    for slot_i,sec in order: assigned[slot_i]=(float(sec),0.5,0.5,False,False)

# ---- optional auto-center: detect the main subject per shot (OpenCV) -------
AUTOCENTER=os.environ.get("AUTOCENTER")=="1"
ac_cache={}
if AUTOCENTER:
    try:
        import cv2
        _face=cv2.CascadeClassifier(cv2.data.haarcascades+"haarcascade_frontalface_default.xml")
        _hog=cv2.HOGDescriptor(); _hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    except Exception as e:
        print(f"  auto-center: OpenCV unavailable ({e}) — using center crops"); AUTOCENTER=False
if AUTOCENTER:
    acpath=os.path.join(CACHE,"autocenter_"+ckey(os.path.abspath(SRC),mtime(SRC))+".json")
    if os.path.exists(acpath):
        try: ac_cache=json.load(open(acpath))
        except Exception: ac_cache={}
    _tmp=os.path.join(CACHE,"_ac.png")
    def detect_cx(tsec):
        key=f"{tsec:.2f}"
        if key in ac_cache: return ac_cache[key]
        cx=None
        try:
            subprocess.run(["ffmpeg","-v","error","-y","-ss",str(tsec),"-i",SRC,"-frames:v","1",
                "-vf","scale=640:-2",_tmp],check=False)
            img=cv2.imread(_tmp)
            if img is not None:
                w=img.shape[1]; gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
                boxes=_face.detectMultiScale(gray,1.1,5,minSize=(40,40))
                if len(boxes)==0:
                    rects,_=_hog.detectMultiScale(img,winStride=(8,8))
                    boxes=rects
                if len(boxes):
                    bx,by,bw,bh=max(boxes,key=lambda r:r[2]*r[3])
                    cx=round((bx+bw/2)/w,3)
        except Exception: cx=None
        ac_cache[key]=cx; return cx
    print("  auto-center: detecting subjects…")

cuts=[]; ac_hits=0
for idx,((s0,slen),a) in enumerate(zip(slots,assigned)):
    sec,cx0,cx1,is_pan,manual=a
    if AUTOCENTER and not manual and not is_pan:   # detection fills only unset shots
        dcx=detect_cx(float(min(sec,max(0.0,DUR-slen))))
        if dcx is not None: cx0=cx1=clip01(dcx); ac_hits+=1
    if PAN>0 and not is_pan:                 # gentle auto-drift around the center
        d=1 if idx%2==0 else -1
        cx0,cx1=clip01(cx0 - d*PAN/2), clip01(cx1 + d*PAN/2)
    s=float(min(sec,max(0.0,DUR-slen)))
    cuts.append({"src_start":round(s,3),"dur":round(slen,3),"slow":1.0,
                 "crop_x0":round(cx0,3),"crop_x1":round(cx1,3),
                 "excite":round(float(exc[int(min(sec,NS-1))]),3)})
if AUTOCENTER:
    try: json.dump(ac_cache,open(acpath,"w"))
    except Exception: pass
    print(f"  auto-center: framed {ac_hits}/{len(cuts)} shots on a detected subject")

# ---- slow-mo: mark N evenly-spaced shots to play slowed (beat-preserving) ---
SLOWMO=int(float(os.environ.get("SLOWMO") or 0))
SLOWMO_RATE=float(os.environ.get("SLOWMO_RATE") or 2)
if SLOWMO>0 and len(cuts)>0:
    n=min(SLOWMO,len(cuts))
    idxs={int(round((k+0.5)*len(cuts)/n)) for k in range(n)}
    for j in idxs:
        j=min(j,len(cuts)-1); cuts[j]["slow"]=SLOWMO_RATE
    print(f"  slow-mo: {len(idxs)} shot(s) at {SLOWMO_RATE:g}x")

OVL=os.environ.get("OVERLAY","")
overlay_meta=None
if OVL:
    overlay_meta={"file":os.path.abspath(OVL),
                  "start":float(os.environ.get("OVERLAY_START") or 2),
                  "fade":float(os.environ.get("OVERLAY_FADE") or 0.2),
                  "end":(float(os.environ["OVERLAY_END"]) if os.environ.get("OVERLAY_END") else None),
                  "blend":(os.environ.get("OVERLAY_BLEND") or "").strip().lower()}
    print(f"  overlay: {OVL} @ {overlay_meta['start']}s, {overlay_meta['fade']*1000:.0f}ms fade-in"
          + (f", blend={overlay_meta['blend']}" if overlay_meta['blend'] else ""))

LOOK=(os.environ.get("LOOK") or "").strip().lower()
FILTER_RAW=(os.environ.get("FILTER") or "").strip()
LOOK_SCOPE=(os.environ.get("LOOK_SCOPE") or "footage").strip().lower()
if LOOK_SCOPE not in ("footage","all"): LOOK_SCOPE="footage"
if LOOK or FILTER_RAW: print(f"  look: {FILTER_RAW or LOOK} (scope: {LOOK_SCOPE})")
if PAN>0: print(f"  auto-pan: ±{PAN/2:.2f} around each shot")

FPS=int(float(os.environ.get("FPS") or 30))
SHAKE=float(os.environ.get("SHAKE") or 0)
LOOK_INT=float(os.environ.get("LOOK_INTENSITY") or 1)
if FPS!=30: print(f"  frame rate: {FPS} fps")
if SHAKE>0: print(f"  camera shake: {SHAKE:g}px")
plan={"source":os.path.abspath(SRC),"audio":audio_meta,"overlay":overlay_meta,
      "look":(LOOK or None),"filter":(FILTER_RAW or None),"look_scope":LOOK_SCOPE,
      "look_intensity":LOOK_INT,"fps":FPS,"shake":SHAKE,"tempo":round(tempo,1),
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
FPS=int(p.get("fps",30)); SH=float(p.get("shake",0))
a_idx=0
if a["file"]: a_idx=idx; idx+=1
o_idx=None
if ov: o_idx=idx; idx+=1
for i,c in enumerate(cuts):
    dur=max(0.05,c["dur"]); slow=float(c.get("slow",1))
    s=c["src_start"]; e=s+dur/slow                 # slow-mo: grab less source, stretch to fill slot
    c0=c.get("crop_x0", c.get("crop_x",0.5)); c1=c.get("crop_x1", c0)
    chain=f"[0:v]trim=start={s}:end={e},setpts={slow:g}*(PTS-STARTPTS)"
    if SH>0:
        # scale with headroom, then crop 1080x1920 with a pan + handheld shake
        ph=i*1.7
        sy=f"{SH:g}+{SH:g}*(0.6*sin(2*PI*6.5*t+{ph:.2f})+0.4*sin(2*PI*3.1*t))"
        sx=f"{0.5*SH:g}*sin(2*PI*4.7*t+{ph:.2f})"
        xexpr=f"(iw-{1080})*({c0}+{(c1-c0):.5f}*t/{dur})+{sx}"
        chain+=(f",scale={1080+2*int(SH)}:{1920+2*int(SH)}:force_original_aspect_ratio=increase,"
                f"crop=1080:1920:{xexpr}:{sy},setsar=1[v{i}];")
    else:
        xexpr=f"(iw-1080)*({c0}+{(c1-c0):.5f}*t/{dur})"
        chain+=(",scale=1080:1920:force_original_aspect_ratio=increase,"
                f"crop=1080:1920:{xexpr}:0,setsar=1[v{i}];")
    parts.append(chain); labels+=f"[v{i}]"
parts.append(f"{labels}concat=n={len(cuts)}:v=1:a=0[vc];")
parts.append(f"[vc]fps={FPS},format=yuv420p[vbase0];")
# creative look / filter, applied to the footage (before any overlay).
# LOOKS are functions of intensity k so LOOK_INTENSITY can push them harder.
k=float(p.get("look_intensity",1))
def _looks(k):
    ci=lambda base,amt:round(base+amt*k,3)   # scale an effect by intensity
    ni=lambda amt:int(round(amt*k))
    return {
      "bw":"hue=s=0",
      "punch":f"eq=contrast={ci(1,0.12)}:saturation={ci(1,0.35)}:brightness={ci(0,0.02)}",
      "warm":f"colorbalance=rs={ci(0,0.06)}:gs={ci(0,0.02)}:bs={ci(0,-0.06)},eq=saturation={ci(1,0.12)}",
      "cool":f"colorbalance=rs={ci(0,-0.06)}:bs={ci(0,0.08)}",
      "vignette":f"vignette=PI/{max(3.0,5-1.2*k):.2f}",
      "dramatic":f"eq=contrast={ci(1,0.25)}:saturation={max(0.2,1-0.15*k)},vignette=PI/{max(3.0,5-1.0*k):.2f}",
      "film":f"curves=preset=medium_contrast,eq=saturation={ci(1,0.05)},vignette=PI/5,noise=alls={ni(7)}:allf=t",
      # beefier VHS: chroma bleed, tape noise, luma smear, softening, vignette
      "vhs":(f"eq=saturation={ci(1,0.45)}:contrast={ci(1,0.08)}:brightness={ci(0,0.02)},"
             f"rgbashift=rh={ni(7)}:bh={ni(-7)}:bv={ni(4)}:gh={ni(-3)},"
             f"gblur=sigma={ci(0.3,0.5)},noise=alls={ni(18)}:allf=t+u,"
             f"curves=b='0/0.05 1/0.92':r='0/0.03 1/0.98',vignette=PI/{max(3.5,5-0.8*k):.2f}"),
    }
LOOKS=_looks(k)
look_chain=p.get("filter") or (LOOKS.get(p.get("look",""),"") if p.get("look") else "")
scope=(p.get("look_scope") or "footage")   # "footage" (before overlay) or "all" (whole composite)
if look_chain and scope=="footage":
    parts.append(f"[vbase0]{look_chain},format=yuv420p[vbase];")
else:
    parts.append("[vbase0]null[vbase];")
vlabel="vbase"
if ov:
    end=ov.get("end"); blend=(ov.get("blend") or "")
    f=(f"[{o_idx}:v]format=rgba,scale=1080:1920:force_original_aspect_ratio=decrease,"
       f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black@0.0,"
       f"fade=t=in:st={ov['start']}:d={ov['fade']}:alpha=1")
    if end: f+=f",fade=t=out:st={end}:d={ov['fade']}:alpha=1"
    f+="[ov];"
    parts.append(f)
    if blend and blend not in ("none","normal"):
        # blend mode: bake the (faded) overlay over black so transparent areas
        # are identity for lighten-family modes (exclusion/screen/difference/...),
        # then blend the whole frame. shortest=1 so looped inputs terminate.
        dur=p["reel_seconds"]+1
        # bake overlay over black, then blend in RGB (gbrp) so chroma is preserved
        # where the overlay is transparent; YUV blending would grey the whole frame.
        parts.append(f"color=c=black:s=1080x1920:r={FPS}:d={dur},format=rgba[obg];")
        parts.append("[obg][ov]overlay=0:0:format=auto:shortest=1,format=gbrp[ovflat];")
        parts.append("[vbase]format=gbrp[vrgb];")
        parts.append(f"[vrgb][ovflat]blend=all_mode={blend}:shortest=1,format=yuv420p[vout];")
    else:
        # plain alpha compositing; shortest=1 so the looped overlay ends with video
        parts.append("[vbase][ov]overlay=0:0:format=auto:shortest=1,format=yuv420p[vout];")
    vlabel="vout"
# scope=="all": grade the whole composite (overlay included), after compositing
if look_chain and scope=="all":
    parts.append(f"[{vlabel}]{look_chain},format=yuv420p[vgraded];")
    vlabel="vgraded"
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
  local d sz ofps
  d="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/reel.mp4")"
  sz="$(du -h "$OUT_DIR/reel.mp4" | awk '{print $1}')"
  ofps="$(python3 -c "import json;print(json.load(open('$PLAN')).get('fps',30))")"
  ok "Done."
  printf "\n%sFinal Reel:%s %s/reel.mp4\n  duration : %.2f s\n  size     : %s\n  format   : 1080x1920, H.264 high, AAC 128k, %sfps, %s cuts\n" \
    "$BOLD" "$RST" "$OUT_DIR" "$d" "$sz" "$ofps" "$ncuts"
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
