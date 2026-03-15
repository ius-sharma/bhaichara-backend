const multer = require("multer");
const path = require("path");
const fs = require("fs");

const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeUserId = String(req.params.id || "user").replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${safeUserId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if ((file.mimetype || "").startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed."));
};

const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = {
  uploadAvatar,
};
