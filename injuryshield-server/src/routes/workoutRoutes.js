const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addWorkout,
  getWorkouts,
  updateWorkout,
  deleteWorkout,
} = require("../controllers/workoutController");

// List + Create
router.route("/")
  .get(protect, getWorkouts)
  .post(protect, addWorkout);

// Update + Delete (optional, but useful)
router.route("/:id")
  .put(protect, updateWorkout)
  .delete(protect, deleteWorkout);

module.exports = router;
