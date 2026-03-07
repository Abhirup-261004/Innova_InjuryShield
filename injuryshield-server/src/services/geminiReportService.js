const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function buildPrompt(payload) {
  const {
    athleteName,
    acwr,
    acuteLoad,
    chronicLoad,
    sleep,
    fatigue,
    soreness,
    stress,
    painAreas,
    weeklyLoad,
    overtraining,
    postureRisk,
    postureFlags
  } = payload;

  return `
You are an elite sports science injury prevention assistant.

Your task is to generate a concise, practical, professional athlete injury prevention report.

Athlete Data:
- Athlete Name: ${athleteName || "Athlete"}
- Weekly Load: ${weeklyLoad ?? "N/A"}
- Acute Load (7d): ${acuteLoad ?? "N/A"}
- Chronic Load (28d avg): ${chronicLoad ?? "N/A"}
- ACWR: ${acwr ?? "N/A"}
- Sleep Score: ${sleep ?? "N/A"}
- Fatigue: ${fatigue ?? "N/A"}
- Soreness: ${soreness ?? "N/A"}
- Stress: ${stress ?? "N/A"}
- Pain Areas: ${
    Array.isArray(painAreas) && painAreas.length ? painAreas.join(", ") : "None"
  }
- Overtraining Flag: ${overtraining ? "Yes" : "No"}
- Posture/Form Risk: ${postureRisk || "Unknown"}
- Posture Flags: ${
    Array.isArray(postureFlags) && postureFlags.length
      ? postureFlags.join(", ")
      : "None"
  }

Instructions:
Return ONLY valid JSON in this exact shape:
{
  "summary": "string",
  "riskLevel": "Low or Moderate or High",
  "keyFindings": ["string", "string", "string"],
  "trainingRecommendation": "string",
  "recoveryRecommendation": "string",
  "coachNote": "string"
}

Rules:
- Keep the report athlete-friendly and practical
- Mention ACWR if relevant
- Mention pain areas if relevant
- Mention posture/form risk if relevant
- Do not give medical diagnosis
- Focus on injury prevention, recovery, and training adjustment
- Do not include markdown
- Do not include code fences
`;
}

function getFallbackReport(text = "") {
  return {
    summary:
      text ||
      "The athlete shows a moderate injury-risk profile based on workload, recovery, and form signals. A short-term adjustment in training intensity with closer recovery monitoring is advised.",
    riskLevel: "Moderate",
    keyFindings: [
      "Workload and recovery indicators should be monitored closely.",
      "Pain or soreness signals may require temporary training modification.",
      "Movement-quality issues may increase injury risk during high-intensity sessions."
    ],
    trainingRecommendation:
      "Reduce high-intensity volume temporarily, prioritize technique quality, and reintroduce load progressively.",
    recoveryRecommendation:
      "Prioritize sleep, hydration, mobility work, and lower-stress recovery sessions over the next few days.",
    coachNote:
      "Review athlete readiness before the next demanding session and monitor changes in soreness, fatigue, and form."
  };
}

async function generateInjuryReport(payload) {
  const prompt = buildPrompt(payload);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  });

  const text = response.text?.trim() || "";

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || "",
      riskLevel: parsed.riskLevel || "Moderate",
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      trainingRecommendation: parsed.trainingRecommendation || "",
      recoveryRecommendation: parsed.recoveryRecommendation || "",
      coachNote: parsed.coachNote || ""
    };
  } catch (error) {
    return getFallbackReport(text);
  }
}

module.exports = { generateInjuryReport };