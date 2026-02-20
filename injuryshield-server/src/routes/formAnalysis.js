const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const FormAnalysis = require("../models/FormAnalysis");
const { protect } = require("../middleware/authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze", protect, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No video uploaded" });

    const PY_URL = process.env.POSTURE_AI_URL; // e.g. https://posture-ai.onrender.com
    if (!PY_URL) return res.status(500).json({ message: "POSTURE_AI_URL not set" });

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(`${PY_URL}/analyze`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    const saved = await FormAnalysis.create({
      user: req.user._id,
      originalName: req.file.originalname,
      result: data,
    });

    res.json({ ok: true, analysisId: saved._id, result: data });
  } catch (err) {
    res.status(500).json({
      message: err.response?.data?.detail || err.message || "Analysis failed",
    });
  }
});

router.get("/history", protect, async (req, res) => {
  const items = await FormAnalysis.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(items);
});

module.exports = router;