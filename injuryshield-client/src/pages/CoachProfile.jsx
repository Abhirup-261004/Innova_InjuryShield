import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import "../css/CoachProfile.css";

function CoachProfile() {
  const { coachId } = useParams();
  const [coach, setCoach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachProfile = async () => {
      try {
        const { data } = await API.get(`/coaches/profile/${coachId}`);
        setCoach(data.coach);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoachProfile();
  }, [coachId]);

  const renderStars = (rating = 0) => {
    const rounded = Math.round(rating);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  };

  if (loading) {
    return <p className="coach-profile-loading">Loading coach profile...</p>;
  }

  if (!coach) {
    return <p className="coach-profile-loading">Coach not found.</p>;
  }

  return (
    <div className="coach-profile-page">
      <div className="coach-profile-card">
        <div className="coach-profile-top">
          <div className="coach-profile-avatar">
            {coach.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2>{coach.name}</h2>
            <p>{coach.email}</p>
          </div>
        </div>

        <div className="coach-profile-stars">
          {renderStars(coach.avgRating || 0)}
        </div>

        <div className="coach-profile-info">
          <p>
            <strong>Average Rating:</strong> {coach.avgRating || 0} / 5
          </p>
          <p>
            <strong>Total Reviews:</strong> {coach.ratingsCount || 0}
          </p>
          <p>
            <strong>Specialization:</strong>{" "}
            {coach.specialization || "General Fitness"}
          </p>
          <p>
            <strong>Experience:</strong> {coach.experienceYears || 0} years
          </p>
          <p>
            <strong>Bio:</strong> {coach.coachBio || "No bio added yet."}
          </p>
        </div>
      </div>

      <div className="coach-profile-reviews">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="coach-profile-review-card">
              <p>
                <strong>{review.user?.name || "User"}</strong> rated{" "}
                {review.rating} ⭐
              </p>
              {review.review && <p>{review.review}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoachProfile;