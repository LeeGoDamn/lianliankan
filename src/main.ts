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
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 检查两点之间是否可以直线连接（中间没有障碍）
function canConnectStraight(board: (Cell | null)[][], p1: Point, p2: Point): boolean {
  if (p1.row === p2.row) {
    const minCol = Math.min(p1.col, p2.col)
    const maxCol = Math.max(p1.col, p2.col)
    for (let c = minCol + 1; c < maxCol; c++) {
      if (board[p1.row][c] !== null) return false
    }
    return true
  }
  if (p1.col === p2.col) {
    const minRow = Math.min(p1.row, p2.row)
    const maxRow = Math.max(p1.row, p2.row)
    for (let r = minRow + 1; r < maxRow; r++) {
      if (board[r][p1.col] !== null) return false
    }
    return true
  }
  return false
}

// 检查是否可以通过一个拐点连接
function canConnectOneCorner(board: (Cell | null)[][], p1: Point, p2: Point): Point | null {
  const corner1: Point = { row: p1.row, col: p2.col }
  const corner2: Point = { row: p2.row, col: p1.col }

  if (board[corner1.row][corner1.col] === null || (corner1.row === p1.row && corner1.col === p1.col) || (corner1.row === p2.row && corner1.col === p2.col)) {
    if (canConnectStraight(board, p1, corner1) && canConnectStraight(board, corner1, p2)) {
      return corner1
    }
  }

  if (board[corner2.row][corner2.col] === null || (corner2.row === p1.row && corner2.col === p1.col) || (corner2.row === p2.row && corner2.col === p2.col)) {
    if (canConnectStraight(board, p1, corner2) && canConnectStraight(board, corner2, p2)) {
      return corner2
    }
  }

  return null
}

// 检查是否可以通过两个拐点连接
function canConnectTwoCorners(board: (Cell | null)[][], p1: Point, p2: Point): Point[] | null {
  const { rows, cols } = state

  // 水平方向扫描
  for (let c = -1; c <= cols; c++) {
    if (c === p1.col || c === p2.col) continue
    
    const corner1: Point = { row: p1.row, col: c }
    const corner2: Point = { row: p2.row, col: c }
    
    const isValidCorner1 = c < 0 || c >= cols || board[corner1.row][corner1.col] === null
    const isValidCorner2 = c < 0 || c >= cols || board[corner2.row][corner2.col] === null
    
    if (isValidCorner1 && isValidCorner2) {
      if (canConnectStraight(board, p1, corner1) && 
          canConnectStraight(board, corner1, corner2) && 
          canConnectStraight(board, corner2, p2)) {
        return [corner1, corner2]
      }
    }
  }

  // 垂直方向扫描
  for (let r = -1; r <= rows; r++) {
    if (r === p1.row || r === p2.row) continue
    
    const corner1: Point = { row: r, col: p1.col }
    const corner2: Point = { row: r, col: p2.col }
    
    const isValidCorner1 = r < 0 || r >= rows || board[corner1.row][corner1.col] === null
    const isValidCorner2 = r < 0 || r >= rows || board[corner2.row][corner2.col] === null
    
    if (isValidCorner1 && isValidCorner2) {
      if (canConnectStraight(board, p1, corner1) && 
          canConnectStraight(board, corner1, corner2) && 
          canConnectStraight(board, corner2, p2)) {
        return [corner1, corner2]
      }
    }
  }

  return null
}

// 主路径检测函数
interface PathResult {
  canConnect: boolean
  path: Point[]
}

function findPath(board: (Cell | null)[][], p1: Point, p2: Point): PathResult {
  // 直线连接
  if (canConnectStraight(board, p1, p2)) {
    return { canConnect: true, path: [p1, p2] }
  }

  // 一个拐点
  const corner1 = canConnectOneCorner(board, p1, p2)
  if (corner1) {
    return { canConnect: true, path: [p1, corner1, p2] }
  }

  // 两个拐点
  const corners2 = canConnectTwoCorners(board, p1, p2)
  if (corners2) {
    return { canConnect: true, path: [p1, corners2[0], corners2[1], p2] }
  }

  return { canConnect: false, path: [] }
}

// 找到一对可以消除的格子（用于提示功能）
function findHint(): [Cell, Cell] | null {
  const { board, rows, cols } = state
  const cells: Cell[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] && !board[r][c]!.isMatched) {
        cells.push(board[r][c]!)
      }
    }
  }

  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (cells[i].emoji === cells[j].emoji) {
        const result = findPath(board, cells[i], cells[j])
        if (result.canConnect) {
          return [cells[i], cells[j]]
        }
      }
    }
  }

  return null
}

