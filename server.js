
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "*"
}));

app.use(express.json({ limit: "2mb" }));

// Server health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TECH_ARYAN_K Backend is running!",
    status: "online"
  });
});

// API connection status (keys are never exposed)
app.get("/api/status", (req, res) => {
  res.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    fal: Boolean(process.env.FAL_KEY),
    backend: "online"
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TECH_ARYAN_K server running on port ${PORT}`);
});
