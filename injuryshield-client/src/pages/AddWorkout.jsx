import { useState } from "react";
import { calculateLoad } from "../utils/loadCalculator";
import "../css/AddWorkout.css";
import { useInjury } from "../contexts/InjuryContext";

function AddWorkout() {

    const { addWorkout } = useInjury();


  const [form, setForm] = useState({
    type: "",
    duration: "",
    rpe: ""
  });

  const [load, setLoad] = useState(0);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    if (updated.duration && updated.rpe) {
      setLoad(calculateLoad(Number(updated.duration), Number(updated.rpe)));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await addWorkout({
      type: form.type,
      duration: Number(form.duration),
      rpe: Number(form.rpe),
    });
    alert("Workout Saved!");
  } catch {
    alert("Failed to save workout");
  }
};


  return (
    <div className="workout-container">
      <form className="workout-form" onSubmit={handleSubmit}>
        <h2>Add Workout</h2>

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          required
        >
          <option value="">Select Workout Type</option>
          <option value="Strength (Upper)">Strength (Upper)</option>
          <option value="Strength (Lower)">Strength (Lower)</option>
          <option value="Hypertrophy">Hypertrophy</option>
          <option value="HIIT">HIIT</option>
          <option value="Cardio">Cardio</option>
          <option value="Sport Practice">Sport Practice</option>
        </select>

        <input
          type="number"
          name="duration"
          placeholder="Duration (minutes)"
          value={form.duration}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="rpe"
          placeholder="Intensity (1-10)"
          min="1"
          max="10"
          value={form.rpe}
          onChange={handleChange}
          required
        />

        <p>Calculated Load: <strong>{load}</strong></p>

        <button type="submit">Save Workout</button>
      </form>
    </div>
  );
}

export default AddWorkout;
