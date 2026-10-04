'use strict';

/**
 * 一键刷新画廊清单
 * 用法：node refresh-gallery.cjs   （或 `npm run refresh:gallery`）
 * 作用：扫描 picture/ 文件夹，生成两份清单：
 *   - gallery.js  内嵌清单（双击 index.html 直接打开也能显示画廊）
 *   - gallery.json JSON 清单（备用）
 * 加图 / 删图 / 改名后跑一下即可；布局会自动适应，无需改其它文件。
 */

const fs = require('fs');
const path = require('path');

const PICTURE_DIR = path.join(__dirname, 'picture');
const OUT_JS = path.join(__dirname, 'gallery.js');
const OUT_JSON = path.join(__dirname, 'gallery.json');
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif']);

if (!fs.existsSync(PICTURE_DIR)) {
  console.error('未找到 picture 文件夹：' + PICTURE_DIR);
  process.exit(1);
}

const images = fs.readdirSync(PICTURE_DIR)
  .filter((n) => EXTS.has(path.extname(n).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'zh', { numeric: true }))
  .map((n) => 'picture/' + n);

fs.writeFileSync(OUT_JS, 'window.GALLERY_IMAGES = ' + JSON.stringify(images) + ';\n', 'utf8');
fs.writeFileSync(OUT_JSON, JSON.stringify({ images }, null, 2), 'utf8');

console.log('✔ 已更新 gallery.js / gallery.json，共 ' + images.length + ' 张图片');
images.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f));
