const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateAthleteReport,
  getMyReportHistory,
  getCoachAthleteReports
} = require("../controllers/geminiController");

router.get("/athlete-report", protect, generateAthleteReport);
router.get("/history", protect, getMyReportHistory);
router.get("/coach-reports/:athleteId", protect, getCoachAthleteReports);

module.exports = router;