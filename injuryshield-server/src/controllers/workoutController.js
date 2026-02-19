// src/controllers/workoutController.js
const Workout = require("../models/Workout");

// Small helper to keep date handling consistent
const parseDate = (value) => {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
};

// ✅ Add workout
exports.addWorkout = async (req, res) => {
  try {
    const { type, duration, rpe, date, notes } = req.body;

    if (!type) return res.status(400).json({ message: "type is required" });

    const dur = Number(duration);
    const intensity = Number(rpe);

    if (!Number.isFinite(dur) || dur <= 0)
      return res.status(400).json({ message: "duration must be a positive number" });

    if (!Number.isFinite(intensity) || intensity <= 0)
      return res.status(400).json({ message: "rpe must be a positive number" });

    const load = dur * intensity;

    const workout = await Workout.create({
      user: req.user._id,
      type,
      duration: dur,
      rpe: intensity,
      load,
      notes: notes || "",
      date: parseDate(date),
    });

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all workouts (with pagination + filters)
exports.getWorkouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
      sort = "desc", // desc = newest first
    } = req.query;

    const query = { user: req.user._id };

    if (type) query.type = type;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);

      // If both are invalid dates, remove filter
      if (
        (startDate && isNaN(new Date(startDate).getTime())) &&
        (endDate && isNaN(new Date(endDate).getTime()))
      ) {
        delete query.date;
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const total = await Workout.countDocuments(query);

    const workouts = await Workout.find(query)
      .sort({ date: sort === "asc" ? 1 : -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      workouts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update workout (AND recalc load if duration/rpe changes)
exports.updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await Workout.findOne({ _id: id, user: req.user._id });
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    const allowedFields = ["type", "duration", "rpe", "date", "notes"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) workout[field] = req.body[field];
    });

    // Normalize numbers (if provided)
    if (req.body.duration !== undefined) {
      const dur = Number(workout.duration);
      if (!Number.isFinite(dur) || dur <= 0) {
        return res.status(400).json({ message: "duration must be a positive number" });
      }
      workout.duration = dur;
    }

    if (req.body.rpe !== undefined) {
      const intensity = Number(workout.rpe);
      if (!Number.isFinite(intensity) || intensity <= 0) {
        return res.status(400).json({ message: "rpe must be a positive number" });
      }
      workout.rpe = intensity;
    }

    if (req.body.date !== undefined) {
      workout.date = parseDate(workout.date);
    }

    // ✅ Recalculate load when duration/rpe changes (critical for ACWR & charts)
    if (req.body.duration !== undefined || req.body.rpe !== undefined) {
      workout.load = Number(workout.duration || 0) * Number(workout.rpe || 0);
    }

    const updated = await workout.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete workout
exports.deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await Workout.findOne({ _id: id, user: req.user._id });
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    await workout.deleteOne();
    res.json({ message: "Workout deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Workout load trend (for charts)
exports.getWorkoutTrend = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });

    const trend = workouts.map((w) => ({
      date: w.date.toISOString().split("T")[0],
      load: Number(w.load || 0),
      type: w.type,
    }));

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
