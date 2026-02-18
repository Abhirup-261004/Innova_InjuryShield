const mongoose = require("mongoose");

const recoveryLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    recoveryIndex: { type: Number, min: 0, max: 100, required: true }, // RI (0–100) :contentReference[oaicite:1]{index=1}
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecoveryLog", recoveryLogSchema);
