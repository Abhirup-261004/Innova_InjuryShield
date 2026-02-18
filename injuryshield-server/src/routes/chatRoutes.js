const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getContacts, getConversations, getMessages } = require("../controllers/chatController");
const { deleteForMe } = require("../controllers/chatController");

router.get("/contacts", protect, getContacts);
router.get("/conversations", protect, getConversations);
router.get("/:otherUserId/messages", protect, getMessages);
router.delete("/message/:messageId", protect, deleteForMe);

module.exports = router;
