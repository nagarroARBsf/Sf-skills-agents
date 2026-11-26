// Page behaviour shared by every section: segmented tabs, copy buttons, theme, mobile nav, scroll spy.
(function () {
  function codeText(id) { var el = document.getElementById(id); return el ? el.textContent.replace(/^\n+|\s+$/g, '') : ''; }

  // ---------- segmented tabs ----------
  document.querySelectorAll('.seg[data-tabs]').forEach(function (seg) {
    var btns = seg.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) {
          o.setAttribute('aria-selected', String(o === b));
          var p = document.getElementById(o.dataset.target);
          if (p) p.hidden = o !== b;
        });
      });
    });
  });

  // ---------- copy buttons ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copy');
    if (!b) return;
    var text = b.dataset.copy ? document.getElementById(b.dataset.copy).textContent : codeText(b.dataset.copyText);
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); };
    try { navigator.clipboard.writeText(text).then(done, function () {}); } catch (err) { /* clipboard unavailable */ }
  });

  // ---------- theme ----------
  var root = document.documentElement;
  try { var saved = localStorage.getItem('sfsdlc-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('sfsdlc-theme', root.dataset.theme); } catch (e) {}
  });

  // ---------- mobile nav ----------
  var menuBtn = document.getElementById('menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.sidebar a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); });
  });

  // ---------- scroll spy ----------
  var links = document.querySelectorAll('.sidebar a');
  var tabs = document.querySelectorAll('.tabs a');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  function spy() {
    var y = window.scrollY + 110, current = sections[0];
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections[sections.length - 1];
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current.id); });
    tabs.forEach(function (a) { a.classList.toggle('active', a.dataset.tab === current.dataset.tab); });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();
})();