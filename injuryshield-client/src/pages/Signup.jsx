import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../css/Auth.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" // default
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      if (parsed.role === "coach") navigate("/coach");
      else navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post("/auth/register", formData);

      localStorage.setItem("userInfo", JSON.stringify(data));

      // Role-based redirect
      if (data.role === "coach") {
        navigate("/coach");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Role Selection */}
        <div className="role-selector">
          <label>
            <input
              type="radio"
              name="role"
              value="user"
              checked={formData.role === "user"}
              onChange={handleChange}
            />
            Athlete
          </label>

          <label>
            <input
              type="radio"
              name="role"
              value="coach"
              checked={formData.role === "coach"}
              onChange={handleChange}
            />
            Coach
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default Signup;

