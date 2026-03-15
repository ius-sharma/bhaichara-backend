const Message = require("../models/Message");

const sendMessage = async (req, res) => {
	const { sender, receiver, message } = req.body;

	if (!sender || !receiver || !message) {
		return res
			.status(400)
			.json({ message: "Sender, receiver, and message are required." });
	}

	try {
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
	const userA =
		req.params.userA ||
		req.query.userA ||
		req.body.userA ||
		req.query.currentUserId ||
		req.body.currentUserId;
	const userB =
		req.params.userB || req.params.userId || req.query.userB || req.body.userB;

	if (!userA || !userB) {
		return res.status(400).json({ message: "userA and userB are required." });
	}

	try {
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

module.exports = {
	sendMessage,
	getConversation,
};
