import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import "../css/Workouts.css";
import EditWorkoutModal from "../components/EditWorkoutModal";


function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);


  const limit = 10;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("limit", String(limit));
    params.set("sort", sort);
    if (type) params.set("type", type);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  }, [pagination.page, type, startDate, endDate, sort]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await API.get(`/workouts?${queryString}`);
      setWorkouts(data.workouts || []);
      setPagination((p) => ({
        ...p,
        page: data.pagination?.page ?? 1,
        totalPages: data.pagination?.totalPages ?? 1,
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const onApplyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const onClear = () => {
    setType("");
    setStartDate("");
    setEndDate("");
    setSort("desc");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openEdit = (w) => {
  setSelectedWorkout(w);
  setEditOpen(true);
};

const closeEdit = () => {
  setEditOpen(false);
  setSelectedWorkout(null);
};

const saveEdit = async (payload) => {
  try {
    await API.put(`/workouts/${selectedWorkout._id}`, payload);
    closeEdit();
    fetchWorkouts(); // refresh list
  } catch (err) {
    alert(err?.response?.data?.message || "Failed to update workout");
  }
};

const deleteWorkout = async (id) => {
  const ok = confirm("Delete this workout?");
  if (!ok) return;

  try {
    await API.delete(`/workouts/${id}`);
    fetchWorkouts();
  } catch (err) {
    alert(err?.response?.data?.message || "Failed to delete workout");
  }
};


  const prevDisabled = pagination.page <= 1;
  const nextDisabled = pagination.page >= pagination.totalPages;

  return (
    <div className="workouts-container">
      <h2>Workout History</h2>

      <div className="workouts-filters">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Run">Run</option>
          <option value="Gym">Gym</option>
          <option value="Cycling">Cycling</option>
          <option value="Yoga">Yoga</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End date"
        />

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>

        <button onClick={onApplyFilters}>Apply</button>
        <button onClick={onClear}>Clear</button>
      </div>

      {loading ? (
        <p>Loading workouts...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : workouts.length === 0 ? (
        <p>No workouts found.</p>
      ) : (
        <>
          <div className="workout-list">
            {workouts.map((w) => (
              <div key={w._id} className="workout-card">
                <h3>{w.type}</h3>
                <p>Duration: {w.duration} mins</p>
                <p>RPE: {w.rpe}</p>
                <p>Load: {w.load}</p>
                <p>Date: {new Date(w.date).toLocaleDateString()}</p>
                <div className="workout-actions">
                    <button onClick={() => openEdit(w)}>Edit</button>
                    <button onClick={() => deleteWorkout(w._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <EditWorkoutModal
            open={editOpen}
            onClose={closeEdit}
            workout={selectedWorkout}
            onSave={saveEdit}
          />

          <div className="pagination-bar">
            <button
              disabled={prevDisabled}
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(p.page - 1, 1) }))
              }
            >
              Prev
            </button>

            <span>
              Page {pagination.page} / {pagination.totalPages}
            </span>

            <button
              disabled={nextDisabled}
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(p.page + 1, p.totalPages),
                }))
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Workouts;

