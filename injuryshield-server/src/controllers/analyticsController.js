const Workout = require("../models/Workout");
const Checkin = require("../models/Checkin");
const User = require("../models/User");
const { computeACWR } = require("../utils/acwr");
const { detectOvertraining } = require("../utils/overtraining");
const { calculateRisk } = require("../utils/risk");
const { buildAcwrTrend } = require("../utils/acwrTrend");


exports.getSummary = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });
    const checkins = await Checkin.find({ user: req.user._id }).sort({ date: 1 });

    const latestCheckin = checkins.length ? checkins[checkins.length - 1] : null;

    const acwrData = computeACWR(workouts);
    const overtraining = detectOvertraining(workouts);
    const riskScore = calculateRisk(acwrData, latestCheckin);

    const weeklyLoad = workouts.reduce((sum, w) => sum + Number(w.load || 0), 0);

    res.json({
      weeklyLoad,
      acwrData,
      riskScore,
      overtraining,
      workoutsCount: workouts.length,
      checkinsCount: checkins.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAcwrTrend = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });

    const trend = buildAcwrTrend(workouts, 14);

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsersSummary = async (req, res) => {
  if ((req.user.role || "").toLowerCase()!== "coach"){
    return res.status(403).json({ message: "Access denied" });
  }

  const users = await User.find().select("-password");

  const summaries = await Promise.all(
    users.map(async (user) => {
      const workouts = await Workout.find({ user: user._id });

      const totalLoad = workouts.reduce((sum, w) => sum + w.load, 0);

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        workoutsCount: workouts.length,
        totalLoad
      };
    })
  );

  res.json(summaries);
};

