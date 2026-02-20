const BOARD_SIZE = 19;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const capturesEl = document.getElementById("captures");
const difficultyEl = document.getElementById("difficulty");
const difficultyLabelEl = document.getElementById("difficulty-label");
const languageEl = document.getElementById("language");
const languageLabelEl = document.getElementById("language-label");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const newGameBtn = document.getElementById("new-game");
const passBtn = document.getElementById("pass-btn");
const undoBtn = document.getElementById("undo-btn");

const margin = 38;
const cell = (canvas.width - margin * 2) / (BOARD_SIZE - 1);
const starPoints = [3, 9, 15];

let board = makeEmptyBoard();
let turn = BLACK;
let gameOver = false;
let consecutivePasses = 0;
let captures = { black: 0, white: 0 };
let history = [];
let boardHashes = new Set();
let currentLang = languageEl.value;

const I18N = {
  "zh-Hant": {
    pageTitle: "圍棋三難度",
    title: "圍棋（人機對戰）",
    subtitle: "黑棋先手（你），白棋後手（AI）",
    difficultyLabel: "難度",
    languageLabel: "語言",
    newGame: "新遊戲",
    pass: "停一手",
    undo: "悔棋",
    boardAria: "圍棋棋盤",
    difficultyEasy: "簡單",
    difficultyMedium: "中等",
    difficultyHard: "困難",
    yourTurn: "你的回合",
    aiTurn: "AI 回合",
    aiThinking: "AI 思考中...",
    aiPassYourTurn: "AI 停一手，你的回合",
    aiNoLegal: "AI 無合法落點，停一手。你的回合",
    invalidMove: "該點不可落子（禁手、打劫或已有棋子）",
    undoEnded: "已回退（對局已結束）",
    captures: "提子：黑 {black} / 白 {white}",
    difficultySwitched: "難度已切換為：{level}",
    winnerBlack: "黑棋（你）",
    winnerWhite: "白棋（AI）",
    gameOver:
      "對局結束，勝者：{winner}。估算：黑 {blackTotal}，白 {whiteTotal}（白貼目 6.5）",
  },
  en: {
    pageTitle: "Go Game - 3 Levels",
    title: "Go (Player vs AI)",
    subtitle: "Black moves first (You), White moves second (AI)",
    difficultyLabel: "Difficulty",
    languageLabel: "Language",
    newGame: "New Game",
    pass: "Pass",
    undo: "Undo",
    boardAria: "Go board",
    difficultyEasy: "Easy",
    difficultyMedium: "Medium",
    difficultyHard: "Hard",
    yourTurn: "Your turn",
    aiTurn: "AI turn",
    aiThinking: "AI is thinking...",
    aiPassYourTurn: "AI passes. Your turn",
    aiNoLegal: "AI has no legal move and passes. Your turn",
    invalidMove: "Illegal move (suicide, ko, or occupied point)",
    undoEnded: "Undone (game had ended)",
    captures: "Captures: Black {black} / White {white}",
    difficultySwitched: "Difficulty switched to: {level}",
    winnerBlack: "Black (You)",
    winnerWhite: "White (AI)",
    gameOver:
      "Game over. Winner: {winner}. Estimate: Black {blackTotal}, White {whiteTotal} (White komi 6.5)",
  },
};

function t(key, vars = {}) {
  const dict = I18N[currentLang] || I18N["zh-Hant"];
  const template = dict[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function setStaticTexts() {
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");
  titleEl.textContent = t("title");
  subtitleEl.textContent = t("subtitle");
  difficultyLabelEl.textContent = t("difficultyLabel");
  languageLabelEl.textContent = t("languageLabel");
  newGameBtn.textContent = t("newGame");
  passBtn.textContent = t("pass");
  undoBtn.textContent = t("undo");
  canvas.setAttribute("aria-label", t("boardAria"));

  for (const option of difficultyEl.options) {
    if (option.value === "easy") option.textContent = t("difficultyEasy");
    if (option.value === "medium") option.textContent = t("difficultyMedium");
    if (option.value === "hard") option.textContent = t("difficultyHard");
  }
}

function makeEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

function cloneBoard(src) {
  return src.map((row) => row.slice());
}

function boardHash(src) {
  return src.map((r) => r.join("")).join("|");
}

function inBounds(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function neighbors(x, y) {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ].filter(([nx, ny]) => inBounds(nx, ny));
}

function getGroupAndLiberties(src, x, y) {
  const color = src[y][x];
  if (color === EMPTY) return { stones: [], liberties: 0 };
  const stack = [[x, y]];
  const visited = new Set([`${x},${y}`]);
  const stones = [];
  const libs = new Set();

  while (stack.length) {
    const [cx, cy] = stack.pop();
    stones.push([cx, cy]);
    for (const [nx, ny] of neighbors(cx, cy)) {
      const val = src[ny][nx];
      if (val === EMPTY) {
        libs.add(`${nx},${ny}`);
      } else if (val === color && !visited.has(`${nx},${ny}`)) {
        visited.add(`${nx},${ny}`);
        stack.push([nx, ny]);
      }
    }
  }
  return { stones, liberties: libs.size };
}

function removeStones(src, stones) {
  for (const [x, y] of stones) src[y][x] = EMPTY;
}

function attemptMove(src, x, y, color) {
  if (!inBounds(x, y) || src[y][x] !== EMPTY) return null;
  const opponent = color === BLACK ? WHITE : BLACK;
  const next = cloneBoard(src);
  next[y][x] = color;
  let captured = 0;

  for (const [nx, ny] of neighbors(x, y)) {
    if (next[ny][nx] !== opponent) continue;
    const group = getGroupAndLiberties(next, nx, ny);
    if (group.liberties === 0) {
      captured += group.stones.length;
      removeStones(next, group.stones);
    }
  }

  const own = getGroupAndLiberties(next, x, y);
  if (own.liberties === 0) return null;
  return { board: next, captured };
}

function pushHistory() {
  history.push({
    board: cloneBoard(board),
    turn,
    gameOver,
    consecutivePasses,
    captures: { ...captures },
    boardHashes: new Set(boardHashes),
  });
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d9a967";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#5a3f1f";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < BOARD_SIZE; i++) {
    const p = margin + i * cell;
    ctx.beginPath();
    ctx.moveTo(margin, p);
    ctx.lineTo(canvas.width - margin, p);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p, margin);
    ctx.lineTo(p, canvas.height - margin);
    ctx.stroke();
  }

  ctx.fillStyle = "#4a2f15";
  for (const sy of starPoints) {
    for (const sx of starPoints) {
      ctx.beginPath();
      ctx.arc(margin + sx * cell, margin + sy * cell, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = board[y][x];
      if (stone === EMPTY) continue;
      const px = margin + x * cell;
      const py = margin + y * cell;
      const gradient = ctx.createRadialGradient(px - 6, py - 6, 2, px, py, 16);
      if (stone === BLACK) {
        gradient.addColorStop(0, "#6b6b6b");
        gradient.addColorStop(1, "#111");
      } else {
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(1, "#d8d8d8");
      }
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(px, py, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function updateStatus(key, vars = {}) {
  statusEl.textContent = t(key, vars);
  capturesEl.textContent = t("captures", {
    black: captures.black,
    white: captures.white,
  });
}

function xyFromEvent(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (evt.clientX - rect.left) * scaleX;
  const my = (evt.clientY - rect.top) * scaleY;
  const x = Math.round((mx - margin) / cell);
  const y = Math.round((my - margin) / cell);
  return [x, y];
}

function applyMove(x, y, color) {
  const result = attemptMove(board, x, y, color);
  if (!result) return false;
  const nextHash = boardHash(result.board);
  if (boardHashes.has(nextHash)) return false;

  pushHistory();
  board = result.board;
  boardHashes.add(nextHash);
  if (color === BLACK) captures.black += result.captured;
  else captures.white += result.captured;

  turn = color === BLACK ? WHITE : BLACK;
  consecutivePasses = 0;
  drawBoard();
  return true;
}

function legalMoves(src, color, seenHashes) {
  const moves = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const result = attemptMove(src, x, y, color);
      if (!result) continue;
      const hash = boardHash(result.board);
      if (seenHashes.has(hash)) continue;
      moves.push({ x, y, captured: result.captured, board: result.board });
    }
  }
  return moves;
}

function distanceToNearestStone(x, y, src) {
  let best = Infinity;
  for (let yy = 0; yy < BOARD_SIZE; yy++) {
    for (let xx = 0; xx < BOARD_SIZE; xx++) {
      if (src[yy][xx] === EMPTY) continue;
      const d = Math.abs(xx - x) + Math.abs(yy - y);
      if (d < best) best = d;
    }
  }
  return best === Infinity ? 0 : best;
}

function localLibertyScore(src, x, y, color) {
  const mine = getGroupAndLiberties(src, x, y).liberties;
  const opponent = color === BLACK ? WHITE : BLACK;
  let pressure = 0;
  for (const [nx, ny] of neighbors(x, y)) {
    if (src[ny][nx] !== opponent) continue;
    const g = getGroupAndLiberties(src, nx, ny);
    pressure += Math.max(0, 3 - g.liberties);
  }
  return mine + pressure * 1.2;
}

function quickBoardScore(src, color) {
  const opponent = color === BLACK ? WHITE : BLACK;
  let myStones = 0;
  let opStones = 0;
  let myLibs = 0;
  let opLibs = 0;
  const seen = new Set();

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const v = src[y][x];
      if (v === EMPTY || seen.has(`${x},${y}`)) continue;
      const g = getGroupAndLiberties(src, x, y);
      for (const [gx, gy] of g.stones) seen.add(`${gx},${gy}`);
      if (v === color) {
        myStones += g.stones.length;
        myLibs += g.liberties;
      } else {
        opStones += g.stones.length;
        opLibs += g.liberties;
      }
    }
  }
  return (myStones - opStones) * 2 + (myLibs - opLibs) * 0.35;
}

function selectAiMove() {
  const moves = legalMoves(board, WHITE, boardHashes);
  if (!moves.length) return null;
  const level = difficultyEl.value;

  if (level === "easy") {
    const picked = moves.filter((m) => distanceToNearestStone(m.x, m.y, board) <= 2);
    const pool = picked.length ? picked : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (level === "medium") {
    let best = null;
    let bestScore = -Infinity;
    for (const m of moves) {
      const score =
        m.captured * 3 +
        localLibertyScore(m.board, m.x, m.y, WHITE) -
        distanceToNearestStone(m.x, m.y, board) * 0.25 +
        Math.random() * 0.2;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
    return best;
  }

  let pre = moves
    .map((m) => ({
      ...m,
      preScore:
        m.captured * 5 +
        localLibertyScore(m.board, m.x, m.y, WHITE) +
        quickBoardScore(m.board, WHITE) * 0.2 -
        distanceToNearestStone(m.x, m.y, board) * 0.15,
    }))
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, 18);

  let best = pre[0];
  let bestEval = -Infinity;
  const simulatedHashes = new Set(boardHashes);
  for (const m of pre) {
    simulatedHashes.add(boardHash(m.board));
    const replies = legalMoves(m.board, BLACK, simulatedHashes);
    replies.sort((a, b) => b.captured - a.captured);
    const topReplies = replies.slice(0, 8);
    let worstReplyValue = 0;
    for (const r of topReplies) {
      const penalty = r.captured * 4 + quickBoardScore(r.board, BLACK) * 0.15;
      if (penalty > worstReplyValue) worstReplyValue = penalty;
    }
    simulatedHashes.delete(boardHash(m.board));
    const evalScore = m.preScore - worstReplyValue;
    if (evalScore > bestEval) {
      bestEval = evalScore;
      best = m;
    }
  }
  return best;
}

function territoryScore(src) {
  const visited = new Set();
  let blackTerritory = 0;
  let whiteTerritory = 0;
  let blackStones = 0;
  let whiteStones = 0;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (src[y][x] === BLACK) blackStones++;
      if (src[y][x] === WHITE) whiteStones++;
      if (src[y][x] !== EMPTY || visited.has(`${x},${y}`)) continue;

      const region = [];
      const queue = [[x, y]];
      visited.add(`${x},${y}`);
      const borders = new Set();

      while (queue.length) {
        const [cx, cy] = queue.pop();
        region.push([cx, cy]);
        for (const [nx, ny] of neighbors(cx, cy)) {
          const val = src[ny][nx];
          if (val === EMPTY && !visited.has(`${nx},${ny}`)) {
            visited.add(`${nx},${ny}`);
            queue.push([nx, ny]);
          } else if (val === BLACK) borders.add(BLACK);
          else if (val === WHITE) borders.add(WHITE);
        }
      }

      if (borders.size === 1) {
        if (borders.has(BLACK)) blackTerritory += region.length;
        else whiteTerritory += region.length;
      }
    }
  }

  const blackTotal = blackStones + blackTerritory + captures.black;
  const whiteTotal = whiteStones + whiteTerritory + captures.white + 6.5;
  return {
    blackTotal,
    whiteTotal,
  };
}

function finishGame() {
  gameOver = true;
  const score = territoryScore(board);
  const winnerKey = score.blackTotal > score.whiteTotal ? "winnerBlack" : "winnerWhite";
  updateStatus("gameOver", {
    winner: t(winnerKey),
    blackTotal: score.blackTotal.toFixed(1),
    whiteTotal: score.whiteTotal.toFixed(1),
  });
}

function aiTurn() {
  if (gameOver || turn !== WHITE) return;
  updateStatus("aiThinking");
  setTimeout(() => {
    const move = selectAiMove();
    if (!move) {
      consecutivePasses++;
      turn = BLACK;
      if (consecutivePasses >= 2) finishGame();
      else updateStatus("aiPassYourTurn");
      return;
    }
    const ok = applyMove(move.x, move.y, WHITE);
    if (!ok) {
      consecutivePasses++;
      turn = BLACK;
      updateStatus("aiNoLegal");
      return;
    }
    updateStatus("yourTurn");
  }, 180);
}

function newGame() {
  board = makeEmptyBoard();
  turn = BLACK;
  gameOver = false;
  consecutivePasses = 0;
  captures = { black: 0, white: 0 };
  history = [];
  boardHashes = new Set([boardHash(board)]);
  drawBoard();
  updateStatus("yourTurn");
}

canvas.addEventListener("click", (evt) => {
  if (gameOver || turn !== BLACK) return;
  const [x, y] = xyFromEvent(evt);
  if (!inBounds(x, y)) return;
  const ok = applyMove(x, y, BLACK);
  if (!ok) {
    updateStatus("invalidMove");
    return;
  }
  updateStatus("aiThinking");
  aiTurn();
});

passBtn.addEventListener("click", () => {
  if (gameOver || turn !== BLACK) return;
  pushHistory();
  consecutivePasses++;
  turn = WHITE;
  if (consecutivePasses >= 2) finishGame();
  else aiTurn();
});

undoBtn.addEventListener("click", () => {
  if (!history.length) return;
  const prev = history.pop();
  board = prev.board;
  turn = prev.turn;
  gameOver = prev.gameOver;
  consecutivePasses = prev.consecutivePasses;
  captures = prev.captures;
  boardHashes = prev.boardHashes;
  drawBoard();
  updateStatus(gameOver ? "undoEnded" : turn === BLACK ? "yourTurn" : "aiTurn");
});

newGameBtn.addEventListener("click", newGame);
difficultyEl.addEventListener("change", () => {
  updateStatus("difficultySwitched", {
    level: difficultyEl.options[difficultyEl.selectedIndex].text,
  });
  if (!gameOver && turn === WHITE) aiTurn();
});

languageEl.addEventListener("change", () => {
  currentLang = languageEl.value;
  setStaticTexts();
  if (gameOver) finishGame();
  else updateStatus(turn === BLACK ? "yourTurn" : "aiTurn");
});

setStaticTexts();
newGame();
