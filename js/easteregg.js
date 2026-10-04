/* 彩蛋：玩具鸭。点击 -> 播放音效 + 按扁回弹（可连续点击）。
   连点 30 次 -> 高速乱码 -> 故障 -> 连续英文报错弹窗（右下角层叠）-> 「你在期待什么」 -> XP 蓝屏 -> 自动刷新 */
(function () {
  var duck = document.getElementById('duck');
  var img = document.getElementById('duckImg');
  var NORMAL = 'Easter%20egg/1.png';
  var PRESSED = 'Easter%20egg/2.png';
  var SOUND = 'Easter%20egg/%E9%9F%B3%E6%95%88.wav';

  var timers = [];
  var audio = null;
  var clickCount = 0;
  var sequenceStarted = false;

  function ensureAudio() {
    if (!audio) {
      try { audio = new Audio(SOUND); audio.preload = 'auto'; } catch (e) { audio = null; }
    }
    return audio;
  }
  function playSound() {
    var a = ensureAudio();
    if (!a) return;
    try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [];
  }

  duck.addEventListener('click', function () {
    clearTimers();
    playSound();
    duck.classList.remove('squish');
    void duck.offsetWidth;
    duck.classList.add('squish');
    img.src = NORMAL;
    timers.push(setTimeout(function () { img.src = PRESSED; }, 180));
    timers.push(setTimeout(function () { img.src = NORMAL; }, 430));
    timers.push(setTimeout(function () { duck.classList.remove('squish'); }, 620));

    if (!sequenceStarted) {
      clickCount++;
      if (clickCount >= 30) {
        sequenceStarted = true;
        startGlitchSequence();
      }
    }
  });

  /* ============ 故障彩蛋序列 ============ */
  var GARBLE = '锟斤拷烫烫屯屯铊镪燊彧吖昺圐埜滧彁忄灬籴觌氅餮饕疋丏丩丒丳卄卌巜巛廴廾灬忄▞▚▟▙█▓▒░⠿⣿⣷⣻<>#%&@!?';
  var textNodes = [];
  var garbleTimer = null;

  function isExcluded(node) {
    var el = node;
    while (el && el !== document.body) {
      if (el.nodeType === 1) {
        var id = el.id;
        if (id === 'appLayer' || id === 'startMenu' || id === 'starField' || id === 'langDrop' || id === 'duck') return true;
        var cls = typeof el.className === 'string' ? el.className : '';
        if (/(^| )(tb-btns|footbar|lang-drop|star-field|app-window|xp-dialog|bsod|glitch-overlay|duck)( |$)/.test(cls)) return true;
      }
      el = el.parentNode;
    }
    return false;
  }

  function collectTextNodes() {
    var out = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var p = n.parentNode;
      if (!p) continue;
      var tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE') continue;
      if (isExcluded(p)) continue;
      if (n.nodeValue && n.nodeValue.trim().length) out.push(n);
    }
    return out;
  }

  function garbleTick() {
    for (var i = 0; i < textNodes.length; i++) {
      var t = textNodes[i];
      var len = t.nodeValue.length;
      var s = '';
      for (var j = 0; j < len; j++) s += GARBLE[(Math.random() * GARBLE.length) | 0];
      t.nodeValue = s;
    }
  }

  function startGarble() {
    textNodes = collectTextNodes();
    garbleTick();
    garbleTimer = setInterval(garbleTick, 50);
  }

  function startGlitch() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('glitching');
    var overlay = document.createElement('div');
    overlay.className = 'glitch-overlay';
    document.body.appendChild(overlay);
    var flash = document.createElement('div');
    flash.className = 'glitch-flash';
    document.body.appendChild(flash);
  }

  /* ---- 连续英文报错弹窗（右下角层叠） ---- */
  var ERR_TITLES = ['Error', 'Runtime Error', 'Application Error', 'System Error', 'Warning', 'Microsoft Windows', 'Program Error', 'Fatal Error'];
  var ERR_MSGS = [
    'The application has encountered a problem and needs to close. We are sorry for the inconvenience.',
    'Access violation at address 0x0040F2A0 in module svchost.exe. Read of address 0x00000000.',
    'Runtime Error! Program: C:\\WINDOWS\\system32\\iexplore.exe',
    'Not enough memory to complete this operation. Close some programs and try again.',
    'The system has recovered from a serious error.',
    '0x80004005: Unspecified error.',
    'A required .DLL file, MSVCRT.dll, was not found.',
    'The instruction at 0x77f11d80 referenced memory at 0x00000000. The memory could not be read.',
    'Windows Explorer has stopped working. Windows is checking for a solution to the problem...',
    'Exception EAccessViolation in module cupcake.exe at 0001A2F0.',
    'This program is not responding. If you close it, you might lose information.',
    'The device is not ready.',
    'Unknown error occurred while accessing the disk.',
    'Setup was unable to complete the installation. An internal error occurred.'
  ];

  var cascadeCount = 0;
  var cascadeX = 90, cascadeY = 80;

  function nextCascadePos() {
    var x = cascadeX + cascadeCount * 28;
    var y = cascadeY + cascadeCount * 28;
    cascadeCount++;
    if (cascadeCount > 7) {
      cascadeCount = 0;
      cascadeX = 30 + Math.random() * (window.innerWidth * 0.55);
      cascadeY = 20 + Math.random() * (window.innerHeight * 0.4);
      if (cascadeX < 0) cascadeX = 30;
      if (cascadeY < 0) cascadeY = 20;
    }
    return { x: x, y: y };
  }

  function spawnError() {
    var pos = nextCascadePos();
    var dlg = document.createElement('div');
    dlg.className = 'xp-dialog err-dialog';
    dlg.style.left = pos.x + 'px';
    dlg.style.top = pos.y + 'px';
    dlg.innerHTML =
      '<div class="titlebar"><span class="tb-title">' + ERR_TITLES[(Math.random() * ERR_TITLES.length) | 0] + '</span><span class="tb-btns"><i class="tb-close">×</i></span></div>' +
      '<div class="dlg-body"><span class="dlg-ico">⚠</span><span>' + ERR_MSGS[(Math.random() * ERR_MSGS.length) | 0] + '</span></div>' +
      '<div class="dlg-btns"><button class="dlg-btn">OK</button></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('.dlg-btn').addEventListener('click', function () { dlg.remove(); });
    dlg.querySelector('.tb-close').addEventListener('click', function () { dlg.remove(); });
    var all = document.querySelectorAll('.err-dialog');
    if (all.length > 22) all[0].remove();
  }

  var errorTimer = null;
  function startErrorSpam() {
    spawnError();
    errorTimer = setInterval(spawnError, 170);
  }

  /* ---- 重点弹窗「你在期待什么」 ---- */
  var featuredShown = false;
  function showFeaturedDialog() {
    if (featuredShown) return;
    featuredShown = true;
    var dlg = document.createElement('div');
    dlg.className = 'xp-dialog featured-dialog';
    dlg.innerHTML =
      '<div class="titlebar"><span class="tb-title">信息</span><span class="tb-btns"><i class="tb-close">×</i></span></div>' +
      '<div class="dlg-body"><span class="dlg-ico">⚠</span><span>你在期待什么？</span></div>' +
      '<div class="dlg-btns"><button class="dlg-btn">确定</button></div>';
    document.body.appendChild(dlg);
    var done = false;
    function proceed() {
      if (done) return;
      done = true;
      if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
      showBSOD();
    }
    dlg.querySelector('.dlg-btn').addEventListener('click', proceed);
    dlg.querySelector('.tb-close').addEventListener('click', proceed);
    setTimeout(proceed, 3800);
  }

  /* ---- 蓝屏（慢速） ---- */
  function showBSOD() {
    if (garbleTimer) clearInterval(garbleTimer);
    if (errorTimer) clearInterval(errorTimer);
    document.querySelectorAll('.err-dialog').forEach(function (d) { d.remove(); });

    var bsod = document.createElement('div');
    bsod.className = 'bsod';
    bsod.innerHTML =
      '<div class="bsod-title">Windows</div>' +
      'A problem has been detected and Windows has been shut down to prevent damage\n' +
      'to your computer.\n\n' +
      'CUPCAKE_GLITCH.sys\n\n' +
      'If this is the first time you\'ve seen this Stop error screen,\n' +
      'restart your computer. If this screen appears again, follow these steps:\n\n' +
      'Check to make sure any new hardware or software is properly installed.\n' +
      'If this is a new installation, ask your hardware or software manufacturer\n' +
      'for any Windows updates you might need.\n\n' +
      'Technical information:\n\n' +
      '*** STOP: 0x0000007E (0xC0000005, 0xE1A2F000, 0xF7A2A000, 0xF7A29FF0)\n\n' +
      '    cupcake.sys - Address E1A2F000 base at E1A2A000, DateStamp 3d6dd67c';
    var mem = document.createElement('div');
    mem.className = 'bsod-mem';
    mem.innerHTML = 'Beginning dump of physical memory' +
      '<div class="bsod-bar"><div class="bsod-fill"></div></div>' +
      '<div style="margin-top:4px">Physical memory dump ... 0%</div>';
    bsod.appendChild(mem);
    document.body.appendChild(bsod);

    var fill = mem.querySelector('.bsod-fill');
    var label = mem.querySelector('div[style]');
    var pct = 0;
    var iv = setInterval(function () {
      pct += 1.5 + Math.random() * 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(iv);
        setTimeout(function () { location.reload(); }, 1600);
      }
      fill.style.width = pct + '%';
      label.textContent = 'Physical memory dump ... ' + Math.floor(pct) + '%';
    }, 190);
  }

  function startGlitchSequence() {
    startGarble();
    setTimeout(startGlitch, 3000);
    setTimeout(startErrorSpam, 3500);
    setTimeout(showFeaturedDialog, 7500);
  }
})();
