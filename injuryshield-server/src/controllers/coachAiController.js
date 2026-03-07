const User = require("../models/User");
const Workout = require("../models/Workout");
const Checkin = require("../models/Checkin");
const FormAnalysis = require("../models/FormAnalysis");
const AthleteReport = require("../models/AthleteReport");
const { generateCoachInsight } = require("../services/coachAiService");

function daysAgo(dateValue) {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

exports.getCoachInsightForAthlete = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { athleteId } = req.params;

    const athlete = await User.findOne({
      _id: athleteId,
      role: "user",
      coachAssigned: req.user._id,
      coachRequestStatus: "approved"
    }).select("name email goal experienceLevel");

    if (!athlete) {
      return res.status(404).json({ message: "Athlete not found under this coach" });
    }

    const workouts = await Workout.find({ user: athleteId }).sort({ date: -1 }).limit(60);
    const latestCheckin = await Checkin.findOne({ user: athleteId }).sort({ date: -1 });
    const latestPosture = await FormAnalysis.findOne({ user: athleteId }).sort({ createdAt: -1 });
    const latestAiReport = await AthleteReport.findOne({ user: athleteId }).sort({ createdAt: -1 });

    const acuteLoad = workouts
      .filter((w) => daysAgo(w.date) <= 7)
      .reduce((sum, w) => sum + (w.load || 0), 0);

    const chronicLoadRaw = workouts
      .filter((w) => daysAgo(w.date) <= 28)
      .reduce((sum, w) => sum + (w.load || 0), 0);

    const chronicLoad = Number((chronicLoadRaw / 4).toFixed(2));

    const acwr =
      chronicLoad > 0 ? Number((acuteLoad / chronicLoad).toFixed(2)) : 0;

    const workoutsLast28Days = workouts.filter((w) => daysAgo(w.date) <= 28);
    const workoutsLast14Days = workouts.filter((w) => daysAgo(w.date) <= 14);

    const totalWorkoutsLast28Days = workoutsLast28Days.length;

    const avgRpeLast14Days =
      workoutsLast14Days.length > 0
        ? Number(
            (
              workoutsLast14Days.reduce((sum, w) => sum + (w.rpe || 0), 0) /
              workoutsLast14Days.length
            ).toFixed(1)
          )
        : 0;

    const painAreas = latestCheckin?.painAreas || [];
    const postureRisk = latestPosture?.result?.risk?.zone || null;
    const postureFlags =
      latestPosture?.result?.risk?.flags?.map((f) => f.key) || [];

    const payload = {
      athleteName: athlete.name,
      goal: athlete.goal,
      experienceLevel: athlete.experienceLevel,
      acuteLoad,
      chronicLoad,
      acwr,
      weeklyLoad: acuteLoad,
      totalWorkoutsLast28Days,
      avgRpeLast14Days,
      lastWorkout: workouts[0]
        ? {
            type: workouts[0].type,
            duration: workouts[0].duration,
            rpe: workouts[0].rpe,
            load: workouts[0].load,
            date: workouts[0].date
          }
        : null,
      latestCheckin: latestCheckin
        ? {
            sleep: latestCheckin.sleep,
            fatigue: latestCheckin.fatigue,
            soreness: latestCheckin.soreness,
            stress: latestCheckin.stress
          }
        : null,
      painAreas,
      postureRisk,
      postureFlags,
      previousAiSummary: latestAiReport?.report?.summary || null
    };

    console.log("Coach AI payload:", payload);
    const insight = await generateCoachInsight(payload);

    return res.json({
      ok: true,
      athlete: {
        _id: athlete._id,
        name: athlete.name,
        email: athlete.email
      },
      metrics: payload,
      insight
    });
  } catch (error) {
    console.error("Coach AI insight error FULL:", error);
    console.error("Coach Ai insight message:", error.message);
    console.error("Coach Ai insight stack:", error.stack);
    return res.status(500).json({
      message: error.message || "Failed to generate coach insight"
    });
  }
};