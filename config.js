const defaultAIConfig = {
    epsilon: 0.1,
    alpha: 0.1,
    gamma: 0.9,
    saveInterval: 1000,
    initialEpsilon: 0.3,
    epsilonDecay: 0.9999
};

const defaultTrainingConfig = {
    episodes: 100000,
    initialEpsilon: 0.3,
    epsilonDecay: 0.9999,
    alpha: 0.1,
    gamma: 0.95,
    saveInterval: 100,
    startFromCheckpoint: true
};

const paths = {
    modelFile: 'model.json',
    statsFile: 'training_stats.json',
    checkpointFile: 'training_checkpoint.json',
    logFile: 'game.log'
};

const gameConfig = {
    boardSize: 8,
    maxTurns: 100,
    players: {
        empty: 0,
        black: 1,
        white: 2
    }
};

module.exports = {
    defaultAIConfig,
    defaultTrainingConfig,
    paths,
    gameConfig
};
