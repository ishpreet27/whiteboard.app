const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentData = [];

const socket = io();

// IMPORTANT: Dynamic URL (works on Render)
const BASE_URL = window.location.origin;

// Resize canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Drawing
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const x = e.clientX;
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

// ==========================
// SAVE BOARD
// ==========================
async function saveBoard() {
  const name = prompt("Enter board name:");

  if (!name) return;

  try {
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

    const data = await res.json();
    alert("Board Saved!");

    loadBoards(); // 🔥 refresh sidebar after save
  } catch (err) {
    console.error(err);
    alert("Save failed!");
  }
}

// ==========================
// LOAD ALL BOARDS
// ==========================
async function loadBoards() {
  try {
    const res = await fetch(`${BASE_URL}/boards`);
    const boards = await res.json();

    const list = document.getElementById("boardsList");
    list.innerHTML = "";

    boards.forEach(board => {
      const item = document.createElement("div");
      item.innerText = board.name;
      item.style.cursor = "pointer";

      item.onclick = () => loadBoard(board._id);

      list.appendChild(item);
    });
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// LOAD SINGLE BOARD
// ==========================
async function loadBoard(id) {
  try {
    const res = await fetch(`${BASE_URL}/load/${id}`);
    const board = await res.json();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    board.data.forEach(point => {
      ctx.fillRect(point.x, point.y, 2, 2);
    });

    currentData = board.data;
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// REFRESH BUTTON FIX
// ==========================
function refreshBoards() {
  loadBoards();
}

// ==========================
// AUTO LOAD ON PAGE LOAD
// ==========================
window.onload = () => {
  loadBoards();  // 🔥 this fixes your issue
};
