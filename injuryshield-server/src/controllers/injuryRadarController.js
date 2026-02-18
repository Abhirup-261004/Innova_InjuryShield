const { predictBodyPartRisk } = require("../services/injuryRadarService");

exports.predict = async (req, res) => {
  try {
    const { bodyPart, painIntensity, plannedSessions } = req.body;

    if (!bodyPart) return res.status(400).json({ message: "bodyPart is required" });
    if (!Array.isArray(plannedSessions))
      return res.status(400).json({ message: "plannedSessions must be an array" });

    const result = await predictBodyPartRisk({
      userId: req.user._id,
      bodyPart,
      painIntensity: Number(painIntensity || 0),
      plannedSessions,
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Injury radar prediction failed" });
  }
};
