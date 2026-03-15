const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

/*
============================
CORS CONFIG
============================
*/

const allowedOrigins = [
  "http://localhost:5173",
  "https://ius-sharma.github.io",
  "https://ius-sharma.github.io/bhaichara-client",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());

/*
============================
MIDDLEWARE
============================
*/

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
============================
ROUTES
============================
*/

const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/aiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/upload", uploadRoutes);

/*
============================
TEST ROUTE
============================
*/

app.get("/", (req, res) => {
  res.send("Bhaichara backend is running 🚀");
});

/*
============================
ERROR HANDLER
============================
*/

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || 500;

  console.error("Server Error:", err.message);

  res.status(status).json({
    status,
    message: err.message || "Internal Server Error",
  });
});

/*
============================
SERVER START
============================
*/

app.listen(PORT, () => {
  console.log(`Bhaichara backend server running on port ${PORT}`);
});
