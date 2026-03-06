const mongoose = require("mongoose");

const coachRatingSchema = new mongoose.Schema(
  {
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

coachRatingSchema.index({ coach: 1, athlete: 1 }, { unique: true });

module.exports = mongoose.model("CoachRating", coachRatingSchema);