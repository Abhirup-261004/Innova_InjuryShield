const Checkin = require("../models/Checkin");

exports.addCheckin = async (req, res) => {
  try {
    const { sleep, fatigue, soreness, stress, painAreas } = req.body;

    const checkin = await Checkin.create({
      user: req.user._id,
      sleep,
      fatigue,
      soreness,
      stress,
      painAreas
    });

    res.status(201).json(checkin);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find({ user: req.user._id }).sort({ date: 1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
