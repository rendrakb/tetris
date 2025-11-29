document.addEventListener("DOMContentLoaded", () => {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT;
  const EMPTY_COLOR = "";

  const gameBoard = document.getElementById("game-board");
  const nextPieceDisplay = document.getElementById("next-piece");
  const holdPieceDisplay = document.getElementById("hold-piece");
  const scoreDisplay = document.getElementById("score");
  const levelDisplay = document.getElementById("level");
  const linesDisplay = document.getElementById("lines");
  const pauseBtn = document.getElementById("pause-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsBtnAlt = document.getElementById("settings-btn-alt");
  const pauseOverlay = document.getElementById("pause-overlay");
  const resumeBtn = document.getElementById("resume-btn");
  const gameOverOverlay = document.getElementById("game-over");
  const finalScoreDisplay = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart-btn");
  const settingsModal = document.getElementById("settings-modal");
  const saveSettingsBtn = document.getElementById("save-settings");
  const resetSettingsBtn = document.getElementById("reset-settings");
  const closeSettingsBtn = document.querySelector(".close-btn");
  const keybindButtons = document.querySelectorAll(".keybind-btn");

  let controls = {
    moveLeft: "ArrowLeft",
    moveRight: "ArrowRight",
    rotate: "ArrowUp",
    softDrop: "ArrowDown",
    hardDrop: " ",
    hold: "c",
    pause: "p",
  };

  let board = Array(BOARD_SIZE).fill(EMPTY_COLOR);
  let currentPiece = null;
  let nextPiece = null;
  let holdPiece = null;
  let hasHeld = false;
  let gameInterval = null;
  let isPaused = false;
  let isGameOver = false;
  let score = 0;
  let level = 1;
  let lines = 0;
  let dropSpeed = 1000;

  const TETROMINOS = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      className: "i-piece",
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      className: "j-piece",
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      className: "l-piece",
    },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      className: "o-piece",
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      className: "s-piece",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      className: "t-piece",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      className: "z-piece",
    },
  };

  function init() {
    for (let i = 0; i < BOARD_SIZE; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      gameBoard.appendChild(cell);
    }

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      nextPieceDisplay.appendChild(cell);
    }

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      holdPieceDisplay.appendChild(cell);
    }

    const savedControls = localStorage.getItem("tetrisControls");
    if (savedControls) {
      controls = JSON.parse(savedControls);
      updateControlsDisplay();
    }

    newGame();

    document.addEventListener("keydown", handleKeyPress);
    pauseBtn.addEventListener("click", togglePause);
    resumeBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", newGame);

    settingsBtn.addEventListener("click", openSettings);
    settingsBtnAlt.addEventListener("click", openSettings);
    closeSettingsBtn.addEventListener("click", closeSettings);
    saveSettingsBtn.addEventListener("click", saveSettings);
    resetSettingsBtn.addEventListener("click", resetSettings);

    document.getElementById("btn-left").addEventListener("click", moveLeft);
    document.getElementById("btn-right").addEventListener("click", moveRight);
    document.getElementById("btn-rotate").addEventListener("click", rotate);
    document.getElementById("btn-soft").addEventListener("click", moveDown);
    document.getElementById("btn-hard").addEventListener("click", hardDrop);
    document
      .getElementById("btn-hold")
      .addEventListener("click", holdCurrentPiece);

    keybindButtons.forEach((btn) => {
      btn.addEventListener("click", startRebinding);
    });
  }

  function newGame() {
    board = Array(BOARD_SIZE).fill(EMPTY_COLOR);
    score = 0;
    level = 1;
    lines = 0;
    dropSpeed = 1000;
    holdPiece = null;
    hasHeld = false;
    isPaused = false;
    isGameOver = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    linesDisplay.textContent = lines;

    const cells = gameBoard.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.className = "cell";
    });

    gameOverOverlay.classList.remove("active");
    pauseOverlay.classList.remove("active");

    nextPiece = getRandomPiece();
    getNewPiece();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(moveDown, dropSpeed);
  }

  function getRandomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const tetromino = pieces[Math.floor(Math.random() * pieces.length)];

    return {
      type: tetromino,
      shape: JSON.parse(JSON.stringify(TETROMINOS[tetromino].shape)),
      className: TETROMINOS[tetromino].className,
      position: {
        x: tetromino === "O" ? 4 : 3,
        y: 0,
      },
      rotation: 0,
    };
  }

  function getNewPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    hasHeld = false;

    if (!isValidMove(currentPiece)) {
      gameOver();
      return;
    }

    drawPiece();
    drawNextPiece();
    drawGhostPiece();
  }

  function drawPiece() {
    clearPiece();

    const { shape, className, position } = currentPiece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (boardY >= 0) {
            const index = boardY * BOARD_WIDTH + boardX;
            const cell = gameBoard.children[index];
            cell.classList.add(className);
          }
        }
      }
    }
  }

  function drawGhostPiece() {
    const cells = gameBoard.querySelectorAll(".ghost");
    cells.forEach((cell) => cell.classList.remove("ghost"));

    const ghostPiece = JSON.parse(JSON.stringify(currentPiece));

    while (isValidMove(ghostPiece)) {
      ghostPiece.position.y++;
    }

    ghostPiece.position.y--;

    const { shape, position } = ghostPiece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (boardY >= 0) {
            const index = boardY * BOARD_WIDTH + boardX;
            const cell = gameBoard.children[index];

            if (!cell.classList.contains(currentPiece.className)) {
              cell.classList.add("ghost");
            }
          }
        }
      }
    }
  }

  function drawNextPiece() {
    const cells = nextPieceDisplay.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.className = "cell";
    });

    const { shape, className } = nextPiece;
    const offsetX = (5 - shape[0].length) / 2;
    const offsetY = (5 - shape.length) / 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const displayX = Math.floor(offsetX + x);
          const displayY = Math.floor(offsetY + y);
          const index = displayY * 4 + displayX;
          cells[index].classList.add(className);
        }
      }
    }
  }

  function drawHoldPiece() {
    const cells = holdPieceDisplay.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.className = "cell";
    });

    if (holdPiece) {
      const { shape, className } = holdPiece;
      const offsetX = (5 - shape[0].length) / 2;
      const offsetY = (5 - shape.length) / 2;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const displayX = Math.floor(offsetX + x);
            const displayY = Math.floor(offsetY + y);
            const index = displayY * 4 + displayX;
            cells[index].classList.add(className);
          }
        }
      }
    }
  }

  function clearPiece() {
    const cells = gameBoard.querySelectorAll(".cell");
    cells.forEach((cell) => {
      if (!cell.classList.contains("locked")) {
        cell.className = "cell";
      }
    });
  }

  function isValidMove(piece) {
    const { shape, position } = piece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }

          if (boardY >= 0) {
            const index = boardY * BOARD_WIDTH + boardX;
            const cell = gameBoard.children[index];

            if (cell.classList.contains("locked")) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  function lockPiece() {
    const { shape, className, position } = currentPiece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (boardY >= 0) {
            const index = boardY * BOARD_WIDTH + boardX;
            const cell = gameBoard.children[index];
            cell.classList.add("locked");
          }
        }
      }
    }

    checkLines();

    getNewPiece();

    createParticles();
  }

  function moveDown() {
    if (isPaused || isGameOver) return;

    currentPiece.position.y++;

    if (!isValidMove(currentPiece)) {
      currentPiece.position.y--;
      lockPiece();
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function moveLeft() {
    if (isPaused || isGameOver) return;

    currentPiece.position.x--;

    if (!isValidMove(currentPiece)) {
      currentPiece.position.x++;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function moveRight() {
    if (isPaused || isGameOver) return;

    currentPiece.position.x++;

    if (!isValidMove(currentPiece)) {
      currentPiece.position.x--;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function rotate() {
    if (isPaused || isGameOver) return;
    if (currentPiece.type === "O") return;

    const originalPosition = { ...currentPiece.position };
    const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));

    const size = currentPiece.shape.length;
    const newShape = Array(size)
      .fill()
      .map(() => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newShape[x][size - 1 - y] = currentPiece.shape[y][x];
      }
    }

    currentPiece.shape = newShape;

    const kicks = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ];

    let validKick = false;

    for (const kick of kicks) {
      currentPiece.position.x = originalPosition.x + kick.x;
      currentPiece.position.y = originalPosition.y + kick.y;

      if (isValidMove(currentPiece)) {
        validKick = true;
        break;
      }
    }

    if (!validKick) {
      currentPiece.position = { ...originalPosition };
      currentPiece.shape = originalShape;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function hardDrop() {
    if (isPaused || isGameOver) return;

    while (isValidMove(currentPiece)) {
      currentPiece.position.y++;
    }

    currentPiece.position.y--;

    drawPiece();
    lockPiece();
  }

  function holdCurrentPiece() {
    if (isPaused || isGameOver || hasHeld) return;

    hasHeld = true;
    clearPiece();

    if (holdPiece === null) {
      holdPiece = {
        type: currentPiece.type,
        shape: JSON.parse(JSON.stringify(TETROMINOS[currentPiece.type].shape)),
        className: currentPiece.className,
        position: { x: currentPiece.type === "O" ? 4 : 3, y: 0 },
        rotation: 0,
      };
      getNewPiece();
    } else {
      const temp = currentPiece;
      currentPiece = {
        type: holdPiece.type,
        shape: JSON.parse(JSON.stringify(holdPiece.shape)),
        className: holdPiece.className,
        position: { x: holdPiece.type === "O" ? 4 : 3, y: 0 },
        rotation: 0,
      };
      holdPiece = {
        type: temp.type,
        shape: JSON.parse(JSON.stringify(TETROMINOS[temp.type].shape)),
        className: temp.className,
        position: { x: temp.type === "O" ? 4 : 3, y: 0 },
        rotation: 0,
      };
    }

    drawHoldPiece();
    drawPiece();
    drawGhostPiece();
  }

  function checkLines() {
    let linesCleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      let isLineComplete = true;

      for (let x = 0; x < BOARD_WIDTH; x++) {
        const index = y * BOARD_WIDTH + x;
        const cell = gameBoard.children[index];

        if (!cell.classList.contains("locked")) {
          isLineComplete = false;
          break;
        }
      }

      if (isLineComplete) {
        linesCleared++;

        for (let x = 0; x < BOARD_WIDTH; x++) {
          const index = y * BOARD_WIDTH + x;
          const cell = gameBoard.children[index];
          cell.className = "cell";

          setTimeout(() => {
            cell.style.backgroundColor = "#FFFFFF";
            setTimeout(() => {
              cell.style.backgroundColor = "";
            }, 50);
          }, x * 20);
        }

        for (let yy = y; yy > 0; yy--) {
          for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = yy * BOARD_WIDTH + x;
            const above = (yy - 1) * BOARD_WIDTH + x;

            const cell = gameBoard.children[index];
            const cellAbove = gameBoard.children[above];

            cell.className = cellAbove.className;
          }
        }

        for (let x = 0; x < BOARD_WIDTH; x++) {
          const cell = gameBoard.children[x];
          cell.className = "cell";
        }

        y++;
      }
    }

    if (linesCleared > 0) {
      updateScore(linesCleared);
    }
  }

  function updateScore(linesCleared) {
    const linePoints = [0, 100, 300, 500, 800];
    const levelMultiplier = level;

    score += linePoints[linesCleared] * levelMultiplier;
    lines += linesCleared;

    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelDisplay.classList.add("level-up");
      setTimeout(() => {
        levelDisplay.classList.remove("level-up");
      }, 500);

      dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
      clearInterval(gameInterval);
      gameInterval = setInterval(moveDown, dropSpeed);
    }

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    linesDisplay.textContent = lines;
  }

  function createParticles() {
    if (currentPiece.position.y < 0) return;

    const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00"];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");

      const rect = gameBoard.getBoundingClientRect();
      const x = rect.left + currentPiece.position.x * 30 + Math.random() * 60;
      const y = rect.top + currentPiece.position.y * 30 + Math.random() * 60;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      particle.style.width = `${Math.random() * 8 + 2}px`;
      particle.style.height = particle.style.width;

      document.body.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      let opacity = 1;

      const animateParticle = () => {
        opacity -= 0.02;
        particle.style.opacity = opacity;
        particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
        particle.style.top = `${parseFloat(particle.style.top) + vy}px`;

        if (opacity > 0) {
          requestAnimationFrame(animateParticle);
        } else {
          particle.remove();
        }
      };

      requestAnimationFrame(animateParticle);
    }
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);

    gameOverOverlay.classList.add("active");
    finalScoreDisplay.textContent = score;
  }

  function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;

    if (isPaused) {
      clearInterval(gameInterval);
      pauseOverlay.classList.add("active");
    } else {
      gameInterval = setInterval(moveDown, dropSpeed);
      pauseOverlay.classList.remove("active");
    }
  }

  function handleKeyPress(e) {
    e.preventDefault();

    const key = e.key.toLowerCase();
    const code = e.code;

    if (
      (code === "Space" && controls.hardDrop === " ") ||
      key === controls.hardDrop.toLowerCase()
    ) {
      hardDrop();
    } else if (
      key === controls.moveLeft.toLowerCase() ||
      code === controls.moveLeft
    ) {
      moveLeft();
    } else if (
      key === controls.moveRight.toLowerCase() ||
      code === controls.moveRight
    ) {
      moveRight();
    } else if (
      key === controls.rotate.toLowerCase() ||
      code === controls.rotate
    ) {
      rotate();
    } else if (
      key === controls.softDrop.toLowerCase() ||
      code === controls.softDrop
    ) {
      moveDown();
    } else if (key === controls.hold.toLowerCase() || code === controls.hold) {
      holdCurrentPiece();
    } else if (
      key === controls.pause.toLowerCase() ||
      code === controls.pause
    ) {
      togglePause();
    }
  }

  function openSettings() {
    if (!isPaused && !isGameOver) {
      togglePause();
    }

    settingsModal.classList.add("active");

    keybindButtons.forEach((btn) => {
      const action = btn.dataset.action;
      btn.textContent = getKeyDisplay(controls[action]);
    });
  }

  function closeSettings() {
    settingsModal.classList.remove("active");
  }

  function saveSettings() {
    localStorage.setItem("tetrisControls", JSON.stringify(controls));

    updateControlsDisplay();

    closeSettings();
  }

  function resetSettings() {
    controls = {
      moveLeft: "ArrowLeft",
      moveRight: "ArrowRight",
      rotate: "ArrowUp",
      softDrop: "ArrowDown",
      hardDrop: " ",
      hold: "c",
      pause: "p",
    };

    keybindButtons.forEach((btn) => {
      const action = btn.dataset.action;
      btn.textContent = getKeyDisplay(controls[action]);
    });
  }

  function updateControlsDisplay() {
    document.getElementById("move-left-key").textContent = getKeyDisplay(
      controls.moveLeft
    );
    document.getElementById("move-right-key").textContent = getKeyDisplay(
      controls.moveRight
    );
    document.getElementById("rotate-key").textContent = getKeyDisplay(
      controls.rotate
    );
    document.getElementById("soft-drop-key").textContent = getKeyDisplay(
      controls.softDrop
    );
    document.getElementById("hard-drop-key").textContent = getKeyDisplay(
      controls.hardDrop
    );
    document.getElementById("hold-key").textContent = getKeyDisplay(
      controls.hold
    );
    document.getElementById("pause-key").textContent = getKeyDisplay(
      controls.pause
    );
  }

  function getKeyDisplay(key) {
    const specialKeys = {
      " ": "Space",
      ArrowLeft: "←",
      ArrowRight: "→",
      ArrowUp: "↑",
      ArrowDown: "↓",
      Control: "Ctrl",
      Escape: "Esc",
    };

    return specialKeys[key] || key.toUpperCase();
  }

  function startRebinding(e) {
    const btn = e.target;
    const action = btn.dataset.action;

    keybindButtons.forEach((b) => b.classList.remove("listening"));
    btn.classList.add("listening");
    btn.textContent = "Press Key...";

    const keyListener = (e) => {
      e.preventDefault();

      let newKey = e.key;

      if (e.code === "Space") {
        newKey = " ";
      }

      controls[action] = newKey;

      btn.textContent = getKeyDisplay(newKey);
      btn.classList.remove("listening");

      document.removeEventListener("keydown", keyListener);
    };

    document.addEventListener("keydown", keyListener);
  }

  init();
});
