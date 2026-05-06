const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const speedEl = document.getElementById('speed');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');

const state = {
  player: { x: 460, y: 280, r: 14, speed: 5 },
  keys: new Set(),
  obstacles: [],
  frame: 0,
  score: 0,
  speedFactor: 1,
  gameOver: false,
};

let best = Number(localStorage.getItem('neon-best') || 0);
bestEl.textContent = best;

function reset() {
  state.player.x = 460;
  state.player.y = 280;
  state.obstacles = [];
  state.frame = 0;
  state.score = 0;
  state.speedFactor = 1;
  state.gameOver = false;
  overlay.classList.add('hidden');
  updateHUD();
}

function spawnObstacle() {
  const edge = Math.floor(Math.random() * 4);
  const size = 12 + Math.random() * 18;
  let x = 0;
  let y = 0;

  if (edge === 0) { x = -30; y = Math.random() * canvas.height; }
  if (edge === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
  if (edge === 2) { x = Math.random() * canvas.width; y = -30; }
  if (edge === 3) { x = Math.random() * canvas.width; y = canvas.height + 30; }

  const angle = Math.atan2(state.player.y - y, state.player.x - x);
  const baseSpeed = (1.2 + Math.random() * 1.8) * state.speedFactor;
  state.obstacles.push({ x, y, r: size, vx: Math.cos(angle) * baseSpeed, vy: Math.sin(angle) * baseSpeed });
}

function updateHUD() {
  scoreEl.textContent = state.score;
  speedEl.textContent = `${state.speedFactor.toFixed(1)}x`;
}

function movePlayer() {
  const p = state.player;
  if (state.keys.has('ArrowUp') || state.keys.has('w')) p.y -= p.speed;
  if (state.keys.has('ArrowDown') || state.keys.has('s')) p.y += p.speed;
  if (state.keys.has('ArrowLeft') || state.keys.has('a')) p.x -= p.speed;
  if (state.keys.has('ArrowRight') || state.keys.has('d')) p.x += p.speed;

  p.x = Math.max(p.r, Math.min(canvas.width - p.r, p.x));
  p.y = Math.max(p.r, Math.min(canvas.height - p.r, p.y));
}

function drawNeonCircle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function update() {
  if (state.gameOver) return;
  state.frame += 1;
  movePlayer();

  if (state.frame % Math.max(18, 45 - Math.floor(state.speedFactor * 5)) === 0) {
    spawnObstacle();
  }

  if (state.frame % 300 === 0) {
    state.speedFactor += 0.1;
  }

  state.obstacles.forEach((o) => {
    o.x += o.vx;
    o.y += o.vy;
  });

  state.obstacles = state.obstacles.filter((o) => o.x > -60 && o.x < canvas.width + 60 && o.y > -60 && o.y < canvas.height + 60);

  for (const o of state.obstacles) {
    const dx = o.x - state.player.x;
    const dy = o.y - state.player.y;
    if (Math.hypot(dx, dy) < o.r + state.player.r) {
      state.gameOver = true;
      best = Math.max(best, state.score);
      localStorage.setItem('neon-best', String(best));
      bestEl.textContent = best;
      finalScore.textContent = `Score: ${state.score}`;
      overlay.classList.remove('hidden');
      break;
    }
  }

  state.score += 1;
  updateHUD();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, '#0f1a34');
  grd.addColorStop(1, '#080d20');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawNeonCircle(state.player.x, state.player.y, state.player.r, '#7df9ff');
  state.obstacles.forEach((o) => drawNeonCircle(o.x, o.y, o.r, '#8d6bff'));
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => state.keys.add(e.key));
window.addEventListener('keyup', (e) => state.keys.delete(e.key));
document.getElementById('restartBtn').addEventListener('click', reset);
document.getElementById('overlayRestart').addEventListener('click', reset);

reset();
loop();
