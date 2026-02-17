export function generateWeeklyPlan(riskScore, overtraining) {

  let intensity = "High";
  let sets = 4;
  let reps = "8–10";
  let duration = 60;

  // Overtraining overrides everything
  if (overtraining?.isOvertraining) {
    intensity = "Recovery";
    sets = 2;
    reps = "12–15";
    duration = 30;
  }
  else if (riskScore > 70) {
    intensity = "Low";
    sets = 2;
    reps = "12–15";
    duration = 30;
  }
  else if (riskScore > 40) {
    intensity = "Moderate";
    sets = 3;
    reps = "10–12";
    duration = 45;
  }

  const exercises = {
    "Upper Body": ["Bench Press", "Shoulder Press", "Tricep Dips"],
    "Lower Body": ["Squats", "Lunges", "Leg Press"],
    "Cardio": ["Treadmill Run", "Cycling", "Rowing"],
    "Push Workout": ["Push-ups", "Chest Press", "Overhead Press"],
    "Pull Workout": ["Pull-ups", "Lat Pulldown", "Bicep Curls"],
    "Full Body": ["Deadlift", "Burpees", "Kettlebell Swings"],
    "Rest / Mobility": ["Stretching", "Foam Rolling", "Light Walk"]
  };

  const basePlan = [
    "Upper Body",
    "Lower Body",
    "Cardio",
    "Rest / Mobility",
    "Push Workout",
    "Pull Workout",
    "Full Body"
  ];

  return basePlan.map((focus, index) => ({
    day: `Day ${index + 1}`,
    focus,
    intensity,
    duration,
    sets,
    reps,
    exercises: exercises[focus]
  }));
}
