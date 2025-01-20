const { debug } = require('./logger');
const { gameConfig } = require('./config');

class Board {
    constructor() {
        const { boardSize, players } = gameConfig;
        this.board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(players.empty));
        this.currentPlayer = players.black;
        this.initialize();
        debug('新しいボードを初期化しました');
    }

    initialize() {
        const { boardSize, players } = gameConfig;
        const mid = boardSize / 2;
        
        this.board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(players.empty));
        this.board[mid - 1][mid - 1] = players.white;
        this.board[mid - 1][mid] = players.black;
        this.board[mid][mid - 1] = players.black;
        this.board[mid][mid] = players.white;
        this.currentPlayer = players.black;
        debug('ボードを初期配置にリセットしました');
    }

    getState() {
        return this.board.map(row => row.join('')).join('');
    }

    getScores() {
        const { players } = gameConfig;
        let black = 0, white = 0;
        
        for (let row of this.board) {
            for (let cell of row) {
                if (cell === players.black) black++;
                else if (cell === players.white) white++;
            }
        }
        
        return { player1: black, player2: white };
    }

    isValidMove(row, col, player) {
        const { boardSize, players } = gameConfig;
        if (this.board[row][col] !== players.empty) return false;

        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            let x = row + dx, y = col + dy;
            let hasOpponent = false;
            
            while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
                if (this.board[x][y] === players.empty) break;
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
        const { players } = gameConfig;

        if (!this.isValidMove(row, col, player)) {
            debug(`無効な手です: ${move}`);
            return false;
        }

        this.board[row][col] = player;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dx, dy] of directions) {
            let x = row + dx, y = col + dy;
            let toFlip = [];

            while (x >= 0 && x < gameConfig.boardSize && y >= 0 && y < gameConfig.boardSize) {
                if (this.board[x][y] === players.empty) break;
                if (this.board[x][y] === player) {
                    for (const [fx, fy] of toFlip) {
                        this.board[fx][fy] = player;
                    }
                    break;
                }
                toFlip.push([x, y]);
                x += dx;
                y += dy;
            }
        }

        this.currentPlayer = this.currentPlayer === players.black ? players.white : players.black;
        debug(`手 ${move} を実行しました（プレイヤー ${player}）`);
        return true;
    }

    getAvailableMoves() {
        const { boardSize } = gameConfig;
        const moves = [];
        
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (this.isValidMove(i, j, this.currentPlayer)) {
                    moves.push(`${String.fromCharCode(65 + j)}${i + 1}`);
                }
            }
        }
        return moves;
    }

    printBoard() {
        const { players } = gameConfig;
        debug('  A B C D E F G H');
        
        for (let i = 0; i < gameConfig.boardSize; i++) {
            let row = `${i + 1} `;
            for (let j = 0; j < gameConfig.boardSize; j++) {
                if (this.board[i][j] === players.empty) row += '. ';
                else if (this.board[i][j] === players.black) row += '● ';
                else row += '○ ';
            }
            debug(row);
        }
        debug('');
    }
}

module.exports = Board;
