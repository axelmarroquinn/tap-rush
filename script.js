/* ==========================================
   1. VARIABLES GLOBALES Y CONFIGURACIÓN
   ========================================== */
const space = document.getElementById("space");
const overlay = document.getElementById("overlay");
const game = document.getElementById("game");
const liveScore = document.getElementById("liveScore");
const title = document.getElementById("title");
const instruction = document.getElementById("instruction");
const statsContainer = document.getElementById("stats-container");

const startClassicBtn = document.getElementById("startClassicBtn");
const startContrarrelojBtn = document.getElementById("startContrarrelojBtn"); 
const progressContainer = document.getElementById("progress-container");
const progressFill = document.getElementById("progress-fill");
const progressAlien = document.getElementById("progress-alien");

let score = 0;
let highScore = localStorage.getItem("tapRushContrarrelojRecord") || 0;
let gameActive = false;
let gameMode = ""; 
let alienTimeout, goldInterval, monsterInterval, countdownInterval;

const REACTION_LIMIT = 1300;
const MISSION_GOAL = 100; 
const CONTRARRELOJ_TIME = 30;   
const ITEM_MARGIN = 80;

/* ==========================================
   2. GESTIÓN DE MENÚS Y BOTONES DINÁMICOS
   ========================================== */

function showMenu(t, inst) {
    title.innerText = t;
    instruction.innerText = inst;
    
    // Configuración de estadísticas
    const scoreLabel = gameMode === "contrarreloj" ? "Puntuación:" : "Puntos:";
    if (gameMode === "contrarreloj" && score > highScore) {
        highScore = score;
        localStorage.setItem("tapRushContrarrelojRecord", highScore);
    }

    statsContainer.innerHTML = `
        <p>${scoreLabel} <span>${score}</span></p>
        <p id="highScoreRow">Récord: <span>${highScore}</span></p>
    `;

    document.getElementById("highScoreRow").style.display = (gameMode === "contrarreloj") ? "block" : "none";
    statsContainer.style.display = "block";
    
    // Lógica de transformación de botones (Reintentar / Menú)
    if (gameMode === "mision") {
        startClassicBtn.innerText = "Reintentar modo misión 🛸";
        startClassicBtn.onclick = () => initGame("mision");
    } else {
        startClassicBtn.innerText = "Reintentar contrarreloj ⏱️";
        startClassicBtn.onclick = () => initGame("contrarreloj");
    }
    
    startContrarrelojBtn.innerText = "Volver al menú principal 📡";
    startContrarrelojBtn.onclick = () => location.reload();

    liveScore.classList.add("hidden");
    progressContainer.classList.add("hidden");
    overlay.style.display = "flex";
}

/* ==========================================
   3. MECÁNICAS DE JUEGO (ALIENS Y SPAWNS)
   ========================================== */

function spawnNormalAlien() {
    if (!gameActive) return;
    const old = game.querySelector(".alien.normal");
    if (old) old.remove();
    clearTimeout(alienTimeout);

    const pos = getSafePosition();
    const alien = document.createElement("div");
    alien.className = "alien normal";
    alien.textContent = "👽";
    alien.style.left = `${pos.x}px`;
    alien.style.top = `${pos.y}px`;

    alien.onclick = (e) => {
        e.stopPropagation();
        score++;
        updateUI();
        spawnNormalAlien(); 
    };
    game.appendChild(alien);
    alienTimeout = setTimeout(() => triggerGameOver("tiempo"), REACTION_LIMIT);
}

function startSpawners() {
    goldInterval = setInterval(() => {
        if (!gameActive) return;
        const gold = createItem("👽", "golden");
        gold.onclick = (e) => {
            e.stopPropagation();
            score += 5;
            updateUI();
            gold.remove();
            clearTimeout(alienTimeout);
            alienTimeout = setTimeout(() => triggerGameOver("tiempo"), REACTION_LIMIT);
        };
        game.appendChild(gold);
        setTimeout(() => { if(gold.parentNode) gold.remove(); }, 2000);
    }, 20000);

    monsterInterval = setInterval(() => {
        if (!gameActive) return;
        const monster = createItem("👾", "monster");
        monster.onclick = (e) => {
            e.stopPropagation();
            score = Math.max(0, score - 5);
            updateUI();
            triggerShake();
            monster.remove();
            if (score <= 0) triggerGameOver("puntos");
        };
        game.appendChild(monster);
        setTimeout(() => { if(monster.parentNode) monster.remove(); }, 3000);
    }, 10000);
}

/* ==========================================
   4. CONTROL DE PARTIDA (INICIO, VICTORIA, DERROTA)
   ========================================== */

function initGame(mode) {
    gameActive = true;
    gameMode = mode;
    score = 0;
    game.innerHTML = "";
    createBackground(); 
    
    clearTimeout(alienTimeout);
    clearInterval(goldInterval);
    clearInterval(monsterInterval);
    clearInterval(countdownInterval);
    
    overlay.style.display = "none";
    liveScore.classList.remove("hidden");
    
    if (mode === "mision") {
        progressContainer.classList.remove("hidden");
        liveScore.innerText = "0";
    } else {
        progressContainer.classList.add("hidden");
        startCountdown(CONTRARRELOJ_TIME);
    }

    updateUI();
    spawnNormalAlien();
    startSpawners();
}

function winMission() {
    stopAll();
    startVictoryCelebration();
    showMenu("¡Misión Cumplida! 🏆", "¡El alien llegó a su nave! 👽🛸");
}

