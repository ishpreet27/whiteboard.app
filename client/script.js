const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const socket = io();
const BASE_URL = window.location.origin;

let drawing = false;
let currentData = [];

let color = document.getElementById("colorPicker").value;
let size = document.getElementById("size").value;

// Fullscreen canvas
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = window.innerHeight - 120;
}
resizeCanvas();
window.onresize = resizeCanvas;

// ================= DRAW =================
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  const point = { x, y, color, size };
  currentData.push(point);

  socket.emit("draw", point);
}

// Receive draw
socket.on("draw", (data) => {
  ctx.fillStyle = data.color;
  ctx.fillRect(data.x, data.y, data.size, data.size);
});

// ================= CLEAR =================
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentData = [];
  socket.emit("clear");
}

socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// ================= SAVE =================
async function saveBoard() {
  const name = prompt("Enter board name:");
  if (!name) return;

  await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, data: currentData })
  });

  alert("Saved!");
  loadBoards();
}

// ================= LOAD LIST =================
async function loadBoards() {
  const res = await fetch(`${BASE_URL}/boards`);
  const boards = await res.json();

  const list = document.getElementById("boardsList");
  list.innerHTML = "";

  boards.forEach(board => {
    const div = document.createElement("div");
    div.innerText = board.name;
    div.onclick = () => loadBoard(board._id);
    list.appendChild(div);
  });
}

// ================= LOAD BOARD =================
async function loadBoard(id) {
  const res = await fetch(`${BASE_URL}/load/${id}`);
  const board = await res.json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.data.forEach(p => {
    ctx.fillStyle = p.color || "#000";
    ctx.fillRect(p.x, p.y, p.size || 2, p.size || 2);
  });

  currentData = board.data;
}

// ================= REFRESH =================
function refreshBoards() {
  loadBoards();
}

// ================= DOWNLOAD =================
function downloadCanvas() {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL();
  link.click();
}

// ================= THEME =================
function toggleTheme() {
  document.body.classList.toggle("light");
}

// ================= EVENTS =================
document.getElementById("colorPicker").onchange = e => color = e.target.value;
document.getElementById("size").onchange = e => size = e.target.value;

// ================= AUTO LOAD =================
window.onload = () => loadBoards();
