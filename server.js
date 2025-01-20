const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // URLに基づいてファイルパスを決定
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // ファイルの拡張子を取得
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // MIMEタイプのマッピング
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif'
    };

    // MIMEタイプを設定
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // ファイルを読み込んでレスポンスとして返す
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