function triggerGameOver(reason) {
    if (!gameActive) return;
    const titulo = "¡Oh no! 😵‍💫";
    let subtexto = "";

    // Lógica de mensajes según la causa de derrota
    if (reason === "puntos") {
        subtexto = "¡Se acabaron los puntos! 🚨";
    } else {
        subtexto = (gameMode === "mision") 
            ? "¡El alien no llegó a la nave! 🛸💨" 
            : "¡Se acabó el tiempo de reacción! ⏱️";
    }
    
    endGame(titulo, subtexto);
}

function endGame(t, inst) {
    stopAll();
    showMenu(t, inst);
}

function stopAll() {
    gameActive = false;
    clearTimeout(alienTimeout);
    clearInterval(goldInterval);
    clearInterval(monsterInterval);
    clearInterval(countdownInterval);
    game.innerHTML = "";
}

/* ==========================================
   5. UTILIDADES Y EFECTOS
   ========================================== */

// Calcula la distancia entre dos puntos (Teorema de Pitágoras)
function getDistance(x1, y1, x2, y2) {
    let xd = x2 - x1;
    let yd = y2 - y1;
    return Math.sqrt(xd * xd + yd * yd);
}

// Genera una posición que no esté cerca de otros aliens
function getSafePosition() {
    let x, y, tooClose;
    let attempts = 0;

    do {
        tooClose = false;
        x = Math.random() * (window.innerWidth - 150) + 75;
        y = Math.random() * (window.innerHeight - 250) + 125;
        
        // Revisamos todos los aliens que ya están en el juego
        const existingAliens = document.querySelectorAll('.alien');
        for (let a of existingAliens) {
            const ax = parseFloat(a.style.left);
            const ay = parseFloat(a.style.top);
            // Si la distancia es menor a 120px, está muy cerca
            if (getDistance(x, y, ax, ay) < 120) {
                tooClose = true;
                break;
            }
        }
        attempts++;
        // Si después de 10 intentos no halla sitio (pantalla llena), sale igual
    } while (tooClose && attempts < 10);

    return { x, y };
}


function startCountdown(seconds) {
    let timeLeft = seconds;
    liveScore.innerText = `${timeLeft}s | Puntos: ${score}`;
    countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            endGame(`¡Alcanzaste los ${CONTRARRELOJ_TIME} segundos! 🏆`, "¡Tu velocidad es de otro planeta! 🚀✨"); 
        } else {
            liveScore.innerText = `${timeLeft}s | Puntos: ${score}`;
        }
    }, 1000);
}

function updateUI() {
    if (gameMode === "mision") {
        liveScore.innerText = `Puntos: ${score}`; 
        const p = Math.min((score / MISSION_GOAL) * 100, 100);
        progressFill.style.width = p + "%";
        progressAlien.style.left = `calc(${p}% - 20px)`;
        if (score >= MISSION_GOAL) winMission();
    } else {
        const timePart = liveScore.innerText.split('|')[0];
        liveScore.innerText = `${timePart} | Puntos: ${score}`;
    }
}

function getSafePosition() {
    let x = Math.random() * (window.innerWidth - 100) + 50;
    let y = Math.random() * (window.innerHeight - 200) + 100;
    return { x, y };
}

function createItem(emoji, cls) {
    const pos = getSafePosition();
    const div = document.createElement("div");
    div.className = `alien ${cls}`;
    div.textContent = emoji;
    div.style.left = `${pos.x}px`;
    div.style.top = `${pos.y}px`;
    return div;
}

function triggerShake() {
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 200);
}

function startVictoryCelebration() {
    for(let i = 0; i < 15; i++) {
        const celebrant = document.createElement("div");
        celebrant.className = "rocket"; 
        celebrant.textContent = Math.random() > 0.5 ? "🛸" : "👽";
        celebrant.style.top = Math.random() * 90 + "vh";
        celebrant.style.left = "-15vw";
        celebrant.style.fontSize = "35px";
        celebrant.style.animationDuration = (Math.random() * 4 + 3) + "s";
        celebrant.style.animationDelay = (Math.random() * 2) + "s";
        space.appendChild(celebrant);
    }
}

function createBackground() {
    space.innerHTML = "";
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement("div");
        star.className = "star"; 
        star.textContent = "•";
        
        star.style.top = Math.random() * 100 + "vh";
        star.style.left = Math.random() * 100 + "vw";
        
        star.style.animationDuration = (15 + Math.random() * 25) + "s";
        star.style.opacity = Math.random(); 
        
        space.appendChild(star);
    }

    for (let i = 0; i < 8; i++) {
        const rocket = document.createElement("div");
        rocket.className = "rocket";
        rocket.textContent = "🚀";
        
        rocket.style.top = Math.random() * 100 + "vh";
        rocket.style.left = "-15vw"; 
        
        rocket.style.animationDuration = (8 + Math.random() * 12) + "s";
        rocket.style.animationDelay = (i * 3) + "s";
        
        space.appendChild(rocket);
    }
}

/* ==========================================
   6. EVENT LISTENERS
   ========================================== */
startClassicBtn.onclick = () => initGame("mision");
startContrarrelojBtn.onclick = () => initGame("contrarreloj");

game.onclick = (e) => {
    if (gameActive && e.target === game) {
        if (score > 0) {
            score = Math.max(0, score - 2);
            updateUI();
            triggerShake();
            // Si el error te deja en 0, pierdes
            if (score <= 0) triggerGameOver("puntos");
        } else {
            // Si ya tenías 0 y fallas, pierdes
            triggerGameOver("puntos");
        }
    }
};

createBackground();