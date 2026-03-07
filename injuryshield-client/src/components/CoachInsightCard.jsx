import "../css/CoachInsightCard.css";

function CoachInsightCard({ data, loading }) {
  if (loading) {
    return (
      <div className="coach-ai-card">
        <h4>AI Coach Assistant</h4>
        <p>Generating insight...</p>
      </div>
    );
  }

  if (!data) return null;

  const riskClass =
    data.insight?.riskLevel?.toLowerCase() === "high"
      ? "high"
      : data.insight?.riskLevel?.toLowerCase() === "moderate"
      ? "moderate"
      : "low";

  return (
    <div className="coach-ai-card">
      <div className={`coach-ai-risk ${riskClass}`}>
        <div>
          <h4>AI Coach Assistant</h4>
          <p>{data.athlete?.name}</p>
        </div>
        <span>{data.insight?.riskLevel || "Unknown"} Risk</span>
      </div>

      <div className="coach-ai-section">
        <h5>Athlete Status</h5>
        <p>{data.insight?.athleteStatus || "Not available"}</p>
      </div>

      <div className="coach-ai-section">
        <h5>Summary</h5>
        <p>{data.insight?.summary || "No summary available."}</p>
      </div>

      <div className="coach-ai-section">
        <h5>Key Findings</h5>
        {data.insight?.keyFindings?.length ? (
          <ul>
            {data.insight.keyFindings.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No key findings available.</p>
        )}
      </div>

      <div className="coach-ai-grid">
        <div className="coach-ai-mini">
          <span>ACWR</span>
          <strong>{data.metrics?.acwr ?? "N/A"}</strong>
        </div>
        <div className="coach-ai-mini">
          <span>Acute Load</span>
          <strong>{data.metrics?.acuteLoad ?? "N/A"}</strong>
        </div>
        <div className="coach-ai-mini">
          <span>Chronic Load</span>
          <strong>{data.metrics?.chronicLoad ?? "N/A"}</strong>
        </div>
        <div className="coach-ai-mini">
          <span>Avg RPE</span>
          <strong>{data.metrics?.avgRpeLast14Days ?? "N/A"}</strong>
        </div>
      </div>

      <div className="coach-ai-section">
        <h5>Training Recommendation</h5>
        <p>{data.insight?.trainingRecommendation}</p>
      </div>

      <div className="coach-ai-section">
        <h5>Recovery Recommendation</h5>
        <p>{data.insight?.recoveryRecommendation}</p>
      </div>

      <div className="coach-ai-section">
        <h5>Coach Action</h5>
        <p>{data.insight?.coachAction}</p>
      </div>
    </div>
  );
}

export default CoachInsightCard;