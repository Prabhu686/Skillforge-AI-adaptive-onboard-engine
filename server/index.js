require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const analyzeRoute = require("./routes/analyze");

const app  = express();
const PORT = process.env.PORT || 5000;
const PROD = process.env.NODE_ENV === "production";

if (!PROD) app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/analyze", analyzeRoute);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Serve React build in production (Docker)
if (PROD) {
  app.use(express.static(path.join(__dirname, "public")));
  app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
}

app.listen(PORT, () => console.log(`SkillForge server running on port ${PORT}`));
