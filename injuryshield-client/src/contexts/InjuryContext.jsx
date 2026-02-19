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
  try {
    const { data } = await API.get("/analytics/summary");
    setSummary(data);

    const trendRes = await API.get("/analytics/acwr-trend");
    setAcwrTrend(trendRes.data);

    const workoutTrendRes = await API.get("/workouts/trend");
    setWorkoutTrend(workoutTrendRes.data);

    const workoutsRes = await API.get("/workouts");
    setWorkouts(workoutsRes.data?.workouts ?? workoutsRes.data ?? []);
  } catch (error) {
    // important: don’t keep dashboard stuck forever
    setSummary({ weeklyLoad: 0, acwrData: { acuteLoad: 0, chronicLoad: 0, acwr: 0 }, riskScore: 0, overtraining: { isOvertraining: false, reasons: [] }});
    console.log("Auth/API error:", error?.response?.data || error.message);
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
