const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Keep files in memory so we can stream them straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || "").startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// POST /api/upload/avatar
router.post("/avatar", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided." });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "bhaichara/avatars",
      resource_type: "image",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    },
    (error, result) => {
      if (error || !result) {
        console.error("[upload/avatar] Cloudinary error:", error);
        return res
          .status(500)
          .json({ message: "Cloudinary upload failed.", error: error?.message });
      }
      return res.status(200).json({ avatarUrl: result.secure_url });
    },
  );

  uploadStream.on("error", (err) => {
    console.error("[upload/avatar] stream error:", err);
  });

  uploadStream.end(req.file.buffer);
});

module.exports = router;
