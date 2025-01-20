const fs = require('fs');

// ログレベルの定義
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
};

// 現在のログレベル（INFO以上を出力）
let currentLogLevel = LogLevel.ERROR;

const LOG_FILE = 'game.log';

// ログ出力関数
const log = (level, message) => {
    if (level >= currentLogLevel) {
        const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
        const logMessage = `${new Date().toISOString()} [${levelName}] - ${message}\n`;
        
        try {
            // ファイルには全てのログを書き込む
            fs.appendFileSync(LOG_FILE, logMessage);
            
            // コンソールには設定されたレベル以上のログを出力
            if (level >= currentLogLevel) {
                const output = level >= LogLevel.ERROR ? process.stderr : process.stdout;
                output.write(logMessage);
            }
        } catch (error) {
            process.stderr.write(`致命的なエラー: ${error.message}\n`);
            process.exit(1);
        }
    }
};

// 各ログレベルのヘルパー関数
const debug = (message) => log(LogLevel.DEBUG, message);
const info = (message) => log(LogLevel.INFO, message);
const warn = (message) => log(LogLevel.WARN, message);
const error = (message) => log(LogLevel.ERROR, message);
const fatal = (message) => log(LogLevel.FATAL, message);

// ログレベルを設定する関数
const setLogLevel = (level) => {
    if (level in LogLevel) {
        currentLogLevel = LogLevel[level];
        info(`ログレベルを ${level} に設定しました`);
    }
};

// 開始時にログファイルをクリア
fs.writeFileSync(LOG_FILE, '');

// 初期ログレベルをINFOに設定
setLogLevel('INFO');

module.exports = {
    LogLevel,
    debug,
    info,
    warn,
    error,
    fatal,
    setLogLevel
};
