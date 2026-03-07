import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import "../css/LiveSession.css";

function LiveSessionLobby() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const createSession = async () => {
      try {
        const counterpartId =
          searchParams.get("coachId") || searchParams.get("athleteId");

        if (!counterpartId) {
          setError("No coach/athlete selected for live session.");
          setLoading(false);
          return;
        }

        const { data } = await API.post("/video-sessions/start", {
          counterpartId
        });

        setSession(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not create/join live session"
        );
      } finally {
        setLoading(false);
      }
    };

    createSession();
  }, [searchParams]);

  if (loading) {
    return <div className="live-shell"><p>Preparing live session...</p></div>;
  }

  if (error) {
    return <div className="live-shell"><p style={{ color: "red" }}>{error}</p></div>;
  }

  return (
    <div className="live-shell">
      <div className="live-card">
        <h2>Live Session Ready</h2>
        <p>
          Coach: <strong>{session?.coach?.name}</strong>
        </p>
        <p>
          Athlete: <strong>{session?.athlete?.name}</strong>
        </p>
        <button onClick={() => navigate(`/live-session/${session._id}`)}>
          Join Session
        </button>
      </div>
    </div>
  );
}

export default LiveSessionLobby;