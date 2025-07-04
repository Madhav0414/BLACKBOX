const board = document.getElementById("board");
const log = document.getElementById("log");
const guessCountDisplay = document.getElementById("guess-count");
const revealBtn = document.getElementById("reveal");

const SIZE = 10;
let guessCount = 0;

const atomCount = 4;
const atoms = generateRandomAtoms(atomCount);

function generateRandomAtoms(count) {
  const positions = new Set();

  while (positions.size < count) {
    const r = Math.floor(Math.random() * 8) + 1;
    const c = Math.floor(Math.random() * 8) + 1;
    positions.add(r * SIZE + c);
  }

  return Array.from(positions);
}

// Build board
for (let r = 0; r < SIZE; r++) {
  for (let c = 0; c < SIZE; c++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    if ((r === 0 || r === 9 || c === 0 || c === 9) &&
      !(r === 0 && c === 0) && !(r === 0 && c === 9) &&
      !(r === 9 && c === 0) && !(r === 9 && c === 9)) {
      const num = getBorderNumber(r, c);
      if (num !== null) {
        cell.classList.add("border");
        cell.textContent = String(num).padStart(2, "0");
        cell.addEventListener("click", () => fireRay(num));
      }
    }

    board.appendChild(cell);
  }
}

function getBorderNumber(r, c) {
  if (r === 0 && c >= 1 && c <= 8) return c;
  if (c === 9 && r >= 1 && r <= 8) return r + 9;
  if (r === 9 && c >= 1 && c <= 8) return 27 - c;
  if (c === 0 && r >= 1 && r <= 8) return 35 - r;
  return null;
}

function getEntry(num) {
  if (num >= 1 && num <= 8) return { pos: { r: 0, c: num }, dir: { r: 1, c: 0 } };
  if (num >= 10 && num <= 17) return { pos: { r: num - 9, c: 9 }, dir: { r: 0, c: -1 } };
  if (num >= 19 && num <= 26) return { pos: { r: 9, c: 27 - num }, dir: { r: -1, c: 0 } };
  if (num >= 27 && num <= 34) return { pos: { r: 35 - num, c: 0 }, dir: { r: 0, c: 1 } };
  return null;
}

function fireRay(entry) {
  clearPaths();
  guessCount++;
  guessCountDisplay.textContent = `Guesses: ${guessCount}`;

  let { pos, dir } = getEntry(entry);
  let path = [];

  while (true) {
    pos = { r: pos.r + dir.r, c: pos.c + dir.c };
    path.push({ ...pos });

    if (pos.r === 0 || pos.r === 9 || pos.c === 0 || pos.c === 9) {
      const exit = getBorderNumber(pos.r, pos.c);
      const result = (exit === entry) ? "Reflected" : `Exit at ${exit}`;
      log.innerHTML += `<div>Ray ${entry} → ${result}</div>`;
      drawPath(path);
      return;
    }

    const idx = pos.r * SIZE + pos.c;

    if (atoms.includes(idx)) {
      log.innerHTML += `<div>Ray ${entry} → Absorbed</div>`;
      drawPath(path);
      return;
    }

    // Universal diagonal deflection check
    const diag = getDiagonals(pos);
    const deflection = diag.find(d => atoms.includes(d.r * SIZE + d.c));
    if (deflection) {
      dir = deflect(dir, deflection.name);
    }

    // Reflection check (blocked from both diagonals)
    const diagNames = diag.filter(p => atoms.includes(p.r * SIZE + p.c)).map(p => p.name);
    if ((diagNames.includes("NW") && diagNames.includes("SE")) ||
      (diagNames.includes("NE") && diagNames.includes("SW"))) {
      log.innerHTML += `<div>Ray ${entry} → Reflected</div>`;
      drawPath(path);
      return;
    }
  }
}

function getDiagonals(pos) {
  return [
    { r: pos.r - 1, c: pos.c - 1, name: "NW" },
    { r: pos.r - 1, c: pos.c + 1, name: "NE" },
    { r: pos.r + 1, c: pos.c - 1, name: "SW" },
    { r: pos.r + 1, c: pos.c + 1, name: "SE" }
  ];
}

function deflect(dir, diag) {
  if (diag === "NW") return dir.r === 1 ? { r: 0, c: 1 } : { r: 1, c: 0 };
  if (diag === "NE") return dir.r === 1 ? { r: 0, c: -1 } : { r: 1, c: 0 };
  if (diag === "SW") return dir.r === -1 ? { r: 0, c: 1 } : { r: -1, c: 0 };
  if (diag === "SE") return dir.r === -1 ? { r: 0, c: -1 } : { r: -1, c: 0 };
  return dir;
}

function drawPath(path) {
  path.forEach(p => {
    const idx = p.r * SIZE + p.c;
    if (idx >= 0 && idx < board.children.length) {
      board.children[idx].classList.add("path");
    }
  });
}

function clearPaths() {
  document.querySelectorAll(".path").forEach(cell => cell.classList.remove("path"));
}

revealBtn.addEventListener("click", () => {
  atoms.forEach(idx => board.children[idx].classList.add("atom"));
});
