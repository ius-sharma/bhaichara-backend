const express = require("express");
const {
  createUser,
  registerUser,
  loginUser,
  getAllUsers,
  searchUsers,
  updateUserProfile,
  uploadUserAvatar,
  updateUserAvatarUrl,
} = require("../controllers/userController");
const { uploadAvatar } = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/users — list users
router.get("/", authMiddleware, getAllUsers);

// GET /api/users/search?q=term — search users by name
router.get("/search", authMiddleware, searchUsers);

// POST /api/users — create a new user
router.post("/", createUser);

// POST /api/users/register — register a new user
router.post("/register", registerUser);

// POST /api/users/login — login user
router.post("/login", loginUser);

// PUT /api/users/avatar — update avatar URL for the logged-in user
router.put("/avatar", authMiddleware, updateUserAvatarUrl);

// PUT /api/users/:id/profile — update user profile
router.put("/:id/profile", updateUserProfile);

// POST /api/users/:id/avatar — upload profile avatar
router.post("/:id/avatar", uploadAvatar.single("avatar"), uploadUserAvatar);

module.exports = router;
