const express = require("express");
const {
  sendMessage,
  getConversation,
  setTypingStatus,
  getTypingStatus,
} = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/messages/send
router.post("/send", authMiddleware, sendMessage);

// GET /api/messages/conversation/:userId
router.get("/conversation/:userId", authMiddleware, getConversation);

// POST /api/messages/typing-status (body: { friendId, isTyping })
router.post("/typing-status", authMiddleware, setTypingStatus);

// GET /api/messages/typing-status?friendId=xyz
router.get("/typing-status", authMiddleware, getTypingStatus);

module.exports = router;
