const { info, debug, warn } = require('./logger');
const { gameConfig } = require('./config');

class Game {
    constructor(player1, player2, board) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = board;
        this.currentPlayer = player1;
        this.moveCount = 0;
        this.gameEnded = false;
        info('新しいゲームを開始します');
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        debug(`プレイヤーを切り替え: ${this.currentPlayer.name}`);
        
        let passCount = 0;
        while (this.board.getAvailableMoves().length === 0 && !this.gameEnded) {
            warn(`${this.currentPlayer.name}はパスします`);
            this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
            passCount++;
            
            if (passCount >= 2) {
                info("両プレイヤーがパスしたためゲーム終了");
                this.gameEnded = true;
                return;
            }
        }
    }

    playMove(move) {
        this.moveCount++;
        debug(`\n==================`);
        debug(`ターン ${this.moveCount}`);
        debug(`現在のプレイヤー: ${this.currentPlayer.name}`);
        
        if (move === null || !this.board.getAvailableMoves().length) {
            warn(`${this.currentPlayer.name}が手を打てません`);
            if (this.isGameOver()) {
                info("ゲーム終了");
                return;
            }
            this.switchPlayer();
            return;
        }

        debug(`選択された手: ${move}`);
        if (this.board.makeMove(move)) {
            this.board.printBoard();
            const scores = this.board.getScores();
            //info(`スコア - Player1: ${scores.player1}, Player2: ${scores.player2}`);
            this.switchPlayer();
        } else {
            warn(`無効な手が選択されました: ${move}`);
        }
        debug(`==================`);
    }

    isGameOver() {
        if (this.gameEnded) return true;
        
        const originalPlayer = this.board.currentPlayer;
        const { players } = gameConfig;
        
        // 黒の手番で確認
        this.board.currentPlayer = players.black;
        const blackMoves = this.board.getAvailableMoves();
        
        // 白の手番で確認
        this.board.currentPlayer = players.white;
        const whiteMoves = this.board.getAvailableMoves();
        
        // プレイヤーを元に戻す
        this.board.currentPlayer = originalPlayer;
        
        const isOver = blackMoves.length === 0 && whiteMoves.length === 0;
        if (isOver) {
            this.gameEnded = true;
            info("ゲーム終了条件を満たしました");
            const scores = this.board.getScores();
            info(`最終スコア - Player1: ${scores.player1}, Player2: ${scores.player2}`);
        }
        return isOver;
    }

    hasReachedTurnLimit() {
        return this.moveCount >= gameConfig.maxTurns;
    }
}

module.exports = Game;
