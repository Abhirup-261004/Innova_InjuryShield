const { randomUUID } = require("crypto");
const User = require("../models/User");
const VideoSession = require("../models/VideoSession");

function isApprovedPair({ currentUser, counterpart }) {
  if (!currentUser || !counterpart) return false;

  // athlete starts with assigned approved coach
  if (
    currentUser.role === "user" &&
    counterpart.role === "coach" &&
    String(currentUser.coachAssigned) === String(counterpart._id) &&
    currentUser.coachRequestStatus === "approved"
  ) {
    return true;
  }

  // coach starts with approved athlete
  if (
    currentUser.role === "coach" &&
    counterpart.role === "user" &&
    String(counterpart.coachAssigned) === String(currentUser._id) &&
    counterpart.coachRequestStatus === "approved"
  ) {
    return true;
  }

  return false;
}

exports.startOrJoinSession = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const { counterpartId } = req.body;

    if (!counterpartId) {
      return res.status(400).json({ message: "counterpartId is required" });
    }

    const counterpart = await User.findById(counterpartId);
    if (!counterpart) {
      return res.status(404).json({ message: "Counterpart not found" });
    }

    if (!isApprovedPair({ currentUser, counterpart })) {
      return res.status(403).json({
        message: "Live sessions are allowed only between approved coach-athlete pairs"
      });
    }

    const coachId =
      currentUser.role === "coach" ? currentUser._id : counterpart._id;
    const athleteId =
      currentUser.role === "user" ? currentUser._id : counterpart._id;

    let session = await VideoSession.findOne({
      coach: coachId,
      athlete: athleteId,
      status: "active"
    })
      .populate("coach", "name email role")
      .populate("athlete", "name email role");

    if (!session) {
      session = await VideoSession.create({
        roomId: randomUUID(),
        coach: coachId,
        athlete: athleteId,
        initiatedBy: currentUser._id,
        status: "active"
      });

      session = await VideoSession.findById(session._id)
        .populate("coach", "name email role")
        .populate("athlete", "name email role");
    }

    res.json(session);
  } catch (error) {
    console.error("startOrJoinSession error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMySessions = async (req, res) => {
  try {
    const sessions = await VideoSession.find({
      $or: [{ coach: req.user._id }, { athlete: req.user._id }]
    })
      .populate("coach", "name email role")
      .populate("athlete", "name email role")
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error("getMySessions error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await VideoSession.findById(req.params.id)
      .populate("coach", "name email role")
      .populate("athlete", "name email role");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isParticipant =
      String(session.coach._id) === String(req.user._id) ||
      String(session.athlete._id) === String(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(session);
  } catch (error) {
    console.error("getSessionById error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await VideoSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const isParticipant =
      String(session.coach) === String(req.user._id) ||
      String(session.athlete) === String(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (session.status !== "ended") {
      session.status = "ended";
      session.endedAt = new Date();
      session.durationSec = Math.max(
        0,
        Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
      );
      await session.save();
    }

    res.json({ message: "Session ended", session });
  } catch (error) {
    console.error("endSession error:", error);
    res.status(500).json({ message: error.message });
  }
};