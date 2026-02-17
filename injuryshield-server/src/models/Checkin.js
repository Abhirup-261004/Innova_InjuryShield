const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sleep: Number,
    fatigue: Number,
    soreness: Number,
    stress: Number,
    painAreas: [String],
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Checkin", checkinSchema);
