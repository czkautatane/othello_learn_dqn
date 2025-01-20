class Board {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.currentPlayer = 1; // 1: 黒, 2: 白
        this.initialize();
    }

    initialize() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(0));
        this.board[3][3] = 2;
        this.board[3][4] = 1;
        this.board[4][3] = 1;
        this.board[4][4] = 2;
        this.currentPlayer = 1;
    }

    getState() {
        return this.board.map(row => row.join('')).join('');
    }

    getScores() {
        let black = 0, white = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === 1) black++;
                else if (this.board[i][j] === 2) white++;
            }
        }
        return { black, white };
    }

    isValidMove(row, col, player) {
        if (this.board[row][col] !== 0) return false;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            let x = row + dx, y = col + dy;
            let hasOpponent = false;
            
            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (this.board[x][y] === 0) break;
                if (this.board[x][y] === player) {
                    if (hasOpponent) return true;
                    break;
                }
                hasOpponent = true;
                x += dx;
                y += dy;
            }
        }
        return false;
    }

    makeMove(move) {
        const row = parseInt(move.slice(1)) - 1;
        const col = move.charCodeAt(0) - 65;
        const player = this.currentPlayer;

        if (!this.isValidMove(row, col, player)) return false;

        this.board[row][col] = player;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const flippedStones = [];
        for (const [dx, dy] of directions) {
            let x = row + dx, y = col + dy;
            let toFlip = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (this.board[x][y] === 0) break;
                if (this.board[x][y] === player) {
                    for (const [fx, fy] of toFlip) {
                        this.board[fx][fy] = player;
                        flippedStones.push([fx, fy]);
                    }
                    break;
                }
                toFlip.push([x, y]);
                x += dx;
                y += dy;
            }
        }

        this.currentPlayer = 3 - player;
        return { success: true, flippedStones };
    }

    getAvailableMoves() {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(i, j, this.currentPlayer)) {
                    moves.push(`${String.fromCharCode(65 + j)}${i + 1}`);
                }
            }
        }
        return moves;
    }
}

// HTMLコンソール出力用のユーティリティ
function logToConsole(message) {
    const consoleElement = document.getElementById('console-log');
    if (consoleElement) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        consoleElement.appendChild(entry);
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
    console.log(message);
}

class OthelloAI {
    constructor() {
        this.modelFilePath = 'http://localhost:3000/model.json';
        this.model = null;
    }

    async loadModel() {
        try {
            const response = await fetch(this.modelFilePath);
            if (!response.ok) throw new Error('モデルの読み込みに失敗しました');
            this.model = await response.json();
            logToConsole('AIモデルを読み込みました');
        } catch (error) {
            logToConsole('モデルの読み込みに失敗しました。ランダムな手を使用します: ' + error.message);
            this.model = null;
        }
    }

    getPredictedMove(board) {
        const state = board.getState();
        const availableMoves = board.getAvailableMoves();
        
        if (availableMoves.length === 0) {
            return null;
        }

        // AIは常にプレイヤーと反対の色を使用
        const playerModel = this.model ? this.model[board.currentPlayer === 1 ? 'player1' : 'player2'] : null;
        if (!playerModel || !playerModel.qValues || !playerModel.qValues[state]) {
            return this.getRandomMove(availableMoves);
        }

        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of availableMoves) {
            const value = playerModel.qValues[state][move] || 0;
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return bestMove || this.getRandomMove(availableMoves);
    }

    getRandomMove(availableMoves) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
}

class Game {
    constructor() {
        this.board = new Board();
        this.ai = new OthelloAI();
        this.gameBoard = document.getElementById('gameBoard');
        this.status = document.getElementById('status');
        this.score = document.getElementById('score');
        this.gameEndDialog = document.getElementById('gameEndDialog');
        this.finalScore = document.getElementById('finalScore');
        this.playerColor = null;
        this.isGameOver = false;

        this.initializeBoard();
        this.initializeEventListeners();
    }

    async initialize() {
        await this.ai.loadModel();
        this.enablePlayerSelection();
    }

