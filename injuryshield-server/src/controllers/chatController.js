const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { canChat } = require("../utils/chatRules");

async function getOrCreateConversation(userId, otherId) {
  let convo = await Conversation.findOne({
    participants: { $all: [userId, otherId] }
  });

  if (!convo) {
    convo = await Conversation.create({ participants: [userId, otherId] });
  }
  return convo;
}

// GET /api/chat/contacts
// Coach: list all users
// User: list all coaches
exports.getContacts = async (req, res) => {
  const role = req.user.role;

  const filter = role === "coach" ? { role: "user" } : { role: "coach" };
  const contacts = await User.find(filter).select("_id name email role");

  res.json(contacts);
};

// GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  const userId = req.user._id;

  const convos = await Conversation.find({ participants: userId })
    .populate("lastMessage")
    .populate("participants", "name role email")
    .sort({ updatedAt: -1 });

  // compute unread counts per conversation (messages to me not seen, not deleted for me)
  const convoIds = convos.map((c) => c._id);

  const unreadAgg = await Message.aggregate([
    {
      $match: {
        conversation: { $in: convoIds },
        receiver: new mongoose.Types.ObjectId(userId),
        status: { $ne: "seen" },
        deletedFor: { $ne: new mongoose.Types.ObjectId(userId) }
      }
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } }
  ]);

  const unreadMap = new Map(unreadAgg.map((u) => [String(u._id), u.count]));

  const formatted = convos.map((c) => {
    const other = c.participants.find((p) => String(p._id) !== String(userId));
    return {
      _id: c._id,
      otherUser: other,
      lastMessage: c.lastMessage,
      updatedAt: c.updatedAt,
      unreadCount: unreadMap.get(String(c._id)) || 0
    };
  });

  res.json(formatted);
};


// GET /api/chat/:otherUserId/messages
exports.getMessages = async (req, res) => {
  const userId = req.user._id;
  const otherId = req.params.otherUserId;

  const otherUser = await User.findById(otherId).select("_id role name");
  if (!otherUser) return res.status(404).json({ message: "User not found" });

  if (!canChat(req.user, otherUser)) {
    return res.status(403).json({ message: "Chat not allowed" });
  }

  const convo = await getOrCreateConversation(userId, otherId);

  const msgs = await Message.find({
    conversation: convo._id,
    deletedFor: { $ne: req.user._id } // ✅ hide deleted for me
}).sort({ createdAt: 1 });

    res.json({ conversationId: convo._id, messages: msgs });
};

exports.deleteForMe = async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ message: "Message not found" });

  // only participants can delete for themselves
  const isParticipant =
    String(msg.sender) === String(userId) || String(msg.receiver) === String(userId);

  if (!isParticipant) return res.status(403).json({ message: "Not allowed" });

  await Message.updateOne(
    { _id: messageId },
    { $addToSet: { deletedFor: userId } }
  );

  res.json({ ok: true });
};
