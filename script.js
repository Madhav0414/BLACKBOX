const gridSize = 10;
const playSize = 8;
const atomCount = 4;
let atoms = [];
let guessCount = 0;
let rayLog = [];
const grid = document.getElementById("grid");
const guessDisplay = document.getElementById("guess-count");
const rayLogDiv = document.getElementById("ray-log");

function isEdge(r, c) {
  return r === 0 || r === 9 || c === 0 || c === 9;
}

function resetGame() {
  atoms = [];
  guessCount = 0;
  rayLog = [];
  guessDisplay.textContent = "0";
  rayLogDiv.innerHTML = "";
  const taken = new Set();
  while (atoms.length < atomCount) {
    const r = Math.floor(Math.random() * playSize) + 1;
    const c = Math.floor(Math.random() * playSize) + 1;
    const key = `${r},${c}`;
    if (!taken.has(key)) {
      taken.add(key);
      atoms.push({ r, c });
    }
  }
  createGrid();
}

function createGrid() {
  grid.innerHTML = "";
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (isEdge(r, c)) {
        cell.classList.add("edge");
        const number = getEdgeNumber(r, c);
        if (number) {
          cell.textContent = number;
          cell.dataset.edge = number;
          cell.onclick = () => shootRay(r, c, cell, number);
        }
      } else {
        cell.classList.add("inside");
        cell.onclick = () => markGuess(cell);
      }

      grid.appendChild(cell);
    }
  }
}

function getEdgeNumber(r, c) {
  if (r === 0 && c >= 1 && c <= 8) return c;
  if (c === 9 && r >= 1 && r <= 8) return 8 + r;
  if (r === 9 && c >= 1 && c <= 8) return 25 - c;
  if (c === 0 && r >= 1 && r <= 8) return 33 - r;
  return null;
}

function getCellByEdgeNumber(num) {
  if (num >= 1 && num <= 8) return [0, num];
  if (num >= 9 && num <= 16) return [num - 8, 9];
  if (num >= 17 && num <= 24) return [9, 25 - num];
  if (num >= 25 && num <= 32) return [33 - num, 0];
  return null;
}

function markGuess(cell) {
  cell.classList.toggle("guess");
  guessCount = document.querySelectorAll(".guess").length;
  guessDisplay.textContent = guessCount;
}

function shootRay(r, c, entryCell, entryNum) {
  const dir = getDirection(r, c);
  let curR = r + dir.dr;
  let curC = c + dir.dc;

  while (curR > 0 && curR < 9 && curC > 0 && curC < 9) {
    if (hasAtom(curR, curC)) {
      entryCell.classList.add("hit");
      logRay(entryNum, "absorbed");
      return;
    }

    const near = getNearbyAtoms(curR, curC);
    if (near.length >= 2) {
      entryCell.classList.add("reflect");
      logRay(entryNum, "reflected");
      return;
    } else if (near.length === 1) {
      const def = deflect(dir);
      curR += def.dr;
      curC += def.dc;
      entryCell.classList.add("deflect");
    } else {
      curR += dir.dr;
      curC += dir.dc;
    }
  }

  const exitNum = getEdgeNumber(curR, curC);
  entryCell.classList.add("reflect");
  const exitCell = document.querySelector(`.cell[data-row='${curR}'][data-col='${curC}']`);
  if (exitCell && exitCell !== entryCell) {
    exitCell.classList.add("reflect");
    logRay(entryNum, exitNum);
  } else {
    logRay(entryNum, "reflected");
  }
}

function logRay(from, to) {
  const msg = typeof to === "number"
    ? `Ray: ${from} → ${to}`
    : `Ray: ${from} → ${to}`;
  rayLog.push(msg);
  updateLogDisplay();
}

function updateLogDisplay() {
  rayLogDiv.innerHTML = rayLog.map(line => `<div>${line}</div>`).join("");
}

function getDirection(r, c) {
  if (r === 0) return { dr: 1, dc: 0 };
  if (r === 9) return { dr: -1, dc: 0 };
  if (c === 0) return { dr: 0, dc: 1 };
  if (c === 9) return { dr: 0, dc: -1 };
}

function hasAtom(r, c) {
  return atoms.some(atom => atom.r === r && atom.c === c);
}

function getNearbyAtoms(r, c) {
  const near = [];
  const positions = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1]
  ];
  for (let [nr, nc] of positions) {
    if (hasAtom(nr, nc)) near.push({ r: nr, c: nc });
  }
  return near;
}

function deflect(dir) {
  return { dr: dir.dc, dc: dir.dr };
}

function checkGuesses() {
  let correct = 0;
  document.querySelectorAll(".guess").forEach(cell => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    if (hasAtom(r, c)) {
      correct++;
      cell.classList.add("atom");
    } else {
      cell.classList.add("hit");
    }
  });

  // Reveal all atoms
  atoms.forEach(({ r, c }) => {
    const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
    if (!cell.classList.contains("guess")) {
      cell.classList.add("atom");
    }
  });

  setTimeout(() => {
    alert(`You found ${correct}/${atomCount} atoms.`);
  }, 100);
}

resetGame();
