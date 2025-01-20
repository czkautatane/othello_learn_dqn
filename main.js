const { error, fatal } = require('./logger');
const { defaultTrainingConfig } = require('./config');
const { train } = require('./ai');

// エラーハンドリング
process.on('uncaughtException', (error) => {
    fatal(`未処理の例外: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    fatal(`未処理のPromise例外: ${error.message}`);
    process.exit(1);
});

process.on('SIGINT', () => {
    warn('中断シグナルを受信しました。チェックポイントを保存して終了します...');
    process.exitCode = 130;
});

// メイン処理
try {
    train(defaultTrainingConfig.episodes, defaultTrainingConfig)
        .catch(error => {
            error(`エラーが発生しました: ${error.message}`);
            process.exit(1);
        });
} catch (error) {
    error(`予期せぬエラーが発生しました: ${error.message}`);
    process.exit(1);
}
