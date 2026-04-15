const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let data = [];

// ✅ FIX: use deployed URL automatically
const BASE_URL = window.location.origin;

// ✅ FIX: socket for deployed app
const socket = io();

// Draw function
function drawLine(x0, y0, x1, y1, emit) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.closePath();

  if (!emit) return;

  const w = canvas.width;
  const h = canvas.height;

  socket.emit("draw", {
    x0: x0 / w,
    y0: y0 / h,
    x1: x1 / w,
    y1: y1 / h
  });

  data.push({ x0, y0, x1, y1 });
}

// Mouse events
let current = { x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  current.x = e.clientX;
  current.y = e.clientY;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  drawLine(current.x, current.y, e.clientX, e.clientY, true);
  current.x = e.clientX;
  current.y = e.clientY;
});

// Socket receive
socket.on("draw", (data) => {
  const w = canvas.width;
  const h = canvas.height;

  drawLine(
    data.x0 * w,
    data.y0 * h,
    data.x1 * w,
    data.y1 * h
  );
});

// Clear canvas
function clearBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  data = [];
  socket.emit("clear");
}

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// =======================
// ✅ SAVE BOARD
// =======================
async function saveBoard() {
  const name = prompt("Enter board name:");
  if (!name) return;

  await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, data })
  });

  alert("✅ Board Saved!");
  loadBoards();
}

// =======================
// ✅ LOAD ALL BOARDS
// =======================
async function loadBoards() {
  const res = await fetch(`${BASE_URL}/boards`);
  const boards = await res.json();

  const list = document.getElementById("boardsList");
  list.innerHTML = "";

  boards.forEach((b) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${b.name}
      <button onclick="loadBoard('${b._id}')">Load</button>
      <button onclick="deleteBoard('${b._id}')">Delete</button>
    `;
    list.appendChild(item);
  });
}

// =======================
// ✅ LOAD ONE BOARD
// =======================
async function loadBoard(id) {
  const res = await fetch(`${BASE_URL}/load/${id}`);
  const board = await res.json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.data.forEach((line) => {
    drawLine(line.x0, line.y0, line.x1, line.y1);
  });

  data = board.data;
}

// =======================
// ✅ DELETE BOARD
// =======================
async function deleteBoard(id) {
  await fetch(`${BASE_URL}/delete/${id}`, {
    method: "DELETE"
  });

  loadBoards();
}

// Load boards on start
window.onload = loadBoards;
