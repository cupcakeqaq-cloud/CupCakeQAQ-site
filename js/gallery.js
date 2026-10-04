/* 画廊：加载图片清单（优先后端 /api/gallery 实时扫描，回退 gallery.js 内嵌清单 / gallery.json）+ 灯箱 */
(function () {
  var grid = document.getElementById('galleryGrid');
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var lbClose = document.getElementById('lbClose');

  var images = [];

  function renderGrid() {
    grid.innerHTML = '';
    if (!images.length) {
      grid.innerHTML = '<div class="gallery-empty">' + window.t('galleryEmpty') + '</div>';
    } else {
      images.forEach(function (src) {
        var item = document.createElement('div');
        item.className = 'gallery-item';
        var img = document.createElement('img');
        img.src = encodeURI(src);
        img.loading = 'lazy';
        img.alt = src.split('/').pop();
        item.appendChild(img);
        item.addEventListener('click', function () { open(src); });
        grid.appendChild(item);
      });
    }
  }

  function open(src) {
    lbImg.src = encodeURI(src);
    lbCaption.textContent = src.split('/').pop();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }
  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function load() {
    fetch('/api/gallery')
      .then(function (r) { if (!r.ok) throw new Error('api'); return r.json(); })
      .then(function (d) { images = d.images || []; renderGrid(); })
      .catch(function () {
        // 没有后端时：用 gallery.js 里内嵌的清单（双击 index.html 也能显示）
        if (window.GALLERY_IMAGES && window.GALLERY_IMAGES.length) {
          images = window.GALLERY_IMAGES;
          renderGrid();
          return;
        }
        fetch('gallery.json')
          .then(function (r) { if (!r.ok) throw new Error('fb'); return r.json(); })
          .then(function (d) { images = d.images || []; renderGrid(); })
          .catch(function () { images = []; renderGrid(); });
      });
  }

  // 语言切换时，空状态文案跟着换
  document.addEventListener('langchange', function () {
    if (!images.length) renderGrid();
  });

  load();
})();
