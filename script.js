/* script.js */
const GRID_SIZE = 10;
let score = 0, history = [], undoRights = 3, timer = 0, timerInterval = null;
let audioUnlocked = false;

// SES ELEMENTLERİ
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicToggle');
const clickSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-game-countdown-921.mp3');
const errorSfx = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-608.mp3');

// Varsayılan Ses Seviyesi %30
bgMusic.volume = 0.3;

function togglePanel(id, iconId) { 
    const p = document.getElementById(id); 
    const i = document.getElementById(iconId); 
    p.classList.toggle('open'); 
    i.innerText = p.classList.contains('open') ? '▲' : '▼'; 
}

function unlockAudio() { 
    if (!audioUnlocked) { 
        clickSfx.play().then(() => { clickSfx.pause(); audioUnlocked = true; }); 
    } 
}

// MÜZİK KONTROLÜ
function toggleMusic() {
    if (bgMusic.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
}

function playMusic() {
    bgMusic.play().then(() => {
        musicBtn.classList.remove('muted');
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }).catch(err => console.log("Müzik etkileşim bekliyor..."));
}

function pauseMusic() {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
    musicBtn.classList.add('muted');
    musicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
}

function initBoard() {
    const b = document.getElementById('game-board'); b.innerHTML = '';
    for (let y = 1; y <= 10; y++) { 
        for (let x = 1; x <= 10; x++) {
            const c = document.createElement('div'); 
            c.id = `x${x}y${y}`; 
            c.className = 'cell clickable'; 
            c.onclick = () => handleCellClick(x, y); 
            b.appendChild(c);
        } 
    }
}

function handleCellClick(x, y) {
    if (score === 0) { startTimer(); unlockAudio(); playMusic(); }
    
    const last = history[history.length - 1];
    if (last && !isValidMove(last.x, last.y, x, y)) {
        errorSfx.play(); return;
    }
    
    const cell = document.getElementById(`x${x}y${y}`);
    if (cell.classList.contains('filled')) return;

    clickSfx.play();
    if (last) document.getElementById(`x${last.x}y${last.y}`).classList.remove('last');

    cell.classList.add('filled', 'last');
    cell.innerText = ++score;
    history.push({x, y});

    document.getElementById('score').innerText = score;
    updateBoardVisuals(x, y);
    
    if (score === 100 || !hasPossibleMoves(x, y)) endGame();
}

function isValidMove(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
    return (dx === 3 && dy === 0) || (dx === 0 && dy === 3) || (dx === 2 && dy === 2);
}

function updateBoardVisuals(currX, currY) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('valid-move'));
    for (let y = 1; y <= 10; y++) {
        for (let x = 1; x <= 10; x++) {
            const cell = document.getElementById(`x${x}y${y}`);
            if (!cell.classList.contains('filled') && isValidMove(currX, currY, x, y)) {
                cell.classList.add('valid-move');
            }
        }
    }
}

function hasPossibleMoves(x, y) {
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 1 && nx <= 10 && ny >= 1 && ny <= 10) {
                if (!document.getElementById(`x${nx}y${ny}`).classList.contains('filled') && isValidMove(x, y, nx, ny)) return true;
            }
        }
    }
    return false;
}

function undoMove() {
    if (undoRights <= 0 || history.length <= 1) return;
    
    const last = history.pop();
    const cell = document.getElementById(`x${last.x}y${last.y}`);
    cell.classList.remove('filled', 'last', 'valid-move');
    cell.innerText = '';
    
    score--;
    undoRights--;
    
    const newLast = history[history.length - 1];
    const lastCell = document.getElementById(`x${newLast.x}y${newLast.y}`);
    lastCell.classList.add('last');
    
    document.getElementById('score').innerText = score;
    updateUndoDisplay();
    updateBoardVisuals(newLast.x, newLast.y);
}

function resetGame() {
    clearInterval(timerInterval);
    score = 0; history = []; undoRights = 3; timer = 0;
    document.getElementById('score').innerText = '0';
    document.getElementById('timer').innerText = '00:00';
    document.getElementById('game-start-overlay').style.display = 'flex';
    updateUndoDisplay();
    initBoard();
}

function startGame() {
    document.getElementById('game-start-overlay').style.display = 'none';
    initBoard();
    updateUndoDisplay();
    unlockAudio();
    playMusic(); // Oyun başladığında müzik devreye girer
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        const m = Math.floor(timer / 60).toString().padStart(2, '0');
        const s = (timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

function updateUndoDisplay() {
    const d = document.getElementById('undoDisplay');
    d.innerHTML = '<div class="life-dot"></div><div class="life-dot"></div><div class="life-dot"></div>';
    d.className = `life-container life-${undoRights}`;
    document.getElementById('undoBtn').disabled = (undoRights <= 0 || history.length <= 1);
}

function endGame() {
    clearInterval(timerInterval);
    setTimeout(() => {
        document.getElementById('finalScoreText').innerText = score;
        document.getElementById('finalTimeText').innerText = document.getElementById('timer').innerText;
        document.getElementById('finalDateText').innerText = new Date().toLocaleDateString('tr-TR');
        document.getElementById('funMessageText').innerText = score === 100 ? "MÜKEMMEL! TAM PUAN!" : "Harika Denemeydi!";
        document.getElementById('resultModal').style.display = 'flex';
        saveScore(score, timer);
    }, 500);
}

function saveScore(s, t) { 
    let scs = JSON.parse(localStorage.getItem('h100Scores') || '[]'); 
    scs.push({ score: s, time: t, date: new Date().toLocaleDateString('tr-TR') }); 
    scs.sort((a, b) => b.score - a.score); 
    localStorage.setItem('h100Scores', JSON.stringify(scs.slice(0, 5))); 
    updateLeaderboard(); 
}

function updateLeaderboard() { 
    const scs = JSON.parse(localStorage.getItem('h100Scores') || '[]'); 
    const b = document.getElementById('leaderboardBody'); 
    b.innerHTML = scs.map((s, i) => `<tr><td>${i+1}.</td><td><b>${s.score} P</b></td><td>${s.time}s</td><td>${s.date}</td></tr>`).join(''); 
}

function closeModal() { 
    document.getElementById('resultModal').style.display = 'none'; 
    resetGame();
}

async function generateAndShare() {
    const area = document.getElementById('captureArea');
    const canvas = await html2canvas(area, { backgroundColor: '#ffffff', scale: 2 });
    canvas.toBlob(blob => {
        const file = new File([blob], 'hedef100-skor.png', { type: 'image/png' });
        if (navigator.share) {
            navigator.share({ files: [file], title: 'Hedef 100 Skorum', text: `Hedef 100 oyununda ${score} puan yaptım! Sen kaç yapabilirsin?` });
        } else {
            const link = document.createElement('a');
            link.download = 'hedef100-skor.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    });
}

// İlk Yükleme
window.onload = () => {
    initBoard();
    updateLeaderboard();
    updateUndoDisplay();
};
