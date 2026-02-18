import RiskGauge from "../components/RiskGauge";
import "../css/Dashboard.css";
import { useInjury } from "../contexts/InjuryContext";
import AcwrTrendChart from "../components/AcwrTrendChart";
import LoadChart from "../components/LoadChart";
import AcwrEwmaChart from "../components/AcwrEwmaChart";


function Dashboard() {
  const { summary, acwrTrend, workoutTrend } = useInjury();

  // Loading state (until backend responds)
  if (!summary) {
    return <p style={{ padding: "40px" }}>Loading dashboard...</p>;
  }

  const { weeklyLoad, acwrData, riskScore, overtraining } = summary;

  const { acuteLoad, chronicLoad, acwr } = acwrData || {
    acuteLoad: 0,
    chronicLoad: 0,
    acwr: 0
  };


  // Determine ACWR zone
  let acwrZone = "Safe Zone";
  let acwrColor = "#22c55e";

  if (acwr >= 1.5) {
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

  if (overtraining?.isOvertraining) {
    suggestion =
      "Overtraining detected. Take a recovery day and reduce training intensity for the next session.";
  } else if (acwr >= 1.5) {
    suggestion =
      "ACWR above 1.5 indicates a dangerous workload spike. Schedule deload + mobility work.";
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
                {overtraining.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
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
            <span style={{ color: acwrColor, fontWeight: "bold" }}>{acwr}</span>
          </p>
          <p style={{ color: acwrColor, fontWeight: "bold" }}>{acwrZone}</p>

          <p className="meta">
            Safe: 0.8–1.3 | Caution: 1.3–1.5 | High: &gt; 1.5
          </p>
        </div>

        <div className="card">
            <h3>ACWR Trend (Last 14 Days)</h3>
            <AcwrTrendChart data={acwrTrend} />
        </div>

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
