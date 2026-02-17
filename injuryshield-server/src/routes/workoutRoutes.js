const express = require("express");
const router = express.Router();
const { addWorkout, getWorkouts } = require("../controllers/workoutController");
const { protect } = require("../middleware/authMiddleware");
const { getWorkoutTrend } = require("../controllers/workoutController");

router.route("/")
  .post(protect, addWorkout)
  .get(protect, getWorkouts);

router.get("/trend", protect, getWorkoutTrend);


module.exports = router;
