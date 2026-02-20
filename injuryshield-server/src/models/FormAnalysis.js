const mongoose = require("mongoose");

const formAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String },
    result: { type: Object, required: true }, // stores risk/summary/series
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormAnalysis", formAnalysisSchema);