import { useEffect, useState } from "react";
import API from "../api/axios";
import "../css/EditCoachProfile.css";

function EditCoachProfile() {
  const [formData, setFormData] = useState({
    coachBio: "",
    specialization: "",
    experienceYears: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const raw = localStorage.getItem("userInfo");
        const user = raw ? JSON.parse(raw) : null;
        if (!user?._id) return;

        const { data } = await API.get(`/coaches/profile/${user._id}`);
        setFormData({
          coachBio: data.coach?.coachBio || "",
          specialization: data.coach?.specialization || "",
          experienceYears: data.coach?.experienceYears || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.name === "experienceYears"
          ? Number(e.target.value)
          : e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put("/coaches/profile", formData);
      alert("Coach profile updated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="edit-coach-loading">Loading profile...</p>;
  }

  return (
    <div className="edit-coach-page">
      <div className="edit-coach-card">
        <h2>Edit Coach Profile</h2>

        <form onSubmit={handleSubmit} className="edit-coach-form">
          <label>Specialization</label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g. Strength Training, Rehab, Fat Loss"
          />

          <label>Years of Experience</label>
          <input
            type="number"
            name="experienceYears"
            value={formData.experienceYears}
            onChange={handleChange}
            min="0"
          />

          <label>Bio</label>
          <textarea
            name="coachBio"
            rows="5"
            value={formData.coachBio}
            onChange={handleChange}
            placeholder="Write a short coach bio..."
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditCoachProfile;