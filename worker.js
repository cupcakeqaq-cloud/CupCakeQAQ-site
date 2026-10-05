/**
 * 弹幕留言板后端 —— Cloudflare Worker + Durable Object
 * 与原来的 server.js 保持完全相同的 API，前端无需改动：
 *   GET  /api/danmaku         拉取历史弹幕
 *   POST /api/danmaku         发送一条弹幕
 *   GET  /api/danmaku/stream  SSE 实时推送
 *
 * 所有弹幕请求都路由到同一个 Durable Object（单例），因此广播范围一致、天然支持实时。
 * 数据存在 Durable Object 的持久化存储里（免费额度含 5GB）。
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_STORE = 500;  // 最多保存多少条
const MAX_TEXT = 120;   // 单条最长字符数

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname.indexOf('/api/danmaku') === 0) {
      const id = env.DANMAKU_ROOM.idFromName('global');
      const stub = env.DANMAKU_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('Danmaku backend is running.\nAPI: /api/danmaku', {
      headers: Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, CORS),
    });
  },
};

export class DanmakuRoom {
  constructor(state, env) {
    this.state = state;
    this.clients = new Set(); // SSE 连接
    this.list = null;
    this.hb = null;
  }

  async load() {
    if (this.list === null) {
      this.list = (await this.state.storage.get('list')) || [];
    }
    return this.list;
  }

  async save() {
    if (this.list.length > MAX_STORE) this.list = this.list.slice(-MAX_STORE);
    await this.state.storage.put('list', this.list);
  }

  broadcast(item) {
    const chunk = new TextEncoder().encode('data: ' + JSON.stringify(item) + '\n\n');
    for (const c of Array.from(this.clients)) {
      try { c.enqueue(chunk); } catch (e) { this.clients.delete(c); }
    }
  }

  // 心跳，防止长连接被中间层掐断
  heartbeat() {
    if (this.hb || this.clients.size === 0) return;
    this.hb = setInterval(() => {
      if (this.clients.size === 0) { clearInterval(this.hb); this.hb = null; return; }
      const chunk = new TextEncoder().encode(': ping\n\n');
      for (const c of Array.from(this.clients)) {
        try { c.enqueue(chunk); } catch (e) { this.clients.delete(c); }
      }
    }, 25000);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/api/danmaku' && request.method === 'GET') {
      const list = await this.load();
      return json({ list: list.slice(-200) });
    }

    if (url.pathname === '/api/danmaku' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }
      const text = String(body.text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_TEXT);
      if (!text) return json({ ok: false, error: '内容不能为空' }, 400);

      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        text: text,
        color: (typeof body.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(body.color)) ? body.color : null,
        time: Date.now(),
      };

      await this.load();
      this.list.push(item);
      await this.save();
      this.broadcast(item);
      return json({ ok: true, item: item });
    }

    if (url.pathname === '/api/danmaku/stream') {
      await this.load();
      const self = this;
      const stream = new ReadableStream({
        start(controller) {
          self.clients.add(controller);
          controller.enqueue(new TextEncoder().encode('retry: 3000\n\n'));
          self.heartbeat();
        },
        cancel(controller) {
          self.clients.delete(controller);
        },
      });
      return new Response(stream, {
        headers: Object.assign({
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }, CORS),
      });
    }

    return json({ ok: false, error: 'not found' }, 404);
  }
}
