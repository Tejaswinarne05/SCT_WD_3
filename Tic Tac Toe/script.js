const gameBoard = document.getElementById('game-board');
const cells = document.querySelectorAll('.cell');
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-button');
const pvpModeButton = document.getElementById('pvp-mode');
const pvcModeButton = document.getElementById('pvc-mode');
const settingsSection = document.getElementById('settings-section'); // New parent for settings
const playerMarkerSelection = document.getElementById('player-marker-selection');
const player1MarkerInput = document.getElementById('player1-marker');
const player2MarkerInput = document.getElementById('player2-marker');
const player1ColorInput = document.getElementById('player1-color');
const player2ColorInput = document.getElementById('player2-color');
const applyMarkersColorsButton = document.getElementById('apply-markers-colors');
const difficultySelection = document.getElementById('difficulty-selection');
const difficultyEasyButton = document.getElementById('difficulty-easy');
const difficultyMediumButton = document.getElementById('difficulty-medium');
const difficultyHardButton = document.getElementById('difficulty-hard');
const player1ScoreSpan = document.getElementById('player1-score');
const player2ScoreSpan = document.getElementById('player2-score');
const drawsScoreSpan = document.getElementById('draws-score');
const confettiContainer = document.getElementById('confetti-container');

// Sound effects
const placeSound = document.getElementById('place-sound');
const winSound = document.getElementById('win-sound');
const drawSound = document.getElementById('draw-sound');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let isPlayerVsComputer = false; // Default to Player vs Player
let player1Marker = 'X';
let player2Marker = 'O';
let player1Color = '#dc3545'; // Default red
let player2Color = '#007bff'; // Default blue
let aiDifficulty = 'easy'; // 'easy', 'medium', 'hard'

let player1Wins = 0;
let player2Wins = 0;
let draws = 0;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

const messages = {
    playerTurn: (player) => `It's ${player}'s turn`,
    win: (player) => `Player ${player} has won!`,
    draw: 'Game ended in a draw!'
};

// --- Game Logic Functions ---

function initializeGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = player1Marker; // Always start with player 1
    gameActive = true;
    gameMessage.innerHTML = messages.playerTurn(currentPlayer);
    gameMessage.style.color = '#333'; // Reset message color

    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.style.color = ''; // Reset inline color
        cell.classList.remove('win-animation');
        cell.style.boxShadow = ''; // Clear win animation shadow
    });
    gameBoard.classList.remove('draw-animation'); // Remove draw animation class
    confettiContainer.innerHTML = ''; // Clear any existing confetti

    updateScoreboard();

    // If PVC and AI is set to go first (e.g., player2Marker is AI)
    if (isPlayerVsComputer && currentPlayer === player2Marker) {
        setTimeout(computerMove, 700);
    }
}

function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    // Prevent clicking if cell is occupied, game is inactive, or it's AI's turn in PVC
    if (board[clickedCellIndex] !== '' || !gameActive || (isPlayerVsComputer && currentPlayer === player2Marker)) {
        return;
    }

    makeMove(clickedCell, clickedCellIndex);
    checkGameResult();

    // If game is still active and it's AI's turn in PVC
    if (gameActive && isPlayerVsComputer && currentPlayer === player2Marker) {
        setTimeout(computerMove, 700); // Delay computer move for better UX
    }
}

function makeMove(cell, index) {
    board[index] = currentPlayer;
    cell.innerHTML = currentPlayer;
    cell.style.color = (currentPlayer === player1Marker) ? player1Color : player2Color;
    playPlaceSound();
}

function changePlayer() {
    currentPlayer = currentPlayer === player1Marker ? player2Marker : player1Marker;
    gameMessage.innerHTML = messages.playerTurn(currentPlayer);
}

