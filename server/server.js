const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

const io = new Server(server, {
  cors: { origin: "*" }
});

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/whiteboard")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Schema
const BoardSchema = new mongoose.Schema({
  name: { type: String, default: "Untitled Board" },
  data: Array,
  createdAt: { type: Date, default: Date.now }
});

const Board = mongoose.model("Board", BoardSchema);

// WebSocket
io.on("connection", (socket) => {
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });
});

// APIs
app.post("/save", async (req, res) => {
  const { name, data } = req.body;
  const board = new Board({ name, data });
  await board.save();
  res.json(board);
});

app.get("/boards", async (req, res) => {
  const boards = await Board.find().sort({ createdAt: -1 });
  res.json(boards);
});

app.get("/load/:id", async (req, res) => {
  const board = await Board.findById(req.params.id);
  res.json(board);
});

app.put("/rename/:id", async (req, res) => {
  const { name } = req.body;
  const board = await Board.findByIdAndUpdate(
    req.params.id,
    { name },
    { new: true }
  );
  res.json(board);
});

app.delete("/delete/:id", async (req, res) => {
  await Board.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
