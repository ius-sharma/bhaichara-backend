const express = require("express");
const {
	sendMessage,
	getConversation,
} = require("../controllers/messageController");

const router = express.Router();

// POST /api/messages/send
router.post("/send", sendMessage);

// GET /api/messages/conversation/:userId
router.get("/conversation/:userId", getConversation);

module.exports = router;
