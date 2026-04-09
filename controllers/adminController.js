const User = require("../models/User");
const Message = require("../models/Message");
const Friend = require("../models/Friend");
const mongoose = require("mongoose");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureValidUserId = (userId) => mongoose.Types.ObjectId.isValid(userId);

const getAdminActorId = (req) => req.user?.id;

const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBlacklistedUsers,
      totalMessages,
      totalFriendRequests,
      acceptedFriends,
      recentUsers,
      recentMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlacklisted: true }),
      Message.countDocuments(),
      Friend.countDocuments(),
      Friend.countDocuments({ status: "accepted" }),
      User.find({}, "name email role isBlacklisted createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Message.find({}, "message sender receiver createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .lean(),
    ]);

    const pendingFriendRequests = totalFriendRequests - acceptedFriends;

    return res.status(200).json({
      totalUsers,
      totalBlacklistedUsers,
      totalMessages,
      totalFriendRequests,
      acceptedFriends,
      pendingFriendRequests,
      recentUsers,
      recentMessages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const role = String(req.query.role || "")
      .trim()
      .toLowerCase();
    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();

    const filters = {};

    if (query) {
      const safeRegex = new RegExp(escapeRegex(query), "i");
      filters.$or = [{ name: safeRegex }, { email: safeRegex }];
    }

    if (["admin", "student"].includes(role)) {
      filters.role = role;
    }

    if (status === "blacklisted") {
      filters.isBlacklisted = true;
    }

    if (status === "active") {
      filters.isBlacklisted = false;
    }

    const users = await User.find(filters)
      .select(
        "_id name email role bio interests aiName avatarUrl createdAt isBlacklisted blacklistReason blacklistedAt",
      )
      .sort({ createdAt: -1 })
      .limit(150)
      .lean();

    const userIds = users.map((item) => item._id);

    if (userIds.length === 0) {
      return res.status(200).json({ users: [] });
    }

    const [messageCounts, friendCounts] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }],
          },
        },
        {
          $project: {
            participants: ["$sender", "$receiver"],
          },
        },
        { $unwind: "$participants" },
        { $match: { participants: { $in: userIds } } },
        { $group: { _id: "$participants", count: { $sum: 1 } } },
      ]),
      Friend.aggregate([
        {
          $match: {
            $or: [{ sender: { $in: userIds } }, { receiver: { $in: userIds } }],
          },
        },
        {
          $project: {
            entries: [
              { user: "$sender", status: "$status" },
              { user: "$receiver", status: "$status" },
            ],
          },
        },
        { $unwind: "$entries" },
        { $match: { "entries.user": { $in: userIds } } },
        {
          $group: {
            _id: { user: "$entries.user", status: "$entries.status" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const messageCountByUser = new Map(
      messageCounts.map((item) => [String(item._id), item.count]),
    );
    const acceptedFriendsByUser = new Map();
    const pendingFriendsByUser = new Map();

    friendCounts.forEach((item) => {
      const userId = String(item._id.user);

      if (item._id.status === "accepted") {
        acceptedFriendsByUser.set(userId, item.count);
      }

      if (item._id.status === "pending") {
        pendingFriendsByUser.set(userId, item.count);
      }
    });

    const responseUsers = users.map((item) => {
      const userId = String(item._id);

      return {
        ...item,
        stats: {
          totalMessages: messageCountByUser.get(userId) || 0,
          acceptedFriends: acceptedFriendsByUser.get(userId) || 0,
          pendingConnections: pendingFriendsByUser.get(userId) || 0,
        },
      };
    });

    return res.status(200).json({
      users: responseUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

const getAdminUserDetails = async (req, res) => {
  const { userId } = req.params;

  if (!ensureValidUserId(userId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  try {
    const [
      user,
      totalMessages,
      acceptedFriends,
      pendingConnections,
      recentMessages,
    ] = await Promise.all([
      User.findById(userId)
        .select(
          "_id name email role bio interests aiName avatarUrl createdAt isBlacklisted blacklistReason blacklistedAt",
        )
        .lean(),
      Message.countDocuments({
        $or: [{ sender: userId }, { receiver: userId }],
      }),
      Friend.countDocuments({
        status: "accepted",
        $or: [{ sender: userId }, { receiver: userId }],
      }),
      Friend.countDocuments({
        status: "pending",
        $or: [{ sender: userId }, { receiver: userId }],
      }),
      Message.find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("message sender receiver createdAt")
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      user: {
        ...user,
        stats: {
          totalMessages,
          acceptedFriends,
          pendingConnections,
        },
        recentMessages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

const blacklistUser = async (req, res) => {
  const adminId = getAdminActorId(req);
  const { userId } = req.params;
  const reason = String(req.body?.reason || "").trim();

  if (!ensureValidUserId(userId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  if (!adminId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (String(adminId) === String(userId)) {
    return res.status(400).json({ message: "You cannot blacklist yourself." });
  }

  try {
    const targetUser = await User.findById(userId).select(
      "_id role isBlacklisted",
    );

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.role === "admin") {
      return res.status(400).json({
        message: "Admin accounts cannot be blacklisted.",
      });
    }

    if (targetUser.isBlacklisted) {
      return res.status(200).json({
        message: "User is already blacklisted.",
      });
    }

    await User.findByIdAndUpdate(userId, {
      isBlacklisted: true,
      blacklistReason: reason || "Policy violation flagged by admin.",
      blacklistedAt: new Date(),
      blacklistedBy: adminId,
    });

    return res.status(200).json({
      message: "User blacklisted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

const unblacklistUser = async (req, res) => {
  const { userId } = req.params;

  if (!ensureValidUserId(userId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  try {
    const targetUser = await User.findById(userId).select(
      "_id role isBlacklisted",
    );

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.role === "admin") {
      return res.status(400).json({
        message: "Admin accounts cannot be unblacklisted from this action.",
      });
    }

    if (!targetUser.isBlacklisted) {
      return res.status(200).json({
        message: "User is already active.",
      });
    }

    await User.findByIdAndUpdate(userId, {
      isBlacklisted: false,
      blacklistReason: "",
      blacklistedAt: null,
      blacklistedBy: null,
    });

    return res.status(200).json({
      message: "User removed from blacklist.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const adminId = getAdminActorId(req);
  const { userId } = req.params;

  if (!ensureValidUserId(userId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  if (!adminId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (String(adminId) === String(userId)) {
    return res.status(400).json({ message: "You cannot delete yourself." });
  }

  try {
    const targetUser = await User.findById(userId).select("_id role");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admin accounts cannot be deleted." });
    }

    await Promise.all([
      Message.deleteMany({
        $or: [{ sender: userId }, { receiver: userId }],
      }),
      Friend.deleteMany({
        $or: [{ sender: userId }, { receiver: userId }],
      }),
      User.findByIdAndDelete(userId),
    ]);

    return res.status(200).json({
      message: "User deleted successfully.",
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
  getAdminUsers,
  getAdminUserDetails,
  blacklistUser,
  unblacklistUser,
  deleteUser,
};
