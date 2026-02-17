const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getSummary } = require("../controllers/analyticsController");
const { getAcwrTrend } = require("../controllers/analyticsController");
const { getAllUsersSummary} = require("../controllers/analyticsController");

router.get("/summary", protect, getSummary);
router.get("/acwr-trend", protect, getAcwrTrend);

router.get("/coach", protect, getAllUsersSummary);

module.exports = router;
