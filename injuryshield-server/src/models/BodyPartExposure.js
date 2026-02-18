const mongoose = require("mongoose");

const bodyPartExposureSchema = new mongoose.Schema(
  {
    sessionType: { type: String, required: true, unique: true },
    exposure: {
      shoulder: { type: Number, default: 0 },
      knee: { type: Number, default: 0 },
      lowerBack: { type: Number, default: 0 },
      ankle: { type: Number, default: 0 },
      elbow: { type: Number, default: 0 },
      hip: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BodyPartExposure", bodyPartExposureSchema);
