import './style.css'

const EMOJIS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒',
  '🌸', '🌺', '🌻', '🌹', '🌼', '💐', '🌿', '🍀',
  '🐶', '🐱', '🐼', '🦊', '🐰', '🐨', '🐯', '🦁',
  '🚀', '✈️', '🚗', '🚲', '⛵', '🛸', '🚁', '🏍️',
  '⭐', '🌙', '☀️', '🌈', '❄️', '🔥', '💎', '🎵',
]

interface Cell { id: number; emoji: string; row: number; col: number; isMatched: boolean }
interface Point { row: number; col: number }

interface GameState {
  board: (Cell | null)[][]
  rows: number
  cols: number
  selectedCell: Cell | null
  moves: number
  matches: number
  totalPairs: number
  startTime: number | null
  elapsedTime: number
  timerInterval: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  isWon: boolean
  isAnimating: boolean
}

const state: GameState = {
  board: [], rows: 8, cols: 10, selectedCell: null,
  moves: 0, matches: 0, totalPairs: 0,
  startTime: null, elapsedTime: 0, timerInterval: null,
  difficulty: 'medium', isWon: false, isAnimating: false,
}

const DIFFICULTY_CONFIG = {
  easy: { rows: 6, cols: 8 },
  medium: { rows: 8, cols: 10 },
  hard: { rows: 10, cols: 12 },
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 逆向生成法：保证初始有解
function createGuaranteedBoard(): (Cell | null)[][] {
  const { rows, cols } = state
  const totalCells = rows * cols
  const pairs = totalCells / 2
  state.totalPairs = pairs

  const board: (Cell | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
  const positions: Point[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) positions.push({ row: r, col: c })

  const shuffledPositions = shuffleArray(positions)
  const selectedEmojis = shuffleArray(EMOJIS).slice(0, pairs)

  let id = 0
  for (let i = 0; i < pairs; i++) {
    const emoji = selectedEmojis[i]
    const p1 = shuffledPositions[i * 2]
    const p2 = shuffledPositions[i * 2 + 1]
    board[p1.row][p1.col] = { id: id++, emoji, row: p1.row, col: p1.col, isMatched: false }
    board[p2.row][p2.col] = { id: id++, emoji, row: p2.row, col: p2.col, isMatched: false }
  }

  console.log('✅ 棋盘生成完成')
  return board
}

// 路径检测
function canConnectStraight(board: (Cell | null)[][], p1: Point, p2: Point): boolean {
  if (p1.row === p2.row) {
    const [minC, maxC] = [Math.min(p1.col, p2.col), Math.max(p1.col, p2.col)]
    for (let c = minC + 1; c < maxC; c++) {
      if (c >= 0 && c < state.cols && board[p1.row]?.[c] !== null) return false
    }
    return true
  }
  if (p1.col === p2.col) {
    const [minR, maxR] = [Math.min(p1.row, p2.row), Math.max(p1.row, p2.row)]
    for (let r = minR + 1; r < maxR; r++) {
      if (r >= 0 && r < state.rows && board[r]?.[p1.col] !== null) return false
    }
    return true
  }
  return false
}

function canConnectOneCorner(board: (Cell | null)[][], p1: Point, p2: Point): Point | null {
  const corners = [{ row: p1.row, col: p2.col }, { row: p2.row, col: p1.col }]
  for (const c of corners) {
    const isValid = c.col < 0 || c.col >= state.cols || c.row < 0 || c.row >= state.rows || board[c.row]?.[c.col] === null
    const isSame = (c.row === p1.row && c.col === p1.col) || (c.row === p2.row && c.col === p2.col)
    if (isValid && !isSame && canConnectStraight(board, p1, c) && canConnectStraight(board, c, p2)) return c
  }
  return null
}

function canConnectTwoCorners(board: (Cell | null)[][], p1: Point, p2: Point): Point[] | null {
  // 水平扫描
  for (let c = -1; c <= state.cols; c++) {
    if (c === p1.col || c === p2.col) continue
    const c1: Point = { row: p1.row, col: c }
    const c2: Point = { row: p2.row, col: c }
    const v1 = c < 0 || c >= state.cols || board[c1.row]?.[c] === null
    const v2 = c < 0 || c >= state.cols || board[c2.row]?.[c] === null
    if (v1 && v2 && canConnectStraight(board, p1, c1) && canConnectStraight(board, c1, c2) && canConnectStraight(board, c2, p2)) return [c1, c2]
  }
  // 垂直扫描
  for (let r = -1; r <= state.rows; r++) {
    if (r === p1.row || r === p2.row) continue
    const c1: Point = { row: r, col: p1.col }
    const c2: Point = { row: r, col: p2.col }
    const v1 = r < 0 || r >= state.rows || board[r]?.[c1.col] === null
    const v2 = r < 0 || r >= state.rows || board[r]?.[c2.col] === null
    if (v1 && v2 && canConnectStraight(board, p1, c1) && canConnectStraight(board, c1, c2) && canConnectStraight(board, c2, p2)) return [c1, c2]
  }
  return null
}

function findPath(board: (Cell | null)[][], p1: Point, p2: Point): Point[] | null {
  if (canConnectStraight(board, p1, p2)) return [p1, p2]
  const c1 = canConnectOneCorner(board, p1, p2)
  if (c1) return [p1, c1, p2]
  const c2 = canConnectTwoCorners(board, p1, p2)
  if (c2) return [p1, c2[0], c2[1], p2]
  return null
}

// ===== 修复：findHint 中正确提取 Point =====
function findHint(board: (Cell | null)[][]): [Cell, Cell] | null {
  const cells: Cell[] = []
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (board[r]?.[c] && !board[r][c]!.isMatched) cells.push(board[r][c]!)
    }
  }
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (cells[i].emoji === cells[j].emoji) {
        // 修复：提取 Point 对象传给 findPath
        const p1: Point = { row: cells[i].row, col: cells[i].col }
        const p2: Point = { row: cells[j].row, col: cells[j].col }
        if (findPath(board, p1, p2)) {
          return [cells[i], cells[j]]
        }
      }
    }
  }
  return null
}

