import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../css/Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.role === "coach") navigate("/coach");
      else navigate("/dashboard");
    } catch {
      // corrupted storage, clear it
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { data } = await API.post("/auth/login", { email, password });

    console.log("LOGIN RESPONSE:", data);

    // Support both backend formats
    const token = data?.token;
    const user = data?.user || data;

    if (!token) {
      throw new Error("Login response missing token");
    }

    localStorage.setItem("token", token);

    localStorage.setItem(
      "userInfo",
      JSON.stringify({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );

    if (user.role === "coach") navigate("/coach");
    else navigate("/dashboard");

  } catch (error) {
    console.log("Login error:", error);
    alert(error.response?.data?.message || error.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
