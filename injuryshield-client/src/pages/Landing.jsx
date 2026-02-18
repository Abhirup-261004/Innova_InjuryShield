import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Landing.css";

function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    setIsLoggedIn(!!userInfo);
  }, []);

  return (
    <div className="landing">
      {/* Premium Pattern Background */}  
      <div className="premium-pattern"></div>

      {/* Hero Section */}
      <section className="hero">
        <h1>Train Smarter. Prevent Injuries.</h1>
        <p>
          InjuryShield uses workload analytics and recovery science to predict
          injury risk and auto-adjust your training plan in real time.
        </p>

        <div className="cta-buttons">
          <Link to="/signup" className="btn primary">Get Started</Link>
          {!isLoggedIn && <Link to="/login" className="btn secondary">Login</Link>}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why InjuryShield?</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>📊 Injury Risk Prediction</h3>
            <p>Uses Acute-Chronic Workload Ratio (ACWR) to detect unsafe load spikes.</p>
          </div>

          <div className="feature-card">
            <h3>🧠 Recovery Monitoring</h3>
            <p>Tracks sleep, fatigue, soreness & stress to calculate readiness.</p>
          </div>

          <div className="feature-card">
            <h3>⚡ Adaptive Workout Plans</h3>
            <p>Automatically adjusts intensity based on your recovery & risk level.</p>
          </div>

          <div className="feature-card">
            <h3>📈 Performance Analytics</h3>
            <p>Visual dashboards for weekly load, progression & overtraining detection.</p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact">
        <h2>The Problem We Solve</h2>
        <p>
          60–70% of sports injuries occur due to sudden workload spikes.
          InjuryShield identifies unsafe training patterns before injuries happen.
        </p>
      </section>

    </div>
  );
}

export default Landing;