// 检查是否还有可消除的对子
function hasValidMoves(): boolean {
  return findHint() !== null
}

// 绘制连接线
function drawMatchLine(path: Point[]) {
  const container = document.getElementById('board-container')
  if (!container) return

  const cells = container.querySelectorAll('.cell')
  const firstCell = cells[0] as HTMLElement
  if (!firstCell) return

  const cellWidth = firstCell.offsetWidth
  const cellHeight = firstCell.offsetHeight
  const gap = 8 // gap-2 = 8px

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i]
    const p2 = path[i + 1]

    const line = document.createElement('div')
    line.className = 'match-line'

    const x1 = p1.col * (cellWidth + gap) + cellWidth / 2
    const y1 = p1.row * (cellHeight + gap) + cellHeight / 2
    const x2 = p2.col * (cellWidth + gap) + cellWidth / 2
    const y2 = p2.row * (cellHeight + gap) + cellHeight / 2

    if (p1.row === p2.row) {
      // 水平线
      line.style.width = `${Math.abs(x2 - x1)}px`
      line.style.height = '4px'
      line.style.left = `${Math.min(x1, x2)}px`
      line.style.top = `${y1 - 2}px`
    } else {
      // 垂直线
      line.style.width = '4px'
      line.style.height = `${Math.abs(y2 - y1)}px`
      line.style.left = `${x1 - 2}px`
      line.style.top = `${Math.min(y1, y2)}px`
    }

    container.appendChild(line)

    setTimeout(() => {
      line.remove()
    }, 300)
  }
}

function renderGame() {
  const app = document.getElementById('app')!
  const { board, cols } = state

  app.innerHTML = `
    <div class="min-h-screen p-2 md:p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-4">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
            🔗 连连看
          </h1>
          <p class="text-gray-400 text-sm">找出相同图案，用不超过两个拐点的线连接消除</p>
        </div>

        <!-- Stats -->
        <div class="flex justify-center gap-3 mb-4 flex-wrap">
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${state.moves}</div>
            <div class="text-xs text-gray-400">步数</div>
          </div>
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${formatTime(state.elapsedTime)}</div>
            <div class="text-xs text-gray-400">时间</div>
          </div>
          <div class="stats-card text-center">
            <div class="text-xl font-bold text-white">${state.matches}/${state.totalPairs}</div>
            <div class="text-xs text-gray-400">配对</div>
          </div>
        </div>

        <!-- Difficulty -->
        <div class="flex justify-center gap-2 mb-4">
          ${(['easy', 'medium', 'hard'] as const).map(d => `
            <button 
              class="btn ${state.difficulty === d ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : 'opacity-70'}"
              data-difficulty="${d}"
            >
              ${d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
            </button>
          `).join('')}
        </div>

        <!-- Game Board -->
        <div 
          id="board-container"
          class="relative grid gap-2 mb-4"
          style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));"
        >
          ${board.map((row, _r) => 
            row.map((cell, _c) => cell ? `
              <div 
                class="cell ${cell.isMatched ? 'matched' : ''} ${state.selectedCell?.id === cell.id ? 'selected' : ''}"
                data-id="${cell.id}"
                data-row="${cell.row}"
                data-col="${cell.col}"
              >
                ${cell.emoji}
              </div>
            ` : `
              <div class="cell opacity-0 pointer-events-none"></div>
            `).join('')
          ).join('')}
        </div>

        <!-- Buttons -->
        <div class="flex justify-center gap-2">
          <button class="btn" id="resetBtn">🔄 重新开始</button>
          <button class="btn" id="hintBtn">💡 提示</button>
        </div>
      </div>
    </div>

    <!-- Win Modal -->
    ${state.isWon ? `
      <div class="win-modal fixed inset-0 flex items-center justify-center z-50">
        <div class="win-content text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-3xl font-bold text-white mb-4">恭喜通关！</h2>
          <div class="text-gray-300 mb-6">
            <p>用时：<span class="text-white font-bold">${formatTime(state.elapsedTime)}</span></p>
            <p>步数：<span class="text-white font-bold">${state.moves}</span></p>
          </div>
          <button class="btn" id="playAgainBtn">🎮 再玩一次</button>
        </div>
      </div>
    ` : ''}

    <!-- No Moves Modal -->
    <div id="noMovesModal" class="win-modal fixed inset-0 flex items-center justify-center z-50 hidden">
      <div class="win-content text-center">
        <div class="text-6xl mb-4">😅</div>
        <h2 class="text-2xl font-bold text-white mb-4">没有可消除的配对了</h2>
        <p class="text-gray-300 mb-6">棋盘将重新洗牌</p>
        <button class="btn" id="shuffleBtn">🔀 洗牌</button>
      </div>
    </div>
  `

  // Event listeners
  document.querySelectorAll('.cell:not(.matched)').forEach(cell => {
    cell.addEventListener('click', () => handleCellClick(cell as HTMLElement))
  })

  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.getAttribute('data-difficulty') as 'easy' | 'medium' | 'hard'
      resetGame()
    })
  })

  document.getElementById('resetBtn')?.addEventListener('click', resetGame)
  document.getElementById('playAgainBtn')?.addEventListener('click', resetGame)
  document.getElementById('hintBtn')?.addEventListener('click', showHint)
  document.getElementById('shuffleBtn')?.addEventListener('click', shuffleBoard)
}

