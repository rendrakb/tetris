document.addEventListener("DOMContentLoaded", () => {
  const CONSTANTS = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BOARD_SIZE: 200,
    EMPTY_COLOR: "",
    INITIAL_DROP_SPEED: 1000,
    MIN_DROP_SPEED: 100,
    SPEED_DECREASE: 100,
    LINES_PER_LEVEL: 10,
    PARTICLE_COUNT: 20,
    LINE_POINTS: [0, 100, 300, 500, 800],
  };

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

  const DEFAULT_CONTROLS = {
    moveLeft: "ArrowLeft",
    moveRight: "ArrowRight",
    rotate: "ArrowUp",
    softDrop: "ArrowDown",
    hardDrop: " ",
    hold: "c",
    pause: "p",
  };

  const DOM = {
    gameBoard: document.getElementById("game-board"),
    nextPieceDisplay: document.getElementById("next-piece"),
    holdPieceDisplay: document.getElementById("hold-piece"),
    scoreDisplay: document.getElementById("score"),
    levelDisplay: document.getElementById("level"),
    linesDisplay: document.getElementById("lines"),
    pauseBtn: document.getElementById("pause-btn"),
    settingsBtn: document.getElementById("settings-btn"),
    settingsBtnAlt: document.getElementById("settings-btn-alt"),
    pauseOverlay: document.getElementById("pause-overlay"),
    resumeBtn: document.getElementById("resume-btn"),
    gameOverOverlay: document.getElementById("game-over"),
    finalScoreDisplay: document.getElementById("final-score"),
    restartBtn: document.getElementById("restart-btn"),
    settingsModal: document.getElementById("settings-modal"),
    saveSettingsBtn: document.getElementById("save-settings"),
    resetSettingsBtn: document.getElementById("reset-settings"),
    closeSettingsBtn: document.querySelector(".close-btn"),
    keybindButtons: document.querySelectorAll(".keybind-btn"),
  };

  const state = {
    board: Array(CONSTANTS.BOARD_SIZE).fill(CONSTANTS.EMPTY_COLOR),
    currentPiece: null,
    nextPiece: null,
    holdPiece: null,
    hasHeld: false,
    gameInterval: null,
    isPaused: false,
    isGameOver: false,
    score: 0,
    level: 1,
    lines: 0,
    dropSpeed: CONSTANTS.INITIAL_DROP_SPEED,
    controls: { ...DEFAULT_CONTROLS },
  };

  function init() {
    initializeBoard();
    initializeDisplays();
    loadSavedControls();
    attachEventListeners();
    newGame();
  }

  function initializeBoard() {
    for (let i = 0; i < CONSTANTS.BOARD_SIZE; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      DOM.gameBoard.appendChild(cell);
    }
  }

  function initializeDisplays() {
    [DOM.nextPieceDisplay, DOM.holdPieceDisplay].forEach((display) => {
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        display.appendChild(cell);
      }
    });
  }

  function loadSavedControls() {
    const savedControls = localStorage.getItem("tetrisControls");
    if (savedControls) {
      state.controls = JSON.parse(savedControls);
      updateControlsDisplay();
    }
  }

  function attachEventListeners() {
    document.addEventListener("keydown", handleKeyPress);

    DOM.pauseBtn.addEventListener("click", togglePause);
    DOM.resumeBtn.addEventListener("click", togglePause);
    DOM.restartBtn.addEventListener("click", newGame);

    DOM.settingsBtn.addEventListener("click", openSettings);
    DOM.settingsBtnAlt.addEventListener("click", openSettings);
    DOM.closeSettingsBtn.addEventListener("click", closeSettings);
    DOM.saveSettingsBtn.addEventListener("click", saveSettings);
    DOM.resetSettingsBtn.addEventListener("click", resetSettings);

    document.getElementById("btn-left").addEventListener("click", moveLeft);
    document.getElementById("btn-right").addEventListener("click", moveRight);
    document.getElementById("btn-rotate").addEventListener("click", rotate);
    document.getElementById("btn-soft").addEventListener("click", moveDown);
    document.getElementById("btn-hard").addEventListener("click", hardDrop);
    document.getElementById("btn-hold").addEventListener("click", holdCurrentPiece);

    DOM.keybindButtons.forEach((btn) =>
      btn.addEventListener("click", startRebinding)
    );
  }

  function newGame() {
    resetGameState();
    updateDisplay();
    clearBoard();
    hideOverlays();
    startGame();
  }

  function resetGameState() {
    state.board = Array(CONSTANTS.BOARD_SIZE).fill(CONSTANTS.EMPTY_COLOR);
    state.score = 0;
    state.level = 1;
    state.lines = 0;
    state.dropSpeed = CONSTANTS.INITIAL_DROP_SPEED;
    state.holdPiece = null;
    state.hasHeld = false;
    state.isPaused = false;
    state.isGameOver = false;
  }

  function updateDisplay() {
    DOM.scoreDisplay.textContent = state.score;
    DOM.levelDisplay.textContent = state.level;
    DOM.linesDisplay.textContent = state.lines;
  }

  function clearBoard() {
    DOM.gameBoard
      .querySelectorAll(".cell")
      .forEach((cell) => (cell.className = "cell"));
  }

  function hideOverlays() {
    DOM.gameOverOverlay.classList.remove("active");
    DOM.pauseOverlay.classList.remove("active");
  }

  function startGame() {
    state.nextPiece = getRandomPiece();
    getNewPiece();

    if (state.gameInterval) clearInterval(state.gameInterval);
    state.gameInterval = setInterval(moveDown, state.dropSpeed);
  }

  function getRandomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const tetromino = pieces[Math.floor(Math.random() * pieces.length)];

    return {
      type: tetromino,
      shape: JSON.parse(JSON.stringify(TETROMINOS[tetromino].shape)),
      className: TETROMINOS[tetromino].className,
      position: { x: tetromino === "O" ? 4 : 3, y: 0 },
      rotation: 0,
    };
  }

  function getNewPiece() {
    state.currentPiece = state.nextPiece;
    state.nextPiece = getRandomPiece();
    state.hasHeld = false;

    if (!isValidMove(state.currentPiece)) {
      gameOver();
      return;
    }

    drawPiece();
    drawNextPiece();
    drawGhostPiece();
  }

  function drawPiece() {
    clearPiece();
    const { shape, className, position } = state.currentPiece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && position.y + y >= 0) {
          const index =
            (position.y + y) * CONSTANTS.BOARD_WIDTH + (position.x + x);
          DOM.gameBoard.children[index].classList.add(className);
        }
      }
    }
  }

  function drawGhostPiece() {
    DOM.gameBoard
      .querySelectorAll(".ghost")
      .forEach((cell) => cell.classList.remove("ghost"));

    const ghostPiece = JSON.parse(JSON.stringify(state.currentPiece));
    while (isValidMove(ghostPiece)) {
      ghostPiece.position.y++;
    }
    ghostPiece.position.y--;

    const { shape, position } = ghostPiece;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && position.y + y >= 0) {
          const index =
            (position.y + y) * CONSTANTS.BOARD_WIDTH + (position.x + x);
          const cell = DOM.gameBoard.children[index];
          if (!cell.classList.contains(state.currentPiece.className)) {
            cell.classList.add("ghost");
          }
        }
      }
    }
  }

  function drawNextPiece() {
    const cells = DOM.nextPieceDisplay.querySelectorAll(".cell");
    cells.forEach((cell) => (cell.className = "cell"));

    const { shape, className } = state.nextPiece;
    const offsetX = (5 - shape[0].length) / 2;
    const offsetY = (5 - shape.length) / 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const index = Math.floor(offsetY + y) * 4 + Math.floor(offsetX + x);
          cells[index].classList.add(className);
        }
      }
    }
  }

  function drawHoldPiece() {
    const cells = DOM.holdPieceDisplay.querySelectorAll(".cell");
    cells.forEach((cell) => (cell.className = "cell"));

    if (!state.holdPiece) return;

    const { shape, className } = state.holdPiece;
    const offsetX = (5 - shape[0].length) / 2;
    const offsetY = (5 - shape.length) / 2;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const index = Math.floor(offsetY + y) * 4 + Math.floor(offsetX + x);
          cells[index].classList.add(className);
        }
      }
    }
  }

  function clearPiece() {
    DOM.gameBoard.querySelectorAll(".cell").forEach((cell) => {
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

          if (
            boardX < 0 ||
            boardX >= CONSTANTS.BOARD_WIDTH ||
            boardY >= CONSTANTS.BOARD_HEIGHT
          ) {
            return false;
          }

          if (boardY >= 0) {
            const index = boardY * CONSTANTS.BOARD_WIDTH + boardX;
            if (DOM.gameBoard.children[index].classList.contains("locked")) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  function lockPiece() {
    const { shape, position } = state.currentPiece;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] && position.y + y >= 0) {
          const index =
            (position.y + y) * CONSTANTS.BOARD_WIDTH + (position.x + x);
          DOM.gameBoard.children[index].classList.add("locked");
        }
      }
    }

    checkLines();
    getNewPiece();
    createParticles();
  }

  function moveDown() {
    if (state.isPaused || state.isGameOver) return;

    state.currentPiece.position.y++;

    if (!isValidMove(state.currentPiece)) {
      state.currentPiece.position.y--;
      lockPiece();
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function moveLeft() {
    if (state.isPaused || state.isGameOver) return;

    state.currentPiece.position.x--;
    if (!isValidMove(state.currentPiece)) {
      state.currentPiece.position.x++;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function moveRight() {
    if (state.isPaused || state.isGameOver) return;

    state.currentPiece.position.x++;
    if (!isValidMove(state.currentPiece)) {
      state.currentPiece.position.x--;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function rotate() {
    if (state.isPaused || state.isGameOver || state.currentPiece.type === "O")
      return;

    const originalPosition = { ...state.currentPiece.position };
    const originalShape = JSON.parse(JSON.stringify(state.currentPiece.shape));
    const size = state.currentPiece.shape.length;

    const newShape = Array(size)
      .fill()
      .map(() => Array(size).fill(0));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newShape[x][size - 1 - y] = state.currentPiece.shape[y][x];
      }
    }

    state.currentPiece.shape = newShape;

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
      state.currentPiece.position.x = originalPosition.x + kick.x;
      state.currentPiece.position.y = originalPosition.y + kick.y;

      if (isValidMove(state.currentPiece)) {
        validKick = true;
        break;
      }
    }

    if (!validKick) {
      state.currentPiece.position = originalPosition;
      state.currentPiece.shape = originalShape;
    } else {
      drawPiece();
      drawGhostPiece();
    }
  }

  function hardDrop() {
    if (state.isPaused || state.isGameOver) return;

    while (isValidMove(state.currentPiece)) {
      state.currentPiece.position.y++;
    }
    state.currentPiece.position.y--;

    drawPiece();
    lockPiece();
  }

  function holdCurrentPiece() {
    if (state.isPaused || state.isGameOver || state.hasHeld) return;

    state.hasHeld = true;
    clearPiece();

    if (state.holdPiece === null) {
      state.holdPiece = createPieceFromType(state.currentPiece.type);
      getNewPiece();
    } else {
      const temp = state.currentPiece;
      state.currentPiece = createPieceFromType(state.holdPiece.type);
      state.holdPiece = createPieceFromType(temp.type);
    }

    drawHoldPiece();
    drawPiece();
    drawGhostPiece();
  }

  function createPieceFromType(type) {
    return {
      type,
      shape: JSON.parse(JSON.stringify(TETROMINOS[type].shape)),
      className: TETROMINOS[type].className,
      position: { x: type === "O" ? 4 : 3, y: 0 },
      rotation: 0,
    };
  }

  function checkLines() {
    let linesCleared = 0;

    for (let y = CONSTANTS.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (isLineComplete(y)) {
        linesCleared++;
        animateLineClear(y);
        shiftLinesDown(y);
        clearTopLine();
        y++;
      }
    }

    if (linesCleared > 0) {
      updateScore(linesCleared);
    }
  }

  function isLineComplete(y) {
    for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
      const index = y * CONSTANTS.BOARD_WIDTH + x;
      if (!DOM.gameBoard.children[index].classList.contains("locked")) {
        return false;
      }
    }
    return true;
  }

  function animateLineClear(y) {
    for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
      const index = y * CONSTANTS.BOARD_WIDTH + x;
      const cell = DOM.gameBoard.children[index];
      cell.className = "cell";

      setTimeout(() => {
        cell.style.backgroundColor = "#FFFFFF";
        setTimeout(() => (cell.style.backgroundColor = ""), 50);
      }, x * 20);
    }
  }

  function shiftLinesDown(fromY) {
    for (let yy = fromY; yy > 0; yy--) {
      for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
        const index = yy * CONSTANTS.BOARD_WIDTH + x;
        const above = (yy - 1) * CONSTANTS.BOARD_WIDTH + x;
        DOM.gameBoard.children[index].className =
          DOM.gameBoard.children[above].className;
      }
    }
  }

  function clearTopLine() {
    for (let x = 0; x < CONSTANTS.BOARD_WIDTH; x++) {
      DOM.gameBoard.children[x].className = "cell";
    }
  }

  function updateScore(linesCleared) {
    state.score += CONSTANTS.LINE_POINTS[linesCleared] * state.level;
    state.lines += linesCleared;

    const newLevel = Math.floor(state.lines / CONSTANTS.LINES_PER_LEVEL) + 1;
    if (newLevel > state.level) {
      levelUp(newLevel);
    }

    DOM.scoreDisplay.textContent = state.score;
    DOM.levelDisplay.textContent = state.level;
    DOM.linesDisplay.textContent = state.lines;
  }

  function levelUp(newLevel) {
    state.level = newLevel;
    DOM.levelDisplay.classList.add("level-up");
    setTimeout(() => DOM.levelDisplay.classList.remove("level-up"), 500);

    state.dropSpeed = Math.max(
      CONSTANTS.MIN_DROP_SPEED,
      CONSTANTS.INITIAL_DROP_SPEED -
        (state.level - 1) * CONSTANTS.SPEED_DECREASE
    );

    clearInterval(state.gameInterval);
    state.gameInterval = setInterval(moveDown, state.dropSpeed);
  }

  function createParticles() {
    if (state.currentPiece.position.y < 0) return;

    const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00"];
    const rect = DOM.gameBoard.getBoundingClientRect();

    for (let i = 0; i < CONSTANTS.PARTICLE_COUNT; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");

      const x =
        rect.left + state.currentPiece.position.x * 30 + Math.random() * 60;
      const y =
        rect.top + state.currentPiece.position.y * 30 + Math.random() * 60;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      const size = Math.random() * 8 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      document.body.appendChild(particle);
      animateParticle(particle);
    }
  }

  function animateParticle(particle) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    let opacity = 1;

    const animate = () => {
      opacity -= 0.02;
      particle.style.opacity = opacity;
      particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
      particle.style.top = `${parseFloat(particle.style.top) + vy}px`;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  function gameOver() {
    state.isGameOver = true;
    clearInterval(state.gameInterval);
    DOM.gameOverOverlay.classList.add("active");
    DOM.finalScoreDisplay.textContent = state.score;
  }

  function togglePause() {
    if (state.isGameOver) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      clearInterval(state.gameInterval);
      DOM.pauseOverlay.classList.add("active");
    } else {
      state.gameInterval = setInterval(moveDown, state.dropSpeed);
      DOM.pauseOverlay.classList.remove("active");
    }
  }

  function handleKeyPress(e) {
    e.preventDefault();

    const key = e.key.toLowerCase();
    const code = e.code;
    const controls = state.controls;

    const keyMap = {
      hardDrop: () =>
        (code === "Space" && controls.hardDrop === " ") ||
        key === controls.hardDrop.toLowerCase(),
      moveLeft: () =>
        key === controls.moveLeft.toLowerCase() || code === controls.moveLeft,
      moveRight: () =>
        key === controls.moveRight.toLowerCase() || code === controls.moveRight,
      rotate: () =>
        key === controls.rotate.toLowerCase() || code === controls.rotate,
      softDrop: () =>
        key === controls.softDrop.toLowerCase() || code === controls.softDrop,
      hold: () => key === controls.hold.toLowerCase() || code === controls.hold,
      pause: () =>
        key === controls.pause.toLowerCase() || code === controls.pause,
    };

    if (keyMap.hardDrop()) hardDrop();
    else if (keyMap.moveLeft()) moveLeft();
    else if (keyMap.moveRight()) moveRight();
    else if (keyMap.rotate()) rotate();
    else if (keyMap.softDrop()) moveDown();
    else if (keyMap.hold()) holdCurrentPiece();
    else if (keyMap.pause()) togglePause();
  }

  function openSettings() {
    if (!state.isPaused && !state.isGameOver) {
      togglePause();
    }

    DOM.settingsModal.classList.add("active");
    DOM.keybindButtons.forEach((btn) => {
      btn.textContent = getKeyDisplay(state.controls[btn.dataset.action]);
    });
  }

  function closeSettings() {
    DOM.settingsModal.classList.remove("active");
  }

  function saveSettings() {
    localStorage.setItem("tetrisControls", JSON.stringify(state.controls));
    updateControlsDisplay();
    closeSettings();
  }

  function resetSettings() {
    state.controls = { ...DEFAULT_CONTROLS };
    DOM.keybindButtons.forEach((btn) => {
      btn.textContent = getKeyDisplay(state.controls[btn.dataset.action]);
    });
  }

  function updateControlsDisplay() {
    const controlIds = {
      moveLeft: "move-left-key",
      moveRight: "move-right-key",
      rotate: "rotate-key",
      softDrop: "soft-drop-key",
      hardDrop: "hard-drop-key",
      hold: "hold-key",
      pause: "pause-key",
    };

    Object.entries(controlIds).forEach(([control, id]) => {
      document.getElementById(id).textContent = getKeyDisplay(
        state.controls[control]
      );
    });
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

    DOM.keybindButtons.forEach((b) => b.classList.remove("listening"));
    btn.classList.add("listening");
    btn.textContent = "Press Key...";

    const keyListener = (e) => {
      e.preventDefault();
      const newKey = e.code === "Space" ? " " : e.key;

      state.controls[action] = newKey;
      btn.textContent = getKeyDisplay(newKey);
      btn.classList.remove("listening");
      document.removeEventListener("keydown", keyListener);
    };

    document.addEventListener("keydown", keyListener);
  }

  init();
});
