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

app.options("*", cors());