function hasValidMoves(board: (Cell | null)[][]): boolean {
  return findHint(board) !== null
}

// 渲染
function formatTime(seconds: number): string {
  return Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0')
}

function drawMatchLine(path: Point[]) {
  const container = document.getElementById('board-container')
  if (!container) return
  const cells = container.querySelectorAll('.cell:not(.opacity-0)')
  if (cells.length === 0) return
  const firstCell = cells[0] as HTMLElement
  const cellW = firstCell.offsetWidth, cellH = firstCell.offsetHeight, gap = 8

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i], p2 = path[i + 1]
    const line = document.createElement('div')
    line.className = 'match-line'
    const x1 = p1.col < 0 ? -20 : p1.col >= state.cols ? state.cols * (cellW + gap) + 20 : p1.col * (cellW + gap) + cellW / 2
    const y1 = p1.row < 0 ? -20 : p1.row >= state.rows ? state.rows * (cellH + gap) + 20 : p1.row * (cellH + gap) + cellH / 2
    const x2 = p2.col < 0 ? -20 : p2.col >= state.cols ? state.cols * (cellW + gap) + 20 : p2.col * (cellW + gap) + cellW / 2
    const y2 = p2.row < 0 ? -20 : p2.row >= state.rows ? state.rows * (cellH + gap) + 20 : p2.row * (cellH + gap) + cellH / 2
    if (p1.row === p2.row) {
      line.style.width = Math.abs(x2 - x1) + 'px'
      line.style.height = '4px'
      line.style.left = Math.min(x1, x2) + 'px'
      line.style.top = (y1 - 2) + 'px'
    } else {
      line.style.width = '4px'
      line.style.height = Math.abs(y2 - y1) + 'px'
      line.style.left = (x1 - 2) + 'px'
      line.style.top = Math.min(y1, y2) + 'px'
    }
    container.appendChild(line)
    setTimeout(() => line.remove(), 300)
  }
}

