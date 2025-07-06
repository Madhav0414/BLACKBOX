const board = document.getElementById("board");
const log = document.getElementById("log");
const guessCountDisplay = document.getElementById("guess-count");
const revealBtn = document.getElementById("reveal");

const SIZE = 10;
let guessCount = 0;

const atomCount = 4;
const atoms = generateRandomAtoms(atomCount);

let guessMode = false;
let playerGuesses = [];

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
        } else {
            cell.addEventListener('click', () => handleCellClick(r, c));
        }

        board.appendChild(cell);
    }
}

function getBorderNumber(r, c) {
    if (r === 0 && c >= 1 && c <= 8) return c; // Top
    if (c === 9 && r >= 1 && r <= 8) return 8 + r; // Right
    if (r === 9 && c >= 1 && c <= 8) return 26 - c; // Bottom
    if (c === 0 && r >= 1 && r <= 8) return 34 - r; // Left
    return null;
}

function getEntry(num) {
    if (num >= 1 && num <= 8) return { pos: { r: 0, c: num }, dir: { r: 1, c: 0 } }; // Top
    if (num >= 9 && num <= 16) return { pos: { r: num - 8, c: 9 }, dir: { r: 0, c: -1 } }; // Right
    if (num >= 17 && num <= 24) return { pos: { r: 9, c: 26 - num }, dir: { r: -1, c: 0 } }; // Bottom
    if (num >= 25 && num <= 32) return { pos: { r: 34 - num, c: 0 }, dir: { r: 0, c: 1 } }; // Left
    return null;
}

function fireRay(entry) {
    guessCount++;
    guessCountDisplay.textContent = `Guesses: ${guessCount}`;

    let { pos, dir } = getEntry(entry);

    let firstMove = true;

    while (true) {
        pos = { r: pos.r + dir.r, c: pos.c + dir.c };

        // Check for exit
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

        // Check for absorption
        if (atoms.includes(idx)) {
            log.innerHTML += `<div>Ray ${entry} → Absorbed</div>`;
            return;
        }

        // Check diagonals
        let diagonals = getDiagonals(pos);
        let occupiedDiagonals = diagonals.filter(d => atoms.includes(d.r * SIZE + d.c)).map(d => d.name);

        // Check for reflection (special case)
        if ((occupiedDiagonals.includes("NW") && occupiedDiagonals.includes("SE")) ||
            (occupiedDiagonals.includes("NE") && occupiedDiagonals.includes("SW"))) {
            if (firstMove) {
                log.innerHTML += `<div>Ray ${entry} → Reflected</div>`;
            } else {
                // Continue moving even after double deflection
                // The ray can still exit elsewhere
            }
            return;
        }

        // Deflection
        if (occupiedDiagonals.length === 1) {
            dir = deflect(dir, occupiedDiagonals[0]);
        }

        firstMove = false; // After first movement, set this to false
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
    // Moving down
    if (dir.r === 1 && dir.c === 0) {
        if (diag === "NW" || diag === "SW") return { r: 0, c: 1 }; // Deflect right
        if (diag === "NE" || diag === "SE") return { r: 0, c: -1 }; // Deflect left
    }

    // Moving up
    if (dir.r === -1 && dir.c === 0) {
        if (diag === "NW" || diag === "SW") return { r: 0, c: 1 }; // Deflect right
        if (diag === "NE" || diag === "SE") return { r: 0, c: -1 }; // Deflect left
    }

    // Moving right
    if (dir.r === 0 && dir.c === 1) {
        if (diag === "NW" || diag === "NE") return { r: 1, c: 0 }; // Deflect down
        if (diag === "SW" || diag === "SE") return { r: -1, c: 0 }; // Deflect up
    }

    // Moving left
    if (dir.r === 0 && dir.c === -1) {
        if (diag === "NW" || diag === "NE") return { r: 1, c: 0 }; // Deflect down
        if (diag === "SW" || diag === "SE") return { r: -1, c: 0 }; // Deflect up
    }

    // If no deflection, keep moving straight
    return dir;
}

// Handle player guesses by clicking cells
function handleCellClick(r, c) {
    if (!guessMode) return;

    const idx = r * SIZE + c;

    if (playerGuesses.includes(idx)) return;

    playerGuesses.push(idx);
    board.children[idx].classList.add('guess');

    if (playerGuesses.length === 4) {
        let correct = 0;
        playerGuesses.forEach(g => {
            if (atoms.includes(g)) correct++;
        });

        log.innerHTML += `<div>You guessed ${correct} atom(s) correctly!</div>`;
        revealAtoms();
        guessMode = false;
    }
}

// Guess button setup
const guessBtn = document.createElement('button');
guessBtn.textContent = "Start Guessing";
document.body.insertBefore(guessBtn, log);

guessBtn.addEventListener('click', () => {
    guessMode = true;
    playerGuesses = [];
    log.innerHTML += `<div>Guess mode activated! Click 4 cells.</div>`;
});

// Reveal button setup
revealBtn.addEventListener("click", () => {
    revealAtoms();
});

function revealAtoms() {
    atoms.forEach(idx => board.children[idx].classList.add("atom"));
}
