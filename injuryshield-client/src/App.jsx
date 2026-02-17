import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DailyCheckin from "./pages/DailyCheckin";
import AddWorkout from "./pages/AddWorkout";
import Workouts from "./pages/Workouts";
import WeeklyPlan from "./pages/WeeklyPlan";
import ProtectedRoute from "./components/ProtectedRoute";
import CoachDashboard from "./pages/CoachDashboard";


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/checkin" element={<DailyCheckin />} />
        <Route path="/workouts/new" element={<AddWorkout />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/plan" element={<WeeklyPlan />} />
        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRoles={["coach"]}>
              <CoachDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;