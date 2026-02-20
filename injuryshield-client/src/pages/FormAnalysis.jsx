import { useEffect, useMemo, useRef, useState } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "../css/FormAnalysis.css";

// ---------- Geometry helpers ----------
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function angleABC(A, B, C) {
  // angle at B formed by A-B-C, returns degrees
  if (!A || !B || !C) return null;
  const BAx = A.x - B.x,
    BAy = A.y - B.y;
  const BCx = C.x - B.x,
    BCy = C.y - B.y;

  const dot = BAx * BCx + BAy * BCy;
  const magBA = Math.sqrt(BAx * BAx + BAy * BAy);
  const magBC = Math.sqrt(BCx * BCx + BCy * BCy);
  if (magBA === 0 || magBC === 0) return null;

  const cos = clamp(dot / (magBA * magBC), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

function getKeypointMap(keypoints) {
  const m = {};
  for (const kp of keypoints || []) {
    if (kp.name) m[kp.name] = kp;
  }
  return m;
}

// Simple smoothing (EMA)
function ema(prev, next, alpha = 0.25) {
  if (prev == null) return next;
  if (next == null) return prev;
  return prev + alpha * (next - prev);
}

// ---------- Drawing ----------
const EDGES = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

function drawPose(ctx, keypoints, scoreThreshold = 0.35) {
  const kps = getKeypointMap(keypoints);

  // points
  for (const kp of keypoints || []) {
    if ((kp.score ?? 0) < scoreThreshold) continue;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  // edges
  ctx.lineWidth = 2;
  for (const [a, b] of EDGES) {
    const A = kps[a],
      B = kps[b];
    if (!A || !B) continue;
    if ((A.score ?? 0) < scoreThreshold || (B.score ?? 0) < scoreThreshold) continue;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }
}

// ---------- Heuristics (demo-friendly, not medical) ----------
function computeMetrics(keypoints, scoreThreshold = 0.35) {
  const kp = getKeypointMap(keypoints);

  // Require enough confidence for legs/hips
  const required = [
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
    "left_shoulder",
    "right_shoulder",
  ];

  for (const r of required) {
    if (!kp[r] || (kp[r].score ?? 0) < scoreThreshold) return null;
  }

  // Knee angles (hip-knee-ankle)
  const leftKneeAngle = angleABC(kp.left_hip, kp.left_knee, kp.left_ankle);
  const rightKneeAngle = angleABC(kp.right_hip, kp.right_knee, kp.right_ankle);

  // Midpoints
  const pelvisMid = {
    x: (kp.left_hip.x + kp.right_hip.x) / 2,
    y: (kp.left_hip.y + kp.right_hip.y) / 2,
  };

  const shoulderMid = {
    x: (kp.left_shoulder.x + kp.right_shoulder.x) / 2,
    y: (kp.left_shoulder.y + kp.right_shoulder.y) / 2,
  };

  // Valgus proxy (inward drift)
  const leftInsideDeviation = kp.left_knee.x - kp.left_ankle.x; // + means knee right of ankle
  const rightInsideDeviation = kp.right_ankle.x - kp.right_knee.x; // + means knee left of ankle

  const hipWidth = Math.max(1, Math.abs(kp.left_hip.x - kp.right_hip.x));
  const leftValgus = leftInsideDeviation / hipWidth;
  const rightValgus = rightInsideDeviation / hipWidth;

  // Trunk lean proxy
  const vx = shoulderMid.x - pelvisMid.x;
  const vy = shoulderMid.y - pelvisMid.y;

  const trunkLeanDeg = Math.abs((Math.atan2(vx, -vy) * 180) / Math.PI);

  // Asymmetry
  const kneeAngleDiff =
    leftKneeAngle != null && rightKneeAngle != null ? Math.abs(leftKneeAngle - rightKneeAngle) : null;

  const valgusDiff = Math.abs(leftValgus - rightValgus);

  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  return {
    leftKneeAngle,
    rightKneeAngle,
    avgKneeAngle,
    leftValgus,
    rightValgus,
    valgusDiff,
    trunkLeanDeg,
    kneeAngleDiff,
  };
}

function classifyRisk(m) {
  const valgusMax = Math.max(m.leftValgus, m.rightValgus);
  const trunk = m.trunkLeanDeg;
  const asym = m.kneeAngleDiff ?? 0;

  const flags = [];

  // Knee valgus thresholds
  if (valgusMax > 0.16)
    flags.push({ key: "knee_valgus", level: "HIGH", note: "Knee collapse inward detected (high)." });
  else if (valgusMax > 0.1)
    flags.push({ key: "knee_valgus", level: "MOD", note: "Mild–moderate knee valgus detected." });

  // Trunk lean thresholds
  if (trunk > 28)
    flags.push({ key: "back_rounding", level: "HIGH", note: "Excess forward trunk lean/rounding proxy detected." });
  else if (trunk > 18)
    flags.push({ key: "back_rounding", level: "MOD", note: "Moderate forward trunk lean/rounding proxy detected." });

  // Asymmetry thresholds
  if (asym > 18 || m.valgusDiff > 0.08)
    flags.push({ key: "asymmetry", level: "HIGH", note: "Left–right imbalance detected (high)." });
  else if (asym > 12 || m.valgusDiff > 0.05)
    flags.push({ key: "asymmetry", level: "MOD", note: "Left–right imbalance detected (moderate)." });

  // Overall score
  let score = 10;
  for (const f of flags) score += f.level === "HIGH" ? 30 : 18;
  score = clamp(score, 0, 100);

  const zone = score >= 70 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";
  return { zone, score, flags };
}

export default function FormAnalysis() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [detector, setDetector] = useState(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);

  const smoothRef = useRef({
    trunkLeanDeg: null,
    leftValgus: null,
    rightValgus: null,
    leftKneeAngle: null,
    rightKneeAngle: null,
    kneeAngleDiff: null,
    valgusDiff: null,
    avgKneeAngle: null,
  });

  const [fileName, setFileName] = useState("");

  const statusText = useMemo(() => {
    if (!ready) return "Loading pose model…";
    if (!fileName) return "Upload a squat/running video to analyze.";
    if (!playing) return "Press Play to start analysis.";
    return "Analyzing…";
  }, [ready, fileName, playing]);

  // Init model
  useEffect(() => {
    (async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      const model = posedetection.SupportedModels.MoveNet;
      const d = await posedetection.createDetector(model, {
        modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });

      setDetector(d);
      setReady(true);
    })();
  }, []);

  // Main loop
  useEffect(() => {
    if (!detector) return;

    let raf = null;
    let cancelled = false;

    const loop = async () => {
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, 0, 0, w, h);

        if (!video.paused && !video.ended) {
          const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
          const pose = poses?.[0];

          if (pose?.keypoints?.length) {
            ctx.strokeStyle = "rgba(34,197,94,0.9)";
            ctx.fillStyle = "rgba(34,197,94,0.9)";

            drawPose(ctx, pose.keypoints, 0.35);

            const m = computeMetrics(pose.keypoints, 0.35);
            if (m) {
              const s = smoothRef.current;
              for (const k of Object.keys(s)) {
                s[k] = ema(s[k], m[k], 0.25);
              }
              const sm = { ...m, ...s };

              setMetrics(sm);
              const r = classifyRisk(sm);
              setRisk(r);

              // Draw overlay text
              const label = `Risk: ${r.zone} (${r.score})`;
              ctx.fillStyle =
                r.zone === "HIGH"
                  ? "rgba(239,68,68,0.95)"
                  : r.zone === "MODERATE"
                    ? "rgba(245,158,11,0.95)"
                    : "rgba(34,197,94,0.95)";
              ctx.font = "bold 18px Arial";
              ctx.fillText(label, 14, 28);

              ctx.fillStyle = "rgba(255,255,255,0.9)";
              ctx.font = "14px Arial";
              ctx.fillText(`Trunk lean: ${sm.trunkLeanDeg?.toFixed(1)}°`, 14, 50);
              ctx.fillText(`Valgus L/R: ${sm.leftValgus?.toFixed(2)} / ${sm.rightValgus?.toFixed(2)}`, 14, 70);
              ctx.fillText(
                `Knee angle L/R: ${sm.leftKneeAngle?.toFixed(0)}° / ${sm.rightKneeAngle?.toFixed(0)}°`,
                14,
                90
              );
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [detector]);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMetrics(null);
    setRisk(null);

    const url = URL.createObjectURL(file);
    const v = videoRef.current;
    if (v) {
      v.src = url;
      v.load();
      setPlaying(false);
    }
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused || v.ended) {
      await v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="fa-wrap">
      <div className="fa-header">
        <div>
          <h2>AI Form Analysis</h2>
          <p className="fa-sub">
            Upload a squat or running video. We detect knee valgus, trunk collapse proxy, and asymmetry using TFJS Pose Detection.
          </p>
        </div>

        <div className="fa-actions">
          <label className="fa-upload">
            Upload Video
            <input type="file" accept="video/*" onChange={onUpload} />
          </label>
          <button className="fa-btn" onClick={togglePlay} disabled={!fileName || !ready}>
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="fa-grid">
        <div className="fa-stage">
          <div className="fa-stage-top">
            <div className={`fa-badge ${ready ? "ok" : ""}`}>{ready ? "Model Ready" : "Loading…"}</div>
            <div className="fa-status">{statusText}</div>
          </div>

          <div className="fa-canvas-wrap">
            <video
              ref={videoRef}
              className="fa-video"
              controls={false}
              playsInline
              onEnded={() => setPlaying(false)}
            />
            <canvas ref={canvasRef} className="fa-canvas" />
          </div>

          <div className="fa-hint">Tip: Use a 5–15s clip, side or front view. Better lighting = better landmarks.</div>
        </div>

        <div className="fa-panel">
          <div className="fa-card">
            <h3>Biomechanical Risk</h3>

            {!risk ? (
              <p className="fa-muted">No analysis yet. Upload and press Play.</p>
            ) : (
              <>
                <div className={`fa-risk ${risk.zone.toLowerCase()}`}>
                  <div className="fa-risk-title">{risk.zone} RISK</div>
                  <div className="fa-risk-score">{risk.score}/100</div>
                </div>

                <div className="fa-flags">
                  {risk.flags.length === 0 ? (
                    <div className="fa-flag ok">No major red flags detected in current frames.</div>
                  ) : (
                    risk.flags.map((f, i) => (
                      <div key={i} className={`fa-flag ${f.level === "HIGH" ? "high" : "mod"}`}>
                        <strong>{f.key.replace("_", " ").toUpperCase()}:</strong> {f.note}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="fa-card">
            <h3>Live Metrics</h3>
            {!metrics ? (
              <p className="fa-muted">Waiting for pose landmarks…</p>
            ) : (
              <div className="fa-metrics">
                <div className="fa-metric">
                  <span>Trunk lean</span>
                  <strong>{metrics.trunkLeanDeg?.toFixed(1)}°</strong>
                </div>
                <div className="fa-metric">
                  <span>Knee valgus (L)</span>
                  <strong>{metrics.leftValgus?.toFixed(2)}</strong>
                </div>
                <div className="fa-metric">
                  <span>Knee valgus (R)</span>
                  <strong>{metrics.rightValgus?.toFixed(2)}</strong>
                </div>
                <div className="fa-metric">
                  <span>Knee angle (L)</span>
                  <strong>{metrics.leftKneeAngle?.toFixed(0)}°</strong>
                </div>
                <div className="fa-metric">
                  <span>Knee angle (R)</span>
                  <strong>{metrics.rightKneeAngle?.toFixed(0)}°</strong>
                </div>
                <div className="fa-metric">
                  <span>Asymmetry (knee angle diff)</span>
                  <strong>{(metrics.kneeAngleDiff ?? 0).toFixed(1)}°</strong>
                </div>
              </div>
            )}
          </div>

          <div className="fa-card">
            <h3>Judge-friendly Notes</h3>
            <ul className="fa-notes">
              <li>Real-time pose inference runs in the browser (no upload to server needed).</li>
              <li>Angles + deviations computed per frame; smoothed with EMA for stable readings.</li>
              <li>Outputs explainable flags that can be saved to athlete history later.</li>
            </ul>
            <p className="fa-disclaimer">*Demo feature for coaching insights, not medical diagnosis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}