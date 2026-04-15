const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentData = [];

const socket = io();

// ✅ Dynamic URL (important)
const BASE_URL = window.location.origin;

// Canvas size
canvas.width = window.innerWidth - 200;
canvas.height = window.innerHeight;

// ================= DRAW =================
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const x = e.clientX - 200;
  const y = e.clientY;

  ctx.fillRect(x, y, 2, 2);

  const point = { x, y };
  currentData.push(point);

  socket.emit("draw", point);
}

// Receive draw
socket.on("draw", (data) => {
  ctx.fillRect(data.x, data.y, 2, 2);
});

// Clear
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

  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      data: currentData
    })
  });

  await res.json();
  alert("Saved!");

  loadBoards(); // refresh sidebar
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

// ================= LOAD ONE =================
async function loadBoard(id) {
  const res = await fetch(`${BASE_URL}/load/${id}`);
  const board = await res.json();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.data.forEach(p => {
    ctx.fillRect(p.x, p.y, 2, 2);
  });

  currentData = board.data;
}

// ================= REFRESH =================
function refreshBoards() {
  loadBoards();
}

// ================= AUTO LOAD =================
window.onload = () => {
  loadBoards();
};
