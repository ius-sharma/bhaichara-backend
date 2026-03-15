const express = require("express");
const {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
} = require("../controllers/friendController");

const router = express.Router();

// POST /api/friends/add
router.post("/add", sendFriendRequest);

// POST /api/friends/request
router.post("/request", sendFriendRequest);

// POST /api/friends/accept
router.post("/accept", acceptFriendRequest);

// GET /api/friends/list/:userId
router.get("/list/:userId", getFriendsList);

module.exports = router;
