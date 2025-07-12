const board = document.getElementById("board");
const log = document.getElementById("log");
const guessCountDisplay = document.getElementById("guess-count");
const revealBtn = document.getElementById("reveal");

let atomCount = 4;
const SIZE = 10;
let atoms = [];
let guessCount = 0;
let playerGuesses = [];

function startGame(count) {
  atomCount = count;
  document.getElementById("difficulty-screen").style.display = "none";
  document.getElementById("game-container").style.display = "flex";
  atoms = generateRandomAtoms(atomCount);
  buildBoard();
}

function generateRandomAtoms(count) {
  const positions = new Set();
  while (positions.size < count) {
    const r = Math.floor(Math.random() * 8) + 1;
    const c = Math.floor(Math.random() * 8) + 1;
    positions.add(r * SIZE + c);
  }
  return Array.from(positions);
}

function buildBoard() {
  board.innerHTML = "";
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
      } else {
        cell.addEventListener('click', () => handleCellClick(r, c));
      }

      board.appendChild(cell);
    }
  }
}

function getBorderNumber(r, c) {
  if (r === 0 && c >= 1 && c <= 8) return c;
  if (c === 9 && r >= 1 && r <= 8) return 8 + r;
  if (r === 9 && c >= 1 && c <= 8) return 26 - c;
  if (c === 0 && r >= 1 && r <= 8) return 34 - r;
  return null;
}

function getEntry(num) {
  if (num >= 1 && num <= 8) return { pos: { r: 0, c: num }, dir: { r: 1, c: 0 } };
  if (num >= 9 && num <= 16) return { pos: { r: num - 8, c: 9 }, dir: { r: 0, c: -1 } };
  if (num >= 17 && num <= 24) return { pos: { r: 9, c: 26 - num }, dir: { r: -1, c: 0 } };
  if (num >= 25 && num <= 32) return { pos: { r: 34 - num, c: 0 }, dir: { r: 0, c: 1 } };
  return null;
}

function fireRay(entry) {
  guessCount++;
  guessCountDisplay.textContent = `Guesses: ${guessCount}`;
  let { pos, dir } = getEntry(entry);
  let firstMove = true;

  while (true) {
    pos = { r: pos.r + dir.r, c: pos.c + dir.c };

    if (pos.r === 0 || pos.r === SIZE - 1 || pos.c === 0 || pos.c === SIZE - 1) {
      const exit = getBorderNumber(pos.r, pos.c);
      if (exit === entry && firstMove) {
        log.innerHTML += `<div>Ray ${entry} → Reflected</div>`;
      } else {
        log.innerHTML += `<div>Ray ${entry} → Exited at ${exit}</div>`;
      }
      return;
    }

    const idx = pos.r * SIZE + pos.c;

    if (atoms.includes(idx)) {
      log.innerHTML += `<div>Ray ${entry} → Absorbed</div>`;
      return;
    }

    const diagonals = getDiagonals(pos);
    const occupiedDiagonals = diagonals.filter(d => atoms.includes(d.r * SIZE + d.c)).map(d => d.name);

    if ((occupiedDiagonals.includes("NW") && occupiedDiagonals.includes("SE")) ||
      (occupiedDiagonals.includes("NE") && occupiedDiagonals.includes("SW"))) {
      if (firstMove) {
        log.innerHTML += `<div>Ray ${entry} → Reflected</div>`;
      }
      return;
    }

    if (occupiedDiagonals.length === 1) {
      dir = deflect(dir, occupiedDiagonals[0]);
    }

    firstMove = false;
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
  if (dir.r === 1 && dir.c === 0 || dir.r === -1 && dir.c === 0) {
    return (diag === "NW" || diag === "SW") ? { r: 0, c: 1 } : { r: 0, c: -1 };
  }
  if (dir.r === 0 && dir.c === 1 || dir.r === 0 && dir.c === -1) {
    return (diag === "NW" || diag === "NE") ? { r: 1, c: 0 } : { r: -1, c: 0 };
  }
  return dir;
}

function handleCellClick(r, c) {
  const idx = r * SIZE + c;
  if (playerGuesses.includes(idx)) {
    playerGuesses = playerGuesses.filter(i => i !== idx);
    board.children[idx].classList.remove('guess');
  } else if (playerGuesses.length < atomCount) {
    playerGuesses.push(idx);
    board.children[idx].classList.add('guess');
  }
}

revealBtn.addEventListener("click", () => {
  atoms.forEach(idx => board.children[idx].classList.add("atom"));
  let correct = playerGuesses.filter(g => atoms.includes(g)).length;
  log.innerHTML += `<div>You guessed ${correct}/${atomCount} atom(s) correctly.</div>`;
});
