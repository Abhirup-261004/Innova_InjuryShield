const WeeklyPlan = require("../models/WeeklyPlan");
const { generateWeeklyPlan } = require("../utils/planGenerator");

exports.generatePlan = async (req, res) => {
  try {
    const { goal, equipment, daysAvailable, riskScore } = req.body;

    const result = generateWeeklyPlan({
      goal,
      equipment,
      daysAvailable,
      riskScore,
    });

    res.json({
      meta: {
        goal: result.goal,
        equipment: result.equipment,
        daysAvailable: result.daysAvailable,
        riskScore: result.riskScore,
        generatedAt: new Date(),
      },
      days: result.days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.savePlan = async (req, res) => {
  try {
    const { meta, days } = req.body;

    // deactivate old plans
    await WeeklyPlan.updateMany({ user: req.user._id, isActive: true }, { isActive: false });

    const plan = await WeeklyPlan.create({
      user: req.user._id,
      meta: {
        goal: meta?.goal || "general",
        equipment: meta?.equipment || "home",
        daysAvailable: meta?.daysAvailable || [],
        riskScore: Number(meta?.riskScore || 0),
        generatedAt: meta?.generatedAt ? new Date(meta.generatedAt) : new Date(),
      },
      days: Array.isArray(days) ? days : [],
      isActive: true,
    });

    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCurrentPlan = async (req, res) => {
  try {
    const plan = await WeeklyPlan.findOne({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    if (!plan) return res.status(404).json({ message: "No active plan found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markDayCompleted = async (req, res) => {
  try {
    const { dayIndex } = req.params;

    const plan = await WeeklyPlan.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!plan) return res.status(404).json({ message: "No active plan found" });

    const day = plan.days.find(d => d.dayIndex === Number(dayIndex));
    if (!day) return res.status(404).json({ message: "Day not found" });

    day.completed = true;
    day.completedAt = new Date();

    await plan.save();

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

