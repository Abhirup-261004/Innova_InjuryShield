const Workout = require("../models/Workout");
const Checkin = require("../models/Checkin");
const User = require("../models/User");
const { computeACWR } = require("../utils/acwr");
const { detectOvertraining } = require("../utils/overtraining");
const { calculateRisk } = require("../utils/risk");
const { buildAcwrTrend } = require("../utils/acwrTrend");
const { ewmaSeries } = require("../utils/ewma");

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

// helper: yyyy-mm-dd (local safe enough for trend chart)
const toDay = (d) => new Date(d).toISOString().split("T")[0];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
};

const rangeDays = (startDay, endDay) => {
  const days = [];
  for (let cur = startDay; cur <= endDay; cur = addDays(cur, 1)) days.push(cur);
  return days;
};

// ✅ NEW: EWMA-based ACWR trend (user-specific)
exports.getAcwrEwmaTrend = async (req, res) => {
  try {
    // You can tweak these
    const acuteWindow = Number(req.query.acute || 7);     // default 7
    const chronicWindow = Number(req.query.chronic || 28); // default 28
    const lookbackDays = Number(req.query.lookback || 60); // default 60 days

    const workouts = await Workout.find({ user: req.user._id }).sort({ date: 1 });

    if (!workouts.length) return res.json([]);

    // Aggregate load per day
    const dayLoad = {};
    for (const w of workouts) {
      const day = toDay(w.date);
      dayLoad[day] = (dayLoad[day] || 0) + Number(w.load || 0);
    }

    // Build continuous daily series
    const lastWorkoutDay = toDay(workouts[workouts.length - 1].date);
    const startDay = addDays(lastWorkoutDay, -lookbackDays);
    const days = rangeDays(startDay, lastWorkoutDay);

    const loads = days.map((d) => dayLoad[d] || 0);

    // EWMA acute & chronic
    const acute = ewmaSeries(loads, acuteWindow, 0);
    const chronic = ewmaSeries(loads, chronicWindow, 0);

    const trend = days.map((day, i) => {
      const a = acute[i];
      const c = chronic[i];

      // avoid divide-by-zero spikes
      const acwr = c > 0.000001 ? a / c : 0;

      // Optional: risk label bands (common-ish)
      let band = "unknown";
      if (c <= 0.000001) band = "no-baseline";
      else if (acwr < 0.8) band = "under";
      else if (acwr <= 1.3) band = "optimal";
      else if (acwr <= 1.5) band = "caution";
      else band = "high";

      return {
        day,
        load: loads[i],
        acute: Number(a.toFixed(2)),
        chronic: Number(c.toFixed(2)),
        acwr: Number(acwr.toFixed(2)),
        band,
      };
    });

    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

