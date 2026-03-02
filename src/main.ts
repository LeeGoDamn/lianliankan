import './style.css'

// Emoji 列表
const EMOJIS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝', '🍒',
  '🌸', '🌺', '🌻', '🌹', '🌼', '💐', '🌿', '🍀',
  '🐶', '🐱', '🐼', '🦊', '🐰', '🐨', '🐯', '🦁',
  '🚀', '✈️', '🚗', '🚲', '⛵', '🛸', '🚁', '🏍️',
  '⭐', '🌙', '☀️', '🌈', '❄️', '🔥', '💎', '🎵',
]

interface Cell {
  id: number
  emoji: string
  row: number
  col: number
  isMatched: boolean
}

interface Point {
  row: number
  col: number
}

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
  board: [],
  rows: 8,
  cols: 10,
  selectedCell: null,
  moves: 0,
  matches: 0,
  totalPairs: 0,
  startTime: null,
  elapsedTime: 0,
  timerInterval: null,
  difficulty: 'medium',
  isWon: false,
  isAnimating: false,
}

const DIFFICULTY_CONFIG = {
  easy: { rows: 6, cols: 8 },
  medium: { rows: 8, cols: 10 },
  hard: { rows: 10, cols: 12 },
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function createBoard(): (Cell | null)[][] {
  const { rows, cols } = state
  const totalCells = rows * cols
  const pairs = totalCells / 2
  state.totalPairs = pairs

  const selectedEmojis = shuffleArray(EMOJIS).slice(0, pairs)
  const emojiPairs = [...selectedEmojis, ...selectedEmojis]
  const shuffledEmojis = shuffleArray(emojiPairs)

  const board: (Cell | null)[][] = []
  let id = 0

  for (let r = 0; r < rows; r++) {
    const row: (Cell | null)[] = []
    for (let c = 0; c < cols; c++) {
      row.push({
        id: id++,
        emoji: shuffledEmojis[r * cols + c],
        row: r,
        col: c,
        isMatched: false,
      })
    }
    board.push(row)
  }

  return board
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0')
}

// 检查两点之间是否可以直线连接
function canConnectStraight(board: (Cell | null)[][], p1: Point, p2: Point): boolean {
  if (p1.row === p2.row) {
    const minCol = Math.min(p1.col, p2.col)
    const maxCol = Math.max(p1.col, p2.col)
    for (let c = minCol + 1; c < maxCol; c++) {
      if (c >= 0 && c < state.cols && board[p1.row] && board[p1.row][c] !== null) {
        return false
      }
    }
    return true
  }
  if (p1.col === p2.col) {
    const minRow = Math.min(p1.row, p2.row)
    const maxRow = Math.max(p1.row, p2.row)
    for (let r = minRow + 1; r < maxRow; r++) {
      if (r >= 0 && r < state.rows && board[r] && board[r][p1.col] !== null) {
        return false
      }
    }
    return true
  }
  return false
}

// 检查一个拐点连接
function canConnectOneCorner(board: (Cell | null)[][], p1: Point, p2: Point): Point | null {
  const corner1: Point = { row: p1.row, col: p2.col }
  const corner2: Point = { row: p2.row, col: p1.col }

  const isValidC1 = corner1.col < 0 || corner1.col >= state.cols || corner1.row < 0 || corner1.row >= state.rows || (board[corner1.row] && board[corner1.row][corner1.col] === null)
  const isSameC1 = (corner1.row === p1.row && corner1.col === p1.col) || (corner1.row === p2.row && corner1.col === p2.col)
  
  if (isValidC1 && !isSameC1) {
    if (canConnectStraight(board, p1, corner1) && canConnectStraight(board, corner1, p2)) {
      return corner1
    }
  }

  const isValidC2 = corner2.col < 0 || corner2.col >= state.cols || corner2.row < 0 || corner2.row >= state.rows || (board[corner2.row] && board[corner2.row][corner2.col] === null)
  const isSameC2 = (corner2.row === p1.row && corner2.col === p1.col) || (corner2.row === p2.row && corner2.col === p2.col)
  
  if (isValidC2 && !isSameC2) {
    if (canConnectStraight(board, p1, corner2) && canConnectStraight(board, corner2, p2)) {
      return corner2
    }
  }

  return null
}

// 检查两个拐点连接
function canConnectTwoCorners(board: (Cell | null)[][], p1: Point, p2: Point): Point[] | null {
  const { rows, cols } = state

  // 水平扫描
  for (let c = -1; c <= cols; c++) {
    if (c === p1.col || c === p2.col) continue
    const corner1: Point = { row: p1.row, col: c }
    const corner2: Point = { row: p2.row, col: c }
    const valid1 = c < 0 || c >= cols || (board[corner1.row] && board[corner1.row][c] === null)
    const valid2 = c < 0 || c >= cols || (board[corner2.row] && board[corner2.row][c] === null)
    if (valid1 && valid2) {
      if (canConnectStraight(board, p1, corner1) && canConnectStraight(board, corner1, corner2) && canConnectStraight(board, corner2, p2)) {
        return [corner1, corner2]
      }
    }
  }

  // 垂直扫描
  for (let r = -1; r <= rows; r++) {
    if (r === p1.row || r === p2.row) continue
    const corner1: Point = { row: r, col: p1.col }
    const corner2: Point = { row: r, col: p2.col }
    const valid1 = r < 0 || r >= rows || (board[r] && board[r][corner1.col] === null)
    const valid2 = r < 0 || r >= rows || (board[r] && board[r][corner2.col] === null)
    if (valid1 && valid2) {
      if (canConnectStraight(board, p1, corner1) && canConnectStraight(board, corner1, corner2) && canConnectStraight(board, corner2, p2)) {
        return [corner1, corner2]
      }
    }
  }

  return null
}

interface PathResult {
  canConnect: boolean
  path: Point[]
}

function findPath(board: (Cell | null)[][], p1: Point, p2: Point): PathResult {
  if (canConnectStraight(board, p1, p2)) return { canConnect: true, path: [p1, p2] }
  const c1 = canConnectOneCorner(board, p1, p2)
  if (c1) return { canConnect: true, path: [p1, c1, p2] }
  const c2 = canConnectTwoCorners(board, p1, p2)
  if (c2) return { canConnect: true, path: [p1, c2[0], c2[1], p2] }
  return { canConnect: false, path: [] }
}

function findHint(): [Cell, Cell] | null {
  const { board, rows, cols } = state
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] && !board[r][c]!.isMatched) cells.push(board[r][c]!)
    }
  }
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (cells[i].emoji === cells[j].emoji && findPath(board, cells[i], cells[j]).canConnect) {
        return [cells[i], cells[j]]
      }
    }
  }
  return null
}

