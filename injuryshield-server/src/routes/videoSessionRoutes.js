const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  startOrJoinSession,
  getMySessions,
  getSessionById,
  endSession
} = require("../controllers/videoSessionController");

router.post("/start", protect, startOrJoinSession);
router.get("/my", protect, getMySessions);
router.get("/:id", protect, getSessionById);
router.post("/:id/end", protect, endSession);

module.exports = router;