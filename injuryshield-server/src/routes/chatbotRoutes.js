const express = require("express");
const router = express.Router();
const { sendMessageToChatbot } = require("../controllers/chatbotController");

router.post("/message", sendMessageToChatbot);

module.exports = router;