'use strict';

/**
 * 自介网页 · 后端服务（零依赖，纯 Node.js 内置模块）
 * 功能：
 *   1. 静态文件托管（HTML/CSS/JS/图片/字体/声库 zip）
 *   2. GET  /api/gallery   —— 实时扫描 picture/ 文件夹，返回图片清单
 *   3. GET  /api/danmaku   —— 返回历史弹幕
 *   4. POST /api/danmaku   —— 提交一条弹幕并广播
 *   5. GET  /api/danmaku/stream —— SSE 实时推送新弹幕
 *
 * 启动：node server.js  （端口可用环境变量 PORT 覆盖，默认 3000）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const PICTURE_DIR = path.join(ROOT, 'picture');
const DATA_DIR = path.join(ROOT, 'data');
const DANMAKU_FILE = path.join(DATA_DIR, 'danmaku.json');
const MAX_DANMAKU = 500;
const MAX_TEXT_LEN = 120;

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.zip': 'application/zip',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

// ---- 弹幕存储（内存 + JSON 文件持久化） ----
let danmakuList = [];
function loadDanmaku() {
  try {
    if (fs.existsSync(DANMAKU_FILE)) {
      const raw = fs.readFileSync(DANMAKU_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) danmakuList = parsed;
    }
  } catch (e) {
    console.error('[danmaku] 读取失败，使用空列表：', e.message);
  }
}
function saveDanmaku() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DANMAKU_FILE, JSON.stringify(danmakuList, null, 2), 'utf8');
  } catch (e) {
    console.error('[danmaku] 写入失败：', e.message);
  }
}
loadDanmaku();

// ---- SSE 客户端 ----
const sseClients = new Set();
function broadcastDanmaku(item) {
  const payload = 'data: ' + JSON.stringify(item) + '\n\n';
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// ---- 画廊：实时扫描 picture/ ----
function listGallery() {
  let names = [];
  try {
    names = fs.readdirSync(PICTURE_DIR);
  } catch (e) {
    return [];
  }
  const images = names
    .filter((n) => IMAGE_EXTS.has(path.extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh', { numeric: true }))
    .map((n) => 'picture/' + n);
  return images;
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

// ---- 静态文件 ----
function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let filePath = path.normalize(path.join(ROOT, decoded));
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes',
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', () => res.end());
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = url.pathname;

  // 根路径 -> index.html
  if (pathname === '/') {
    serveStatic(req, res, '/index.html');
    return;
  }

  if (pathname === '/api/gallery') {
    json(res, 200, { images: listGallery() });
    return;
  }

  if (pathname === '/api/danmaku') {
    if (req.method === 'GET') {
      json(res, 200, { list: danmakuList.slice(-200) });
      return;
    }
    if (req.method === 'POST') {
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw || '{}');
        const text = String(body.text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_TEXT_LEN);
        if (!text) {
          json(res, 400, { ok: false, error: '内容不能为空' });
          return;
        }
        const item = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          text,
          color: typeof body.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(body.color) ? body.color : null,
          time: Date.now(),
        };
        danmakuList.push(item);
        if (danmakuList.length > MAX_DANMAKU) danmakuList = danmakuList.slice(-MAX_DANMAKU);
        saveDanmaku();
        broadcastDanmaku(item);
        json(res, 200, { ok: true, item });
        return;
      } catch (e) {
        json(res, 400, { ok: false, error: '格式错误' });
        return;
      }
    }
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  if (pathname === '/api/danmaku/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');
    sseClients.add(res);
    // 心跳，防止某些代理断开
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (e) { clearInterval(heartbeat); sseClients.delete(res); }
    }, 25000);
    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log('★ 自介网页服务已启动： http://' + (HOST === '0.0.0.0' ? '127.0.0.1' : HOST) + ':' + PORT);
  console.log('  画廊图片：', listGallery().length, '张');
});
