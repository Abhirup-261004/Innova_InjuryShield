import { useState, useEffect } from "react";
import { useInjury } from "../contexts/InjuryContext";
import { generateWeeklyPlan } from "../utils/planGenerator";
import "../css/Plan.css";

function WeeklyPlan() {

  const { riskScore, overtraining } = useInjury();

  const [plan, setPlan] = useState(
    generateWeeklyPlan(riskScore, overtraining)
  );

  // Automatically update plan when risk or overtraining changes
  useEffect(() => {
    setPlan(generateWeeklyPlan(riskScore, overtraining));
  }, [riskScore, overtraining]);

  const regeneratePlan = () => {
    setPlan(generateWeeklyPlan(riskScore, overtraining));
  };

  return (
    <div className="plan-container">
      <h2>Adaptive 7-Day Workout Plan</h2>

      {overtraining?.isOvertraining && (
        <div className="plan-alert">
          ⚠ Overtraining detected. Recovery-focused week activated.
        </div>
      )}

      <button className="regen-btn" onClick={regeneratePlan}>
        Regenerate Plan
      </button>

      <div className="plan-grid">
        {plan.map((day, index) => (
          <div key={index} className="plan-card">
            <h3>{day.day}</h3>

            <p><strong>Focus:</strong> {day.focus}</p>
            <p><strong>Intensity:</strong> {day.intensity}</p>
            <p><strong>Duration:</strong> {day.duration} mins</p>
            <p><strong>Sets:</strong> {day.sets}</p>
            <p><strong>Reps:</strong> {day.reps}</p>

            <div className="exercise-list">
              <strong>Exercises:</strong>
              <ul>
                {day.exercises.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeeklyPlan;
