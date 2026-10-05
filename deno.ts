/**
 * 弹幕留言板后端 —— Deno Deploy（Deno KV 存储 + SSE 实时推送）
 * API 与原来的 server.js / worker.js 完全一致，前端无需改动：
 *   GET  /api/danmaku         拉取历史弹幕
 *   POST /api/danmaku         发送一条弹幕
 *   GET  /api/danmaku/stream  SSE 实时推送
 *
 * 说明：Deno KV 需要先在 Deno Deploy 控制台「创建数据库并分配给本应用」。
 *      未分配时不会崩溃，会自动退回内存存储（可正常收发，但重启后历史会丢）。
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

// ---------- KV 安全打开（拿不到就退回内存） ----------
let kvPromise: Promise<Deno.Kv | null> | null = null;
let memList: Item[] = [];

function openKvSafe(): Promise<Deno.Kv | null> {
  if (!kvPromise) {
    kvPromise = (async () => {
      try {
        const kvPath = Deno.env.get("KV_PATH");
        return kvPath ? await Deno.openKv(kvPath) : await Deno.openKv();
      } catch (e) {
        console.error(
          "[danmaku] Deno KV 不可用，改用内存存储：",
          e instanceof Error ? e.message : String(e),
        );
        return null;
      }
    })();
  }
  return kvPromise;
}

async function loadList(): Promise<Item[]> {
  const kv = await openKvSafe();
  if (!kv) return memList;
  try {
    const res = await kv.get<Item[]>(KEY);
    return res.value ?? [];
  } catch {
    return memList;
  }
}

async function saveList(list: Item[]): Promise<void> {
  memList = list;
  const kv = await openKvSafe();
  if (!kv) return;
  try {
    await kv.set(KEY, list);
  } catch {
    /* 写入失败时至少内存里还在 */
  }
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
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
    await saveList(list.slice(-MAX_STORE));
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

        // 优先用 KV watch：只有内容变化时才唤醒，省额度
        const kv = await openKvSafe();
        if (kv) {
          try {
            for await (const [entry] of kv.watch([KEY])) {
              if (closed) return;
              pushNew((entry.value as Item[] | null) ?? []);
            }
            return;
          } catch (e) {
            console.error(
              "[danmaku] kv.watch 失败，改用轮询：",
              e instanceof Error ? e.message : String(e),
            );
          }
        }

        // 兜底：轮询
        while (!closed) {
          await new Promise((r) => setTimeout(r, 2500));
          if (closed) break;
          pushNew(await loadList());
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
