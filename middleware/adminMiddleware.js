const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorised." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }

  return next();
};

module.exports = adminMiddleware;