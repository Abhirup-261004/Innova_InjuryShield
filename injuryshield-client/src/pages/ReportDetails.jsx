import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import { exportReportPdf } from "../utils/exportReportPdf";
import "../css/ReportDetails.css";

function ReportDetails() {
  const { reportId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [reportItem, setReportItem] = useState(location.state?.reportItem || null);
  const [loading, setLoading] = useState(!location.state?.reportItem);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId || reportItem) return;

      try {
        setLoading(true);

        // fetch from history and find matching item
        const { data } = await API.get("/gemini/history");
        const found = (data || []).find(
          (item) => String(item._id) === String(reportId)
        );

        if (!found) {
          setError("Report not found");
        } else {
          setReportItem(found);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, reportItem]);

  const handleExportPdf = async () => {
    try {
      await exportReportPdf(
        "report-pdf-root",
        `injuryshield-report-${reportItem?._id || "report"}.pdf`
      );
    } catch (err) {
      alert(err.message || "Failed to export PDF");
    }
  };

  if (loading) {
    return <p className="report-details-loading">Loading report...</p>;
  }

  if (error || !reportItem) {
    return (
      <p className="report-details-loading">
        {error || "Report not found"}
      </p>
    );
  }

  const report = reportItem.report || {};
  const metrics = reportItem.metrics || {};

  const riskClass =
    report.riskLevel?.toLowerCase() === "high"
      ? "high"
      : report.riskLevel?.toLowerCase() === "moderate"
      ? "moderate"
      : "low";

  return (
    <div className="report-details-page">
      <div className="report-details-toolbar">
        <button onClick={() => navigate(-1)} className="toolbar-btn secondary">
          Back
        </button>

        <button onClick={handleExportPdf} className="toolbar-btn primary">
          Download PDF
        </button>

        <button onClick={() => window.print()} className="toolbar-btn primary">
          Print
        </button>
      </div>

      <div id="report-pdf-root" className="report-print-card">
        <div className="report-print-header">
          <div>
            <h1>InjuryShield AI Injury Prevention Report</h1>
            <p className="muted">
              Generated on {new Date(reportItem.createdAt).toLocaleString()}
            </p>
          </div>

          <div className={`risk-chip ${riskClass}`}>
            {report.riskLevel || "Unknown"} Risk
          </div>
        </div>

        <div className="report-section">
          <h2>Summary</h2>
          <p>{report.summary || "No summary available."}</p>
        </div>

        <div className="report-section">
          <h2>Metrics Snapshot</h2>
          <div className="report-metrics-grid">
            <div className="report-metric-box">
              <span>ACWR</span>
              <strong>{metrics.acwr ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Acute Load</span>
              <strong>{metrics.acuteLoad ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Chronic Load</span>
              <strong>{metrics.chronicLoad ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Weekly Load</span>
              <strong>{metrics.weeklyLoad ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Sleep</span>
              <strong>{metrics.sleep ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Fatigue</span>
              <strong>{metrics.fatigue ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Soreness</span>
              <strong>{metrics.soreness ?? "N/A"}</strong>
            </div>

            <div className="report-metric-box">
              <span>Stress</span>
              <strong>{metrics.stress ?? "N/A"}</strong>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h2>Key Findings</h2>
          {report.keyFindings?.length ? (
            <ul>
              {report.keyFindings.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No key findings available.</p>
          )}
        </div>

        <div className="report-section">
          <h2>Training Recommendation</h2>
          <p>
            {report.trainingRecommendation ||
              "No training recommendation available."}
          </p>
        </div>

        <div className="report-section">
          <h2>Recovery Recommendation</h2>
          <p>
            {report.recoveryRecommendation ||
              "No recovery recommendation available."}
          </p>
        </div>

        <div className="report-section">
          <h2>Coach Note</h2>
          <p>{report.coachNote || "No coach note available."}</p>
        </div>

        <div className="report-section">
          <h2>Additional Context</h2>

          <p>
            <strong>Pain Areas:</strong>{" "}
            {metrics.painAreas?.length ? metrics.painAreas.join(", ") : "None"}
          </p>

          <p>
            <strong>Posture Risk:</strong>{" "}
            {metrics.postureRisk || "Not available"}
          </p>

          <p>
            <strong>Posture Flags:</strong>{" "}
            {metrics.postureFlags?.length
              ? metrics.postureFlags.join(", ")
              : "None"}
          </p>

          <p>
            <strong>Overtraining Flag:</strong>{" "}
            {metrics.overtraining ? "Yes" : "No"}
          </p>
        </div>

        <div className="report-footer-note">
          This report is AI-generated for training guidance and injury prevention
          support. It is not a medical diagnosis.
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;