# 交接文档 · 12あKa@被告人杯糕_ 自介网页

> 给接手的 AI / 协作者：读完这份就能无缝接手。项目已上线，**核心功能全部完成**，剩余的是一个被搁置的可选后端。

---

## 一、项目概览

| 项目 | 内容 |
|---|---|
| 本地目录 | `E:\自介网页` |
| 仓库 | `https://github.com/cupcakeqaq-cloud/CupCakeQAQ-site` |
| 线上地址 | `https://cupcakeqaq-cloud.github.io/CupCakeQAQ-site/` |
| 托管 | GitHub Pages（`main` 分支 / root） |
| 技术栈 | 纯静态：原生 HTML + CSS + 原生 JS（无框架、无构建、无依赖） |
| 主题 | 千禧年个人博客 / Windows XP / cutecore / 废萌 |
| 站主 | 自由插画师，CN「12あKa@被告人杯糕_」 |

**关键前提：整站是纯静态的**，所有资源走相对路径，放在 Pages 子路径下也能跑。唯一缺失的能力是「弹幕跨访客实时互通」（需后端，见第八节）。

---

## 二、目录结构

```
E:\自介网页
├─ index.html            页面结构（243 行）
├─ css/style.css         全部样式（790 行，含 CSS 变量与响应式）
├─ js/
│  ├─ i18n.js      195 行  三语字典 + 下拉切换
│  ├─ gallery.js    67 行  画廊渲染 + 灯箱
│  ├─ danmaku.js   188 行  留言板（循环播放 / 发送 / SSE）
│  ├─ easteregg.js 243 行  玩具鸭 + 30 连击故障彩蛋
│  ├─ starfield.js  40 行  背景星星字符画
│  ├─ apps.js      226 行  开始菜单 + 4 个 XP 小应用
│  ├─ main.js       23 行  任务栏时钟 + 访客计数器
│  └─ config.js      8 行  留言板后端地址（当前留空）
├─ gallery.js            画廊内嵌清单（自动生成，勿手改）
├─ gallery.json          画廊 JSON 清单（备用）
├─ refresh-gallery.cjs   一键刷新画廊清单
├─ server.js            本地预览服务器（可选，含弹幕接口）
├─ package.json
├─ assets/
│  ├─ fonts/            像素字体 3 个 woff2（Fusion Pixel Font，OFL）
│  ├─ background/       windows.jpg（大背景）、cute.jpg（自介头图）
│  ├─ icon/             5 个外链图标（mihuashi / gmail / bilibili / x / marshmallow）
│  ├─ stickers/anime/   5 张装饰 GIF
│  └─ star.txt          盲文星星字符画（29 行）
├─ picture/             14 张画作（画廊数据源）
├─ Easter egg/          1.png / 2.png / 音效.wav（音效.mp3 为原始备份）
├─ voice dl/            ゴースト_A.zip、林屿.zip（UTAU 声库，约 126MB）
├─ icon.png             头像
├─ .nojekyll            禁用 Jekyll（Pages 必需）
└─ README.md            面向站主的中文说明
```

---

## 三、页面结构与样式要点

**双栏博客布局**（`.blog-cols`，`minmax(0,1fr) 340px`）：

```
站头横幅（毛玻璃）
  ↓ 分隔线
┌ 主栏 ─────────────────┬ 侧栏（sticky）─┐
│ 画廊（磨砂玻璃面板）    │ 自我介绍 + 头图 │
│ 委托流程（XP 窗口）     │ 更新日志        │
│ 音源配布（XP 窗口）     │                │
│ 弹幕留言板（XP 窗口）   │                │
└───────────────────────┴────────────────┘
底部固定 XP 任务栏（Start 菜单 + 时钟 + 托盘）
右下角玩具鸭（300px，紧贴底端）
```

**设计系统**：`css/style.css:23` 起是 CSS 变量（`--hotpink #ff4fa0`、`--pink`、`--ink`、`--dark`、`--win #ece9d8` 等）。改配色只需动这里。

