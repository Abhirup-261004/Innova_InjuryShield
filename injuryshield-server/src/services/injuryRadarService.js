const Workout = require("../models/Workout"); // your existing model (must include: user, date, duration, rpe, load/sessionType)
const PlannedSession = require("../models/PlannedSession");
const RecoveryLog = require("../models/RecoveryLog");
const BodyPartExposure = require("../models/BodyPartExposure");

const intensityMultiplier = (lvl) => {
  if (lvl === "Easy") return 0.85;
  if (lvl === "Hard") return 1.15;
  return 1.0; // Normal :contentReference[oaicite:9]{index=9}
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
  return "Low"; // :contentReference[oaicite:10]{index=10}
}

async function computeAL_CL(userId) {
  // AL = last 7 days total load, CL = last 28 days avg weekly load (common approach)
  const since28 = daysAgo(28);
  const workouts28 = await Workout.find({ user: userId, date: { $gte: since28 } });

  const last7 = daysAgo(7);
  const workouts7 = workouts28.filter((w) => new Date(w.date) >= last7);

  const AL = sum(workouts7.map((w) => Number(w.load ?? w.trainingLoad ?? (w.duration * w.rpe) ?? 0)));
  const total28 = sum(workouts28.map((w) => Number(w.load ?? w.trainingLoad ?? (w.duration * w.rpe) ?? 0)));
  const CL = total28 / 4; // 28 days -> ~4 weeks baseline

  return { AL, CL: CL || 1 }; // avoid division by 0
}

async function estimatePlannedLoad(userId, plannedSessions) {
  // "Estimate Future Load Using Historical Patterns" :contentReference[oaicite:11]{index=11}
  // Practical implementation: for each sessionType, use last 28d avg load of that type; multiply by intensity multiplier.
  const since28 = daysAgo(28);
  const workouts28 = await Workout.find({ user: userId, date: { $gte: since28 } });

  const byType = {};
  for (const w of workouts28) {
    const t = w.type || w.sessionType || "Unknown";
    const l = Number(w.load ?? w.trainingLoad ?? (w.duration * w.rpe) ?? 0);
    if (!byType[t]) byType[t] = [];
    byType[t].push(l);
  }

  const typeAvg = {};
  Object.keys(byType).forEach((t) => {
    typeAvg[t] = sum(byType[t]) / byType[t].length;
  });

  let plannedLoad = 0;
  const breakdown = [];

  for (const ps of plannedSessions) {
    const base = typeAvg[ps.sessionType] ?? 100; // fallback if no history
    const mult = intensityMultiplier(ps.intensityLevel);
    const est = base * mult;
    plannedLoad += est;
    breakdown.push({ ...ps, estimatedLoad: Math.round(est) });
  }

  return { plannedLoad, breakdown };
}

async function computeBodyPartLoad(userId, plannedBreakdown, bodyPart) {
  // Each session type has a Body-Part Exposure Factor (BPEF) :contentReference[oaicite:12]{index=12}
  const map = await BodyPartExposure.find({});
  const exposureMap = new Map(map.map((x) => [x.sessionType, x.exposure]));

  let localLoad = 0;
  const localBreakdown = [];

  for (const s of plannedBreakdown) {
    const exposure = exposureMap.get(s.sessionType)?.[bodyPart] ?? 0.1; // fallback small
    const partLoad = s.estimatedLoad * exposure;
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

async function computeRecoveryPenalty(userId) {
  // Use latest Recovery Index (RI 0–100) :contentReference[oaicite:13]{index=13}
  const latest = await RecoveryLog.findOne({ user: userId }).sort({ date: -1 });
  const RI = latest?.recoveryIndex ?? 70;

  // simple penalty: lower RI => higher penalty, normalized 0..1
  // (you can tune this)
  const penalty = Math.max(0, (80 - RI) / 80); // RI >=80 => 0 penalty
  return { RI, recoveryPenalty: penalty };
}

async function predictBodyPartRisk({ userId, bodyPart, painIntensity, plannedSessions }) {
  const { AL, CL } = await computeAL_CL(userId);

  const { plannedLoad, breakdown: plannedBreakdown } = await estimatePlannedLoad(
    userId,
    plannedSessions
  );

  // Predict Global Future ACWR :contentReference[oaicite:14]{index=14}
  const predictedAL = AL + plannedLoad;
  const acwrPredicted = predictedAL / (CL || 1);

  // Global ACWR Risk Modeling (exponential above safe zone) :contentReference[oaicite:15]{index=15}
  const acwrRiskFactor = acwrPredicted > 1.3 ? Math.exp(acwrPredicted - 1.3) : 1;

  // Body-part specific load
  const { localLoad, localBreakdown } = await computeBodyPartLoad(
    userId,
    plannedBreakdown,
    bodyPart
  );

  // Local Stress Risk Modeling :contentReference[oaicite:16]{index=16}
  const stressRatio = localLoad / (CL || 1);
  const localStressFactor = stressRatio > 1.2 ? Math.exp(stressRatio - 1.2) : 1;

  // Recovery + pain :contentReference[oaicite:17]{index=17}
  const { RI, recoveryPenalty } = await computeRecoveryPenalty(userId);
  const painFactor = Math.min(10, Math.max(0, painIntensity)) / 10;

  // Final RiskScore weighted formula :contentReference[oaicite:18]{index=18}
  const riskScore =
    0.4 * acwrRiskFactor +
    0.25 * localStressFactor +
    0.2 * recoveryPenalty +
    0.15 * painFactor;

  // Logistic probability conversion :contentReference[oaicite:19]{index=19}
  const probability = (1 / (1 + Math.exp(-riskScore))) * 100;
  const probabilityRounded = Math.round(probability);

  return {
    bodyPart,
    inputs: {
      painIntensity,
      recoveryIndex: RI,
    },
    globals: {
      AL: Math.round(AL),
      CL: Math.round(CL),
      plannedLoad: Math.round(plannedLoad),
      predictedAL: Math.round(predictedAL),
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
