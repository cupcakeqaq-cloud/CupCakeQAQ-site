/* 多语言字典与切换逻辑：中文 / 日本語 / English（下拉式，默认中文） */
(function () {
  var DICT = {
    pageTitle: {
      zh: '12あKa@被告人杯糕_ ★ 个人主页',
      ja: '12あKa@被告人杯糕_ ★ ホームページ',
      en: '12あKa@被告人杯糕_ ★ Homepage'
    },

    headHello: {
      zh: '(｡･ω･｡)ﾉ♡ 欢迎光临',
      ja: '(｡･ω･｡)ﾉ♡ いらっしゃいませ',
      en: '(｡･ω･｡)ﾉ♡ Welcome'
    },

    titleProfile: { zh: '自我介绍', ja: '自己紹介', en: 'About' },
    titleDanmaku: { zh: '弹幕留言板', ja: '弾幕掲示板', en: 'Danmaku Board' },
    titleGallery: { zh: '画廊', ja: 'ギャラリー', en: 'Gallery' },
    titleCommission: { zh: '委托流程', ja: '依頼の流れ', en: 'Commission' },
    titleVoice: { zh: '音源配布', ja: '音源配布', en: 'Voice DL' },

    aboutTitle: { zh: '简介', ja: '紹介', en: 'About' },
    bio: {
      zh: '18↑一般通过十八线低精力画手，此网页用于自我介绍／配布音源／委托流程介绍。',
      ja: '18↑ 一般通過の低浮上絵描き。このページでは自己紹介・音源配布・依頼の流れをまとめています。',
      en: '18+ freelance illustrator, generally low-energy. This page is for my self-intro, voicebank releases, and commission info.'
    },
    linksTitle: { zh: '找到我', ja: '見つけてね', en: 'Find me' },
    email: { zh: '邮箱', ja: 'メール', en: 'Email' },

    counterLabel: { zh: '访问计数', ja: 'アクセスカウンター', en: 'Hits' },

    updatesTitle: { zh: '更新日志', ja: '更新履歴', en: 'Updates' },
    update1: { zh: '网页建成 ✿', ja: 'サイト開設 ✿', en: 'Site opened ✿' },
    update2: { zh: 'UTAU 音源配布中', ja: 'UTAU 音源配布中', en: 'UTAU voicebanks available' },

    danmakuPlaceholder: { zh: '发条弹幕吧', ja: 'コメントをどうぞ', en: 'Leave a comment' },
    danmakuSend: { zh: '发送', ja: '送信', en: 'Send' },
    danmakuColorTitle: { zh: '选择弹幕颜色', ja: 'コメントの色を選ぶ', en: 'Pick a color' },
    danmakuHint: { zh: '点「发送」即可留言', ja: '「送信」でコメントできます', en: 'Hit Send to leave a comment' },
    danmakuStatusWait: { zh: '● 连接中…', ja: '● 接続中…', en: '● Connecting…' },
    danmakuStatusOn: { zh: '● 已连接', ja: '● 接続済み', en: '● Connected' },
    danmakuStatusOff: { zh: '○ 未连接', ja: '○ 未接続', en: '○ Offline' },

    galleryHint: { zh: '单击图片可放大', ja: 'クリックで拡大', en: 'Click to enlarge' },
    galleryEmpty: {
      zh: '暂无作品，往 picture 文件夹放图后刷新即可',
      ja: '作品がありません。picture フォルダに画像を入れて更新してください',
      en: 'No artworks yet — drop images into the picture folder and refresh'
    },

    step1b: { zh: '① 咨询沟通', ja: '① ご相談', en: '① Inquiry' },
    step1d: { zh: '私信说明用途／预算／工期，附上参考图与设定。', ja: 'DMで用途・予算・納期をお知らせください。参考画像と設定も添えて。', en: 'DM me the use, budget, and deadline, plus references and character info.' },
    step2b: { zh: '② 确认报价', ja: '② お見積もり', en: '② Quote' },
    step2d: { zh: '确认价格、排期与修改次数，约好交稿时间。', ja: '料金・スケジュール・修正回数を確認し、納期を決めます。', en: 'Confirm price, schedule, and revisions, and set the deadline.' },
    step3b: { zh: '③ 草稿确认', ja: '③ ラフ確認', en: '③ Sketch' },
    step3d: { zh: '先出草稿／线稿，构图 OK 再进入下一步。', ja: '先にラフ・線画をお見せし、構図OKで次へ進みます。', en: 'I send a sketch/lineart first; we proceed once the composition is approved.' },
    step4b: { zh: '④ 上色细化', ja: '④ 着色・仕上げ', en: '④ Coloring' },
    step4d: { zh: '上色、细化并交付预览，按约定修改。', ja: '着色・仕上げをしてプレビューをお渡しし、約束の範囲で修正します。', en: 'Color and polish, send a preview, and revise as agreed.' },
    step5b: { zh: '⑤ 完稿交付', ja: '⑤ 納品', en: '⑤ Delivery' },
    step5d: { zh: '结算尾款，发送高清成稿 ✿ 感谢委托！', ja: '残金を清算後、高解像度データをお送りします ✿ ご依頼ありがとうございます！', en: 'After the final payment, I send the hi-res files ✿ Thanks for commissioning me!' },
    commissionNote: { zh: '※ 具体流程以实际沟通为准，欢迎先来问价 ♡', ja: '※ 実際の流れは相談次第です。お気軽にお見積もりください ♡', en: '※ Actual process may vary — feel free to ask for a quote first ♡' },

    voiceSizeGhost: { zh: '约 65.3 MB · zip', ja: '約 65.3 MB · zip', en: '~65.3 MB · zip' },
    voiceSizeLin: { zh: '约 55.9 MB · zip', ja: '約 55.9 MB · zip', en: '~55.9 MB · zip' },
    voiceDownload: { zh: '↓ 下载', ja: '↓ ダウンロード', en: '↓ Download' },
    voiceNoteTitle: { zh: '使用说明：', ja: '使い方：', en: 'How to use:' },
    voiceNote: {
      zh: '下载并解压 zip，将音源文件夹放入 UTAU 的 voice 目录，编辑器内选择该音源即可使用。请勿二次配布或倒卖；转载／使用请标注音源作者。商用请先联系确认 ♡',
      ja: 'zipを解凍し、音源フォルダをUTAUのvoiceフォルダに入れて、エディタで選択すれば使用できます。二次配布・転売は禁止。転載・使用時は音源作者を明記してください。商用利用は事前にご連絡ください ♡',
      en: 'Unzip and place the voicebank folder into UTAU\'s voice folder, then select it in the editor. No redistribution or resale; please credit the author when using or sharing. Contact me for commercial use ♡'
    },

    footStart: { zh: '开始', ja: 'スタート', en: 'Start' },

    duckAria: { zh: '玩具鸭彩蛋', ja: 'おもちゃのアヒルのお楽しみ', en: 'Toy duck surprise' }
  };

  var STORE_KEY = 'cupcake-lang-v2';
  var LANGS = ['zh', 'ja', 'en'];
  var LANG_NAME = { zh: '中文', ja: '日本語', en: 'English' };

  function currentLang() {
    var s = null;
    try { s = localStorage.getItem(STORE_KEY); } catch (e) {}
    return LANGS.indexOf(s) !== -1 ? s : 'zh';
  }

  function t(key, vars) {
    var entry = DICT[key];
    var s = (entry && entry[currentLang()]) || (entry && entry.zh) || key;
    if (vars) {
      for (var k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
    }
    return s;
  }

  function apply() {
    var lang = currentLang();
    document.documentElement.lang = lang === 'ja' ? 'ja' : (lang === 'en' ? 'en' : 'zh-CN');

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      var val = DICT[key] && DICT[key][lang];
      if (val != null) el.textContent = val;
    }

    var ph = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < ph.length; j++) {
      var p = ph[j];
      var pk = p.getAttribute('data-i18n-placeholder');
      var pv = DICT[pk] && DICT[pk][lang];
      if (pv != null) p.setAttribute('placeholder', pv);
    }

    var tt = document.querySelectorAll('[data-i18n-title]');
    for (var m = 0; m < tt.length; m++) {
      var te = tt[m];
      var tk = te.getAttribute('data-i18n-title');
      var tv = DICT[tk] && DICT[tk][lang];
      if (tv != null) te.setAttribute('title', tv);
    }

    var ar = document.querySelectorAll('[data-i18n-aria]');
    for (var a = 0; a < ar.length; a++) {
      var ae = ar[a];
      var ak = ae.getAttribute('data-i18n-aria');
      var av = DICT[ak] && DICT[ak][lang];
      if (av != null) ae.setAttribute('aria-label', av);
    }

    // 下拉按钮与选中项
    var toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = LANG_NAME[lang] + ' ▾';
    var opts = document.querySelectorAll('.lang-opt');
    for (var b = 0; b < opts.length; b++) {
      opts[b].classList.toggle('active', opts[b].getAttribute('data-lang') === lang);
    }

    document.dispatchEvent(new CustomEvent('langchange'));
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply();
  }

  window.I18N = DICT;
  window.t = t;
  window.setLang = setLang;

  function closeMenu() {
    var menu = document.getElementById('langMenu');
    var toggle = document.getElementById('langToggle');
    if (menu) menu.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function bind() {
    var toggle = document.getElementById('langToggle');
    var menu = document.getElementById('langMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = menu.hidden;
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
    var opts = document.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          setLang(btn.getAttribute('data-lang'));
          closeMenu();
        });
      })(opts[i]);
    }
    document.addEventListener('click', function (e) {
      if (!document.getElementById('langDrop').contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
