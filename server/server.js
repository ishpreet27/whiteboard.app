const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 5001;

// ✅ MongoDB (Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Schema
const BoardSchema = new mongoose.Schema({
  name: { type: String, default: "Untitled Board" },
  data: Array,
  createdAt: { type: Date, default: Date.now }
});

const Board = mongoose.model("Board", BoardSchema);

// ================= SOCKET =================
io.on("connection", (socket) => {
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });
});

// ================= ROUTES =================

// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// SAVE
app.post("/save", async (req, res) => {
  const { name, data } = req.body;
  const board = new Board({ name, data });
  await board.save();
  res.json(board);
});

// GET ALL
app.get("/boards", async (req, res) => {
  const boards = await Board.find().sort({ createdAt: -1 });
  res.json(boards);
});

// LOAD ONE
app.get("/load/:id", async (req, res) => {
  const board = await Board.findById(req.params.id);
  res.json(board);
});

// ================= START =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
