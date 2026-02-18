import { useMemo, useState } from "react";
import API from "../api/axios";
import "../css/InjuryRadar.css";
import BodyMapPicker from "../components/BodyMapPicker";

const BODY_PARTS = [
  { key: "shoulder", label: "Shoulder" },
  { key: "knee", label: "Knee" },
  { key: "lowerBack", label: "Lower Back" },
  { key: "ankle", label: "Ankle" },
  { key: "hip", label: "Hip" },
  { key: "elbow", label: "Elbow" },
];

const SESSION_TYPES = [
  "Strength Upper",
  "Strength Lower",
  "Running",
  "Cycling",
];

const INTENSITY = ["Easy", "Normal", "Hard"];

function next7Days() {
  const days = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    days.push(x);
  }
  return days;
}

export default function InjuryRadar() {
  const [bodyPart, setBodyPart] = useState("shoulder");
  const [painIntensity, setPainIntensity] = useState(2);

  const days = useMemo(() => next7Days(), []);

  const [planned, setPlanned] = useState(
    days.map((d) => ({
      date: d.toISOString(),
      sessionType: "Strength Upper",
      intensityLevel: "Normal",
    }))
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const updatePlanned = (idx, patch) => {
    setPlanned((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const runPrediction = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await API.post("/injury-radar/predict", {
        bodyPart,
        painIntensity,
        plannedSessions: planned.map((p) => ({
          date: p.date,
          sessionType: p.sessionType,
          intensityLevel: p.intensityLevel,
        })),
      });
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="radar">
      <h2>Injury Radar</h2>
      <p className="meta">
        Predict injury probability for a body part for the next 7 days using planned training + ACWR + recovery + pain.
      </p>

      <div className="radar-grid">
        <div className="card">
          <h3>Inputs</h3>

          <label>Body Part</label>
          <BodyMapPicker value={bodyPart} onChange={setBodyPart} />
          

          <label>Pain (1–10)</label>
          <input
            type="range"
            min="0"
            max="10"
            value={painIntensity}
            onChange={(e) => setPainIntensity(Number(e.target.value))}
          />
          <div className="pill">Pain: {painIntensity}/10</div>

          <button className="primary" onClick={runPrediction} disabled={loading}>
            {loading ? "Predicting..." : "Predict Risk"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="card">
          <h3>Planned Sessions (Next 7 Days)</h3>
          <div className="plan-list">
            {planned.map((p, idx) => (
              <div key={p.date} className="plan-row">
                <div className="date">
                  {new Date(p.date).toLocaleDateString()}
                </div>

                <select
                  value={p.sessionType}
                  onChange={(e) => updatePlanned(idx, { sessionType: e.target.value })}
                >
                  {SESSION_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={p.intensityLevel}
                  onChange={(e) => updatePlanned(idx, { intensityLevel: e.target.value })}
                >
                  {INTENSITY.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Result</h3>

          {!result ? (
            <p className="meta">Run prediction to see probability and breakdown.</p>
          ) : (
            <>
              <div className={`big ${result.category.toLowerCase()}`}>
                {result.probability}% — {result.category}
              </div>

              <div className="breakdown">
                <h4>Global</h4>
                <p>AL (7d): <b>{result.globals.AL}</b></p>
                <p>CL (28d baseline): <b>{result.globals.CL}</b></p>
                <p>Planned Load: <b>{result.globals.plannedLoad}</b></p>
                <p>Predicted ACWR: <b>{result.globals.acwrPredicted}</b></p>

                <h4>Local ({result.bodyPart})</h4>
                <p>Local Load: <b>{result.locals.localLoad}</b></p>
                <p>Stress Ratio: <b>{result.locals.stressRatio}</b></p>

                <h4>Score</h4>
                <p>Risk Score: <b>{result.score}</b></p>
              </div>

              <details className="details">
                <summary>Show session breakdown</summary>
                <pre>{JSON.stringify(result.locals.localBreakdown, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
