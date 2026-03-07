const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildPrompt(data) {
  return `
You are an AI sports performance assistant helping a coach monitor athlete health and training load.

Athlete: ${data.athleteName}

Training Data:
- Acute Load: ${data.acuteLoad}
- Chronic Load: ${data.chronicLoad}
- ACWR: ${data.acwr}
- Weekly Load: ${data.weeklyLoad}
- Total Workouts (28 days): ${data.totalWorkoutsLast28Days}
- Avg RPE (14 days): ${data.avgRpeLast14Days}

Latest Workout:
${JSON.stringify(data.lastWorkout)}

Recovery:
${JSON.stringify(data.latestCheckin)}

Pain Areas:
${data.painAreas}

Posture Risk:
${data.postureRisk}

Provide the response strictly in JSON format with these fields:
{
  "athleteStatus": "",
  "riskLevel": "",
  "summary": "",
  "keyFindings": [],
  "trainingRecommendation": "",
  "recoveryRecommendation": "",
  "coachAction": ""
}
`;
}

async function generateCoachInsight(payload) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = buildPrompt(payload);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        athleteStatus: "Watchlist",
        riskLevel: "Moderate",
        summary: text,
        keyFindings: [],
        trainingRecommendation:
          "Avoid sudden spikes in load and monitor fatigue.",
        recoveryRecommendation:
          "Prioritize sleep and recovery strategies.",
        coachAction:
          "Review athlete workload before next training block."
      };
    }
  } catch (error) {
    console.error("generateCoachInsight service error:", error);

    return {
      athleteStatus: "AI unavailable",
      riskLevel: "Unknown",
      summary: "AI analysis failed, default summary generated.",
      keyFindings: [],
      trainingRecommendation: "Maintain steady training load.",
      recoveryRecommendation: "Monitor recovery metrics.",
      coachAction: "Check athlete manually."
    };
  }
}

module.exports = { generateCoachInsight };