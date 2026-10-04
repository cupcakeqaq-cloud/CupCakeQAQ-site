/* XP 小应用 + 开始菜单：我的电脑 / 记事本 / 画图 / 扫雷（全英文，从「开始」菜单打开，窗口可拖动） */
(function () {
  var layer = document.getElementById('appLayer');
  var menu = document.getElementById('startMenu');
  var startBtn = document.getElementById('startBtn');
  if (!layer) return;

  var windows = {};
  var zTop = 80;

  /* ---------- 通用窗口 ---------- */
  function makeWindow(key, title, bodyHtml) {
    var win = document.createElement('div');
    win.className = 'app-window';
    win.style.left = (90 + Math.random() * 80) + 'px';
    win.style.top = (70 + Math.random() * 60) + 'px';
    win.style.zIndex = ++zTop;
    win.innerHTML =
      '<div class="titlebar"><span class="tb-title">' + title + '</span>' +
      '<span class="tb-btns"><i class="tb-min">—</i><i class="tb-close">×</i></span></div>' +
      '<div class="app-body">' + bodyHtml + '</div>';
    layer.appendChild(win);

    win.addEventListener('mousedown', function () { win.style.zIndex = ++zTop; });

    var bar = win.querySelector('.titlebar');
    bar.addEventListener('mousedown', function (e) {
      var ox = e.clientX - win.offsetLeft;
      var oy = e.clientY - win.offsetTop;
      function move(ev) { win.style.left = (ev.clientX - ox) + 'px'; win.style.top = (ev.clientY - oy) + 'px'; }
      function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });

    win.querySelector('.tb-close').addEventListener('click', function () { win.remove(); delete windows[key]; });
    win.querySelector('.tb-min').addEventListener('click', function () { win.style.display = 'none'; });

    return win;
  }

  function focus(key) {
    if (windows[key]) { windows[key].style.display = ''; windows[key].style.zIndex = ++zTop; return true; }
    return false;
  }

  /* ---------- 我的电脑 ---------- */
  function openComputer() {
    if (focus('computer')) return;
    var items = [['C:', 'Local Disk (C:)', '#4aa3e8'], ['D:', 'Local Disk (D:)', '#7ec8ff'], ['M', 'My Documents', '#ffb64a'], ['P', 'Control Panel', '#b793ff'], ['R', 'Recycle Bin', '#5fd0a8']];
    var lis = items.map(function (it) {
      return '<li><span class="comp-ico" style="background:' + it[2] + '">' + it[0] + '</span><span>' + it[1] + '</span></li>';
    }).join('');
    windows.computer = makeWindow('computer', 'My Computer', '<ul class="comp-list">' + lis + '</ul>');
  }

  /* ---------- 记事本 ---------- */
  function openNotepad() {
    if (focus('notepad')) return;
    windows.notepad = makeWindow('notepad', 'Notepad',
      '<div class="app-toolbar"><span class="tb">File</span><span class="tb">Edit</span><span class="tb">Format</span><span class="tb">View</span><span class="tb">Help</span></div>' +
      '<textarea spellcheck="false"></textarea>');
  }

  /* ---------- 画图 ---------- */
  function openPaint() {
    if (focus('paint')) return;
    var colors = ['#000000', '#e5484d', '#2f8fff', '#3f9c46', '#ffe08a', '#ff6fb1'];
    var swatches = colors.map(function (c) {
      return '<span class="app-color" data-c="' + c + '" style="background:' + c + '"></span>';
    }).join('');
    windows.paint = makeWindow('paint', 'Paint',
      '<div class="app-toolbar">' + swatches + '<button class="tb" data-clear>Clear</button></div>' +
      '<canvas width="340" height="220"></canvas>');

    var win = windows.paint;
    var cv = win.querySelector('canvas');
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var color = '#000000';
    var drawing = false;

    win.querySelectorAll('.app-color').forEach(function (el) {
      el.addEventListener('click', function () { color = el.getAttribute('data-c'); });
    });
    win.querySelector('[data-clear]').addEventListener('click', function () {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
    });
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('mousedown', function (e) {
      drawing = true; ctx.strokeStyle = color; ctx.beginPath();
      var p = pos(e); ctx.moveTo(p[0], p[1]);
    });
    cv.addEventListener('mousemove', function (e) {
      if (!drawing) return; var p = pos(e); ctx.lineTo(p[0], p[1]); ctx.stroke();
    });
    document.addEventListener('mouseup', function () { drawing = false; });
  }

  /* ---------- 扫雷 ---------- */
  function openMines() {
    if (focus('mines')) return;
    var W = 9, H = 9, M = 10;
    var board = [];
    var i, r, c;
    for (r = 0; r < H; r++) { board.push([]); for (c = 0; c < W; c++) board[r].push(0); }
    for (i = 0; i < M; i++) {
      var rr, cc;
      do { rr = (Math.random() * H) | 0; cc = (Math.random() * W) | 0; } while (board[rr][cc] < 0);
      board[rr][cc] = -1;
    }
    for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
      if (board[r][c] < 0) continue;
      var n = 0;
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < H && nc >= 0 && nc < W && board[nr][nc] < 0) n++;
      }
      board[r][c] = n;
    }

    var html = '<div class="app-toolbar"><span class="tb" id="mineFace">☺</span><span class="tb" id="mineRestart">New Game</span></div>';
    html += '<div class="mine-grid" style="grid-template-columns: repeat(' + W + ', 26px)">';
    for (r = 0; r < H; r++) for (c = 0; c < W; c++) html += '<div class="mine-cell" data-r="' + r + '" data-c="' + c + '"></div>';
    html += '</div>';
    windows.mines = makeWindow('mines', 'Minesweeper', html);

    var win = windows.mines;
    var cells = win.querySelectorAll('.mine-cell');
    var revealed = 0;

    function cellAt(r, c) { return win.querySelector('.mine-cell[data-r="' + r + '"][data-c="' + c + '"]'); }
    function flood(r, c) {
      if (r < 0 || r >= H || c < 0 || c >= W) return;
      var el = cellAt(r, c);
      if (!el || el.classList.contains('revealed')) return;
      el.classList.add('revealed'); revealed++;
      if (board[r][c] === 0) {
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) flood(r + dr, c + dc);
      } else {
        el.textContent = board[r][c];
        el.style.color = ['', '#00f', '#080', '#c00', '#004', '#840', '#0aa', '#000', '#888'][board[r][c]];
      }
    }
    function lose() {
      cells.forEach(function (el) {
        if (board[el.getAttribute('data-r')][el.getAttribute('data-c')] < 0) { el.classList.add('revealed', 'mine'); el.textContent = '×'; }
      });
      win.querySelector('#mineFace').textContent = '☹';
    }
    function checkWin() {
      if (revealed === W * H - M) win.querySelector('#mineFace').textContent = '♥';
    }

    cells.forEach(function (el) {
      el.addEventListener('click', function () {
        var r = +el.getAttribute('data-r'), c = +el.getAttribute('data-c');
        if (el.classList.contains('revealed')) return;
        if (board[r][c] < 0) { lose(); return; }
        flood(r, c); checkWin();
      });
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        if (el.classList.contains('revealed')) return;
        el.textContent = el.textContent === '⚑' ? '' : '⚑';
      });
    });
    win.querySelector('#mineRestart').addEventListener('click', function () {
      win.remove(); delete windows.mines; openMines();
    });
  }

  /* ---------- 图标 ---------- */
  var ICONS = {
    computer: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="18" rx="2" fill="#b8d0f0" stroke="#5a7a9a"/><rect x="5.5" y="7.5" width="21" height="12" fill="#3a6ea5"/><path d="M13 26h6M16 23v3" stroke="#5a7a9a" stroke-width="2" fill="none"/><rect x="11" y="27" width="10" height="3" rx="1" fill="#9a9a9a"/></svg>',
    notepad: '<svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="27" rx="2" fill="#fff" stroke="#6a6a6a"/><path d="M6 9h20M8 14h16M8 18h16M8 22h11" stroke="#3a6ea5" stroke-width="1.6" fill="none"/></svg>',
    paint: '<svg viewBox="0 0 32 32"><path d="M16 4a12 12 0 1 0 0 24c1.6 0 2.6-.9 2.6-2 0-1.2-.8-1.7-1.7-2.4-.8-.6-1.1-1.4-1.1-2.2 0-1.7 1.4-2.9 3.1-2.9h.8A6.4 6.4 0 0 0 26 12.6C26 7.7 21.5 4 16 4z" fill="#e8cba0" stroke="#9a7a4a"/><circle cx="11" cy="11" r="2.2" fill="#e5484d"/><circle cx="16" cy="8.5" r="2.2" fill="#2f8fff"/><circle cx="21" cy="11" r="2.2" fill="#3f9c46"/><circle cx="13" cy="16.5" r="2.2" fill="#ff6fb1"/></svg>',
    minesweeper: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="#1a1a1a"/><path d="M16 5v22M5 16h22M8 8l16 16M24 8L8 24" stroke="#e5484d" stroke-width="2"/><circle cx="16" cy="16" r="2.6" fill="#fff"/></svg>'
  };

  var APP_DEFS = [
    { key: 'notepad', name: 'Notepad', fn: openNotepad },
    { key: 'paint', name: 'Paint', fn: openPaint },
    { key: 'minesweeper', name: 'Minesweeper', fn: openMines },
    { key: 'computer', name: 'My Computer', fn: null }
  ];

  /* ---------- 开始菜单 ---------- */
  function buildMenu() {
    var items = APP_DEFS.map(function (a) {
      return '<div class="start-item' + (a.fn ? '' : ' disabled') + '" data-app="' + a.key + '">' + ICONS[a.key] + '<span>' + a.name + '</span></div>';
    }).join('');
    menu.innerHTML =
      '<div class="start-head"><img class="avatar-mini" src="icon.png" alt=""><span>12あKa@被告人杯糕_</span></div>' +
      '<div class="start-programs">' + items + '</div>' +
      '<div class="start-divider"></div>' +
      '<div class="start-side">' +
      '<div class="ss-item">My Documents</div>' +
      '<div class="ss-item">My Pictures</div>' +
      '<div class="ss-item">My Music</div>' +
      '<div class="ss-item">Control Panel</div>' +
      '</div>' +
      '<div class="start-footer"><button id="stLogoff">Log Off</button><button id="stTurnoff">Turn Off Computer</button></div>';

    menu.querySelectorAll('.start-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var def = APP_DEFS.filter(function (a) { return a.key === el.getAttribute('data-app'); })[0];
        if (def && def.fn) { def.fn(); menu.hidden = true; }
      });
    });
    menu.querySelector('#stLogoff').addEventListener('click', function () { menu.hidden = true; });
    menu.querySelector('#stTurnoff').addEventListener('click', function () { menu.hidden = true; });
  }

  if (startBtn && menu) {
    buildMenu();
    startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    document.addEventListener('click', function (e) {
      if (menu && !menu.hidden && !menu.contains(e.target) && e.target !== startBtn) menu.hidden = true;
    });
  }
})();
