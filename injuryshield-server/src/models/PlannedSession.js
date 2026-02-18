const mongoose = require("mongoose");

const plannedSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    sessionType: { type: String, required: true }, // e.g. "Strength Upper"
    intensityLevel: {
      type: String,
      enum: ["Easy", "Normal", "Hard"],
      default: "Normal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlannedSession", plannedSessionSchema);
