/* 通用交互：任务栏时钟 + 访客计数器 */
(function () {
  var clock = document.getElementById('clock');
  function tick() {
    var d = new Date();
    clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  if (clock) { tick(); setInterval(tick, 15000); }

  // 访客计数器（本浏览器内累计，LED 显示纯数字）
  var counter = document.getElementById('visitCounter');
  var COUNT_KEY = 'cupcake-visits';
  var n = 1;
  try {
    var prev = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10) || 0;
    n = prev + 1;
    localStorage.setItem(COUNT_KEY, String(n));
  } catch (e) {}
  function setCounter() {
    if (counter) counter.textContent = String(n).padStart(6, '0');
  }
  setCounter();
})();
