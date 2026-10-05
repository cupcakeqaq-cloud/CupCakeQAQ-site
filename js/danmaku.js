/* 弹幕留言板：SSE 实时接收 + POST 发送 + 颜色选择，后端不可用时降级为本地演示 */
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
  var seen = {}; // 已播放过的弹幕 id，避免自己发的重复显示

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

  // 带 id 去重的播放：SSE 回显与 POST 返回同一条时只显示一次
  function spawnItem(item) {
    if (!item || !item.text) return;
    if (item.id) {
      if (seen[item.id]) return;
      seen[item.id] = 1;
    }
    spawn(item.text, item.color);
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
        .then(function (d) { if (d && d.ok && d.item) spawnItem(d.item); })
        .catch(function () { spawn(text, currentColor); });
    } else {
      spawn(text, currentColor);
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

  function init() {
    setStatus('wait');

    fetch(BASE + '/api/danmaku')
      .then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); })
      .then(function (d) {
        connected = true;
        setStatus('on');
        var list = (d.list || []).slice(-15); // 只回放最近 15 条
        list.forEach(function (item, i) {
          setTimeout(function () { spawnItem(item); }, i * 300);
        });
      })
      .catch(function () { /* 后端不可用 */ });

    try {
      var es = new EventSource(BASE + '/api/danmaku/stream');
      es.onopen = function () { connected = true; setStatus('on'); };
      es.onmessage = function (ev) {
        try { spawnItem(JSON.parse(ev.data)); } catch (e) {}
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