function checkGameResult() {
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = board[winCondition[0]];
        let b = board[winCondition[1]];
        let c = board[winCondition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winningCells = winCondition;
            break;
        }
    }

    if (roundWon) {
        gameMessage.innerHTML = messages.win(currentPlayer);
        gameMessage.style.color = '#28a745'; // Green for win message
        gameActive = false;
        if (currentPlayer === player1Marker) {
            player1Wins++;
        } else {
            player2Wins++;
        }
        updateScoreboard();
        playWinSound();
        triggerConfetti(currentPlayer === player1Marker ? player1Color : player2Color);
        // Apply win animation to winning cells
        const winColor = (currentPlayer === player1Marker) ? player1Color : player2Color;
        winningCells.forEach(index => {
            cells[index].classList.add('win-animation');
            // Dynamically set box-shadow color for the win animation
            cells[index].style.boxShadow = `0 0 15px 5px ${winColor}B3`; // B3 is 70% opacity
            cells[index].style.backgroundColor = `${winColor}33`; // Lighter background
        });
        return;
    }

    let roundDraw = !board.includes('');
    if (roundDraw) {
        gameMessage.innerHTML = messages.draw;
        gameMessage.style.color = '#ffc107'; // Yellow for draw message
        gameActive = false;
        draws++;
        updateScoreboard();
        gameBoard.classList.add('draw-animation'); // Add draw animation to board
        playDrawSound();
        return;
    }

    changePlayer();
}

// --- Computer AI Logic ---

function computerMove() {
    if (!gameActive) return;

    let moveIndex;
    if (aiDifficulty === 'easy') {
        moveIndex = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        moveIndex = getMediumAIMove();
    } else { // hard (Minimax)
        moveIndex = getBestMoveMinimax();
    }

    if (moveIndex !== null) {
        const cellToClick = document.querySelector(`[data-cell-index="${moveIndex}"]`);
        makeMove(cellToClick, moveIndex);
        checkGameResult();
    }
}

function getRandomMove() {
    let availableMoves = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }
    return availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null;
}

function getMediumAIMove() {
    // 1. Check for a winning move for AI itself
    let winningMove = findWinningMove(player2Marker);
    if (winningMove !== null) return winningMove;

    // 2. Check to block player's winning move
    let blockingMove = findWinningMove(player1Marker);
    if (blockingMove !== null) return blockingMove;

    // 3. Take center if available
    if (board[4] === '') return 4;

    // 4. Take a corner if available
    const corners = [0, 2, 6, 8];
    for (let corner of corners) {
        if (board[corner] === '') return corner;
    }

    // 5. Take any random available move (fallback)
    return getRandomMove();
}

function findWinningMove(player) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        const line = [board[a], board[b], board[c]];
        const emptyIndex = line.indexOf('');

        if (emptyIndex !== -1) { // If there's an empty spot in the line
            let tempLine = [...line];
            tempLine[emptyIndex] = player; // Temporarily place player's marker

            if (tempLine[0] === player && tempLine[1] === player && tempLine[2] === player) {
                return winningConditions[i][emptyIndex]; // Return the index of the empty spot
            }
        }
    }
    return null;
}


// --- Minimax Algorithm for Hard Difficulty ---

function getBestMoveMinimax() {
    let bestScore = -Infinity;
    let move = null;
    let availableMoves = [];

    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }

    // Shuffle available moves to add some randomness to optimal choices
    availableMoves.sort(() => Math.random() - 0.5);

    for (let i = 0; i < availableMoves.length; i++) {
        let index = availableMoves[i];
        board[index] = player2Marker; // AI is player2Marker
        let score = minimax(board, 0, false);
        board[index] = ''; // Undo the move

        if (score > bestScore) {
            bestScore = score;
            move = index;
        }
    }
    return move;
}

// Check for winner (utility function for minimax)
function checkWinner(currentBoard) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (currentBoard[a] === currentBoard[b] && currentBoard[b] === currentBoard[c] && currentBoard[a] !== '') {
            return currentBoard[a]; // Returns 'X' or 'O' (player1Marker or player2Marker)
        }
    }
    return null; // No winner
}

