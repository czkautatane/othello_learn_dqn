const fs = require('fs');
const { info, debug, error, warn } = require('./logger');
const { paths } = require('./config');
const Board = require('./board');
const Player = require('./player');
const Game = require('./game');

class OthelloAI {
    constructor(config = {}) {
        this.epsilon = config.epsilon || 0.1;
        this.alpha = config.alpha || 0.1;
        this.gamma = config.gamma || 0.9;
        this.saveInterval = config.saveInterval || 1000;
        this.player1 = new Player('player1');
        this.player2 = new Player('player2');
        this.board = new Board();
        this.model = {
            player1: this.player1.model,
            player2: this.player2.model
        };
        this.stats = {
            episodes: [],
            convergence: [],
            averageScores: []
        };
        this.loadModel();
        this.loadStats();
    }

    initializeBoard() {
        return new Board();
    }

    getPredictedMove(board, player) {
        const state = board.getState();
        const availableMoves = board.getAvailableMoves();
        
        if (availableMoves.length === 0) {
            debug('利用可能な手がありません');
            return null;
        }

        if (Math.random() < this.epsilon) {
            debug('ランダムな手を選択（探索）');
            return this.getRandomMove(board);
        }

        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of availableMoves) {
            const value = player.getQValue(state, move) || 0;
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        if (!bestMove) {
            debug('最適な手が見つからないためランダムな手を選択');
            return this.getRandomMove(board);
        }

        debug(`最適な手を選択: ${bestMove} (Q値: ${bestValue.toFixed(4)})`);
        return bestMove;
    }

    getRandomMove(board) {
        const availableMoves = board.getAvailableMoves();
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    updateQValues(episode) {
        const scores = this.board.getScores();
        const reward1 = scores.player1 > scores.player2 ? 1 : (scores.player1 === scores.player2 ? 0 : -1);
        const reward2 = scores.player2 > scores.player1 ? 1 : (scores.player1 === scores.player2 ? 0 : -1);

        this.player1.updateQValue(
            this.player1.lastState,
            this.player1.lastAction,
            reward1,
            this.player1.currentState,
            this.board
        );

        this.player2.updateQValue(
            this.player2.lastState,
            this.player2.lastAction,
            reward2,
            this.player2.currentState,
            this.board
        );

        if (episode % this.saveInterval === 0) {
            this.saveModel();
            this.saveStats();
            info(`エピソード ${episode} の統計: スコア - Player1: ${scores.player1}, Player2: ${scores.player2}`);
        }
    }

    loadModel() {
        try {
            if (fs.existsSync(paths.modelFile)) {
                const data = fs.readFileSync(paths.modelFile, 'utf-8');
                const loadedModel = JSON.parse(data);
                if (loadedModel.player1) {
                    this.player1.model = loadedModel.player1;
                }
                if (loadedModel.player2) {
                    this.player2.model = loadedModel.player2;
                }
                this.model = {
                    player1: this.player1.model,
                    player2: this.player2.model
                };
                info('既存のモデルを読み込みました');
            } else {
                info('新しいモデルを初期化します');
            }
        } catch (error) {
            error(`モデルの読み込みエラー: ${error}`);
        }
    }

    saveModel() {
        try {
            const modelToSave = {
                player1: this.player1.model,
                player2: this.player2.model
            };
            const data = JSON.stringify(modelToSave, null, 2);
            fs.writeFileSync(paths.modelFile, data, 'utf-8');
            info('モデルを保存しました');
        } catch (error) {
            error(`モデルの保存エラー: ${error}`);
        }
    }

    loadStats() {
        try {
            if (fs.existsSync(paths.statsFile)) {
                const data = fs.readFileSync(paths.statsFile, 'utf-8');
                this.stats = JSON.parse(data);
                info('既存の統計データを読み込みました');
            } else {
                info('新しい統計データを初期化します');
            }
        } catch (error) {
            error(`統計データの読み込みエラー: ${error}`);
        }
    }

    saveStats() {
        try {
            const data = JSON.stringify(this.stats, null, 2);
            fs.writeFileSync(paths.statsFile, data, 'utf-8');
            info('統計データを保存しました');
        } catch (error) {
            error(`統計データの保存エラー: ${error}`);
        }
    }

    saveCheckpoint(episode, config) {
        try {
            const checkpoint = {
                episode,
                epsilon: this.epsilon,
                config,
                timestamp: new Date().toISOString()
            };
            fs.writeFileSync(paths.checkpointFile, JSON.stringify(checkpoint, null, 2));
            info(`チェックポイントを保存しました: エピソード ${episode}`);
        } catch (error) {
            error(`チェックポイントの保存エラー: ${error}`);
        }
    }

    loadCheckpoint() {
        try {
            if (fs.existsSync(paths.checkpointFile)) {
                const data = fs.readFileSync(paths.checkpointFile, 'utf-8');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            error(`チェックポイントの読み込みエラー: ${error}`);
            return null;
        }
    }
}

async function train(episodes = 1, config = {}, startFromCheckpoint = true) {
    const ai = new OthelloAI({
        ...config,
        epsilon: config.initialEpsilon || 0.3
    });

    let startEpisode = 1;
    if (startFromCheckpoint) {
        const checkpoint = ai.loadCheckpoint();
        if (checkpoint) {
            startEpisode = checkpoint.episode + 1;
            ai.epsilon = checkpoint.epsilon;
            info(`チェックポイントから再開: エピソード ${startEpisode}, ε: ${ai.epsilon}`);
        }
    }

    info(`${episodes}エピソードのトレーニングを開始します...`);

    for (let episode = startEpisode; episode <= episodes; episode++) {
        debug(`\nエピソード ${episode} 開始`);
        const game = new Game(ai.player1, ai.player2, ai.board);
        game.board.printBoard();
        
        while (!game.isGameOver() && !game.hasReachedTurnLimit()) {
            const currentState = game.board.getState();
            const availableMoves = game.board.getAvailableMoves();
            debug(`利用可能な手: ${availableMoves.join(', ')}`);
            
            if (availableMoves.length > 0) {
                const move = ai.getPredictedMove(game.board, game.currentPlayer);
                if (move) {
                    game.currentPlayer.lastState = currentState;
                    game.currentPlayer.lastAction = move;
                    game.playMove(move);
                    game.currentPlayer.currentState = game.board.getState();
                } else {
                    warn(`${game.currentPlayer.name}が有効な手を見つけられませんでした`);
                }
            } else {
                warn(`${game.currentPlayer.name}の手番をスキップします`);
            }
            
            game.switchPlayer();
            
            if (game.hasReachedTurnLimit()) {
                warn("ターン制限に達しました");
                break; // ゲームループを終了
            }
        }

        ai.updateQValues(episode);
        const finalScores = ai.board.getScores();
        info(`最終スコア - Player1: ${finalScores.player1}, Player2: ${finalScores.player2}`);
        ai.epsilon *= config.epsilonDecay;
        debug(`εを更新: ${ai.epsilon.toFixed(4)}`);
        ai.board = ai.initializeBoard();

        if (episode % 100 === 0) {
            const progress = (episode / episodes * 100).toFixed(1);
            info(`学習進捗: ${progress}%, ε: ${ai.epsilon.toFixed(4)}`);
        }

        if (episode % config.saveInterval === 0) {
            ai.saveCheckpoint(episode, config);
        }

        if (process.exitCode === 130) {
            warn('トレーニングを中断します...');
            ai.saveCheckpoint(episode, config);
            return ai;
        }
    }
    
    info('トレーニング完了');
    return ai;
}

module.exports = {
    OthelloAI,
    train
};
