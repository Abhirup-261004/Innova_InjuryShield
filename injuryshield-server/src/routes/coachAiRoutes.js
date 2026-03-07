const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getCoachInsightForAthlete } = require("../controllers/coachAiController");

router.get("/insight/:athleteId", protect, getCoachInsightForAthlete);

module.exports = router;