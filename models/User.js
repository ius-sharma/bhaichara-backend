const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistReason: {
      type: String,
      default: "",
      trim: true,
    },
    blacklistedAt: {
      type: Date,
      default: null,
    },
    blacklistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("User", userSchema);
