/**
 * 카드 뒤집기 게임 - Supabase fetch API 직접 호출 (라이브러리 불필요)
 */
const SUPABASE_URL = 'https://jgoewykmyisxauhzmlyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2V3eWtteWlzeGF1aHptbHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTA4NDIsImV4cCI6MjA4MzcyNjg0Mn0.3XtwwSNney_qx40mzbdyOeSpQVbyAlKONMKE1HCOqjM';

// Supabase REST API - fetch 직접 호출
async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// 카드 이모지
const CARD_SYMBOLS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];

// 게임 상태
let playerName = '';
let cards = [];
let flippedCards = [];
let moves = 0;
let matchedPairs = 0;
let timerInterval = null;
let seconds = 0;
let isProcessing = false;

// DOM 요소
const gameBoard = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty');
const restartBtn = document.getElementById('restart');
const gameOverModal = document.getElementById('game-over');
const playAgainBtn = document.getElementById('play-again');
const startModal = document.getElementById('start-modal');
const startNameInput = document.getElementById('start-name');
const startBtn = document.getElementById('start-btn');
const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard');

// 난이도별 카드 쌍 수
const DIFFICULTY_PAIRS = { easy: 6, normal: 8, hard: 10 };

function calculateScore() {
  return moves * 100 + seconds;
}

function createCards() {
  const pairs = DIFFICULTY_PAIRS[difficultySelect.value];
  const symbols = CARD_SYMBOLS.slice(0, pairs);
  const deck = [...symbols, ...symbols];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderBoard() {
  const difficulty = difficultySelect.value;
  gameBoard.className = `game-board ${difficulty}`;
  gameBoard.innerHTML = '';
  cards.forEach((symbol, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${symbol}</div>
      </div>
    `;
    card.addEventListener('click', () => handleCardClick(index));
    gameBoard.appendChild(card);
  });
}

function handleCardClick(index) {
  if (isProcessing) return;
  const card = gameBoard.children[index];
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  flippedCards.push({ index, symbol: cards[index] });
  if (flippedCards.length === 2) {
    isProcessing = true;
    moves++;
    movesEl.textContent = moves;
    const [first, second] = flippedCards;
    if (first.symbol === second.symbol) {
      gameBoard.children[first.index].classList.add('matched');
      gameBoard.children[second.index].classList.add('matched');
      matchedPairs++;
      flippedCards = [];
      isProcessing = false;
      if (matchedPairs === cards.length / 2) gameOver();
    } else {
      gameBoard.children[first.index].classList.add('shake');
      gameBoard.children[second.index].classList.add('shake');
      setTimeout(() => {
        gameBoard.children[first.index].classList.remove('shake', 'flipped');
        gameBoard.children[second.index].classList.remove('shake', 'flipped');
        flippedCards = [];
        isProcessing = false;
      }, 550);
    }
  }
}

function startTimer() {
  seconds = 0;
  timerEl.textContent = '0';
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = seconds;
  }, 1000);
}

async function gameOver() {
  clearInterval(timerInterval);
  document.getElementById('final-moves').textContent = moves;
  document.getElementById('final-time').textContent = seconds;
  document.getElementById('final-score').textContent = calculateScore();
  gameOverModal.classList.remove('hidden');
  // 게임 종료 시 자동 저장
  await saveScore();
}

async function saveScore() {
  const name = playerName.trim() || '익명';
  try {
    await supabaseFetch('/card_game_scores', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        player_name: name,
        moves: moves,
        time_seconds: seconds
      })
    });
    loadLeaderboard();
  } catch (err) {
    console.error('점수 저장 실패:', err);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRankBadge(rank) {
  const badges = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return badges[rank] || `${rank}.`;
}

async function loadLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '<p class="loading">로딩 중...</p>';
  try {
    const data = await supabaseFetch(
      '/card_game_scores?select=player_name,moves,time_seconds&order=moves.asc,time_seconds.asc&limit=10'
    );
    if (!data || data.length === 0) {
      listEl.innerHTML = '<p class="no-data">아직 기록이 없습니다.</p>';
      return;
    }
    listEl.innerHTML = data.map((row, i) => {
      const rank = i + 1;
      const badge = getRankBadge(rank);
      const name = escapeHtml(row.player_name || '익명');
      const m = row.moves ?? 0;
      const t = row.time_seconds ?? 0;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      return `<div class="leaderboard-item ${rankClass}"><span class="rank">${badge}</span><span class="name">${name}</span><span class="score">${m}회 / ${t}초</span></div>`;
    }).join('');
  } catch (err) {
    console.error('리더보드 로드 실패:', err);
    listEl.innerHTML = '<p class="no-data">로딩 실패. 새로고침 해주세요.</p>';
  }
}

function initGame() {
  clearInterval(timerInterval);
  cards = createCards();
  flippedCards = [];
  moves = 0;
  matchedPairs = 0;
  seconds = 0;
  isProcessing = false;
  movesEl.textContent = '0';
  timerEl.textContent = '0';
  gameOverModal.classList.add('hidden');
  renderBoard();
  startTimer();
}

// 시작 화면 - 이름 입력 후 게임 시작
function showStartScreen() {
  startModal.classList.remove('hidden');
  startNameInput.value = playerName;
  startNameInput.focus();
}

function hideStartScreenAndStart() {
  playerName = startNameInput.value.trim();
  startModal.classList.add('hidden');
  initGame();
  loadLeaderboard();
}

// 이벤트
restartBtn.addEventListener('click', () => {
  if (playerName) initGame();
  else showStartScreen();
});
playAgainBtn.addEventListener('click', () => {
  initGame();
  loadLeaderboard();
});
startBtn.addEventListener('click', () => {
  if (!startNameInput.value.trim()) {
    startNameInput.placeholder = '이름을 입력해주세요!';
    startNameInput.focus();
    return;
  }
  hideStartScreenAndStart();
});
startNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startBtn.click();
});
refreshLeaderboardBtn?.addEventListener('click', () => {
  refreshLeaderboardBtn.disabled = true;
  refreshLeaderboardBtn.textContent = '로딩 중...';
  loadLeaderboard().finally(() => {
    refreshLeaderboardBtn.disabled = false;
    refreshLeaderboardBtn.textContent = '새로고침';
  });
});
difficultySelect.addEventListener('change', () => {
  if (flippedCards.length === 0 && matchedPairs === 0) initGame();
});

// 앱 시작 - 이름 입력 화면
showStartScreen();
loadLeaderboard();
