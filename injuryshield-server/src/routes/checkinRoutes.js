const express = require("express");
const router = express.Router();
const { addCheckin, getCheckins } = require("../controllers/checkinController");
const { protect } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, addCheckin)
  .get(protect, getCheckins);

module.exports = router;
