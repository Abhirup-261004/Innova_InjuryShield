import { useState } from "react";
import "../css/Checkin.css";
import { useInjury } from "../contexts/InjuryContext";


function DailyCheckin() {

  const { addCheckin } = useInjury();

  const [form, setForm] = useState({
    sleep: "",
    fatigue: 5,
    soreness: 5,
    stress: 5,
    pain: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
        e.preventDefault();
        addCheckin({
            sleep: Number(form.sleep),
            fatigue: Number(form.fatigue),
            soreness: Number(form.soreness),
            stress: Number(form.stress),
            pain: form.pain
        });
        alert("Check-in Saved!");
    };


  return (
    <div className="checkin-container">
      <form className="checkin-form" onSubmit={handleSubmit}>
        <h2>Daily Recovery Check-in</h2>

        <input
          type="number"
          name="sleep"
          placeholder="Sleep Hours"
          value={form.sleep}
          onChange={handleChange}
          required
        />

        <label>Fatigue: {form.fatigue}</label>
        <input type="range" name="fatigue" min="1" max="10"
          value={form.fatigue} onChange={handleChange} />

        <label>Soreness: {form.soreness}</label>
        <input type="range" name="soreness" min="1" max="10"
          value={form.soreness} onChange={handleChange} />

        <label>Stress: {form.stress}</label>
        <input type="range" name="stress" min="1" max="10"
          value={form.stress} onChange={handleChange} />

        <input
          type="text"
          name="pain"
          placeholder="Pain Location (optional)"
          value={form.pain}
          onChange={handleChange}
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default DailyCheckin;
