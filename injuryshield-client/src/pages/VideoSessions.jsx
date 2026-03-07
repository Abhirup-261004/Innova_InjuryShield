import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "../css/LiveSession.css";

function VideoSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await API.get("/video-sessions/my");
        setSessions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return <div className="live-shell"><p>Loading sessions...</p></div>;
  }

  return (
    <div className="live-shell">
      <div className="sessions-card">
        <h2>Live Session History</h2>

        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => {
              const counterpart =
                String(session.coach?._id) === String(userInfo?._id)
                  ? session.athlete
                  : session.coach;

              return (
                <div key={session._id} className="session-row">
                  <div>
                    <h4>{counterpart?.name}</h4>
                    <p>Status: {session.status}</p>
                    <p>Started: {new Date(session.startedAt).toLocaleString()}</p>
                    <p>Duration: {session.durationSec || 0}s</p>
                  </div>

                  <div className="session-actions">
                    {session.status === "active" && (
                      <Link to={`/live-session/${session._id}`}>Join</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoSessions;