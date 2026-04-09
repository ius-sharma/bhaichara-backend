const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id role isBlacklisted")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({
        message: "Your account is blacklisted. Contact admin support.",
      });
    }

    req.user = {
      id: String(user._id),
      role: user.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
