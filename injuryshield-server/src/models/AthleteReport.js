const mongoose = require("mongoose");

const athleteReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    metrics: {
      type: Object,
      required: true
    },
    report: {
      type: Object,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AthleteReport", athleteReportSchema);