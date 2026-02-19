// src/services/injuryRadarService.js
const Workout = require("../models/Workout");
const RecoveryLog = require("../models/RecoveryLog");
const BodyPartExposure = require("../models/BodyPartExposure");
const PlannedSession = require("../models/PlannedSession");

const intensityMultiplier = (lvl) => {
  if (lvl === "Easy") return 0.85;
  if (lvl === "Hard") return 1.15;
  return 1.0; // Normal
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

function categorize(prob) {
  if (prob >= 70) return "High";
  if (prob >= 40) return "Moderate";
  return "Low";
}

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// -------------------------
// 1) Compute AL (last 7d) and CL (28d baseline weekly load)
// -------------------------
async function computeAL_CL(userId) {
  const since28 = daysAgo(28);
  const workouts28 = await Workout.find({
    user: userId,
    date: { $gte: since28 },
  });

  const last7 = daysAgo(7);
  const workouts7 = workouts28.filter((w) => new Date(w.date) >= last7);

  const toLoad = (w) =>
    safeNum(
      w.load ??
        w.trainingLoad ??
        (safeNum(w.duration) * safeNum(w.rpe)) ??
        0
    );

  const AL = sum(workouts7.map(toLoad)); // last 7 days total
  const total28 = sum(workouts28.map(toLoad)); // last 28 days total
  const CL = total28 / 4; // baseline weekly load (~28 days / 4 weeks)

  return { AL, CL };
}

// -------------------------
// 2) Estimate planned load based on recent history by type
// -------------------------
async function estimatePlannedLoad(userId, plannedSessions) {
  const since28 = daysAgo(28);
  const workouts28 = await Workout.find({
    user: userId,
    date: { $gte: since28 },
  });

  // group by type
  const byType = {};
  for (const w of workouts28) {
    const t = w.type || w.sessionType || "Unknown";
    const l = safeNum(
      w.load ??
        w.trainingLoad ??
        (safeNum(w.duration) * safeNum(w.rpe)) ??
        0
    );
    if (!byType[t]) byType[t] = [];
    byType[t].push(l);
  }

  // average load per type
  const typeAvg = {};
  Object.keys(byType).forEach((t) => {
    typeAvg[t] = sum(byType[t]) / byType[t].length;
  });

  let plannedLoad = 0;
  const breakdown = [];

  for (const ps of plannedSessions || []) {
    const sessionType = ps.sessionType || ps.type || "Unknown";
    const intensityLevel = ps.intensityLevel || "Normal";

    // fallback if no history: 100 (tune as you wish)
    const base = safeNum(typeAvg[sessionType] ?? 100);

    const mult = intensityMultiplier(intensityLevel);
    const est = base * mult;

    plannedLoad += est;

    breakdown.push({
      date: ps.date,
      sessionType,
      intensityLevel,
      estimatedLoad: Math.round(est),
    });
  }

  return { plannedLoad, breakdown };
}

// -------------------------
// 3) Compute body-part load using exposure factors
// -------------------------
async function computeBodyPartLoad(plannedBreakdown, bodyPart) {
  const map = await BodyPartExposure.find({});
  const exposureMap = new Map(map.map((x) => [x.sessionType, x.exposure]));

  let localLoad = 0;
  const localBreakdown = [];

  for (const s of plannedBreakdown) {
    const exposure = exposureMap.get(s.sessionType)?.[bodyPart] ?? 0.1; // fallback small
    const partLoad = safeNum(s.estimatedLoad) * safeNum(exposure);

    localLoad += partLoad;

    localBreakdown.push({
      sessionType: s.sessionType,
      intensityLevel: s.intensityLevel,
      estimatedLoad: s.estimatedLoad,
      exposure,
      bodyPartLoad: Math.round(partLoad),
    });
  }

  return { localLoad, localBreakdown };
}

// -------------------------
// 4) Recovery penalty from latest RecoveryLog
// -------------------------
async function computeRecoveryPenalty(userId) {
  const latest = await RecoveryLog.findOne({ user: userId }).sort({ date: -1 });

  const RI = safeNum(latest?.recoveryIndex ?? 70); // default 70

  // normalized 0..1 (lower RI => higher penalty)
  const penalty = Math.max(0, (80 - RI) / 80); // RI >= 80 => 0 penalty

  return { RI, recoveryPenalty: penalty };
}

// -------------------------
// 5) Main prediction function
// -------------------------
async function predictBodyPartRisk({ userId, bodyPart, painIntensity, plannedSessions }) {
  // Compute recent baseline
  const { AL, CL } = await computeAL_CL(userId);

  // Estimate next-week planned training load
  const { plannedLoad, breakdown: plannedBreakdown } =
    await estimatePlannedLoad(userId, plannedSessions);

  /**
   * ✅ FIX 1:
   * plannedLoad represents NEXT 7 days load (weekly).
   * CL represents baseline weekly load.
   * Do NOT add past AL to planned load. That causes inflated ACWR and 100% predictions.
   */
  const CLsafe = Math.max(CL || 0, 50); // baseline floor (prevents exploding ratios for new users)

  // Predicted "future ACWR" as next-week load vs baseline weekly load
  const acwrPredicted = plannedLoad / CLsafe;

  /**
   * ✅ FIX 2:
   * Cap exponential growth so it doesn't always saturate to 100%
   */
  const acwrRiskFactor =
    acwrPredicted > 1.3 ? Math.min(5, Math.exp(acwrPredicted - 1.3)) : 1;

  // Body-part specific load for the planned sessions
  const { localLoad, localBreakdown } = await computeBodyPartLoad(
    plannedBreakdown,
    bodyPart
  );

  const stressRatio = localLoad / CLsafe;
  const localStressFactor =
    stressRatio > 1.2 ? Math.min(5, Math.exp(stressRatio - 1.2)) : 1;

  // Recovery + pain
  const { RI, recoveryPenalty } = await computeRecoveryPenalty(userId);
  const pain = safeNum(painIntensity);
  const painFactor = Math.min(10, Math.max(0, pain)) / 10;

  // Weighted risk score (tunable)
  let riskScore =
    0.4 * acwrRiskFactor +
    0.25 * localStressFactor +
    0.2 * recoveryPenalty +
    0.15 * painFactor;

  /**
   * ✅ FIX 3:
   * Clamp riskScore to avoid always-100 via logistic saturation
   */
  riskScore = Math.max(-3, Math.min(3, riskScore));

  // Logistic probability conversion
  const probability = (1 / (1 + Math.exp(-riskScore))) * 100;
  const probabilityRounded = Math.round(probability);

  return {
    bodyPart,
    inputs: {
      painIntensity: pain,
      recoveryIndex: RI,
    },
    globals: {
      // Helpful debug numbers
      AL: Math.round(AL),              // last 7 days actual load
      CL: Math.round(CL),              // baseline weekly load
      CLsafe: Math.round(CLsafe),      // baseline used for calculations
      plannedLoad: Math.round(plannedLoad),
      acwrPredicted: Number(acwrPredicted.toFixed(2)),
      acwrRiskFactor: Number(acwrRiskFactor.toFixed(2)),
    },
    locals: {
      localLoad: Math.round(localLoad),
      stressRatio: Number(stressRatio.toFixed(2)),
      localStressFactor: Number(localStressFactor.toFixed(2)),
      localBreakdown,
    },
    score: Number(riskScore.toFixed(3)),
    probability: probabilityRounded,
    category: categorize(probabilityRounded),
  };
}

module.exports = { predictBodyPartRisk };
