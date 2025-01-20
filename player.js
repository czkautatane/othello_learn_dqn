const { info, debug } = require('./logger');

class Player {
    constructor(name, config = {}) {
        this.name = name;
        this.alpha = config.alpha || 0.1;
        this.gamma = config.gamma || 0.9;
        this.lastState = null;
        this.lastAction = null;
        this.currentState = null;
        this.model = {
            qValues: {}
        };
        info(`プレイヤー ${name} を初期化しました`);
    }

    updateQValue(lastState, lastAction, reward, currentState, board) {
        if (!this.model.qValues) {
            this.model.qValues = {};
        }
        if (!this.model.qValues[lastState]) {
            this.model.qValues[lastState] = {};
        }
        if (this.model.qValues[lastState][lastAction] === undefined) {
            this.model.qValues[lastState][lastAction] = 0;
        }

        const currentQ = this.model.qValues[lastState][lastAction];
        const maxQ = this.getMaxQValue(currentState, board);

        this.model.qValues[lastState][lastAction] = 
            currentQ + this.alpha * (reward + this.gamma * maxQ - currentQ);
        
        debug(`Q値を更新: 状態=${lastState}, 行動=${lastAction}, 報酬=${reward}, ` +
              `新Q値=${this.model.qValues[lastState][lastAction]}`);
    }

    getMaxQValue(state, board) {
        const availableMoves = board.getAvailableMoves();
        if (availableMoves.length === 0) return 0;

        let maxQ = -Infinity;
        availableMoves.forEach(action => {
            if (this.model.qValues && 
                this.model.qValues[state] && 
                this.model.qValues[state][action] !== undefined) {
                if (this.model.qValues[state][action] > maxQ) {
                    maxQ = this.model.qValues[state][action];
                }
            } else {
                maxQ = Math.max(maxQ, 0);
            }
        });

        return maxQ === -Infinity ? 0 : maxQ;
    }

    getQValue(state, action) {
        if (this.model.qValues && 
            this.model.qValues[state] && 
            this.model.qValues[state][action] !== undefined) {
            return this.model.qValues[state][action];
        }
        return 0;
    }
}

module.exports = Player;
