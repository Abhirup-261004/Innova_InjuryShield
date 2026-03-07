import { useEffect, useState } from "react";
import API from "../api/axios";
import CoachInsightCard from "../components/CoachInsightCard";
import "../css/CoachDashboard.css";

function CoachDashboard() {
  const [trainees, setTrainees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState("");

  const [insights, setInsights] = useState({});
  const [insightLoadingId, setInsightLoadingId] = useState("");

  const normalizeArray = (value, fallbackKeys = []) => {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      for (const key of fallbackKeys) {
        if (Array.isArray(value[key])) return value[key];
      }
    }

    return [];
  };

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [dashboardRes, pendingRes] = await Promise.all([
        API.get("/coaches/coach-dashboard"),
        API.get("/coaches/pending-requests")
      ]);

      console.log("coach-dashboard response:", dashboardRes.data);
      console.log("pending-requests response:", pendingRes.data);

      const traineeData = normalizeArray(dashboardRes.data, [
        "trainees",
        "users",
        "data"
      ]);

      const pendingData = normalizeArray(pendingRes.data, [
        "pendingRequests",
        "requests",
        "data"
      ]);

      setTrainees(traineeData);
      setPendingRequests(pendingData);
      setError("");
    } catch (err) {
      console.error("Coach dashboard fetch error:", err);
      setError(err.response?.data?.message || "Access denied");
      setTrainees([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleHistory = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? "" : userId));
  };

  const approveRequest = async (userId) => {
    try {
      await API.post("/coaches/approve-request", { userId });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve request");
    }
  };

  const rejectRequest = async (userId) => {
    try {
      await API.post("/coaches/reject-request", { userId });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  const generateInsight = async (athleteId) => {
    try {
      setInsightLoadingId(athleteId);
      const { data } = await API.get(`/coach-ai/insight/${athleteId}`);

      setInsights((prev) => ({
        ...prev,
        [athleteId]: data
      }));
    } catch (err) {
      console.error("AI insight error:", err);
      alert(err.response?.data?.message || "Failed to generate AI insight");
    } finally {
      setInsightLoadingId("");
    }
  };

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading coach dashboard...</p>;
  }

  if (error) {
    return <p style={{ padding: "40px", color: "red" }}>{error}</p>;
  }

  return (
    <div className="coach-container">
      <h2>Coach Dashboard</h2>

      <div className="coach-section">
        <h3>Pending Training Requests</h3>

        {pendingRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <div className="pending-grid">
            {pendingRequests.map((user) => (
              <div key={user._id} className="pending-card">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <p>Goal: {user.goal || "Not specified"}</p>
                <p>Experience: {user.experienceLevel || "Not specified"}</p>

                <div className="pending-actions">
                  <button onClick={() => approveRequest(user._id)}>
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => rejectRequest(user._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="coach-section">
        <h3>Approved Athletes</h3>

        {trainees.length === 0 ? (
          <p>No approved athletes yet.</p>
        ) : (
          <div className="coach-grid">
            {trainees.map((user) => (
              <div key={user._id} className="coach-card">
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
                <p>Goal: {user.goal || "Not specified"}</p>
                <p>Experience: {user.experienceLevel || "Not specified"}</p>

                <div className="coach-summary-box">
                  <p>
                    <strong>Total Workouts:</strong> {user.totalWorkouts ?? 0}
                  </p>
                  <p>
                    <strong>Total Load:</strong> {user.totalLoad ?? 0}
                  </p>
                  <p>
                    <strong>Average RPE:</strong> {user.avgRpe ?? 0}
                  </p>
                </div>

                {user.latestWorkout ? (
                  <div className="latest-workout-box">
                    <h4>Latest Workout</h4>
                    <p>Type: {user.latestWorkout.type || "N/A"}</p>
                    <p>Duration: {user.latestWorkout.duration ?? 0} mins</p>
                    <p>RPE: {user.latestWorkout.rpe ?? 0}</p>
                    <p>Load: {user.latestWorkout.load ?? 0}</p>
                    <p>
                      Date:{" "}
                      {user.latestWorkout.date
                        ? new Date(user.latestWorkout.date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                ) : (
                  <p>No workouts logged yet.</p>
                )}

                <div className="coach-dashboard-actions">
                  <button
                    className="history-btn"
                    onClick={() => toggleHistory(user._id)}
                  >
                    {expandedUserId === user._id
                      ? "Hide Workout History"
                      : "View Workout History"}
                  </button>

                  <button
                    className="ai-insight-btn"
                    onClick={() => generateInsight(user._id)}
                    disabled={insightLoadingId === user._id}
                  >
                    {insightLoadingId === user._id
                      ? "Generating AI Insight..."
                      : "Generate AI Insight"}
                  </button>
                </div>

                {expandedUserId === user._id && (
                  <div className="workout-history-box">
                    <h4>Workout History</h4>

                    {!Array.isArray(user.workoutHistory) ||
                    user.workoutHistory.length === 0 ? (
                      <p>No workout history available.</p>
                    ) : (
                      user.workoutHistory.map((w) => (
                        <div key={w._id} className="workout-history-item">
                          <p>
                            <strong>{w.type || "Workout"}</strong>
                          </p>
                          <p>Duration: {w.duration ?? 0} mins</p>
                          <p>RPE: {w.rpe ?? 0}</p>
                          <p>Load: {w.load ?? 0}</p>
                          <p>
                            Date:{" "}
                            {w.date
                              ? new Date(w.date).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <CoachInsightCard
                  data={insights[user._id]}
                  loading={insightLoadingId === user._id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoachDashboard;