const express = require("express");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendsList,
  getIncomingRequests,
  getSentRequests,
} = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/friends/add
router.post("/add", authMiddleware, sendFriendRequest);

// POST /api/friends/request
router.post("/request", authMiddleware, sendFriendRequest);

// GET /api/friends/requests/incoming
router.get("/requests/incoming", authMiddleware, getIncomingRequests);

// GET /api/friends/requests/sent
router.get("/requests/sent", authMiddleware, getSentRequests);

// POST /api/friends/accept
router.post("/accept", authMiddleware, acceptFriendRequest);

// POST /api/friends/reject
router.post("/reject", authMiddleware, rejectFriendRequest);

// GET /api/friends/list
router.get("/list", authMiddleware, getFriendsList);

// GET /api/friends/list/:userId
router.get("/list/:userId", authMiddleware, getFriendsList);

module.exports = router;