**三处关键视觉约定**（都踩过坑）：
1. **站头标题是白色**（`#fff`），投影是偏蓝深灰 `#2b3d5f` —— 因为背景是浅色图，粉色标题看不清。
2. **分隔线纯白、无投影**，两侧带 `━━━━` 拉长装饰。
3. **磨砂玻璃**统一用 `rgba(255,255,255,.5~.68)` + `backdrop-filter: blur()`。

**XP 窗口**：`.window` + `.titlebar`(蓝渐变) + `.win-body`(3px 立体斜边)。窗口按钮（`.tb-min/.tb-max/.tb-close`）是**纯 CSS 绘制**（伪元素画 ×、—、□），**不要改回字体字符**——之前用 `×` 字符会因字体基线导致不居中且被乱码逻辑误替换。

**响应式断点**：900px（双栏→单栏）、760px（隐藏贴纸）、560px（单列画廊、鸭子缩小）。

---

## 四、各功能模块

### 1. 多语言 `js/i18n.js`
- 字典 `DICT`，每条含 `zh / ja / en` 三字段；`data-i18n` / `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria` 四种标记。
- 右上角下拉（默认中文），选择存 `localStorage`（key `cupcake-lang-v2`）。
- 切换时派发 `document` 上的 `langchange` 事件，各模块监听刷新自己的动态文案。
- **改文案**：只改 `DICT`，别动 HTML 里的中文（HTML 里的只是首次渲染兜底）。
- **陷阱**：如果某元素由 JS 动态写文案，就不要给它加 `data-i18n`，否则会和 `langchange` 打架（画廊计数踩过）。

### 2. 画廊 `js/gallery.js`
- 加载顺序：`/api/gallery`（有后端时实时扫描）→ `window.GALLERY_IMAGES`（`gallery.js` 内嵌）→ `gallery.json`。
- 布局：CSS `column-count: 3` 瀑布流，图片按原始比例展示。
- 点击开灯箱显示**原图**（缩略图与原图同源，不裁切）。
- **加图/删图**：直接往 `picture/` 放图；线上（无后端）需跑 `node refresh-gallery.cjs` 更新 `gallery.js` 后再推送。顺序 = 文件名自然排序。

### 3. 留言板 `js/danmaku.js`
- **循环播放用「洗牌袋」算法**：池子打乱后逐条取，一轮内绝不重复，取完重新洗；跨轮首尾不撞车。
- **自适应间隔**（留言越少飘得越慢）：1 条 ≈6.5s，2-3 条 ≈4.8s，4-6 条 ≈3.4s，7-12 条 ≈2.4s，12+ ≈1.7s。
- 新留言**实时插入**并加入循环池；`seen` 按 id 去重（避免自己发的显示两次）。
- 后端地址读 `window.DANMAKU_API`（`js/config.js`）。留空 = 同源。
- 无后端时进入本地演示：能发能飘能循环，但只存在自己浏览器、刷新即失，状态显示「○ 未连接」。

### 4. 彩蛋 `js/easteregg.js` + CSS
两部分：

**(a) 常规点击**：播放 `Easter egg/音效.wav`（已裁掉 0.40s 前导静音，原 1.66s→1.27s），`1.png ↔ 2.png` 切换 + 按扁回弹动画（0.6s，幅度较小）。
- **贴图已预加载**（`new Image()`），修复过「首次点击切换失效」。
- 连点不打断 2.png 的显示（切图定时器不清除，只有动画收尾定时器 `animTimer` 会重置）。

**(b) 连点 30 次触发故障序列**（时间线）：

| 时刻 | 事件 |
|---|---|
| 0s | 全页文字变乱码，**每 50ms** 刷新一次 |
| 3.0s | 页面故障：抖屏 + RGB 色差 + 扫描线叠加 |
| 3.5s | **英文报错弹窗雨**，每 380ms 一个，右下角层叠（每层偏 28px，满 7 个换新起点，上限 22 个） |
| 7.5s | 居中「**你在期待什么？**」重点弹窗（点确定或 3.8s 后继续） |
| — | **XP 蓝屏**（STOP 0x0000007E + cupcake.sys + 内存转储进度条，缓慢推进） |
| — | 转储到 100% 后再停 1.6s → `location.reload()` |

