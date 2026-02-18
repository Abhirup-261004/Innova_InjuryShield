import { Link, useNavigate } from "react-router-dom";
import "../css/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  // Safely parse userInfo
  const storedUser = localStorage.getItem("userInfo");
  const userInfo = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" className="logo-link">
          InjuryShield
        </Link>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {!userInfo ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/checkin">Check-in</Link>
            <Link to="/workouts/new">Add Workout</Link>
            <Link to="/workouts">Workouts</Link>
            <Link to="/injury-radar">Injury Radar</Link>
            <Link to="/plan-builder">Plan Builder</Link>

            {/* Coach Dashboard Link */}
            {userInfo.role === "coach" && (
              <Link to="/coach">Coach Dashboard</Link>
            )}

            {/* User Display */}
            <span className="user-name">
              👤 {userInfo.name}
            </span>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
