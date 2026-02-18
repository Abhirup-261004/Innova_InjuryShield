// src/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getSummary,
  getAcwrTrend,
  getAcwrEwmaTrend,     // ✅ add
  getAllUsersSummary,
} = require("../controllers/analyticsController");

router.get("/summary", protect, getSummary);
router.get("/acwr-trend", protect, getAcwrTrend);

// ✅ NEW EWMA endpoint:
router.get("/acwr-ewma", protect, getAcwrEwmaTrend);

// coach-only route (from upgrade #1)
router.get("/coach",protect, getAllUsersSummary);

module.exports = router;

