const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentData = [];

const socket = io();
const BASE_URL = window.location.origin;

// Canvas size
canvas.width = window.innerWidth - 220;
canvas.height = window.innerHeight - 100;

// ================= DRAW =================
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.fillRect(x, y, 2, 2);

  const point = { x, y };
  currentData.push(point);

  socket.emit("draw", point);
}

// Receive draw
socket.on("draw", (data) => {
  ctx.fillRect(data.x, data.y, 2, 2);
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

  try {
    await fetch(`${BASE_URL}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        data: currentData
      })
    });

    alert("Saved!");
    loadBoards();
  } catch (err) {
    console.error(err);
    alert("Save failed");
  }
}

// ================= LOAD LIST =================
async function loadBoards() {
  try {
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
  } catch (err) {
    console.error(err);
  }
}

// ================= LOAD BOARD =================
async function loadBoard(id) {
  try {
    const res = await fetch(`${BASE_URL}/load/${id}`);
    const board = await res.json();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    board.data.forEach(p => {
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    currentData = board.data;
  } catch (err) {
    console.error(err);
  }
}

// ================= REFRESH =================
function refreshBoards() {
  loadBoards();
}

// ================= AUTO LOAD =================
window.onload = () => {
  loadBoards();
};
