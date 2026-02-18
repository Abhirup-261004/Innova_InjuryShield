const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const templates = {
  general: {
    gym: {
      strength: ["Squat", "Bench Press", "Deadlift", "Lat Pulldown", "Row", "Leg Press"],
      accessory: ["Lunges", "RDL", "Incline DB Press", "Face Pulls", "Calf Raises", "Plank"],
      cardio: ["Treadmill Jog", "Cycling", "Rowing Machine"],
      mobility: ["Hip Mobility", "Shoulder Mobility", "Foam Roll", "Dynamic Stretch"],
    },
    home: {
      strength: ["Push-ups", "Bodyweight Squats", "Glute Bridge", "Pike Push-up", "Split Squat"],
      accessory: ["Plank", "Side Plank", "Bird Dog", "Wall Sit", "Calf Raises"],
      cardio: ["Brisk Walk", "Skipping", "Stair Climb"],
      mobility: ["Yoga Flow", "Hip Openers", "Thoracic Rotation", "Hamstring Stretch"],
    },
    none: {
      strength: ["Push-ups", "Air Squats", "Lunges", "Plank", "Mountain Climbers"],
      accessory: ["Dead Bug", "Side Plank", "Superman Holds", "Glute Bridge"],
      cardio: ["Walk", "Jog", "Jumping Jacks"],
      mobility: ["Mobility Flow", "Stretching"],
    },
  },
};

// riskScore -> plan intensity rules
function intensityFromRisk(riskScore) {
  if (riskScore >= 70) return "Low";
  if (riskScore >= 40) return "Moderate";
  return "Progressive";
}

function buildDay(equipPool, intensity, focus, title) {
  const baseDuration = intensity === "Low" ? 25 : intensity === "Moderate" ? 40 : 55;

  let exercises = [];
  if (title.includes("Recovery") || focus.includes("Mobility")) {
    exercises = [
      pick(equipPool.mobility),
      pick(equipPool.mobility),
      pick(equipPool.accessory),
    ];
  } else if (title.includes("Cardio")) {
    exercises = [pick(equipPool.cardio), pick(equipPool.mobility)];
  } else {
    exercises = [
      pick(equipPool.strength),
      pick(equipPool.strength),
      pick(equipPool.accessory),
      pick(equipPool.accessory),
    ];
  }

  return {
    title,
    focus,
    intensity,
    duration: baseDuration,
    exercises,
    notes:
      intensity === "Low"
        ? "Keep RPE 4–6. Prioritize form + recovery."
        : intensity === "Moderate"
        ? "Keep RPE 6–7. Avoid max effort."
        : "Progress slowly. If fatigue rises, reduce volume 10–20%.",
  };
}

/**
 * Generates a 7-day plan, filling only daysAvailable with training,
 * other days as Recovery.
 * @param {object} inputs { goal, equipment, daysAvailable, riskScore }
 */
function generateWeeklyPlan(inputs) {
  const goal = (inputs.goal || "general").toLowerCase();
  const equipment = (inputs.equipment || "home").toLowerCase();
  const daysAvailable = Array.isArray(inputs.daysAvailable) ? inputs.daysAvailable : [0, 2, 4];
  const riskScore = Number(inputs.riskScore || 0);

  const equipPool =
    templates[goal]?.[equipment] ||
    templates.general[equipment] ||
    templates.general.home;

  const intensity = intensityFromRisk(riskScore);

  // simple structure: Strength / Cardio / Strength / Recovery / Strength / Cardio / Recovery
  const structure = [
    { title: "Strength Day", focus: "Full Body Strength" },
    { title: "Cardio Day", focus: "Aerobic Base" },
    { title: "Strength Day", focus: "Upper + Core" },
    { title: "Recovery Day", focus: "Mobility + Recovery" },
    { title: "Strength Day", focus: "Lower + Core" },
    { title: "Cardio Day", focus: "Intervals / Zone 2" },
    { title: "Recovery Day", focus: "Mobility + Recovery" },
  ];

  const days = [];
  for (let i = 0; i < 7; i++) {
    if (daysAvailable.includes(i)) {
      const s = structure[i];
      days.push({
        dayIndex: i,
        ...buildDay(equipPool, intensity, s.focus, s.title),
      });
    } else {
      days.push({
        dayIndex: i,
        title: "Recovery Day",
        focus: "Mobility + Recovery",
        intensity: "Low",
        duration: 20,
        exercises: [pick(equipPool.mobility), pick(equipPool.mobility)],
        notes: "Rest day. Light mobility + hydration + sleep focus.",
      });
    }
  }

  return { goal, equipment, daysAvailable, riskScore, days };
}

module.exports = { generateWeeklyPlan };
