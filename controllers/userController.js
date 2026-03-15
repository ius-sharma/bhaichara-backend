const User = require("../models/User");
const Friend = require("../models/Friend");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  interests: user.interests,
  role: user.role,
  aiName: user.aiName,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
});

const getAcceptedFriendIds = async (userId) => {
  const acceptedConnections = await Friend.find({
    status: "accepted",
    $or: [{ sender: userId }, { receiver: userId }],
  }).select("sender receiver");

  const friendIds = new Set();

  acceptedConnections.forEach((connection) => {
    const senderId = String(connection.sender);
    const receiverId = String(connection.receiver);

    if (senderId !== String(userId)) {
      friendIds.add(senderId);
    }

    if (receiverId !== String(userId)) {
      friendIds.add(receiverId);
    }
  });

  return Array.from(friendIds);
};

const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        aiName: user.aiName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        interests: user.interests,
        role: user.role,
        aiName: user.aiName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { name, bio, interests, aiName, avatarUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User id is required." });
  }

  try {
    const updates = {};

    if (typeof name === "string") {
      updates.name = name.trim();
    }

    if (typeof bio === "string") {
      updates.bio = bio.trim();
    }

    if (Array.isArray(interests)) {
      updates.interests = interests
        .map((interest) => String(interest).trim())
        .filter(Boolean);
    }

    if (typeof aiName === "string") {
      updates.aiName = aiName.trim() || "Jarvish";
    }

    if (typeof avatarUrl === "string") {
      updates.avatarUrl = avatarUrl.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("_id name email bio interests role aiName avatarUrl createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        role: updatedUser.role,
        aiName: updatedUser.aiName,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (currentUserRole !== "admin") {
    return res.status(403).json({
      message: "Only admin can view all users without searching.",
    });
  }

  try {
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("_id name email bio avatarUrl createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const searchUsers = async (req, res) => {
  const currentUserId = req.user?.id;
  const query = String(req.query.q || "").trim();

  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (query.length < 2) {
    return res.status(400).json({
      message: "Search query must be at least 2 characters.",
    });
  }

  try {
    const friendIds = await getAcceptedFriendIds(currentUserId);

    const users = await User.find({
      _id: { $nin: [currentUserId, ...friendIds] },
      name: { $regex: query, $options: "i" },
    })
      .select("_id name email bio avatarUrl createdAt")
      .sort({ name: 1 })
      .limit(25);

    return res.status(200).json({
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const uploadUserAvatar = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "User id is required." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Avatar image is required." });
  }

  try {
    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      {
        new: true,
        runValidators: true,
      },
    ).select("_id name email bio interests role aiName avatarUrl createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Avatar uploaded successfully.",
      user: buildUserResponse(updatedUser),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

const updateUserAvatarUrl = async (req, res) => {
  const userId = req.user?.id;
  const { avatarUrl } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (typeof avatarUrl !== "string" || !avatarUrl.trim()) {
    return res.status(400).json({ message: "avatarUrl is required." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarUrl.trim() },
      { new: true, runValidators: true },
    ).select("_id name email bio interests role aiName avatarUrl createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Avatar updated successfully.",
      user: buildUserResponse(updatedUser),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

module.exports = {
  createUser,
  registerUser,
  loginUser,
  getAllUsers,
  updateUserProfile,
  uploadUserAvatar,
  updateUserAvatarUrl,
  searchUsers,
};
