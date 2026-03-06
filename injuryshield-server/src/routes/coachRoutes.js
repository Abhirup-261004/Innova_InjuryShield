const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getAllCoaches,
  assignCoach,
  getMyCoach,
  rateCoach,
  getCoachReviews,
  getCoachTraineesDashboard,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getCoachProfileById,
  updateCoachProfile
} = require("../controllers/coachController");

router.get("/", protect, getAllCoaches);
router.get("/my-coach", protect, getMyCoach);
router.post("/assign", protect, assignCoach);
router.post("/rate", protect, rateCoach);
router.get("/reviews/:coachId", protect, getCoachReviews);
router.get("/coach-dashboard", protect, getCoachTraineesDashboard);
router.get("/pending-requests", protect, getPendingRequests);
router.post("/approve-request", protect, approveRequest);
router.post("/reject-request", protect, rejectRequest);
router.get("/profile/:coachId", protect, getCoachProfileById);
router.put("/profile", protect, updateCoachProfile);


module.exports = router;