**关键实现约束**：
- **`body` 上不能加 `transform` 动画**——会让 `position: fixed` 的后代（蓝屏/弹窗）退化成相对页面定位，导致滚动时看不见。抖动只加在 `.page` 和 `.footbar` 上。
- 触发时锁 `document.body.style.overflow = 'hidden'`。
- 乱码会**排除 UI 元素**（标题栏按钮、任务栏、语言栏、应用窗口、弹窗、星星层、鸭子），靠 `isExcluded()`，改结构时注意同步。

### 5. 背景星星 `js/starfield.js`
- 读 `assets/star.txt`，**同时内置一份副本**（file:// 打开时 fetch 会失败，走内置）。
- 随机位置/大小（8-20px），纯白发光，随机 1.6~3.2s 淡入淡出，同屏最多 8 个，生成间隔 0.5~1.1s。
- **无旋转倾斜**（站主要求）。

### 6. XP 小应用 `js/apps.js`
- 点击任务栏 **Start 按钮**展开开始菜单（用户信息条 + 4 个应用 + 侧栏 + Log Off/Turn Off）。
- 4 个应用**界面文字全英文**：Notepad（可输入）、Paint（canvas 作画 + 6 色 + Clear）、Minesweeper（9×9 / 10 雷，左键翻开右键插旗）、**My Computer（故意禁用，灰显点不开——站主明确要求）**。
- 窗口可拖动（拖标题栏）、最小化、关闭、点选置顶。

### 7. 其他
- `js/main.js`：任务栏时钟（每 15s 更新）+ 访客计数器（`localStorage` 累计，LED 绿字样式）。
- 彩蛋鸭 300px 紧贴右下角，z-index 75 **高于任务栏**（70），保证不被遮挡可点击。
- 外链区 5 个一行一条：**邮箱那项不是 `<a mailto>`**，是悬停显示地址气泡的 `div`（站主明确要求不要跳邮件客户端）。

---

## 五、本地运行与验证

```bash
cd E:\自介网页
node server.js          # 起在 http://127.0.0.1:3000（PORT 可覆盖）
```

- 有 `server.js` 时：画廊实时扫描 `picture/`，留言板走本地后端（数据存 `data/danmaku.json`）。
- 直接双击 `index.html`：画廊走内嵌清单，留言板进本地演示模式。
- **语法自检**（无构建，改动后至少跑一次）：
  ```powershell
  node --check js/danmaku.js   # 逐个文件
  ```

---

## 六、git 工作流（重要）

系统 PATH 里**没有 git**，用 GitHub Desktop 自带的：

```powershell
$git = 'C:\Users\CupCakeQAQ_\AppData\Local\GitHubDesktop\app-3.6.6\resources\app\git\cmd\git.exe'
& $git -C 'E:\自介网页' add -A
& $git -C 'E:\自介网页' commit -m "..."
& $git -C 'E:\自介网页' push origin main
```

**已知问题**：
- GitHub 连接**间歇性被重置**（`Recv failure: Connection was reset`）。直接重试即可，通常第二次成功。
- 站主会**在 GitHub 网页端直接改文件**，导致本地与远程历史分叉。若推送被拒：先 `git fetch`，对比 `git diff main origin/main`；内容一致时用 `git reset --hard origin/main` 对齐（**已发生过一次**，站主的 `Ciallo~ (∠・ω< )⌒☆` 描述因此保留）。
- 沙箱运行器在这台机器**不可用**（临时目录缺失），所有命令都需要 `danger-full-access` 才能执行。

---

## 七、踩过的坑（别重犯）

