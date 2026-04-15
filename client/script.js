const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let currentBoardId = null;

// Resize canvas WITHOUT losing drawing
function resizeCanvas() {
  const temp = canvas.toDataURL();

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const img = new Image();
  img.src = temp;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Drawing
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const tool = document.getElementById("tool").value;
  const color = document.getElementById("color").value;
  const size = document.getElementById("size").value;

  ctx.lineCap = "round";

  if (tool === "pen") {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.globalAlpha = 1;
  }

  if (tool === "brush") {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 2;
    ctx.globalAlpha = 1;
  }

  if (tool === "highlighter") {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 4;
    ctx.globalAlpha = 0.3;
  }

  if (tool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = size * 3;
    ctx.globalAlpha = 1;
  }

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

// Clear
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ✅ FIXED SAVE (IMPORTANT)
async function saveBoard() {
  const name = prompt("Enter board name:");
  if (!name) return;

  const data = canvas.toDataURL();

  try {
    const res = await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        data // store string directly
      })
    });

    const result = await res.json();

    // 🔥 Update sidebar instantly
    await loadBoards();

    alert("Saved successfully!");
  } catch (err) {
    console.error(err);
    alert("Save failed");
  }
}

// Load boards
async function loadBoards() {
  try {
    const res = await fetch("/boards");
    const boards = await res.json();

    const list = document.getElementById("boardsList");
    list.innerHTML = "";

    boards.forEach(board => {
      const btn = document.createElement("button");
      btn.innerText = board.name;
      btn.style.display = "block";
      btn.style.width = "100%";
      btn.style.marginBottom = "5px";

      btn.onclick = () => loadBoard(board._id);

      list.appendChild(btn);
    });

  } catch (err) {
    console.error("Error loading boards:", err);
  }
}

// Load board
async function loadBoard(id) {
  try {
    const res = await fetch(`/load/${id}`);
    const board = await res.json();

    const img = new Image();
    img.src = board.data; // string

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    currentBoardId = id;

  } catch (err) {
    console.error("Load error:", err);
  }
}

// New board
function newBoard() {
  clearCanvas();
  currentBoardId = null;
}

// Download
function download() {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL();
  link.click();
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("light");
}

// Init
window.onload = () => {
  loadBoards();
};
