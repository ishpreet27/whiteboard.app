const socket = io("http://localhost:5001");

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.7;
canvas.height = window.innerHeight * 0.7;

let drawing = false;
let history = [];
let currentBoardId = null;

let tool = "pen";
let color = "#000000";
let size = 5;

document.getElementById("tool").onchange = e => tool = e.target.value;
document.getElementById("color").onchange = e => color = e.target.value;
document.getElementById("size").onchange = e => size = e.target.value;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const data = { x: e.offsetX, y: e.offsetY, tool, color, size };

  drawCanvas(data);
  socket.emit("draw", data);
  history.push(data);
}

function drawCanvas({ x, y, tool, color, size }) {
  if (tool === "eraser") {
    ctx.clearRect(x - 10, y - 10, 20, 20);
    return;
  }

  ctx.beginPath();

  if (tool === "pen") ctx.arc(x, y, size, 0, Math.PI * 2);
  if (tool === "brush") ctx.arc(x, y, size * 2, 0, Math.PI * 2);
  if (tool === "highlighter") {
    ctx.fillStyle = color + "55";
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
  } else {
    ctx.fillStyle = color;
  }

  ctx.fill();
}

socket.on("draw", drawCanvas);

function clearBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history = [];
  socket.emit("clear");
}

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// NEW BOARD
function newBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history = [];
  currentBoardId = null;
}

// SAVE
async function saveBoard() {
  const name = prompt("Enter board name:");
  const res = await fetch("http://localhost:5001/save", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, data: history })
  });

  const data = await res.json();
  currentBoardId = data._id;
  loadBoards();
}

// LOAD LIST
async function loadBoards() {
  const res = await fetch("http://localhost:5001/boards");
  const boards = await res.json();

  const list = document.getElementById("boardsList");
  list.innerHTML = "";

  boards.forEach(b => {
    const div = document.createElement("div");
    div.className = "board-item";

    const name = document.createElement("span");
    name.innerText = b.name;
    name.onclick = () => loadBoardById(b._id);

    const renameBtn = document.createElement("button");
    renameBtn.innerText = "✏️";
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      renameBoard(b._id);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "🗑";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteBoard(b._id);
    };

    div.appendChild(name);
    div.appendChild(renameBtn);
    div.appendChild(deleteBtn);

    list.appendChild(div);
  });
}

// LOAD BOARD
async function loadBoardById(id) {
  const res = await fetch(`http://localhost:5001/load/${id}`);
  const board = await res.json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (board.data) {
    board.data.forEach(drawCanvas);
  }
}

// RENAME
async function renameBoard(id) {
  const name = prompt("New name:");
  await fetch(`http://localhost:5001/rename/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name })
  });

  loadBoards();
}

// DELETE
async function deleteBoard(id) {
  if (!confirm("Delete this board?")) return;

  await fetch(`http://localhost:5001/delete/${id}`, {
    method: "DELETE"
  });

  loadBoards();
}

// DOWNLOAD
function downloadImage() {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL();
  link.click();
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("light");
}

// INIT
loadBoards();