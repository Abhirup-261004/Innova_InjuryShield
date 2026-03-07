import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DailyCheckin from "./pages/DailyCheckin";
import AddWorkout from "./pages/AddWorkout";
import Workouts from "./pages/Workouts";
import WeeklyPlanBuilder from "./pages/WeeklyPlanBuilder";
import ProtectedRoute from "./components/ProtectedRoute";
import CoachDashboard from "./pages/CoachDashboard";
import InjuryRadar from "./pages/InjuryRadar";
import ChatPage from "./pages/ChatPage";
import FormAnalysis from "./pages/FormAnalysis";
import PostureAnalysis from "./pages/PostureAnalysis";
import ChooseCoach from "./pages/ChooseCoach";
import RateCoach from "./pages/RateCoach";
import CoachProfile from "./pages/CoachProfile";
import EditCoachProfile from "./pages/EditCoachProfile";
import AthleteReport from "./pages/AthleteReport";
import ReportHistory from "./pages/ReportHistory";
import ReportDetails from "./pages/ReportDetails";
import CoachAthleteReports from "./pages/CoachAthleteReports";

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
        <Route path="/checkin" element={<ProtectedRoute><DailyCheckin /></ProtectedRoute>} />
        <Route path="/workouts/new" element={<ProtectedRoute><AddWorkout /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />

        <Route
          path="/plan-builder"
          element={
            <ProtectedRoute>
              <WeeklyPlanBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/injury-radar" 
          element={
            <ProtectedRoute>
              <InjuryRadar />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/coach"
          element={
            <ProtectedRoute allowedRoles={["coach"]}>
              <CoachDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form-analysis"
          element={
            <ProtectedRoute>
              <FormAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posture-analysis"
          element={
            <ProtectedRoute>
              <PostureAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/choose-coach"
          element={
            <ProtectedRoute>
              <ChooseCoach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rate-coach"
          element={
            <ProtectedRoute>
              <RateCoach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach-profile/:coachId"
          element={
            <ProtectedRoute>
              <CoachProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-coach-profile"
          element={
            <ProtectedRoute allowedRoles={["coach"]}>
              <EditCoachProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/athlete-report"
          element={
            <ProtectedRoute>
              <AthleteReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-history"
          element={
            <ProtectedRoute>
              <ReportHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-details/:reportId"
          element={
            <ProtectedRoute>
              <ReportDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach-athlete-reports/:athleteId"
          element={
            <ProtectedRoute allowedRoles={["coach"]}>
              <CoachAthleteReports />
            </ProtectedRoute>
          }
        />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;