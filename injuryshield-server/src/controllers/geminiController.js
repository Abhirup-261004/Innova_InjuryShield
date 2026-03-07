const Workout = require("../models/Workout");
const Checkin = require("../models/Checkin");
const FormAnalysis = require("../models/FormAnalysis");
const AthleteReport = require("../models/AthleteReport");
const User = require("../models/User");
const { generateInjuryReport } = require("../utils/geminiService");

exports.generateAthleteReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    const workouts = await Workout.find({ user: userId })
      .sort({ date: -1 })
      .limit(30);

    const latestCheckin = await Checkin.findOne({ user: userId }).sort({
      date: -1
    });

    const latestPosture = await FormAnalysis.findOne({ user: userId }).sort({
      createdAt: -1
    });

    const acuteLoad = workouts
      .filter((w) => {
        const diff =
          (Date.now() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      })
      .reduce((sum, w) => sum + (w.load || 0), 0);

    const chronicLoad =
      workouts
        .filter((w) => {
          const diff =
            (Date.now() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 28;
        })
        .reduce((sum, w) => sum + (w.load || 0), 0) / 4;

    const acwr =
      chronicLoad > 0 ? Number((acuteLoad / chronicLoad).toFixed(2)) : 0;

    const weeklyLoad = acuteLoad;

    const postureRisk = latestPosture?.result?.risk?.zone || null;
    const postureFlags =
      latestPosture?.result?.risk?.flags?.map((f) => f.key) || [];

    const payload = {
      athleteName: user.name,
      acwr,
      acuteLoad,
      chronicLoad,
      weeklyLoad,
      sleep: latestCheckin?.sleep ?? null,
      fatigue: latestCheckin?.fatigue ?? null,
      soreness: latestCheckin?.soreness ?? null,
      stress: latestCheckin?.stress ?? null,
      painAreas: latestCheckin?.painAreas || [],
      overtraining: acwr > 1.5,
      postureRisk,
      postureFlags
    };

    const report = await generateInjuryReport(payload);

    const savedReport = await AthleteReport.create({
      user: userId,
      metrics: payload,
      report
    });

    res.json({
      ok: true,
      reportId: savedReport._id,
      metrics: payload,
      report
    });
  } catch (error) {
    console.error("Gemini report error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate report"
    });
  }
};

exports.getMyReportHistory = async (req, res) => {
  try {
    const reports = await AthleteReport.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCoachAthleteReports = async (req, res) => {
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
    });

    if (!athlete) {
      return res
        .status(404)
        .json({ message: "Athlete not found under this coach" });
    }

    const reports = await AthleteReport.find({ user: athleteId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};