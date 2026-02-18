const mongoose = require("mongoose");

const daySchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true },
    title: { type: String, required: true },
    focus: { type: String, required: true },
    intensity: { type: String, required: true },
    duration: { type: Number, required: true },
    exercises: [{ type: String }],
    notes: { type: String, default: "" },

    // NEW
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const weeklyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    meta: {
      goal: { type: String, default: "general" },
      equipment: { type: String, default: "home" }, // home/gym/none
      daysAvailable: [{ type: Number }],            // [0..6]
      riskScore: { type: Number, default: 0 },
      generatedAt: { type: Date, default: Date.now },
    },
    days: { type: [daySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyPlan", weeklyPlanSchema);
