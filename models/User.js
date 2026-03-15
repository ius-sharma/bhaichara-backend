const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    aiName: {
      type: String,
      default: "Jarvish",
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

module.exports = mongoose.model("User", userSchema);
