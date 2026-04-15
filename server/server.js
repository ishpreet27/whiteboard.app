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

// ✅ Serve frontend (IMPORTANT)
app.use(express.static(path.join(__dirname, "../client")));

// ✅ Root route (loads your UI)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const server = http.createServer(app);

// ✅ PORT for Render
const PORT = process.env.PORT || 5001;

// Socket.io
const io = new Server(server, {
  cors: { origin: "*" }
});

// ✅ MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Schema
const BoardSchema = new mongoose.Schema({
  name: { type: String, default: "Untitled Board" },
  data: Array,
  createdAt: { type: Date, default: Date.now }
});

const Board = mongoose.model("Board", BoardSchema);

// WebSocket
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

// APIs
app.post("/save", async (req, res) => {
  try {
    const { name, data } = req.body;
    const board = new Board({ name, data });
    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/boards", async (req, res) => {
  try {
    const boards = await Board.find().sort({ createdAt: -1 });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/load/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/rename/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/delete/:id", async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server (Render fix)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