function hasValidMoves(): boolean {
  return findHint() !== null
}

function drawMatchLine(path: Point[]) {
  const container = document.getElementById('board-container')
  if (!container) return
  const cells = container.querySelectorAll('.cell:not(.opacity-0)')
  if (cells.length === 0) return
  const firstCell = cells[0] as HTMLElement
  const cellWidth = firstCell.offsetWidth
  const cellHeight = firstCell.offsetHeight
  const gap = 8

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i]
    const p2 = path[i + 1]
    const line = document.createElement('div')
    line.className = 'match-line'
    const x1 = p1.col < 0 ? -20 : p1.col >= state.cols ? state.cols * (cellWidth + gap) + 20 : p1.col * (cellWidth + gap) + cellWidth / 2
    const y1 = p1.row < 0 ? -20 : p1.row >= state.rows ? state.rows * (cellHeight + gap) + 20 : p1.row * (cellHeight + gap) + cellHeight / 2
    const x2 = p2.col < 0 ? -20 : p2.col >= state.cols ? state.cols * (cellWidth + gap) + 20 : p2.col * (cellWidth + gap) + cellWidth / 2
    const y2 = p2.row < 0 ? -20 : p2.row >= state.rows ? state.rows * (cellHeight + gap) + 20 : p2.row * (cellHeight + gap) + cellHeight / 2

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
    const lbl = d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'
    return '<button class="btn ' + sel + '" data-difficulty="' + d + '">' + lbl + '</button>'
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

  const res = findPath(state.board, { row: state.selectedCell.row, col: state.selectedCell.col }, { row: cell.row, col: cell.col })
  if (res.canConnect) {
    state.moves++
    state.isAnimating = true
    drawMatchLine(res.path)
    setTimeout(() => {
      state.selectedCell!.isMatched = true
      cell.isMatched = true
      state.board[state.selectedCell!.row][state.selectedCell!.col] = null
      state.board[cell.row][cell.col] = null
      state.matches++
      state.selectedCell = null
      state.isAnimating = false
      if (state.matches === state.totalPairs) { state.isWon = true; if (state.timerInterval) clearInterval(state.timerInterval) }
      else if (!hasValidMoves()) setTimeout(() => { const m = document.getElementById('noMovesModal'); if (m) m.classList.remove('hidden') }, 300)
      renderGame()
    }, 300)
  } else { state.selectedCell = cell; renderGame() }
}

function showHint() {
  const hint = findHint()
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
  state.board = createBoard()
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