// Minimax function
function minimax(currentBoard, depth, isMaximizingPlayer) {
    const winner = checkWinner(currentBoard);

    if (winner === player2Marker) { // AI wins
        return 10 - depth;
    } else if (winner === player1Marker) { // Human wins
        return depth - 10;
    } else if (!currentBoard.includes('')) { // Draw
        return 0;
    }

    if (isMaximizingPlayer) { // AI's turn
        let bestScore = -Infinity;
        for (let i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] === '') {
                currentBoard[i] = player2Marker;
                let score = minimax(currentBoard, depth + 1, false);
                currentBoard[i] = ''; // Undo the move
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else { // Human's turn
        let bestScore = Infinity;
        for (let i = 0; i < currentBoard.length; i++) {
            if (currentBoard[i] === '') {
                currentBoard[i] = player1Marker;
                let score = minimax(currentBoard, depth + 1, true);
                currentBoard[i] = ''; // Undo the move
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// --- UI and Settings Functions ---

function setGameMode(isPVC) {
    isPlayerVsComputer = isPVC;
    if (isPVC) {
        pvpModeButton.classList.remove('active');
        pvcModeButton.classList.add('active');
        playerMarkerSelection.classList.add('hidden'); // Hide marker selection for PVC (computer is always the other marker)
        difficultySelection.classList.remove('hidden'); // Show difficulty selection
    } else {
        pvcModeButton.classList.remove('active');
        pvpModeButton.classList.add('active');
        playerMarkerSelection.classList.remove('hidden'); // Show marker selection for PVP
        difficultySelection.classList.add('hidden'); // Hide difficulty selection
    }
    initializeGame(); // Reset game when mode changes
}

function setAIDifficulty(difficulty) {
    aiDifficulty = difficulty;
    difficultyEasyButton.classList.remove('active');
    difficultyMediumButton.classList.remove('active');
    difficultyHardButton.classList.remove('active');
    document.getElementById(`difficulty-${difficulty}`).classList.add('active');
    initializeGame(); // Reset game when difficulty changes
}

function applyCustomMarkersColors() {
    let p1 = player1MarkerInput.value.trim().toUpperCase();
    let p2 = player2MarkerInput.value.trim().toUpperCase();
    let c1 = player1ColorInput.value;
    let c2 = player2ColorInput.value;

    if (p1 === '' || p2 === '') {
        alert('Please enter a marker for both players.');
        return;
    }
    if (p1 === p2) {
        alert('Player 1 and Player 2 markers cannot be the same.');
        return;
    }

    player1Marker = p1;
    player2Marker = p2;
    player1Color = c1;
    player2Color = c2;
    initializeGame(); // Restart game with new markers and colors
}

function updateScoreboard() {
    player1ScoreSpan.innerHTML = `Player 1 (${player1Marker}): ${player1Wins}`;
    player2ScoreSpan.innerHTML = `Player 2 (${player2Marker}): ${player2Wins}`;
    drawsScoreSpan.innerHTML = `Draws: ${draws}`;
}

// --- Sound Effects Functions ---
function playPlaceSound() {
    if (placeSound) {
        placeSound.currentTime = 0; // Rewind to start
        placeSound.play().catch(e => console.error("Error playing place sound:", e));
    }
}

function playWinSound() {
    if (winSound) {
        winSound.currentTime = 0;
        winSound.play().catch(e => console.error("Error playing win sound:", e));
    }
}

function playDrawSound() {
    if (drawSound) {
        drawSound.currentTime = 0;
        drawSound.play().catch(e => console.error("Error playing draw sound:", e));
    }
}

// --- Confetti Animation ---
function triggerConfetti(color) {
    for (let i = 0; i < 50; i++) { // Generate 50 confetti pieces
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${-20 - Math.random() * 100}px`; // Start above screen
        confetti.style.backgroundColor = color || getRandomConfettiColor(); // Use player color or random
        confetti.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger animation
        confetti.style.setProperty('--x', `${(Math.random() - 0.5) * 500}px`); // Random X movement
        confetti.style.setProperty('--y', `${window.innerHeight + 100}px`); // Fall off screen
        confetti.style.setProperty('--rotation', `${Math.random() * 720}deg`); // Random rotation
        confettiContainer.appendChild(confetti);

        // Remove confetti after animation to prevent DOM bloat
        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    }
}

function getRandomConfettiColor() {
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
    return colors[Math.floor(Math.random() * colors.length)];
}


// --- Event Listeners ---
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartButton.addEventListener('click', initializeGame);
pvpModeButton.addEventListener('click', () => setGameMode(false));
pvcModeButton.addEventListener('click', () => setGameMode(true));
applyMarkersColorsButton.addEventListener('click', applyCustomMarkersColors);
difficultyEasyButton.addEventListener('click', () => setAIDifficulty('easy'));
difficultyMediumButton.addEventListener('click', () => setAIDifficulty('medium'));
difficultyHardButton.addEventListener('click', () => setAIDifficulty('hard'));

// Initial setup
setGameMode(false); // Start in Player vs Player mode
setAIDifficulty('easy'); // Default AI difficulty
initializeGame(); // Initial setup