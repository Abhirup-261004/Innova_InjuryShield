import { useEffect, useState } from "react";
import API from "../api/axios";
import "../css/CoachDashboard.css";

function CoachDashboard() {
  const [trainees, setTrainees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [dashboardRes, pendingRes] = await Promise.all([
        API.get("/coaches/coach-dashboard"),
        API.get("/coaches/pending-requests")
      ]);

      setTrainees(dashboardRes.data.athletes || []);
      setPendingRequests(pendingRes.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Access denied");
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
                  <button onClick={() => approveRequest(user._id)}>Approve</button>
                  <button className="reject-btn" onClick={() => rejectRequest(user._id)}>
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
                  <p><strong>Total Workouts:</strong> {user.totalWorkouts}</p>
                  <p><strong>Total Load:</strong> {user.totalLoad}</p>
                  <p><strong>Average RPE:</strong> {user.avgRpe}</p>
                </div>

                {user.latestWorkout ? (
                  <div className="latest-workout-box">
                    <h4>Latest Workout</h4>
                    <p>Type: {user.latestWorkout.type}</p>
                    <p>Duration: {user.latestWorkout.duration} mins</p>
                    <p>RPE: {user.latestWorkout.rpe}</p>
                    <p>Load: {user.latestWorkout.load}</p>
                    <p>Date: {new Date(user.latestWorkout.date).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <p>No workouts logged yet.</p>
                )}

                <button
                  className="history-btn"
                  onClick={() => toggleHistory(user._id)}
                >
                  {expandedUserId === user._id
                    ? "Hide Workout History"
                    : "View Workout History"}
                </button>

                {expandedUserId === user._id && (
                  <div className="workout-history-box">
                    <h4>Workout History</h4>
                    {user.workoutHistory.length === 0 ? (
                      <p>No workout history available.</p>
                    ) : (
                      user.workoutHistory.map((w) => (
                        <div key={w._id} className="workout-history-item">
                          <p><strong>{w.type}</strong></p>
                          <p>Duration: {w.duration} mins</p>
                          <p>RPE: {w.rpe}</p>
                          <p>Load: {w.load}</p>
                          <p>Date: {new Date(w.date).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoachDashboard;