import os
import uuid
import math
import tempfile
from typing import Dict, Any, Optional

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

import mediapipe as mp

app = FastAPI(title="InjuryShield Posture AI", version="1.0")

mp_pose = mp.solutions.pose


# ------------------------
# Geometry helpers
# ------------------------
def clamp(x, a, b):
    return max(a, min(b, x))


def angle_abc(A, B, C) -> Optional[float]:
    """Angle at B formed by A-B-C in degrees."""
    if A is None or B is None or C is None:
        return None
    BA = np.array([A[0] - B[0], A[1] - B[1]], dtype=np.float32)
    BC = np.array([C[0] - B[0], C[1] - B[1]], dtype=np.float32)
    magBA = np.linalg.norm(BA)
    magBC = np.linalg.norm(BC)
    if magBA < 1e-6 or magBC < 1e-6:
        return None
    cosv = float(np.dot(BA, BC) / (magBA * magBC))
    cosv = clamp(cosv, -1.0, 1.0)
    return math.degrees(math.acos(cosv))


def ema(prev, nxt, alpha=0.25):
    if prev is None:
        return nxt
    if nxt is None:
        return prev
    return prev + alpha * (nxt - prev)


# ------------------------
# Landmark extraction
# ------------------------
def get_landmarks_xy(results, w, h, min_vis=0.55) -> Dict[str, Optional[tuple]]:
    """
    Return dict of required landmarks in pixel coords if visible, else None.
    """
    lm = results.pose_landmarks
    if lm is None:
        return {}

    L = lm.landmark

    def pick(idx):
        if idx is None:
            return None
        if L[idx].visibility < min_vis:
            return None
        return (L[idx].x * w, L[idx].y * h)

    # MediaPipe Pose landmark indices:
    # left_shoulder=11, right_shoulder=12
    # left_hip=23, right_hip=24
    # left_knee=25, right_knee=26
    # left_ankle=27, right_ankle=28
    return {
        "l_shoulder": pick(11),
        "r_shoulder": pick(12),
        "l_hip": pick(23),
        "r_hip": pick(24),
        "l_knee": pick(25),
        "r_knee": pick(26),
        "l_ankle": pick(27),
        "r_ankle": pick(28),
    }


# ------------------------
# Metrics + heuristics
# ------------------------
def compute_metrics(pts: Dict[str, Optional[tuple]]) -> Optional[Dict[str, float]]:
    req = ["l_shoulder", "r_shoulder", "l_hip", "r_hip", "l_knee", "r_knee", "l_ankle", "r_ankle"]
    if any(pts.get(k) is None for k in req):
        return None

    l_hip, r_hip = pts["l_hip"], pts["r_hip"]
    l_knee, r_knee = pts["l_knee"], pts["r_knee"]
    l_ank, r_ank = pts["l_ankle"], pts["r_ankle"]
    l_sh, r_sh = pts["l_shoulder"], pts["r_shoulder"]

    hip_mid = ((l_hip[0] + r_hip[0]) / 2.0, (l_hip[1] + r_hip[1]) / 2.0)
    sh_mid = ((l_sh[0] + r_sh[0]) / 2.0, (l_sh[1] + r_sh[1]) / 2.0)

    # Knee angles
    l_knee_angle = angle_abc(l_hip, l_knee, l_ank)
    r_knee_angle = angle_abc(r_hip, r_knee, r_ank)
    if l_knee_angle is None or r_knee_angle is None:
        return None

    # Normalize by hip width for scale invariance
    hip_w = max(1.0, abs(l_hip[0] - r_hip[0]))

    # Valgus proxy:
    # Left leg: knee drifting toward midline => knee x > ankle x (positive)
    # Right leg: knee drifting toward midline => knee x < ankle x (ankle - knee positive)
    l_valgus = (l_knee[0] - l_ank[0]) / hip_w
    r_valgus = (r_ank[0] - r_knee[0]) / hip_w
    valgus_diff = abs(l_valgus - r_valgus)

    # Trunk lean proxy: angle from vertical of vector (hip_mid -> shoulder_mid)
    vx = sh_mid[0] - hip_mid[0]
    vy = sh_mid[1] - hip_mid[1]
    trunk_lean_deg = abs(math.degrees(math.atan2(vx, -vy)))  # 0 upright, higher leaning

    knee_angle_diff = abs(l_knee_angle - r_knee_angle)
    avg_knee_angle = (l_knee_angle + r_knee_angle) / 2.0

    return {
        "leftKneeAngle": float(l_knee_angle),
        "rightKneeAngle": float(r_knee_angle),
        "avgKneeAngle": float(avg_knee_angle),
        "leftValgus": float(l_valgus),
        "rightValgus": float(r_valgus),
        "valgusDiff": float(valgus_diff),
        "trunkLeanDeg": float(trunk_lean_deg),
        "kneeAngleDiff": float(knee_angle_diff),
    }