    initializeBoard() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.gameBoard.appendChild(cell);
            }
        }
        this.updateBoard();
    }

    initializeEventListeners() {
        this.gameBoard.addEventListener('click', (e) => {
            if (this.isGameOver || !this.playerColor) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.handlePlayerMove(row, col);
        });

        document.getElementById('selectBlack').addEventListener('click', () => this.startGame(1));
        document.getElementById('selectWhite').addEventListener('click', () => this.startGame(2));
        document.getElementById('playAgainBlack').addEventListener('click', () => {
            this.gameEndDialog.classList.add('hidden');
            this.startGame(1);
        });
        document.getElementById('playAgainWhite').addEventListener('click', () => {
            this.gameEndDialog.classList.add('hidden');
            this.startGame(2);
        });
        document.getElementById('endGame').addEventListener('click', () => {
            window.close();
        });
    }

    enablePlayerSelection() {
        document.getElementById('selectBlack').disabled = false;
        document.getElementById('selectWhite').disabled = false;
    }

    startGame(playerColor) {
        this.playerColor = playerColor;
        this.isGameOver = false;
        this.board.initialize();
        this.initializeBoard();
        document.getElementById('selectBlack').disabled = true;
        document.getElementById('selectWhite').disabled = true;

        // プレイヤーが白を選択した場合のみ、AIが最初に黒として打つ
        if (playerColor === 2) {
            this.status.textContent = 'AIの思考中...';
            this.makeAIMove();
        } else {
            this.status.textContent = 'あなたの番です';
            this.updateBoard();
        }
    }

    async handlePlayerMove(row, col) {

        const move = `${String.fromCharCode(65 + col)}${row + 1}`;
        const validMoves = this.board.getAvailableMoves();
        
        if (!validMoves.includes(move)) return;

        const result = this.board.makeMove(move);
        if (result.success) {
            await this.animateMove(row, col, result.flippedStones);
            this.updateBoard();
            this.checkGameState();
            
            if (!this.isGameOver) {
                this.makeAIMove();
            }
        }
    }

    async makeAIMove() {
        this.status.textContent = 'AIの思考中...';
        await new Promise(resolve => setTimeout(resolve, 1000));

        // AIの手番を確実にプレイヤーと反対の色にする
        if (this.board.currentPlayer === this.playerColor) {
            this.board.currentPlayer = 3 - this.playerColor;
        }
        
        const move = this.ai.getPredictedMove(this.board);
        if (move) {
            const row = parseInt(move.slice(1)) - 1;
            const col = move.charCodeAt(0) - 65;
            const result = this.board.makeMove(move);
            
            if (result.success) {
                await this.animateMove(row, col, result.flippedStones);
                this.updateBoard();
                this.checkGameState();
            }
        }

        if (!this.isGameOver) {
            const validMoves = this.board.getAvailableMoves();
            if (validMoves.length === 0) {
                this.board.currentPlayer = 3 - this.board.currentPlayer;
                this.updateBoard();
                this.checkGameState();
            }
        }
    }

    async animateMove(row, col, flippedStones) {
        const cell = this.gameBoard.children[row * 8 + col];
        const stone = document.createElement('div');
        stone.className = `stone ${this.board.board[row][col] === 1 ? 'black' : 'white'}`;
        cell.appendChild(stone);

        for (const [fx, fy] of flippedStones) {
            const flippedCell = this.gameBoard.children[fx * 8 + fy];
            const flippedStone = flippedCell.querySelector('.stone');
            if (flippedStone) {
                flippedStone.classList.add('flipping');
                await new Promise(resolve => setTimeout(resolve, 100));
                flippedStone.className = `stone ${this.board.board[fx][fy] === 1 ? 'black' : 'white'}`;
                flippedStone.classList.remove('flipping');
            }
        }
    }

    updateBoard() {
        const cells = this.gameBoard.children;
        const validMoves = this.board.currentPlayer === this.playerColor ? 
            this.board.getAvailableMoves() : [];

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = cells[i * 8 + j];
                const value = this.board.board[i][j];
                
                cell.innerHTML = '';
                cell.classList.remove('valid-move');

                if (value !== 0) {
                    const stone = document.createElement('div');
                    stone.className = `stone ${value === 1 ? 'black' : 'white'}`;
                    cell.appendChild(stone);
                }

                const move = `${String.fromCharCode(65 + j)}${i + 1}`;
                if (validMoves.includes(move)) {
                    cell.classList.add('valid-move');
                }
            }
        }

        const scores = this.board.getScores();
        this.score.textContent = `黒: ${scores.black} - 白: ${scores.white}`;
        
        if (!this.isGameOver) {
            this.status.textContent = this.board.currentPlayer === this.playerColor ? 
                'あなたの番です' : 'AIの思考中...';
        }
    }

    checkGameState() {
        let playerCanMove = false;
        let aiCanMove = false;

        this.board.currentPlayer = this.playerColor;
        playerCanMove = this.board.getAvailableMoves().length > 0;

        this.board.currentPlayer = 3 - this.playerColor;
        aiCanMove = this.board.getAvailableMoves().length > 0;

        this.board.currentPlayer = playerCanMove ? this.playerColor : (aiCanMove ? 3 - this.playerColor : this.board.currentPlayer);

        if (!playerCanMove && !aiCanMove) {
            this.endGame();
        }
    }

    endGame() {
        this.isGameOver = true;
        const scores = this.board.getScores();
        let result;
        
        if ((this.playerColor === 1 && scores.black > scores.white) ||
            (this.playerColor === 2 && scores.white > scores.black)) {
            result = '勝ち';
        } else if (scores.black === scores.white) {
            result = '引き分け';
        } else {
            result = '負け';
        }

        this.status.textContent = 'ゲーム終了';
        this.finalScore.textContent = `最終スコア - 黒: ${scores.black} 白: ${scores.white} (${result})`;
        this.gameEndDialog.classList.remove('hidden');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initialize().catch(error => {
            logToConsole('AIモデルの読み込みに失敗しました。ランダムな手を使用します: ' + error.message);
    });
});
