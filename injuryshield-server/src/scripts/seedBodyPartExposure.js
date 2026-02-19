const mongoose = require("mongoose");
require("dotenv").config();

const BodyPartExposure = require("../models/BodyPartExposure");

const data = [
  // Example in PDF (you can expand) :contentReference[oaicite:2]{index=2}
  {
    sessionType: "Strength (Upper)",
    exposure: { shoulder: 0.8, knee: 0.1, lowerBack: 0.3, elbow: 0.4, hip: 0.1, ankle: 0.05 },
  },
  {
    sessionType: "Strength (Lower)",
    exposure: { shoulder: 0.2, knee: 0.8, lowerBack: 0.6, hip: 0.6, ankle: 0.5, elbow: 0.05 },
  },
  {
    sessionType: "Running",
    exposure: { shoulder: 0.05, knee: 0.8, lowerBack: 0.4, hip: 0.6, ankle: 0.9, elbow: 0.0 },
  },
  {
    sessionType: "Cycling",
    exposure: { shoulder: 0.1, knee: 0.7, lowerBack: 0.5, hip: 0.5, ankle: 0.3, elbow: 0.0 },
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await BodyPartExposure.deleteMany({});
  await BodyPartExposure.insertMany(data);
  console.log("✅ Seeded BodyPartExposure");
  process.exit(0);
})();
