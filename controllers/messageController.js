const Message = require("../models/Message");
const Friend = require("../models/Friend");

const getCurrentUserId = (req) => req.user?.id || req.user?._id || "";

const areFriends = async (userA, userB) => {
  const relation = await Friend.findOne({
    status: "accepted",
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  }).select("_id");

  return Boolean(relation);
};

const sendMessage = async (req, res) => {
  const sender = String(getCurrentUserId(req));
  const receiver = String(req.body?.receiver || "").trim();
  const message = String(req.body?.message || "").trim();

  if (!sender) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (!sender || !receiver || !message) {
    return res
      .status(400)
      .json({ message: "Sender, receiver, and message are required." });
  }

  if (sender === receiver) {
    return res
      .status(400)
      .json({ message: "You cannot send a message to yourself." });
  }

  try {
    const canMessage = await areFriends(sender, receiver);

    if (!canMessage) {
      return res.status(403).json({
        message: "You can only message accepted friends.",
      });
    }

    const newMessage = await Message.create({ sender, receiver, message });

    return res.status(201).json({
      message: "Message sent successfully.",
      data: newMessage,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const getConversation = async (req, res) => {
  const userA = String(getCurrentUserId(req));
  const userB = String(req.params.userId || req.query.userId || "").trim();

  if (!userA) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (!userA || !userB) {
    return res.status(400).json({ message: "userA and userB are required." });
  }

  try {
    const canReadConversation = await areFriends(userA, userB);

    if (!canReadConversation) {
      return res.status(403).json({
        message: "You can only view chats with accepted friends.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      message: "Conversation fetched successfully.",
      data: messages,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

// --- Typing status in-memory store (for demo; use Redis for production) ---
const typingStatusMap = new Map();

// Set typing status for a user in a chat
const setTypingStatus = (req, res) => {
  const userId = String(getCurrentUserId(req));
  const friendId = String(
    req.body?.friendId || req.query?.friendId || "",
  ).trim();
  const isTyping = Boolean(req.body?.isTyping);
  if (!userId || !friendId) {
    return res.status(400).json({ message: "userId and friendId required." });
  }
  // Key: `${userId}|${friendId}`
  typingStatusMap.set(`${userId}|${friendId}`, {
    isTyping,
    updatedAt: Date.now(),
  });
  return res.status(200).json({ message: "Typing status updated." });
};

// Get typing status of friend in chat (is friend currently typing to me?)
const getTypingStatus = (req, res) => {
  const userId = String(getCurrentUserId(req));
  const friendId = String(
    req.query?.friendId || req.params?.friendId || "",
  ).trim();
  if (!userId || !friendId) {
    return res.status(400).json({ message: "userId and friendId required." });
  }
  // We want: is friendId typing to userId?
  const status = typingStatusMap.get(`${friendId}|${userId}`);
  // Expire after 5 seconds
  const isTyping =
    status && status.isTyping && Date.now() - status.updatedAt < 5000;
  return res.status(200).json({ isTyping: Boolean(isTyping) });
};

module.exports = {
  sendMessage,
  getConversation,
  setTypingStatus,
  getTypingStatus,
};
