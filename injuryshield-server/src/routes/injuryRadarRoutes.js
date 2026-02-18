const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { predict } = require("../controllers/injuryRadarController");

router.post("/predict", protect, predict);

module.exports = router;
