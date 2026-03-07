const mongoose = require("mongoose");

const videoSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "ended", "cancelled"],
      default: "active"
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    durationSec: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoSession", videoSessionSchema);