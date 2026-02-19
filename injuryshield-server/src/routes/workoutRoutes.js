const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  addWorkout,
  getWorkouts,
  updateWorkout,
  deleteWorkout,
  getWorkoutTrend
} = require("../controllers/workoutController");

// ✅ IMPORTANT: define /trend BEFORE /:id
router.get("/trend", protect, getWorkoutTrend);

// List + Create
router.route("/")
  .get(protect, getWorkouts)
  .post(protect, addWorkout);

// Update + Delete
router.route("/:id")
  .put(protect, updateWorkout)
  .delete(protect, deleteWorkout);

module.exports = router;
