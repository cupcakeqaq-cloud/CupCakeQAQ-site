/* 弹幕留言板：SSE 实时接收 + 随机循环播放 + POST 发送 + 颜色选择 */
(function () {
  var screenEl = document.getElementById('danmakuScreen');
  var input = document.getElementById('danmakuInput');
  var sendBtn = document.getElementById('danmakuSend');
  var colorsEl = document.getElementById('danmakuColors');
  var statusEl = document.getElementById('danmakuStatus');

  var COLORS = ['#ffffff', '#ff9dcb', '#ffe08a', '#8df0c6', '#7ed0ff', '#c9a7ff'];
  var currentColor = COLORS[1];
  var connected = false;
  var statusState = 'wait'; // wait | on | off
  var LANES = [10, 42, 74, 106];
  var dots = [];
  var BASE = (window.DANMAKU_API || '').replace(/\/+$/, '');

  var seen = {};        // 实时投递去重（避免自己发的显示两条）
  var pool = [];        // 循环播放的留言池
  var bag = [];         // 洗牌袋：一轮内不重复
  var pendingSkip = {}; // 开屏已展示过的，第一轮洗牌时跳过
  var loopTimer = null;
  var lastLoopId = null;

  COLORS.forEach(function (c, i) {
    var d = document.createElement('span');
    d.className = 'color-dot' + (i === 1 ? ' active' : '');
    d.style.background = c;
    d.title = window.t('danmakuColorTitle');
    d.addEventListener('click', function () {
      currentColor = c;
      var all = colorsEl.querySelectorAll('.color-dot');
      for (var k = 0; k < all.length; k++) all[k].classList.remove('active');
      d.classList.add('active');
    });
    colorsEl.appendChild(d);
    dots.push(d);
  });

  function setStatus(state) {
    statusState = state;
    statusEl.className = 'dot-status ' + state;
    var key = state === 'on' ? 'danmakuStatusOn' : (state === 'wait' ? 'danmakuStatusWait' : 'danmakuStatusOff');
    statusEl.textContent = window.t(key);
  }

  function spawn(text, color) {
    if (!text) return;
    var el = document.createElement('span');
    el.className = 'danmaku-item';
    el.textContent = text;
    el.style.color = color || currentColor;
    el.style.top = LANES[Math.floor(Math.random() * LANES.length)] + 'px';

    var fs = 14 + Math.floor(Math.random() * 5);
    el.style.fontSize = fs + 'px';

    var screenW = screenEl.clientWidth || 460;
    var estW = text.length * fs;
    var dist = screenW + estW + 40;
    var dur = Math.max(4.5, dist / 80);
    el.style.setProperty('--fly', (-dist) + 'px');
    el.style.setProperty('--dur', dur.toFixed(2) + 's');

    screenEl.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
  }

  /* ---------- 留言池 ---------- */
  function addToPool(item) {
    if (!item || !item.text) return;
    pool.push(item);
    if (pool.length > 120) pool.shift(); // 池子上限，避免无限增长
  }

  // 实时投递：同一条（同 id）只立即显示一次
  function spawnRealtime(item) {
    if (!item || !item.text) return;
    if (item.id) {
      if (seen[item.id]) return;
      seen[item.id] = 1;
    }
    addToPool(item);
    spawn(item.text, item.color);
  }

  // 洗牌袋：把池子打乱后逐条取出，取完再洗一轮 —— 一轮内不重复
  function refillBag() {
    bag = pool.filter(function (it) { return !pendingSkip[it.id]; });
    if (!bag.length) bag = pool.slice(); // 全被跳过时退回完整池子
    pendingSkip = {};
    for (var i = bag.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    // 避免新一轮的第一条和上一轮最后一条撞车
    if (bag.length > 1 && lastLoopId && bag[0].id === lastLoopId) {
      var t2 = bag[0]; bag[0] = bag[1]; bag[1] = t2;
    }
  }

  // 循环播放：留言越少，飘得越慢，避免满屏重复
  function loopTick() {
    if (!document.hidden && pool.length) {
      if (!bag.length) refillBag();
      var item = bag.shift();
      if (item) {
        lastLoopId = item.id || null;
        spawn(item.text, item.color);
      }
    }
    var n = pool.length;
    var base = n <= 1 ? 6500 : n <= 3 ? 4800 : n <= 6 ? 3400 : n <= 12 ? 2400 : 1700;
    loopTimer = setTimeout(loopTick, base + Math.random() * base * 0.5);
  }
  function startLoop() {
    if (loopTimer) return;
    loopTick();
  }

  /* ---------- 发送 ---------- */
  function localSend(text) {
    spawnRealtime({
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      text: text,
      color: currentColor
    });
  }

  function send() {
    var text = input.value.replace(/^\s+|\s+$/g, '');
    if (!text) return;
    input.value = '';
    if (connected) {
      fetch(BASE + '/api/danmaku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, color: currentColor })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.ok && d.item) spawnRealtime(d.item); })
        .catch(function () { localSend(text); });
    } else {
      localSend(text);
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  /* ---------- 初始化 ---------- */
  function init() {
    setStatus('wait');
    startLoop(); // 无论有没有后端，循环播放都跑起来

    fetch(BASE + '/api/danmaku')
      .then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); })
      .then(function (d) {
        connected = true;
        setStatus('on');
        var list = d.list || [];
        list.forEach(function (item) {
          if (item && item.id) seen[item.id] = 1; // 历史不重复实时投递
          addToPool(item);
        });
        // 开屏先飘最近 3 条（记下来，第一轮洗牌时跳过，避免立刻重复）
        list.slice(-3).forEach(function (item, i) {
          pendingSkip[item.id] = 1;
          setTimeout(function () { spawn(item.text, item.color); }, i * 450);
        });
      })
      .catch(function () { /* 后端不可用：进入本地演示 */ });

    try {
      var es = new EventSource(BASE + '/api/danmaku/stream');
      es.onopen = function () { connected = true; setStatus('on'); };
      es.onmessage = function (ev) {
        try { spawnRealtime(JSON.parse(ev.data)); } catch (e) {}
      };
      es.onerror = function () {
        connected = false;
        if (statusState !== 'on') setStatus('off');
      };
    } catch (e) {
      setStatus('off');
    }

    setTimeout(function () {
      if (!connected && statusState !== 'on') setStatus('off');
    }, 2500);
  }

  document.addEventListener('langchange', function () {
    setStatus(statusState); // 重新套用当前语言的状态文案
    for (var i = 0; i < dots.length; i++) dots[i].title = window.t('danmakuColorTitle');
  });

  init();
})();
