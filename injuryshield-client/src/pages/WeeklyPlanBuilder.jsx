import { useState, useEffect } from "react";
import API from "../api/axios";
import "../css/WeeklyPlan.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeeklyPlanBuilder() {
  const [goal, setGoal] = useState("general");
  const [equipment, setEquipment] = useState("home");
  const [daysAvailable, setDaysAvailable] = useState([0, 2, 4]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load active saved plan
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const { data } = await API.get("/plans/current");
        setCurrentPlan(data);
      } catch (err) {
        // no active plan
      }
    };
    fetchCurrent();
  }, []);

  const toggleDay = (index) => {
    if (daysAvailable.includes(index)) {
      setDaysAvailable(daysAvailable.filter((d) => d !== index));
    } else {
      setDaysAvailable([...daysAvailable, index]);
    }
  };

  const generatePlan = async () => {
    try {
      setLoading(true);

      const { data } = await API.post("/plans/generate", {
        goal,
        equipment,
        daysAvailable,
        riskScore: 0, // later can connect to dashboard summary
      });

      setGeneratedPlan(data);
    } catch (err) {
      alert(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    try {
      await API.post("/plans", generatedPlan);
      alert("Plan saved successfully");
      setCurrentPlan(generatedPlan);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const markCompleted = async (dayIndex) => {
    try {
      const { data } = await API.patch(`/plans/${dayIndex}/complete`);
      setCurrentPlan(data);
      setGeneratedPlan(null);
    } catch (err) {
      alert("Failed to mark complete");
    }
  };


  const planToDisplay = generatedPlan || currentPlan;

  return (
    <div className="plan-container">
      <h2>Weekly Plan Generator</h2>

      <div className="plan-controls">
        <div>
          <label>Goal:</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="general">General Fitness</option>
            <option value="strength">Strength</option>
            <option value="fatloss">Fat Loss</option>
          </select>
        </div>

        <div>
          <label>Equipment:</label>
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            <option value="home">Home</option>
            <option value="gym">Gym</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <label>Available Days:</label>
          <div className="day-selector">
            {DAYS.map((d, i) => (
              <button
                key={i}
                className={daysAvailable.includes(i) ? "active" : ""}
                onClick={() => toggleDay(i)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generatePlan} disabled={loading}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        {generatedPlan && (
          <button onClick={savePlan} className="save-btn">
            Save Plan
          </button>
        )}
      </div>

      {planToDisplay && (
        <div className="calendar-view">
          {planToDisplay.days.map((day) => (
            <div
              key={day.dayIndex}
              className={`calendar-card ${day.completed ? "completed" : ""}`}
            >
              <h3>{DAYS[day.dayIndex]}</h3>

              {day.completed && (
                <div className="completed-badge">✅ Completed</div>
              )}

              <p><strong>{day.title}</strong></p>
              <p>Focus: {day.focus}</p>
              <p>Intensity: {day.intensity}</p>
              <p>Duration: {day.duration} mins</p>

              <ul>
                {day.exercises.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>

              {!day.completed && (
                <button
                  className="complete-btn"
                  onClick={() => markCompleted(day.dayIndex)}
                >
                  Mark Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanBuilder;

