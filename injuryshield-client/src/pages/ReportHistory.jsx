import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import "../css/ReportHistory.css";

function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await API.get("/gemini/history");
        setReports(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getRiskClass = (riskLevel) => {
    const level = riskLevel?.toLowerCase();
    if (level === "high") return "high";
    if (level === "moderate") return "moderate";
    return "low";
  };

  if (loading) {
    return <p className="report-history-loading">Loading reports...</p>;
  }

  return (
    <div className="report-history-page">
      <h2>AI Report History</h2>

      {reports.length === 0 ? (
        <p>No reports generated yet.</p>
      ) : (
        <div className="report-history-list">
          {reports.map((item) => (
            <div key={item._id} className="report-history-card">
              <div
                className={`history-risk-badge ${getRiskClass(
                  item.report?.riskLevel
                )}`}
              >
                {item.report?.riskLevel || "Unknown"}
              </div>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(item.createdAt).toLocaleString()}
              </p>

              <p>
                <strong>Summary:</strong> {item.report?.summary}
              </p>

              <p>
                <strong>Training Recommendation:</strong>{" "}
                {item.report?.trainingRecommendation}
              </p>

              <div className="report-history-actions">
                <button
                  onClick={() =>
                    navigate(`/report-details/${item._id}`, {
                      state: { reportItem: item }
                    })
                  }
                >
                  View Full Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportHistory;