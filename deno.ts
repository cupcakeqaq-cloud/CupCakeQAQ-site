/**
 * 弹幕留言板后端 —— Deno Deploy（Deno KV 存储 + SSE 实时推送）
 * API 与原来的 server.js / worker.js 完全一致，前端无需改动：
 *   GET  /api/danmaku         拉取历史弹幕
 *   POST /api/danmaku         发送一条弹幕
 *   GET  /api/danmaku/stream  SSE 实时推送
 *
 * 部署：Deno Deploy 新建项目 -> 连接 GitHub 仓库 -> 入口文件填 deno.ts
 */

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const KEY = ["danmaku"];
const MAX_STORE = 500; // 最多保存条数
const MAX_TEXT = 120;  // 单条最长字符数

type Item = { id: string; text: string; color: string | null; time: number };

// Deno Deploy 上留空即使用默认 KV 数据库；本地开发可用 KV_PATH 指定存储文件
const kvPath = Deno.env.get("KV_PATH");
const kv = kvPath ? await Deno.openKv(kvPath) : await Deno.openKv();

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function loadList(): Promise<Item[]> {
  const res = await kv.get<Item[]>(KEY);
  return res.value ?? [];
}

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  // 拉取历史
  if (url.pathname === "/api/danmaku" && req.method === "GET") {
    const list = await loadList();
    return json({ list: list.slice(-200) });
  }

  // 发送一条
  if (url.pathname === "/api/danmaku" && req.method === "POST") {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }

    const text = String(body?.text ?? "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, MAX_TEXT);
    if (!text) return json({ ok: false, error: "内容不能为空" }, 400);

    const item: Item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text,
      color: (typeof body?.color === "string" && /^#[0-9a-fA-F]{3,8}$/.test(body.color as string))
        ? body.color as string
        : null,
      time: Date.now(),
    };

    const list = await loadList();
    list.push(item);
    await kv.set(KEY, list.slice(-MAX_STORE));
    return json({ ok: true, item });
  }

  // SSE 实时推送
  if (url.pathname === "/api/danmaku/stream") {
    const encoder = new TextEncoder();
    const seen = new Set<string>();
    let closed = false;

    const initial = await loadList();
    for (const it of initial) seen.add(it.id);

    const stream = new ReadableStream({
      async start(controller) {
        const send = (s: string) => {
          if (closed) return;
          try { controller.enqueue(encoder.encode(s)); } catch { closed = true; }
        };
        const pushNew = (list: Item[]) => {
          for (const it of list) {
            if (!seen.has(it.id)) {
              seen.add(it.id);
              send("data: " + JSON.stringify(it) + "\n\n");
            }
          }
        };

        send("retry: 3000\n\n");

        try {
          // 优先用 KV watch：只有内容变化时才唤醒，省额度
          for await (const [entry] of kv.watch([KEY])) {
            if (closed) break;
            pushNew((entry.value as Item[] | null) ?? []);
          }
        } catch {
          // watch 不可用时退化为轮询
          while (!closed) {
            await new Promise((r) => setTimeout(r, 3000));
            pushNew(await loadList());
          }
        }
      },
      cancel() { closed = true; },
    });

    return new Response(stream, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  return new Response("Danmaku backend is running.\nAPI: /api/danmaku", {
    headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
  });
});