| 坑 | 结论 |
|---|---|
| `body` 加 transform | 破坏所有 `position: fixed` 子元素定位 |
| 窗口按钮用 `×` 字符 | 不居中 + 被乱码逻辑替换 → 改纯 CSS 伪元素 |
| 鸭子 z-index 低于任务栏 | 被任务栏盖住点不到 → 鸭子 75 / 任务栏 70 |
| 2.png 未预加载 | 冷缓存时切换失效 → 加 `new Image()` 预加载 |
| 循环播放纯随机 | 满屏重复 → 改洗牌袋 + 自适应间隔 |
| `data-i18n` 加在 JS 托管的元素上 | 切换语言时被打回旧文案 → 由 JS 独占 |
| `worker.js`/`deno.ts` 放主仓库 | 210MB 仓库被当静态站构建 → 免费额度爆掉、账号暂停 |

---

## 八、待办：留言板后端（已搁置，可选）

**目标**：让弹幕跨访客实时互通。**目前不做也没关系**，站主已同意暂停。

**接口契约**（前端已按此实现，后端实现这三个即可，**前端一行都不用改**）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/danmaku` | 返回 `{"list":[{id,text,color,time},...]}` |
| POST | `/api/danmaku` | 收 `{text,color}`，返回 `{"ok":true,"item":{...}}` |
| GET | `/api/danmaku/stream` | SSE，推送 `data: {item}\n\n` |

**已尝试并失败的三条路**（别再走）：

1. **Cloudflare Workers**（已部署 `cupcake-danmaku.cupcakeqaq.workers.dev`）→ `workers.dev` 域名**国内 DNS 污染 + TCP 阻断**，用不了。除非绑自有域名。
2. **Deno Deploy** → 首次构建把 210MB 仓库当静态站部署，**免费额度爆掉、账号被暂停**。修复方案（把后端拆成独立小仓库 `E:\danmaku-api`，14KB，含 `deno.ts` / `deno.json` / `server.js` / `render.yaml`）已备好，尚未使用。站主也已建了空仓库 `cupcake-danmaku-api`。
3. **Render** → 注册时**要求绑银行卡**，站主走不通。

**网络实测结论**（站主这条线路，2026 年测）：

| 域名 | 可用 |
|---|---|
| `workers.dev`、`vercel.app` | ❌ 阻断 |
| `deno.net`、`onrender.com`、`railway.app`/`up.railway.app`、`pages.dev`、`netlify.app`、`ts.net` | ✅ 可连 |

**下一步建议**：优先试 **Railway**（2026 年时免费计划不用绑卡，域名实测可连）——直接把 `E:\danmaku-api` 推成独立仓库，Railway 连仓库、Start Command 填 `node server.js` 即可。若 Railway 也要卡，退路是 **Cloudflare Pages Functions**（页面域名 `pages.dev` 可连，拿不到 Durable Object，实时性降到 2-3 秒轮询）。

**接好后只需一步**：改 `js/config.js` 的 `window.DANMAKU_API = 'https://你的地址'`，提交推送。

---

## 九、站主的沟通偏好（重要）

- **要严格执行要求，不要自作主张**。改动前如果不确定，先问清楚再动手。
- 反馈直接，会明确指出「××有 bug」「××不对」。**别辩解，别写长道歉**，直接修 + 简短说明。
- 明确说过讨厌：无意义的装饰、莫名其妙的标签和词汇、过多刻意的地方、「低级 emoji 装饰」、留白过多。
- 喜欢：紧凑极繁排版、千禧年个人博客味、颜文字分隔线、XP 界面还原度。
- 之前因为后端方案反复失败（Cloudflare 被墙 → Deno 额度爆 → Render 要绑卡）**很不高兴**，涉及第三方服务的方案**必须先说清楚风险和限制**，确认后再动手。
- 沟通用中文。

---

## 十、其他可优化项（站主提过「还要继续优化网页」）

- `assets/stickers/anime/` 里还有 **2 张 GIF 未被使用**（`3146718bbnf7ki65m.gif`、`39368n1b2x3prdz.gif` 之外的 5 张中，`1291604qu5lsn49et.gif` 与 `469663dk1ye69vvx.gif` 目前空着）。
- 委托流程、声库使用说明目前是**占位文案**，站主尚未提供正式内容。
- 更新日志两条也是占位（`js/i18n.js` 的 `update1` / `update2`）。
- 画廊目前 14 张，站主会随时增删。
