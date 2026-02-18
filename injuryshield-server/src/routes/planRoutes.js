const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { generatePlan, savePlan, getCurrentPlan, markDayCompleted } = require("../controllers/planController");

router.post("/generate", protect, generatePlan);
router.post("/", protect, savePlan);
router.get("/current", protect, getCurrentPlan);
router.patch("/:dayIndex/complete", protect, markDayCompleted);


module.exports = router;
