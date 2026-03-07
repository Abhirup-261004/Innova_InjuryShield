const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateInjuryReport(payload) {
  try {
    const prompt = `
You are a professional sports scientist.

Analyze the athlete training metrics and generate an injury risk report.

Athlete Metrics:
ACWR: ${payload.acwr}
Acute Load: ${payload.acuteLoad}
Chronic Load: ${payload.chronicLoad}
Weekly Load: ${payload.weeklyLoad}

Recovery:
Sleep: ${payload.sleep}
Fatigue: ${payload.fatigue}
Soreness: ${payload.soreness}
Stress: ${payload.stress}

Pain Areas: ${payload.painAreas?.join(", ") || "None"}

Posture Risk: ${payload.postureRisk || "None"}
Posture Flags: ${payload.postureFlags?.join(", ") || "None"}

Return JSON in this format:

{
  "riskLevel": "Low | Moderate | High",
  "summary": "short explanation",
  "keyFindings": ["point1","point2","point3"],
  "trainingRecommendation": "training advice",
  "recoveryRecommendation": "recovery advice",
  "coachNote": "coach advice"
}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonString);
    }

    return {
      riskLevel: "Moderate",
      summary: text,
      keyFindings: [],
      trainingRecommendation: "",
      recoveryRecommendation: "",
      coachNote: ""
    };
  } catch (error) {
    console.error("Gemini service error:", error.message);

    return {
      riskLevel: "Moderate",
      summary: "AI analysis failed, default summary generated.",
      keyFindings: [],
      trainingRecommendation: "Maintain balanced training.",
      recoveryRecommendation: "Focus on recovery and sleep.",
      coachNote: "Monitor workload progression."
    };
  }
}

module.exports = {
  generateInjuryReport
};