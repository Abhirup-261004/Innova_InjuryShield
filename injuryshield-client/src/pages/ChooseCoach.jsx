import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "../css/ChooseCoach.css";

function ChooseCoach() {
  const [coaches, setCoaches] = useState([]);
  const [myCoachData, setMyCoachData] = useState(null);
  const [ratingData, setRatingData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoaches();
    fetchMyCoach();
  }, []);

  const fetchCoaches = async () => {
    try {
      const { data } = await API.get("/coaches");
      setCoaches(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyCoach = async () => {
    try {
      const { data } = await API.get("/coaches/my-coach");
      setMyCoachData(data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseCoach = async (coachId) => {
    try {
      const { data } = await API.post(`/coaches/assign/${coachId}`);
      alert(data.message || "Coach request sent");
      fetchMyCoach();
      fetchCoaches();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign coach");
    }
  };

  const handleRatingChange = (coachId, field, value) => {
    setRatingData((prev) => ({
      ...prev,
      [coachId]: {
        ...prev[coachId],
        [field]: value
      }
    }));
  };

  const handleRateCoach = async (coachId) => {
    try {
      const payload = ratingData[coachId] || { rating: 5, review: "" };
      const { data } = await API.post(`/coaches/rate/${coachId}`, payload);
      alert(data.message || "Coach rated successfully");
      fetchCoaches();
      fetchMyCoach();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to rate coach");
    }
  };

  const renderStars = (rating = 0) => {
    const rounded = Math.round(rating);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  if (loading) {
    return <p className="choose-coach-loading">Loading coaches...</p>;
  }

  return (
    <div className="choose-coach-page">
      <h1>Choose Your Coach</h1>

      <div className="coach-grid">
        {coaches.length === 0 ? (
          <p>No coaches available right now.</p>
        ) : (
          coaches.map((coach) => {
            const isCurrentCoach = myCoachData?.coach?._id === coach._id;
            const requestStatus = myCoachData?.coachRequestStatus || "none";

            return (
              <div key={coach._id} className="coach-card">
                <div className="coach-avatar">
                  {coach.name?.charAt(0)?.toUpperCase()}
                </div>

                <h3>{coach.name}</h3>
                <p>{coach.email}</p>

                <div className="coach-stars">
                  {renderStars(coach.avgRating || 0)}
                </div>

                <p>
                  <strong>Rating:</strong> {coach.avgRating || 0} / 5
                </p>
                <p>
                  <strong>Reviews:</strong> {coach.ratingsCount || 0}
                </p>
                <p>
                  <strong>Specialization:</strong>{" "}
                  {coach.specialization || "General Fitness"}
                </p>
                <p>
                  <strong>Experience:</strong> {coach.experienceYears || 0} years
                </p>

                <div className="coach-status-badge">
                  {isCurrentCoach
                    ? requestStatus === "approved"
                      ? "Approved"
                      : requestStatus === "pending"
                      ? "Pending"
                      : requestStatus
                    : "Available"}
                </div>

                <Link
                  to={`/coach-profile/${coach._id}`}
                  className="view-profile-btn"
                >
                  View Full Profile
                </Link>

                {!isCurrentCoach ? (
                  <button onClick={() => handleChooseCoach(coach._id)}>
                    Select Coach
                  </button>
                ) : (
                  <>
                    <button disabled>
                      {requestStatus === "approved"
                        ? "Assigned"
                        : requestStatus === "pending"
                        ? "Pending Approval"
                        : "Selected"}
                    </button>

                    {requestStatus === "approved" && (
                      <div className="rate-coach-box">
                        <label>Rate this coach</label>
                        <select
                          value={ratingData[coach._id]?.rating || 5}
                          onChange={(e) =>
                            handleRatingChange(
                              coach._id,
                              "rating",
                              Number(e.target.value)
                            )
                          }
                        >
                          <option value={5}>5</option>
                          <option value={4}>4</option>
                          <option value={3}>3</option>
                          <option value={2}>2</option>
                          <option value={1}>1</option>
                        </select>

                        <textarea
                          placeholder="Write a review..."
                          value={ratingData[coach._id]?.review || ""}
                          onChange={(e) =>
                            handleRatingChange(
                              coach._id,
                              "review",
                              e.target.value
                            )
                          }
                        />

                        <button onClick={() => handleRateCoach(coach._id)}>
                          Submit Review
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChooseCoach;