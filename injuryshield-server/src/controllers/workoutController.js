const Workout = require("../models/Workout");

// Add workout
exports.addWorkout = async (req, res) => {
  try {
    const { type, duration, rpe } = req.body;

    const load = duration * rpe;

    const workout = await Workout.create({
      user: req.user._id,
      type,
      duration,
      rpe,
      load
    });

    res.status(201).json(workout);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workouts for logged user
exports.getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkoutTrend = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });

    const trend = workouts.map((w) => ({
      date: w.date.toISOString().split("T")[0],
      load: w.load
    }));

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
