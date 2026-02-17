import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../api/axios";

const InjuryContext = createContext();

export function InjuryProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [acwrTrend, setAcwrTrend] = useState([]);
  const [workoutTrend, setWorkoutTrend] = useState([]);
  const [workouts, setWorkouts] = useState([]);


  // Helper: get token safely
  const getToken = () => {
    const stored = localStorage.getItem("userInfo");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.token || null;
    } catch {
      return null;
    }
  };

  const fetchSummary = useCallback(async () => {
    const token = getToken();
    if (!token) return; // ✅ don't hit protected endpoints

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const { data } = await API.get("/analytics/summary", config);
      setSummary(data);

      const trendRes = await API.get("/analytics/acwr-trend", config);
      setAcwrTrend(trendRes.data);

      const workoutTrendRes = await API.get("/workouts/trend", config);
      setWorkoutTrend(workoutTrendRes.data);

      const workoutsRes = await API.get("/workouts", config);
      setWorkouts(workoutsRes.data);
    } catch (error) {
      console.log("Not authenticated yet");
    }
  }, []);

  // ✅ Only fetch if logged in
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const addWorkout = async (workout) => {
    const token = getToken();
    if (!token) return;

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    await API.post("/workouts", workout, config);
    fetchSummary();
  };

  const addCheckin = async (checkin) => {
    const token = getToken();
    if (!token) return;

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    await API.post("/checkins", checkin, config);
    fetchSummary();
  };

  return (
    <InjuryContext.Provider
      value={{
        summary,
        acwrTrend,
        workoutTrend,
        workouts,
        addWorkout,
        addCheckin,
        refresh: fetchSummary
      }}
    >
      {children}
    </InjuryContext.Provider>
  );
}

export const useInjury = () => useContext(InjuryContext);
