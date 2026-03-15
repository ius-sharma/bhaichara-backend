const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ius-sharma.github.io",
      "https://ius-sharma.github.io/bhaichara-client",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

<<<<<<< HEAD
app.options("*", cors());
=======
if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL.trim());
}

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests like Postman or server-to-server calls.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const cors = require("cors");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ius-sharma.github.io",
      "https://ius-sharma.github.io/bhaichara-client"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.options("*", cors());

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.get("/", (req, res) => {
  res.send("Bhaichara backend is running");
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  const message = err?.message || "Internal server error.";

  console.error("[express-error]", {
    method: req.method,
    path: req.originalUrl,
    status,
    message,
  });

  res.status(status).json({
    status,
    message,
  });
});

app.listen(PORT, () => {
  console.log(`Bhaichara backend server running on port ${PORT}`);
});
>>>>>>> 38cc3051996938cf439f9af12c1d8b7263ac4454
