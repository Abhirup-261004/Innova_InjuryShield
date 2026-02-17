import { useInjury } from "../contexts/InjuryContext";
import "../css/Workouts.css";

function Workouts() {

  const { workouts = [] } = useInjury();


  return (
    <div className="workouts-container">
      <h2>Workout History</h2>

      {workouts.length === 0 ? (
        <p>No workouts logged yet.</p>
      ) : (
        <div className="workout-list">
          {workouts.map((w, index) => (
            <div key={index} className="workout-card">
              <h3>{w.type}</h3>
              <p>Duration: {w.duration} mins</p>
              <p>RPE: {w.rpe}</p>
              <p>Load: {w.load}</p>
              <p>Date: {new Date(w.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Workouts;