function renderGame() {
  const app = document.getElementById('app')!
  const { board, cols } = state

  const diffBtns = (['easy', 'medium', 'hard'] as const).map(d => {
    const sel = state.difficulty === d ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : 'opacity-70'
    return '<button class="btn ' + sel + '" data-difficulty="' + d + '">' + (d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难') + '</button>'
  }).join('')

  const boardHtml = board.map(row => row.map(cell => cell
    ? '<div class="cell ' + (cell.isMatched ? 'matched' : '') + ' ' + (state.selectedCell?.id === cell.id ? 'selected' : '') + '" data-id="' + cell.id + '" data-row="' + cell.row + '" data-col="' + cell.col + '">' + cell.emoji + '</div>'
    : '<div class="cell opacity-0 pointer-events-none"></div>'
  ).join('')).join('')

  const winModal = state.isWon
    ? '<div class="win-modal fixed inset-0 flex items-center justify-center z-50"><div class="win-content text-center"><div class="text-6xl mb-4">🎉</div><h2 class="text-3xl font-bold text-white mb-4">恭喜通关！</h2><div class="text-gray-300 mb-6"><p>用时：<span class="text-white font-bold">' + formatTime(state.elapsedTime) + '</span></p><p>步数：<span class="text-white font-bold">' + state.moves + '</span></p></div><button class="btn" id="playAgainBtn">🎮 再玩一次</button></div></div>'
    : ''

  app.innerHTML = '<div class="min-h-screen p-2 md:p-4"><div class="max-w-4xl mx-auto"><div class="text-center mb-4"><h1 class="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">🔗 连连看</h1><p class="text-gray-400 text-sm">找出相同图案，用不超过两个拐点的线连接消除</p></div><div class="flex justify-center gap-3 mb-4 flex-wrap"><div class="stats-card text-center"><div class="text-xl font-bold text-white">' + state.moves + '</div><div class="text-xs text-gray-400">步数</div></div><div class="stats-card text-center"><div class="text-xl font-bold text-white">' + formatTime(state.elapsedTime) + '</div><div class="text-xs text-gray-400">时间</div></div><div class="stats-card text-center"><div class="text-xl font-bold text-white">' + state.matches + '/' + state.totalPairs + '</div><div class="text-xs text-gray-400">配对</div></div></div><div class="flex justify-center gap-2 mb-4">' + diffBtns + '</div><div id="board-container" class="relative grid gap-2 mb-4" style="grid-template-columns: repeat(' + cols + ', minmax(0, 1fr));">' + boardHtml + '</div><div class="flex justify-center gap-2"><button class="btn" id="resetBtn">🔄 重新开始</button><button class="btn" id="hintBtn">💡 提示</button></div></div></div>' + winModal + '<div id="noMovesModal" class="win-modal fixed inset-0 flex items-center justify-center z-50 hidden"><div class="win-content text-center"><div class="text-6xl mb-4">😅</div><h2 class="text-2xl font-bold text-white mb-4">没有可消除的配对了</h2><p class="text-gray-300 mb-6">棋盘将重新洗牌</p><button class="btn" id="shuffleBtn">🔀 洗牌</button></div></div><div id="noHintToast" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none">当前没有可消除的配对</div>'

  document.querySelectorAll('.cell:not(.matched)').forEach(c => c.addEventListener('click', () => handleCellClick(c as HTMLElement)))
  document.querySelectorAll('[data-difficulty]').forEach(b => b.addEventListener('click', () => { state.difficulty = b.getAttribute('data-difficulty') as 'easy' | 'medium' | 'hard'; resetGame() }))
  document.getElementById('resetBtn')?.addEventListener('click', resetGame)
  document.getElementById('playAgainBtn')?.addEventListener('click', resetGame)
  document.getElementById('hintBtn')?.addEventListener('click', showHint)
  document.getElementById('shuffleBtn')?.addEventListener('click', shuffleBoard)
}

function handleCellClick(el: HTMLElement) {
  if (state.isAnimating) return
  const row = parseInt(el.getAttribute('data-row')!)
  const col = parseInt(el.getAttribute('data-col')!)
  const cell = state.board[row][col]
  if (!cell || cell.isMatched) return

  if (!state.startTime) { state.startTime = Date.now(); state.timerInterval = window.setInterval(updateTimer, 1000) }

  if (!state.selectedCell) { state.selectedCell = cell; renderGame(); return }
  if (state.selectedCell.id === cell.id) { state.selectedCell = null; renderGame(); return }
  if (state.selectedCell.emoji !== cell.emoji) { state.selectedCell = cell; renderGame(); return }

  const path = findPath(state.board, { row: state.selectedCell.row, col: state.selectedCell.col }, { row: cell.row, col: cell.col })
  if (path) {
    state.moves++
    state.isAnimating = true
    drawMatchLine(path)
    setTimeout(() => {
      state.selectedCell!.isMatched = true
      cell.isMatched = true
      state.board[state.selectedCell!.row][state.selectedCell!.col] = null
      state.board[cell.row][cell.col] = null
      state.matches++
      state.selectedCell = null
      state.isAnimating = false
      if (state.matches === state.totalPairs) { state.isWon = true; if (state.timerInterval) clearInterval(state.timerInterval) }
      else if (!hasValidMoves(state.board)) setTimeout(() => { const m = document.getElementById('noMovesModal'); if (m) m.classList.remove('hidden') }, 300)
      renderGame()
    }, 300)
  } else { state.selectedCell = cell; renderGame() }
}

function showHint() {
  const hint = findHint(state.board)
  if (hint) {
    const [c1, c2] = hint
    document.querySelectorAll('.cell').forEach(c => {
      const id = parseInt(c.getAttribute('data-id')!)
      if (id === c1.id || id === c2.id) { c.classList.add('hint'); setTimeout(() => c.classList.remove('hint'), 1500) }
    })
  } else {
    const t = document.getElementById('noHintToast')
    if (t) { t.classList.remove('opacity-0'); t.classList.add('opacity-100'); setTimeout(() => { t.classList.remove('opacity-100'); t.classList.add('opacity-0') }, 2000) }
  }
}

function shuffleBoard() {
  const { board, rows, cols } = state
  const rem: string[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (board[r][c]) rem.push(board[r][c]!.emoji)
  const sh = shuffleArray(rem)
  let i = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (board[r][c]) board[r][c]!.emoji = sh[i++]
  
  if (!hasValidMoves(state.board)) { shuffleBoard(); return }
  
  const m = document.getElementById('noMovesModal')
  if (m) m.classList.add('hidden')
  renderGame()
}

function updateTimer() {
  if (state.startTime) {
    state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000)
    const el = document.querySelector('.stats-card:nth-child(2) .text-xl')
    if (el) el.textContent = formatTime(state.elapsedTime)
  }
}

function resetGame() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  const cfg = DIFFICULTY_CONFIG[state.difficulty]
  state.rows = cfg.rows
  state.cols = cfg.cols
  state.board = createGuaranteedBoard()
  state.selectedCell = null
  state.moves = 0
  state.matches = 0
  state.startTime = null
  state.elapsedTime = 0
  state.timerInterval = null
  state.isWon = false
  state.isAnimating = false
  renderGame()
}

resetGame()
