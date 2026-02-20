import { useEffect, useState } from "react";
import API from "../api/axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import "../css/PostureAnalysis.css";

function PostureAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get("/form-analysis/history");
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Select a video first");

    const formData = new FormData();
    formData.append("video", file);

    try {
      setLoading(true);

      const { data } = await API.post("/form-analysis/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(data.result);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const riskColor =
    result?.risk?.zone === "HIGH"
      ? "#ef4444"
      : result?.risk?.zone === "MODERATE"
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div className="pa-container">
      <h2>AI Posture & Form Analysis</h2>

      {/* Upload */}
      <div className="pa-upload">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Video"}
        </button>
      </div>

      {/* Risk Card */}
      {result && (
        <div className="pa-risk-card" style={{ borderColor: riskColor }}>
          <h3>
            Risk Level:{" "}
            <span style={{ color: riskColor }}>{result.risk.zone}</span>
          </h3>
          <h4>Score: {result.risk.score}/100</h4>

          {result.risk.flags?.length > 0 && (
            <ul>
              {result.risk.flags.map((f, i) => (
                <li key={i}>
                  <strong>{f.key}:</strong> {f.note}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Trunk Lean Graph */}
      {result && (
        <div className="pa-chart">
          <h3>Trunk Lean Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={result.series || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="acq.trunkLeanDeg"
                stroke="#22c55e"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Valgus Graph */}
      {result && (
        <div className="pa-chart">
          <h3>Knee Valgus Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={result.series || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="acq.leftValgus"
                stroke="#3b82f6"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="acq.rightValgus"
                stroke="#ef4444"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="pa-history">
        <h3>Previous Analyses</h3>

        {history.length === 0 ? (
          <p className="pa-muted">No previous analyses found.</p>
        ) : (
          history.map((item) => (
            <div key={item._id} className="pa-history-item">
              <span>{item.originalName}</span>
              <span>
                Risk:{" "}
                <strong
                  style={{
                    color:
                      item?.result?.risk?.zone === "HIGH"
                        ? "#ef4444"
                        : item?.result?.risk?.zone === "MODERATE"
                        ? "#f59e0b"
                        : "#22c55e"
                  }}
                >
                  {item?.result?.risk?.zone || "UNKNOWN"}
                </strong>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PostureAnalysis;