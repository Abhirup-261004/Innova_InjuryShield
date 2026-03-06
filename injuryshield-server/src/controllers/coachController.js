const User = require("../models/User");
const CoachRating = require("../models/CoachRating");
const Workout = require("../models/Workout");

async function refreshCoachRating(coachId) {
  const ratings = await CoachRating.find({ coach: coachId });

  const count = ratings.length;
  const avg =
    count === 0
      ? 0
      : ratings.reduce((sum, r) => sum + r.rating, 0) / count;

  await User.findByIdAndUpdate(coachId, {
    avgRating: Number(avg.toFixed(1)),
    ratingsCount: count
  });
}

exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ role: "coach" })
      .select(
        "name email avgRating ratingsCount goal experienceLevel coachBio specialization experienceYears"
      )
      .sort({ avgRating: -1, ratingsCount: -1 });

    res.json(coaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignCoach = async (req, res) => {
  try {
    const athleteId = req.user._id;
    const { coachId } = req.body;

    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can select a coach" });
    }

    if (!coachId) {
      return res.status(400).json({ message: "coachId is required" });
    }

    const coach = await User.findOne({ _id: coachId, role: "coach" });
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    const athlete = await User.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({ message: "User not found" });
    }

    athlete.coachAssigned = coachId;
    athlete.coachRequestStatus = "pending";
    await athlete.save();

    const updatedUser = await User.findById(athleteId)
      .populate(
        "coachAssigned",
        "name email avgRating ratingsCount coachBio specialization experienceYears"
      )
      .select("-password");

    res.json({
      message: "Coach request sent successfully",
      user: updatedUser,
      coachRequestStatus: "pending"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyCoach = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "coachAssigned",
      "name email avgRating ratingsCount goal experienceLevel coachBio specialization experienceYears"
    );

    res.json({
      coach: user?.coachAssigned || null,
      coachRequestStatus: user?.coachRequestStatus || "none"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateCoach = async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can rate coaches" });
    }

    const athleteId = req.user._id;
    const { coachId, rating, review } = req.body;

    if (!coachId || !rating) {
      return res
        .status(400)
        .json({ message: "coachId and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const athlete = await User.findById(athleteId);

    if (
      !athlete?.coachAssigned ||
      String(athlete.coachAssigned) !== String(coachId) ||
      athlete.coachRequestStatus !== "approved"
    ) {
      return res.status(403).json({
        message: "You can rate only your approved assigned coach"
      });
    }

    const coach = await User.findOne({ _id: coachId, role: "coach" });
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    await CoachRating.findOneAndUpdate(
      { coach: coachId, athlete: athleteId },
      {
        coach: coachId,
        athlete: athleteId,
        rating,
        review: review || ""
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await refreshCoachRating(coachId);

    const updatedCoach = await User.findById(coachId).select(
      "name email avgRating ratingsCount goal experienceLevel coachBio specialization experienceYears"
    );

    res.json({
      message: "Coach rated successfully",
      coach: updatedCoach
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await User.find({
      role: "user",
      coachAssigned: req.user._id,
      coachRequestStatus: "pending"
    }).select("name email goal experienceLevel createdAt");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const trainee = await User.findOne({
      _id: userId,
      role: "user",
      coachAssigned: req.user._id,
      coachRequestStatus: "pending"
    });

    if (!trainee) {
      return res.status(404).json({ message: "Pending request not found" });
    }

    trainee.coachRequestStatus = "approved";
    await trainee.save();

    res.json({ message: "Trainee request approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const trainee = await User.findOne({
      _id: userId,
      role: "user",
      coachAssigned: req.user._id,
      coachRequestStatus: "pending"
    });

    if (!trainee) {
      return res.status(404).json({ message: "Pending request not found" });
    }

    trainee.coachAssigned = null;
    trainee.coachRequestStatus = "rejected";
    await trainee.save();

    res.json({ message: "Trainee request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCoachReviews = async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await User.findOne({ _id: coachId, role: "coach" });
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    const reviews = await CoachRating.find({ coach: coachId })
      .populate("athlete", "name email")
      .sort({ updatedAt: -1, createdAt: -1 });

    const formattedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.athlete
        ? {
            _id: r.athlete._id,
            name: r.athlete.name,
            email: r.athlete.email
          }
        : null
    }));

    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCoachTraineesDashboard = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const coachId = req.user._id;

    const athletes = await User.find({
      coachAssigned: coachId,
      role: "user",
      coachRequestStatus: "approved"
    }).select("name email goal experienceLevel createdAt");

    const athleteIds = athletes.map((a) => a._id);

    const workouts = await Workout.find({ user: { $in: athleteIds } }).sort({
      date: -1
    });

    const athleteSummaries = athletes.map((athlete) => {
      const athleteWorkouts = workouts.filter(
        (w) => String(w.user) === String(athlete._id)
      );

      const totalLoad = athleteWorkouts.reduce(
        (sum, w) => sum + (w.load || 0),
        0
      );

      const totalDuration = athleteWorkouts.reduce(
        (sum, w) => sum + (w.duration || 0),
        0
      );

      const avgRpe =
        athleteWorkouts.length === 0
          ? 0
          : Number(
              (
                athleteWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0) /
                athleteWorkouts.length
              ).toFixed(1)
            );

      return {
        _id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        goal: athlete.goal,
        experienceLevel: athlete.experienceLevel,
        workoutsCount: athleteWorkouts.length,
        totalWorkouts: athleteWorkouts.length,
        totalLoad,
        totalDuration,
        avgRpe,
        latestWorkout: athleteWorkouts[0] || null,
        workoutHistory: athleteWorkouts,
        recentWorkouts: athleteWorkouts.slice(0, 5)
      };
    });

    const ratings = await CoachRating.find({ coach: coachId })
      .populate("athlete", "name email")
      .sort({ createdAt: -1 });

    res.json({
      coach: {
        _id: req.user._id,
        name: req.user.name,
        avgRating: req.user.avgRating || 0,
        ratingsCount: req.user.ratingsCount || 0
      },
      totalAthletes: athletes.length,
      totalWorkouts: workouts.length,
      totalLoad: workouts.reduce((sum, w) => sum + (w.load || 0), 0),
      totalDuration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      athletes: athleteSummaries,
      ratings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCoachProfileById = async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await User.findOne({
      _id: coachId,
      role: "coach"
    }).select(
      "name email avgRating ratingsCount coachBio specialization experienceYears"
    );

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    const reviews = await CoachRating.find({ coach: coachId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({
      coach,
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCoachProfile = async (req, res) => {
  try {
    if (req.user.role !== "coach") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { coachBio, specialization, experienceYears } = req.body;

    const coach = await User.findById(req.user._id);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    coach.coachBio = coachBio ?? coach.coachBio;
    coach.specialization = specialization ?? coach.specialization;
    coach.experienceYears =
      experienceYears !== undefined
        ? Number(experienceYears)
        : coach.experienceYears;

    await coach.save();

    res.json({
      message: "Coach profile updated successfully",
      coach: {
        _id: coach._id,
        name: coach.name,
        email: coach.email,
        coachBio: coach.coachBio,
        specialization: coach.specialization,
        experienceYears: coach.experienceYears,
        avgRating: coach.avgRating,
        ratingsCount: coach.ratingsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
