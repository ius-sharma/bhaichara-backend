const User = require("../models/User");
const Message = require("../models/Message");
const Friend = require("../models/Friend");

const getAnalytics = async (req, res) => {
	try {
		const [totalUsers, totalMessages, totalFriendRequests, acceptedFriends] =
			await Promise.all([
				User.countDocuments(),
				Message.countDocuments(),
				Friend.countDocuments(),
				Friend.countDocuments({ status: "accepted" }),
			]);

		return res.status(200).json({
			totalUsers,
			totalMessages,
			totalFriendRequests,
			acceptedFriends,
		});
	} catch (error) {
		return res.status(500).json({
			message: "Server error.",
			error: error.message,
		});
	}
};

module.exports = {
	getAnalytics,
};
