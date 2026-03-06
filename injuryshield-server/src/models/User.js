const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "coach"],
      default: "user"
    },

    // athlete -> selected/requested coach
    coachAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    coachRequestStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none"
    },

    avgRating: {
      type: Number,
      default: 0
    },

    ratingsCount: {
      type: Number,
      default: 0
    },

    coachBio: {
      type: String,
      default: ""
    },

    specialization: {
      type: String,
      default: ""
    },

    experienceYears: {
      type: Number,
      default: 0
    },

    goal: {
      type: String,
      default: ""
    },

    experienceLevel: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);