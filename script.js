const space = document.getElementById("space");
const overlay = document.getElementById("overlay");
const game = document.getElementById("game");
const startBtn = document.getElementById("startBtn");
const liveScore = document.getElementById("liveScore");

const title = document.getElementById("title");
const instruction = document.getElementById("instruction");
const statsContainer = document.getElementById("stats-container");
const currentScoreElement = document.getElementById("currentScore");
const highScoreElement = document.getElementById("highScore");

let alienTimeout;
let score = 0;
let highScore = localStorage.getItem("tapRushHighScore") || 0;
const REACTION_LIMIT = 1200;

// Inicializa estrellas y cohetes de fondo
function createBackground() {
  for (let i = 0; i < 40; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.textContent = "•";
    star.style.top = Math.random() * 100 + "vh";
    star.style.left = Math.random() * 100 + "vw";
    star.style.animationDuration = 20 + Math.random() * 20 + "s";
    space.appendChild(star);
  }

  for (let i = 0; i < 8; i++) {
    const rocket = document.createElement("div");
    rocket.className = "rocket";
    rocket.textContent = "🚀";
    rocket.style.top = Math.random() * 100 + "vh";
    rocket.style.left = Math.random() * 100 + "vw";
    rocket.style.animationDuration = 10 + Math.random() * 15 + "s";
    space.appendChild(rocket);
  }
}

// Genera un alien en coordenadas seguras
function spawnAlien() {
  game.innerHTML = "";
  liveScore.innerText = score;

  const alien = document.createElement("div");
  alien.className = "alien";
  alien.textContent = "👽";

  // Margen para evitar bordes y contador inferior
  const posX = Math.random() * 75 + 10; 
  const posY = Math.random() * 55 + 10; 

  alien.style.left = posX + "vw";
  alien.style.top = posY + "vh";

  alien.onclick = (e) => {
    e.stopPropagation();
    clearTimeout(alienTimeout);
    score++;
    spawnAlien();
  };

  game.appendChild(alien);

  alienTimeout = setTimeout(() => endGame(), REACTION_LIMIT);
}

function startGame() {
  score = 0;
  overlay.style.display = "none";
  liveScore.classList.remove("hidden");
  liveScore.innerText = "0";
  spawnAlien();
}

function endGame() {
  game.innerHTML = "";
  liveScore.classList.add("hidden");

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("tapRushHighScore", highScore);
  }

  // Actualización de UI post-partida
  title.innerText = "¡Perdiste! 😵";
  instruction.innerText = "¿Intentamos otra vez?";
  currentScoreElement.innerText = score;
  highScoreElement.innerText = highScore;
  
  statsContainer.style.display = "block";
  startBtn.innerText = "Jugar de nuevo";
  overlay.style.display = "flex";
}

startBtn.onclick = startGame;
createBackground();