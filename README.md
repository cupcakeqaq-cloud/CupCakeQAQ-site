# 12あKa@被告人杯糕_ · 自介网页

千禧年个人博客 / Windows XP / 废萌 风格的个人介绍页（双栏博客排版：左侧主栏画廊，右侧侧栏自我介绍）。

## 目录结构

```
├─ index.html          页面
├─ css/style.css       样式
├─ js/                 交互脚本（多语言 / 画廊 / 弹幕 / 彩蛋 / 小应用 / 通用）
├─ js/config.js        留言板后端地址（留空=本地/同源）
├─ refresh-gallery.cjs 一键刷新画廊清单
├─ gallery.js          画廊内嵌清单（由脚本生成，双击打开也能显示）
├─ gallery.json        画廊 JSON 清单（由脚本生成，备用）
├─ server.js           本地预览服务器（可选，含弹幕接口）
├─ package.json
├─ assets/fonts/       像素字体（Fusion Pixel Font，OFL 授权）
├─ assets/background/  网页大背景 windows.jpg + 自介小头图 cute.jpg
├─ assets/icon/        外链图标（米画师 / Gmail / bilibili / X / marshmallow）
├─ assets/stickers/anime/ 装饰动图贴纸
├─ picture/            画廊作品（加图 / 删图后刷新即可）
├─ Easter egg/         彩蛋贴图 1.png / 2.png + 音效
├─ voice dl/           UTAU 声库 zip
└─ icon.png            头像
```

## 本地运行

需要 [Node.js](https://nodejs.org/)（≥ 18），无需 `npm install`（零依赖）。

```bash
node server.js
# 或
npm start
```

然后浏览器打开 <http://127.0.0.1:3000>。

> 端口默认 3000，可用环境变量 `PORT` 覆盖（如 `PORT=8080 node server.js`）。

## 画廊：加图 / 删图

1. **直接往 `picture/` 文件夹增删图片**——后端 `server.js` 每次访问都会实时扫描该文件夹，刷新页面即可看到最新作品。
2. 若你之后把页面部署到纯静态托管（没有后端），增删图片后跑一次：
   ```bash
   node refresh-gallery.cjs
   # 或
   npm run refresh:gallery
   ```
   脚本会同步更新 `gallery.js` 与 `gallery.json` 两份清单（支持 `png / jpg / jpeg / gif / webp / bmp / avif`，按文件名自然排序）。

布局采用瀑布流（CSS columns），任意数量图片都能自适应排布，不会破坏版式。双击 `index.html` 直接打开（file://）也能正常显示画廊。

## 弹幕留言板

留言会**随机循环播放**（洗牌袋算法：一轮内不重复；留言越少飘得越慢），新留言仍会实时插入。

目前线上是**纯静态**运行：没有后端时，留言只保存在访客自己的浏览器里（能发、能飘、能循环，但别人看不到、刷新即失）。

若以后想做成「多访客实时互通」，只要接一个提供下面三个接口的后端，并把地址填进 `js/config.js` 的 `window.DANMAKU_API` 即可（前端无需改动）：

- `GET  /api/danmaku` —— 拉取历史留言
- `POST /api/danmaku` —— 提交一条（`{"text":"...","color":"#ff9dcb"}`）
- `GET  /api/danmaku/stream` —— SSE 实时推送

仓库里的 `server.js` 就是这套接口的本地实现（`node server.js` 即可，数据存 `data/danmaku.json`）。

## 部署：GitHub Pages

前端是纯静态的，直接放 GitHub Pages：

仓库 **Settings → Pages → Deploy from a branch → main / (root) → Save**，约 1 分钟后访问：

```
https://cupcakeqaq-cloud.github.io/CupCakeQAQ-site/
```

> 根目录已放 `.nojekyll`，避免 Jekyll 处理。
>
> 页面里所有资源都是相对路径，放在仓库子路径下也能正常工作。

## 彩蛋

右下角固定悬浮玩具鸭（紧贴底端）：常态显示 `Easter egg/1.png`，点击播放裁剪过前导静音的 `Easter egg/音效.wav`，并切换为 `Easter egg/2.png`，伴有「按扁—回弹」的挤压动画，可连续点击。（`音效.mp3` 为原始备份）

## 背景星星字符画

`assets/star.txt` 里的星星字符画会随机位置、随机大小地在背景上淡入淡出（白色发光）。逻辑在 `js/starfield.js`；若以 file:// 打开页面，会使用脚本内置的同一份字符画。

## 语言切换（中文 / 日本語 / English）

页面右上角有一个下拉按钮（默认「中文 ▾」），点击后下方展开「中文 · 日本語 · English」选项，选择后整页文字即时切换。选择会记住在浏览器里。

翻译内容集中在 `js/i18n.js` 的字典里，想改措辞直接编辑该文件即可（`zh` / `ja` / `en` 三个字段）。

## 常见修改

- **头像 / 圈名 / 简介**：编辑 `index.html` 中 `#profile` 区块。
- **社交链接**：编辑 `index.html` 中 `.social-grid` 的 5 个 `<a>`。
- **声库下载 / 使用说明**：编辑 `index.html` 中 `#voice` 区块。
- **委托流程**：编辑 `index.html` 中 `#commission` 区块。
- **配色 / 风格**：编辑 `css/style.css` 顶部的 CSS 变量。
- **贴纸 / 颜文字**：替换 `assets/stickers/` 下的 GIF，或改 `index.html` 中的分隔线 / 站头文字。

## 素材来源与授权

- 像素字体：[Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)（SIL OFL 1.1 授权）。
- 颜文字 / 分隔线：[emojicombos.com](https://emojicombos.com)（纯文字符号）。
- `assets/background/`、`assets/icon/`、`assets/stickers/anime/` 为你自备素材：大背景 windows.jpg、自介小头图 cute.jpg、外链图标（文件名对应网址）、装饰动图。
- 画廊以磨砂玻璃面板呈现，缩略图统一裁切铺满格位，点击灯箱显示原图。
