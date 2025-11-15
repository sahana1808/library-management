// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");

const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: config.clientOrigin,
  })
);

// Routes
app.get("/", (_req, res) => {
  res.send("Library Book Request & Tracking System API");
});

app.use("/api/auth", authRoutes);
app.use("/api", requestRoutes);

// Connect to MongoDB and start server
console.log("DEBUG - using MONGO URI:", config.mongoUri);   // <-- added debug line

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
