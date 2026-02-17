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
    age: Number,
    weight: Number,
    goal: {
      type: String,
      enum: ["Fat Loss", "Muscle Gain", "Strength", "Endurance"]
    },
    experienceLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"]
    },
    role: {
        type: String,
        enum: ["user", "coach"],
        default: "user"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
