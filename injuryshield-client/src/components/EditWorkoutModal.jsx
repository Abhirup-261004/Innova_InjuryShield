import { useEffect, useState } from "react";
import "../css/EditWorkoutModal.css";

export default function EditWorkoutModal({ open, onClose, workout, onSave }) {
  const [form, setForm] = useState({
    type: "",
    duration: "",
    rpe: "",
    date: "",
    notes: "",
  });

  useEffect(() => {
    if (!workout) return;
    setForm({
      type: workout.type || "",
      duration: workout.duration ?? "",
      rpe: workout.rpe ?? "",
      date: workout.date ? new Date(workout.date).toISOString().slice(0, 10) : "",
      notes: workout.notes || "",
    });
  }, [workout]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({
      type: form.type,
      duration: Number(form.duration),
      rpe: Number(form.rpe),
      date: form.date,
      notes: form.notes,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Workout</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="">Select Type</option>
            <option value="Run">Run</option>
            <option value="Gym">Gym</option>
            <option value="Cycling">Cycling</option>
            <option value="Yoga">Yoga</option>
            <option value="Other">Other</option>
          </select>

          <input
            name="duration"
            type="number"
            min="1"
            placeholder="Duration (mins)"
            value={form.duration}
            onChange={handleChange}
            required
          />

          <input
            name="rpe"
            type="number"
            min="1"
            max="10"
            placeholder="RPE (1-10)"
            value={form.rpe}
            onChange={handleChange}
            required
          />

          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />

          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
