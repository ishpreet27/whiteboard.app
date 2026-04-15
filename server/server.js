const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: { origin: "*" }
});

// PORT (Render compatible)
const PORT = process.env.PORT || 5001;

// ================= MONGODB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ================= SCHEMA (FIXED) =================
const BoardSchema = new mongoose.Schema({
  name: { type: String, default: "Untitled Board" },
  data: String, // ✅ IMPORTANT FIX
  createdAt: { type: Date, default: Date.now }
});

const Board = mongoose.model("Board", BoardSchema);

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 User connected");

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected");
  });
});

// ================= ROUTES =================

// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// SAVE BOARD
app.post("/save", async (req, res) => {
  try {
    const { name, data } = req.body;

    const board = new Board({
      name,
      data
    });

    await board.save();

    res.json(board); // send saved board back
  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ error: "Failed to save board" });
  }
});

// GET ALL BOARDS
app.get("/boards", async (req, res) => {
  try {
    const boards = await Board.find().sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// LOAD ONE BOARD
app.get("/load/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    res.json(board);
  } catch (err) {
    console.error("Load Error:", err);
    res.status(500).json({ error: "Failed to load board" });
  }
});

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
