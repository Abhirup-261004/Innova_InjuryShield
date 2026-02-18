const Workout = require("../models/Workout");

// Add workout
exports.addWorkout = async (req, res) => {
  try {
    const { type, duration, rpe, date, notes } = req.body;

    const load = Number(duration) * Number(rpe);

    const workout = await Workout.create({
      user: req.user._id,
      type,
      duration,
      rpe,
      load,
      notes: notes || "",
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workouts for logged user
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
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await Workout.findOne({ _id: id, user: req.user._id });
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    const allowedFields = ["type", "duration", "rpe", "date", "notes"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) workout[field] = req.body[field];
    });

    // If you store "load" in DB and want recalculation:
    // workout.load = (workout.duration || 0) * (workout.rpe || 0);

    const updated = await workout.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
