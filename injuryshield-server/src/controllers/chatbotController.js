const { getChatbotReply } = require("../services/chatbotService");

exports.sendMessageToChatbot = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array is required" });
    }

    const reply = await getChatbotReply(messages);

    return res.json({
      ok: true,
      reply
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    return res.status(500).json({
      ok: false,
      reply:
        "I’m having trouble responding right now. You can still explore Dashboard, Workouts, Injury Radar, Coach features, and AI Reports from the navigation."
    });
  }
};