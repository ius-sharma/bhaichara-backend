const express = require("express");
const {
  getAnalytics,
  getAdminUsers,
  getAdminUserDetails,
  blacklistUser,
  unblacklistUser,
  deleteUser,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/analytics", authMiddleware, adminMiddleware, getAnalytics);
router.get("/users", authMiddleware, adminMiddleware, getAdminUsers);
router.get(
  "/users/:userId",
  authMiddleware,
  adminMiddleware,
  getAdminUserDetails,
);
router.patch(
  "/users/:userId/blacklist",
  authMiddleware,
  adminMiddleware,
  blacklistUser,
);
router.patch(
  "/users/:userId/unblacklist",
  authMiddleware,
  adminMiddleware,
  unblacklistUser,
);
router.delete("/users/:userId", authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