function handleCellClick(element: HTMLElement) {
  if (state.isAnimating) return

  const row = parseInt(element.getAttribute('data-row')!)
  const col = parseInt(element.getAttribute('data-col')!)

  const cell = state.board[row][col]
  if (!cell || cell.isMatched) return

  // Start timer on first click
  if (!state.startTime) {
    state.startTime = Date.now()
    state.timerInterval = window.setInterval(updateTimer, 1000)
  }

  // If no cell selected, select this one
  if (!state.selectedCell) {
    state.selectedCell = cell
    renderGame()
    return
  }

  // If same cell clicked, deselect
  if (state.selectedCell.id === cell.id) {
    state.selectedCell = null
    renderGame()
    return
  }

  // Check if emojis match
  if (state.selectedCell.emoji !== cell.emoji) {
    state.selectedCell = cell
    renderGame()
    return
  }

  // Check if can connect
  const pathResult = findPath(
    state.board,
    { row: state.selectedCell.row, col: state.selectedCell.col },
    { row: cell.row, col: cell.col }
  )

  if (pathResult.canConnect) {
    state.moves++
    state.isAnimating = true

    // Draw line
    drawMatchLine(pathResult.path)

    // Animate and remove
    setTimeout(() => {
      state.selectedCell!.isMatched = true
      cell.isMatched = true
      state.board[state.selectedCell!.row][state.selectedCell!.col] = null
      state.board[cell.row][cell.col] = null
      state.matches++
      state.selectedCell = null
      state.isAnimating = false

      // Check win
      if (state.matches === state.totalPairs) {
        state.isWon = true
        if (state.timerInterval) {
          clearInterval(state.timerInterval)
        }
      } else if (!hasValidMoves()) {
        // No valid moves, show modal
        setTimeout(() => {
          const modal = document.getElementById('noMovesModal')
          if (modal) modal.classList.remove('hidden')
        }, 300)
      }

      renderGame()
    }, 300)
  } else {
    // Can't connect, select the new cell
    state.selectedCell = cell
    renderGame()
  }
}

function showHint() {
  const hint = findHint()
  if (hint) {
    const [cell1, cell2] = hint
    const cells = document.querySelectorAll('.cell')
    cells.forEach(c => {
      const cellId = parseInt(c.getAttribute('data-id')!)
      if (cellId === cell1.id || cellId === cell2.id) {
        c.classList.add('hint')
        setTimeout(() => c.classList.remove('hint'), 1500)
      }
    })
  }
}

function shuffleBoard() {
  const { board, rows, cols } = state
  
  // Collect remaining emojis
  const remaining: string[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c]) {
        remaining.push(board[r][c]!.emoji)
      }
    }
  }

  // Shuffle
  const shuffled = shuffleArray(remaining)
  
  // Rebuild board
  let idx = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c]) {
        board[r][c]!.emoji = shuffled[idx++]
      }
    }
  }

  // Hide modal
  const modal = document.getElementById('noMovesModal')
  if (modal) modal.classList.add('hidden')

  renderGame()
}

function updateTimer() {
  if (state.startTime) {
    state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000)
    const timerEl = document.querySelector('.stats-card:nth-child(2) .text-xl')
    if (timerEl) timerEl.textContent = formatTime(state.elapsedTime)
  }
}

function resetGame() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
  }

  const config = DIFFICULTY_CONFIG[state.difficulty]
  state.rows = config.rows
  state.cols = config.cols
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

// Initialize game
resetGame()
