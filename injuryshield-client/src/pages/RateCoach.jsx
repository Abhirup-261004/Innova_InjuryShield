import { useEffect, useState } from "react";
import API from "../api/axios";
import "../css/RateCoach.css";

function RateCoach() {
  const [myCoach, setMyCoach] = useState(null);
  const [requestStatus, setRequestStatus] = useState("none");
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoach = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/coaches/my-coach");
      setMyCoach(data?.coach || null);
      setRequestStatus(data?.coachRequestStatus || "none");

      if (data?.coach?._id) {
        const reviewRes = await API.get(`/coaches/reviews/${data.coach._id}`);
        setReviews(reviewRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoach();
  }, []);

  const submitRating = async (e) => {
    e.preventDefault();
    if (!myCoach?._id) return;

    try {
      setSubmitting(true);
      await API.post("/coaches/rate", {
        coachId: myCoach._id,
        rating,
        review
      });

      alert("Coach rated successfully");
      setReview("");
      setRating(5);
      fetchCoach();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="rate-coach-loading">Loading...</p>;
  }

  if (!myCoach) {
    return (
      <div className="rate-coach-page">
        <h2>Rate Coach</h2>
        <p>You have not selected any coach yet.</p>
      </div>
    );
  }

  if (requestStatus !== "approved") {
    return (
      <div className="rate-coach-page">
        <h2>Rate Coach</h2>
        <p>You can rate your coach only after approval.</p>
        <p>Current request status: <strong>{requestStatus.toUpperCase()}</strong></p>
      </div>
    );
  }

  return (
    <div className="rate-coach-page">
      <div className="rate-coach-card">
        <h2>Rate Your Coach</h2>
        <p>
          <strong>{myCoach.name}</strong> ({myCoach.email})
        </p>
        <p>
          Current Rating: {myCoach.avgRating || 0} ⭐ ({myCoach.ratingsCount || 0} reviews)
        </p>

        <form onSubmit={submitRating} className="rate-coach-form">
          <label>Rating</label>
          <div className="star-row">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`star ${rating >= num ? "active" : ""}`}
                onClick={() => setRating(num)}
              >
                ★
              </span>
            ))}
          </div>

          <label>Review</label>
          <textarea
            rows="4"
            placeholder="Write your review..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </form>
      </div>

      <div className="coach-reviews-box">
        <h3>Coach Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="review-card">
              <p>
                <strong>{r.user?.name || "User"}</strong> rated {r.rating} ⭐
              </p>
              {r.review && <p>{r.review}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RateCoach;