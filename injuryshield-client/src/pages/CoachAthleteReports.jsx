import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import "../css/ReportHistory.css";

function CoachAthleteReports() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await API.get(`/gemini/coach-reports/${athleteId}`);
        setReports(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [athleteId]);

  const getRiskClass = (riskLevel) => {
    const level = riskLevel?.toLowerCase();
    if (level === "high") return "high";
    if (level === "moderate") return "moderate";
    return "low";
  };

  if (loading) {
    return <p className="report-history-loading">Loading athlete reports...</p>;
  }

  return (
    <div className="report-history-page">
      <h2>Athlete AI Reports</h2>

      {reports.length === 0 ? (
        <p>No AI reports found for this athlete.</p>
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

export default CoachAthleteReports;