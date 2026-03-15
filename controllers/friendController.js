const Friend = require("../models/Friend");

const sendFriendRequest = async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res
      .status(400)
      .json({ message: "Sender and receiver are required." });
  }

  if (sender === receiver) {
    return res
      .status(400)
      .json({ message: "You cannot send a friend request to yourself." });
  }

  try {
    const existingRequest = await Friend.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    if (existingRequest) {
      return res.status(409).json({ message: "Friend request already exists." });
    }

    const request = await Friend.create({
      sender,
      receiver,
      status: "pending",
    });

    return res.status(201).json({
      message: "Friend request sent successfully.",
      request,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const getFriendsList = async (req, res) => {
  const userId = req.params.userId || req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    const connections = await Friend.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "_id name email bio")
      .populate("receiver", "_id name email bio")
      .sort({ createdAt: -1 });

    const friendsMap = new Map();

    connections.forEach((connection) => {
      const isSender = String(connection.sender?._id) === String(userId);
      const friend = isSender ? connection.receiver : connection.sender;

      if (friend?._id) {
        friendsMap.set(String(friend._id), {
          _id: friend._id,
          name: friend.name,
          email: friend.email,
          bio: friend.bio || "",
        });
      }
    });

    return res.status(200).json({
      message: "Friends fetched successfully.",
      data: Array.from(friendsMap.values()),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  const requestId = req.body.requestId || req.params.requestId;

  if (!requestId) {
    return res.status(400).json({ message: "requestId is required." });
  }

  try {
    const request = await Friend.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    return res.status(200).json({
      message: "Friend request accepted successfully.",
      request,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
};
