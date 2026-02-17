import { useEffect, useState } from "react";
import API from "../api/axios";
import "../css/CoachDashboard.css";

function CoachDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const { data } = await API.get("/analytics/coach");
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.message || "Access denied");
      } finally {
        setLoading(false);
      }
    };

    fetchCoachData();
  }, []);

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading coach dashboard...</p>;
  }

  if (error) {
    return <p style={{ padding: "40px", color: "red" }}>{error}</p>;
  }

  return (
    <div className="coach-container">
      <h2>Coach Dashboard</h2>

      <div className="coach-grid">
        {users.map((user) => (
          <div key={user._id} className="coach-card">
            <h3>{user.name}</h3>
            <p>Email: {user.email}</p>
            <p>Total Workouts: {user.workoutsCount}</p>
            <p>Total Load: {user.totalLoad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CoachDashboard;
