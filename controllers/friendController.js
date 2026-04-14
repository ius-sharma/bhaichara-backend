const Friend = require("../models/Friend");

const isValidObjectId = (value) =>
  /^[a-f\d]{24}$/i.test(String(value || "").trim());

const getCurrentUserId = (req) => req.user?.id || req.user?._id || "";

const sendFriendRequest = async (req, res) => {
  const sender = String(getCurrentUserId(req));
  const receiver = String(req.body?.receiver || "").trim();

  if (!sender || !receiver) {
    return res
      .status(400)
      .json({ message: "Sender and receiver are required." });
  }

  if (!isValidObjectId(receiver)) {
    return res.status(400).json({ message: "Invalid receiver id." });
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
      return res
        .status(409)
        .json({ message: "Friend request already exists." });
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
  const userId = String(getCurrentUserId(req));

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    const connections = await Friend.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "_id name email bio avatarUrl")
      .populate("receiver", "_id name email bio avatarUrl")
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
          avatarUrl: friend.avatarUrl || "",
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
  const currentUserId = String(getCurrentUserId(req));
  const requestId = req.body.requestId || req.params.requestId;

  if (!requestId) {
    return res.status(400).json({ message: "requestId is required." });
  }

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  try {
    const request = await Friend.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (String(request.receiver) !== currentUserId) {
      return res.status(403).json({
        message: "Only the receiver can accept this request.",
      });
    }

    if (request.status === "accepted") {
      return res.status(200).json({
        message: "Friend request already accepted.",
        request,
      });
    }

    request.status = "accepted";
    await request.save();

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

const getIncomingRequests = async (req, res) => {
  const currentUserId = String(getCurrentUserId(req));

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  try {
    const incomingRequests = await Friend.find({
      receiver: currentUserId,
      status: "pending",
    })
      .populate("sender", "_id name email bio avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const data = incomingRequests
      .filter((item) => item.sender?._id)
      .map((item) => ({
        requestId: item._id,
        status: item.status,
        createdAt: item.createdAt,
        user: item.sender,
      }));

    return res.status(200).json({
      message: "Incoming requests fetched successfully.",
      data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const getSentRequests = async (req, res) => {
  const currentUserId = String(getCurrentUserId(req));

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  try {
    const sentRequests = await Friend.find({
      sender: currentUserId,
      status: "pending",
    })
      .populate("receiver", "_id name email bio avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const data = sentRequests
      .filter((item) => item.receiver?._id)
      .map((item) => ({
        requestId: item._id,
        status: item.status,
        createdAt: item.createdAt,
        user: item.receiver,
      }));

    return res.status(200).json({
      message: "Sent requests fetched successfully.",
      data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const rejectFriendRequest = async (req, res) => {
  const currentUserId = String(getCurrentUserId(req));
  const requestId = req.body.requestId || req.params.requestId;

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (!requestId) {
    return res.status(400).json({ message: "requestId is required." });
  }

  try {
    const request = await Friend.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    const isParticipant =
      String(request.receiver) === currentUserId ||
      String(request.sender) === currentUserId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not allowed to manage this request.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be removed.",
      });
    }

    await Friend.findByIdAndDelete(requestId);

    return res.status(200).json({
      message: "Friend request removed successfully.",
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
  rejectFriendRequest,
  getFriendsList,
  getIncomingRequests,
  getSentRequests,
};
