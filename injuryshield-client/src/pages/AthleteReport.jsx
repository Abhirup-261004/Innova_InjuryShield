import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "../css/AthleteReport.css";

function AthleteReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await API.get("/gemini/athlete-report");
      setReportData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const openFullReport = () => {
    if (!reportData) return;

    navigate(`/report-details/${reportData.reportId}`, {
      state: {
        reportItem: {
          _id: reportData.reportId,
          createdAt: new Date().toISOString(),
          metrics: reportData.metrics,
          report: reportData.report
        }
      }
    });
  };

  const riskClass =
    reportData?.report?.riskLevel?.toLowerCase() === "high"
      ? "high"
      : reportData?.report?.riskLevel?.toLowerCase() === "moderate"
      ? "moderate"
      : "low";

  return (
    <div className="athlete-report-page">
      <div className="athlete-report-header">
        <div>
          <h2>AI Injury Prevention Report</h2>
          <p>
            Generate a Gemini-powered training and recovery report using your
            latest workload, recovery, pain, and posture analysis data.
          </p>
        </div>

        <button
          className="generate-report-btn"
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate AI Report"}
        </button>
      </div>

      {error && <p className="athlete-report-error">{error}</p>}

      {!reportData && !loading && (
        <div className="athlete-report-empty">
          <p>No report generated yet. Click the button above to generate one.</p>
        </div>
      )}

      {reportData && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <span>ACWR</span>
              <strong>{reportData.metrics?.acwr ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Acute Load</span>
              <strong>{reportData.metrics?.acuteLoad ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Chronic Load</span>
              <strong>{reportData.metrics?.chronicLoad ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Weekly Load</span>
              <strong>{reportData.metrics?.weeklyLoad ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Sleep</span>
              <strong>{reportData.metrics?.sleep ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Fatigue</span>
              <strong>{reportData.metrics?.fatigue ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Soreness</span>
              <strong>{reportData.metrics?.soreness ?? "N/A"}</strong>
            </div>

            <div className="metric-card">
              <span>Stress</span>
              <strong>{reportData.metrics?.stress ?? "N/A"}</strong>
            </div>
          </div>

          <div className={`report-risk-banner ${riskClass}`}>
            <div>
              <h3>Risk Level: {reportData.report?.riskLevel || "Unknown"}</h3>
              <p>{reportData.report?.summary || "No summary available."}</p>
            </div>
          </div>

          <div className="report-sections">
            <div className="report-card">
              <h3>Key Findings</h3>
              {reportData.report?.keyFindings?.length ? (
                <ul>
                  {reportData.report.keyFindings.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No key findings available.</p>
              )}
            </div>

            <div className="report-card">
              <h3>Training Recommendation</h3>
              <p>
                {reportData.report?.trainingRecommendation ||
                  "No training recommendation available."}
              </p>
            </div>

            <div className="report-card">
              <h3>Recovery Recommendation</h3>
              <p>
                {reportData.report?.recoveryRecommendation ||
                  "No recovery recommendation available."}
              </p>
            </div>

            <div className="report-card">
              <h3>Coach Note</h3>
              <p>{reportData.report?.coachNote || "No coach note available."}</p>
            </div>
          </div>

          <div className="report-card">
            <h3>Additional Context</h3>

            <p>
              <strong>Pain Areas:</strong>{" "}
              {reportData.metrics?.painAreas?.length
                ? reportData.metrics.painAreas.join(", ")
                : "None"}
            </p>

            <p>
              <strong>Posture Risk:</strong>{" "}
              {reportData.metrics?.postureRisk || "Not available"}
            </p>

            <p>
              <strong>Posture Flags:</strong>{" "}
              {reportData.metrics?.postureFlags?.length
                ? reportData.metrics.postureFlags.join(", ")
                : "None"}
            </p>

            <p>
              <strong>Overtraining Flag:</strong>{" "}
              {reportData.metrics?.overtraining ? "Yes" : "No"}
            </p>
          </div>

          <div className="report-card">
            <button className="generate-report-btn" onClick={openFullReport}>
              Open Full Report View
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AthleteReport;