def classify_risk(m: Dict[str, float]) -> Dict[str, Any]:
    """
    Demo-friendly thresholds. Tune after testing with real clips.
    """
    valgus_max = max(m["leftValgus"], m["rightValgus"])
    trunk = m["trunkLeanDeg"]
    asym = m["kneeAngleDiff"]

    flags = []

    # Knee valgus
    if valgus_max > 0.16:
        flags.append({"key": "knee_valgus", "level": "HIGH", "note": "Knee collapse inward detected (high)."})
    elif valgus_max > 0.10:
        flags.append({"key": "knee_valgus", "level": "MOD", "note": "Mild–moderate knee valgus detected."})

    # Back rounding / trunk collapse proxy
    if trunk > 28:
        flags.append({"key": "back_rounding", "level": "HIGH", "note": "Excess forward trunk lean/rounding proxy detected."})
    elif trunk > 18:
        flags.append({"key": "back_rounding", "level": "MOD", "note": "Moderate forward trunk lean/rounding proxy detected."})

    # Asymmetry
    if asym > 18 or m["valgusDiff"] > 0.08:
        flags.append({"key": "asymmetry", "level": "HIGH", "note": "Left–right imbalance detected (high)."})
    elif asym > 12 or m["valgusDiff"] > 0.05:
        flags.append({"key": "asymmetry", "level": "MOD", "note": "Left–right imbalance detected (moderate)."})

    score = 10
    for f in flags:
        score += 30 if f["level"] == "HIGH" else 18
    score = int(clamp(score, 0, 100))

    zone = "HIGH" if score >= 70 else "MODERATE" if score >= 40 else "LOW"
    return {"score": score, "zone": zone, "flags": flags}


# ------------------------
# Main analysis pipeline
# ------------------------
def analyze_video(path: str, sample_points: int = 60) -> Dict[str, Any]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise ValueError("Could not open video")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    # analyze up to N frames uniformly (fast for hackathon)
    max_frames = 600  # ~20s @30fps
    analyze_count = min(total if total > 0 else max_frames, max_frames)

    # pick indices uniformly
    if total > 0:
        idxs = np.linspace(0, total - 1, analyze_count).astype(int)
    else:
        idxs = np.arange(analyze_count)

    # smoothing buffer
    smooth = {
        "trunkLeanDeg": None,
        "leftValgus": None,
        "rightValgus": None,
        "leftKneeAngle": None,
        "rightKneeAngle": None,
        "kneeAngleDiff": None,
        "valgusDiff": None,
        "avgKneeAngle": None,
    }

    series = []
    valid_frames = 0

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:

        for frame_idx in idxs:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_idx))
            ok, frame = cap.read()
            if not ok or frame is None:
                continue

            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            pts = get_landmarks_xy(results, w, h, min_vis=0.55)
            m = compute_metrics(pts)
            if not m:
                continue

            # smooth with EMA
            for k in smooth.keys():
                smooth[k] = ema(smooth[k], m[k], 0.25)

            sm = {**m, **smooth}
            valid_frames += 1

            # time series for graphs
            series.append(
                {
                    "t": float(frame_idx / fps),
                    "acq": {
                        "trunkLeanDeg": round(sm["trunkLeanDeg"], 2),
                        "leftValgus": round(sm["leftValgus"], 3),
                        "rightValgus": round(sm["rightValgus"], 3),
                        "kneeAngleDiff": round(sm["kneeAngleDiff"], 2),
                    },
                }
            )

    cap.release()

    if valid_frames < 10:
        return {
            "ok": False,
            "message": "Not enough confident pose frames. Try better lighting / stable camera / full body visible.",
        }

    # Aggregate summary metrics
    trunk_vals = [s["acq"]["trunkLeanDeg"] for s in series]
    lval_vals = [s["acq"]["leftValgus"] for s in series]
    rval_vals = [s["acq"]["rightValgus"] for s in series]
    asym_vals = [s["acq"]["kneeAngleDiff"] for s in series]

    summary_metrics = {
        "trunkLeanDeg_mean": float(np.mean(trunk_vals)),
        "trunkLeanDeg_p95": float(np.percentile(trunk_vals, 95)),
        "leftValgus_p95": float(np.percentile(lval_vals, 95)),
        "rightValgus_p95": float(np.percentile(rval_vals, 95)),
        "kneeAngleDiff_p95": float(np.percentile(asym_vals, 95)),
        "framesAnalyzed": int(valid_frames),
        "fps": float(fps),
    }

    # representative metrics for risk scoring (use p95 for robustness)
    representative = {
        "leftValgus": summary_metrics["leftValgus_p95"],
        "rightValgus": summary_metrics["rightValgus_p95"],
        "valgusDiff": abs(summary_metrics["leftValgus_p95"] - summary_metrics["rightValgus_p95"]),
        "trunkLeanDeg": summary_metrics["trunkLeanDeg_p95"],
        "kneeAngleDiff": summary_metrics["kneeAngleDiff_p95"],
        # not used by scoring currently; placeholders
        "leftKneeAngle": 0.0,
        "rightKneeAngle": 0.0,
        "avgKneeAngle": 0.0,
    }

    risk = classify_risk(representative)

    # Downsample series for response size
    if len(series) > sample_points:
        pick = np.linspace(0, len(series) - 1, sample_points).astype(int)
        series_small = [series[i] for i in pick]
    else:
        series_small = series

    return {
        "ok": True,
        "risk": risk,
        "summary": summary_metrics,
        "series": series_small,
        "note": "Heuristic biomechanical flags for coaching insights (not medical diagnosis).",
    }


# ------------------------
# API endpoints
# ------------------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
        raise HTTPException(status_code=400, detail="Unsupported video format")

    with tempfile.TemporaryDirectory() as td:
        vid_path = os.path.join(td, f"{uuid.uuid4().hex}{ext}")
        with open(vid_path, "wb") as f:
            f.write(await file.read())

        try:
            result = analyze_video(vid_path, sample_points=60)
            return JSONResponse(result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
def health():
    return {"ok": True, "service": "posture-ai"}