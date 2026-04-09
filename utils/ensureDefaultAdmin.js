const bcrypt = require("bcryptjs");
const User = require("../models/User");

const DEFAULT_ADMIN = {
  name: "Ayush",
  email: "ayush@dev.com",
  password: "123456",
  role: "admin",
};

const ensureDefaultAdmin = async () => {
  const email = DEFAULT_ADMIN.email.toLowerCase();
  const existingAdmin = await User.findOne({ email });

  if (!existingAdmin) {
    await User.create({
      name: DEFAULT_ADMIN.name,
      email,
      password: DEFAULT_ADMIN.password,
      role: DEFAULT_ADMIN.role,
    });
    console.log("Default admin created.");
    return;
  }

  const passwordMatches = await bcrypt.compare(
    DEFAULT_ADMIN.password,
    existingAdmin.password,
  );

  let shouldSave = false;

  if (existingAdmin.role !== "admin") {
    existingAdmin.role = "admin";
    shouldSave = true;
  }

  if (existingAdmin.name !== DEFAULT_ADMIN.name) {
    existingAdmin.name = DEFAULT_ADMIN.name;
    shouldSave = true;
  }

  if (!passwordMatches) {
    existingAdmin.password = DEFAULT_ADMIN.password;
    shouldSave = true;
  }

  if (shouldSave) {
    await existingAdmin.save();
    console.log("Default admin updated.");
  }
};

module.exports = ensureDefaultAdmin;
