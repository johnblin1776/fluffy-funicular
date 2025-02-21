// Game state
const board = Array(15).fill().map(() => Array(15).fill(''));
const tileBag = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUUUVVWWXYYZ'.split('');
const players = [
    { rack: [], score: 0, placedTiles: [] },
    { rack: [], score: 0, placedTiles: [] }
];
let currentPlayer = 0;
let dictionary = []; // Will be populated from external file

// Letter values (Scrabble scoring)
const letterValues = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10
};

// Fetch dictionary from external file
async function loadDictionary() {
    try {
        const response = await fetch('words.txt');
        const text = await response.text();
        dictionary = text.split('\n').map(word => word.trim().toUpperCase()).filter(word => word.length > 0);
        console.log(`Loaded ${dictionary.length} words into dictionary`);
    } catch (error) {
        console.error('Error loading dictionary:', error);
        setMessage('Failed to load dictionary. Using fallback list.');
        dictionary = ['CAT', 'DOG', 'BAT', 'RAT', 'HAT', 'MAT', 'FROG', 'TOAD', 'PLAY', 'GAME']; // Fallback
    }
}

// Initialize board
function initBoard() {
    const gameBoard = document.getElementById('game-board');
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            gameBoard.appendChild(cell);
        }
    }
}

// Draw tiles for a player
function drawTiles(player) {
    while (player.rack.length < 7 && tileBag.length > 0) {
        const tile = tileBag.splice(Math.floor(Math.random() * tileBag.length), 1)[0];
        player.rack.push(tile);
    }
    updateRack();
}

// Update rack display
function updateRack() {
    const rack = document.getElementById('player-rack');
    rack.innerHTML = '';
    players[currentPlayer].rack.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        tileDiv.textContent = tile;
        tileDiv.draggable = true;
        tileDiv.addEventListener('dragstart', dragStart);
        rack.appendChild(tileDiv);
    });
}

// Drag and drop logic
function dragStart(e) {
    e.dataTransfer.setData('text', e.target.textContent);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadDictionary(); // Load dictionary first
    initBoard();
    drawTiles(players[0]);
    drawTiles(players[1]);
    updateRack();

    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('drop', e => {
            const letter = e.dataTransfer.getData('text');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (!board[row][col]) {
                board[row][col] = letter;
                cell.textContent = letter;
                players[currentPlayer].rack.splice(players[currentPlayer].rack.indexOf(letter), 1);
                players[currentPlayer].placedTiles.push({ letter, row, col });
                updateRack();
            }
        });
    });

    document.getElementById('submit-btn').addEventListener('click', submitWord);
});

// Submit word
function submitWord() {
    const placed = players[currentPlayer].placedTiles;
    if (placed.length === 0) {
        setMessage('No tiles placed!');
        return;
    }

    // Determine direction and word
    const rows = placed.map(t => t.row).sort();
    const cols = placed.map(t => t.col).sort();
    let word = '';
    let score = 0;

    if (rows[0] === rows[rows.length - 1]) { // Horizontal
        const row = rows[0];
        const startCol = cols[0];
        const endCol = cols[cols.length - 1];
        for (let col = startCol; col <= endCol; col++) {
            if (board[row][col]) {
                word += board[row][col];
                score += letterValues[board[row][col]];
            } else {
                setMessage('Invalid: Gaps in word!');
                return;
            }
        }
    } else if (cols[0] === cols[cols.length - 1]) { // Vertical
        const col = cols[0];
        const startRow = rows[0];
        const endRow = rows[rows.length - 1];
        for (let row = startRow; row <= endRow; row++) {
            if (board[row][col]) {
                word += board[row][col];
                score += letterValues[board[row][col]];
            } else {
                setMessage('Invalid: Gaps in word!');
                return;
            }
        }
    } else {
        setMessage('Invalid: Tiles must be in a straight line!');
        return;
    }

    // Validate word
    if (dictionary.includes(word)) {
        players[currentPlayer].score += score;
        updateScores();
        setMessage(`Valid word "${word}"! +${score} points`);
        players[currentPlayer].placedTiles = [];
        drawTiles(players[currentPlayer]);
        switchTurn();
        checkGameOver();
    } else {
        setMessage(`"${word}" is not a valid word!`);
    }
}

// Update scores display
function updateScores() {
    document.getElementById('p1-score').textContent = players[0].score;
    document.getElementById('p2-score').textContent = players[1].score;
}

// Switch turns
function switchTurn() {
    currentPlayer = 1 - currentPlayer;
    document.getElementById('turn').textContent = `Player ${currentPlayer + 1}'s Turn`;
    updateRack();
}

// Display messages
function setMessage(msg) {
    document.getElementById('message').textContent = msg;
}

// Check if game is over
function checkGameOver() {
    if (tileBag.length === 0 && (players[0].rack.length === 0 || players[1].rack.length === 0)) {
        const winner = players[0].score > players[1].score ? 'Player 1' : 'Player 2';
        setMessage(`Game Over! ${winner} wins with ${Math.max(players[0].score, players[1].score)} points!`);
        document.getElementById('submit-btn').disabled = true;
    }
}
