// src/pages/Dashboard.jsx
import RiskGauge from "../components/RiskGauge";
import "../css/Dashboard.css";
import { useInjury } from "../contexts/InjuryContext";
import AcwrTrendChart from "../components/AcwrTrendChart";
import LoadChart from "../components/LoadChart";
import AcwrEwmaChart from "../components/AcwrEwmaChart";

function Dashboard() {
  const { summary, acwrTrend, workoutTrend, refresh } = useInjury();

  // If API failed or not loaded yet
  if (!summary) {
    return <p style={{ padding: "40px" }}>Loading dashboard...</p>;
  }

  const { weeklyLoad = 0, acwrData, riskScore = 0, overtraining } = summary;

  const {
    acuteLoad = 0,
    chronicLoad = 0,
    acwr = 0,
    hasBaseline,
    baselineDays,
  } = acwrData || {};

  // Determine ACWR zone
  let acwrZone = "Safe Zone";
  let acwrColor = "#22c55e";

  // If you added the baseline fields in backend/utils, use them
  if (hasBaseline === false) {
    acwrZone = `Insufficient Baseline${baselineDays ? ` (${baselineDays}d)` : ""}`;
    acwrColor = "#60a5fa";
  } else if (acwr >= 1.5) {
    acwrZone = "High Risk Zone";
    acwrColor = "#ef4444";
  } else if (acwr >= 1.3) {
    acwrZone = "Caution Zone";
    acwrColor = "#f59e0b";
  } else if (acwr > 0 && acwr < 0.8) {
    acwrZone = "Undertraining Zone";
    acwrColor = "#60a5fa";
  }

  // Recommendation logic
  let suggestion = "You are training within an optimal workload range.";

  if (hasBaseline === false) {
    suggestion =
      "You don’t have enough training history yet. Log workouts for ~2 weeks to build a baseline for accurate ACWR & risk prediction.";
  } else if (overtraining?.isOvertraining) {
    suggestion =
      "Overtraining detected. Take a recovery day and reduce training intensity for the next session.";
  } else if (acwr >= 1.5) {
    suggestion =
      "ACWR above 1.5 indicates a dangerous workload spike. Schedule a deload + mobility work.";
  } else if (acwr >= 1.3) {
    suggestion =
      "Approaching overload threshold. Reduce intensity slightly and monitor recovery closely.";
  } else if (acwr > 0 && acwr < 0.8) {
    suggestion =
      "Workload is low compared to baseline. You can safely increase volume gradually if recovery is good.";
  }

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Risk Card */}
        <div className="card">
          <RiskGauge score={riskScore} />

          {overtraining?.isOvertraining && (
            <div className="alert">
              <strong>⚠ Overtraining Alert</strong>
              <ul>
                {overtraining.reasons?.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional manual refresh */}
          {typeof refresh === "function" && (
            <button
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                width: "100%",
              }}
              onClick={refresh}
            >
              Refresh
            </button>
          )}
        </div>

        {/* ACWR Card */}
        <div className="card">
          <h3>ACWR Workload Model</h3>

          <p>
            <strong>Acute Load (7d):</strong> {acuteLoad}
          </p>
          <p>
            <strong>Chronic Load (28d):</strong> {chronicLoad}
          </p>

          <p>
            <strong>ACWR Ratio:</strong>{" "}
            <span style={{ color: acwrColor, fontWeight: "bold" }}>
              {Number.isFinite(acwr) ? acwr : 0}
            </span>
          </p>

          <p style={{ color: acwrColor, fontWeight: "bold" }}>{acwrZone}</p>

          <p className="meta">
            Bands: under &lt; 0.8 • optimal 0.8–1.3 • caution 1.3–1.5 • high &gt; 1.5
          </p>
        </div>

        {/* ACWR Trend */}
        <div className="card">
          <h3>ACWR Trend (Last 14 Days)</h3>
          <AcwrTrendChart data={acwrTrend} />
        </div>

        {/* EWMA Trend */}
        <div className="card">
          <h3>ACWR EWMA Trend (Last 60 Days)</h3>
          <AcwrEwmaChart />
        </div>

        {/* Weekly Load */}
        <div className="card">
          <h3>Weekly Load Summary</h3>
          <p className="meta">
            <strong>Total Weekly Load:</strong> {weeklyLoad}
          </p>
          <p className="meta">
            Log workouts consistently for more accurate ACWR and risk prediction.
          </p>
        </div>

        {/* Workout Load Trend */}
        <div className="card">
          <h3>Workout Load Trend</h3>
          <LoadChart data={workoutTrend} />
        </div>

        {/* Recommendation */}
        <div className="card">
          <h3>Smart Recommendation</h3>
          <p>{suggestion}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
