// Visitor analytics with Azure Application Insights, cookieless.
//
// What is recorded (nothing personal, no cookies, no email addresses):
//   page view            every visit
//   engaged              the tab was visible for config.analytics.engagedSeconds (default 20)
//   scroll_depth         25 / 50 / 75 / 100 % of the page, once each
//   section_view         each section the visitor stopped on for a second, once each
//   download             a zip or video download link was clicked
//   video_play / video_complete
//   video_chapter        a chapter was picked in the tutorial player (scripts/video-player.js)
//   outbound_click       a link to another site (GitHub, nagarro.com)
//   lead_*               the sign-up form was shown / sent / dismissed (never its contents)
//   page_exit            seconds the tab was visible, sent when the visitor leaves
//
// Off when site.config.json has no connection string, and for visitors whose browser sends
// Do Not Track or Global Privacy Control. Other scripts call window.sfTrack(name, props).
(function () {
  var cfg = (window.SFSDLC_CONFIG && window.SFSDLC_CONFIG.analytics) || {};
  var queue = [];
  var ai = null;

  window.sfTrack = function (name, props) {
    if (ai) ai.trackEvent({ name: name, properties: props || {} });
    else if (queue) queue.push([name, props || {}]);
  };

  var optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  if (!cfg.connectionString || optedOut) { queue = null; return; }

  // ---------- load the SDK ----------
  var s = document.createElement('script');
  s.src = cfg.sdkUrl || 'https://js.monitor.azure.com/scripts/b/ai.3.gbl.min.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.onload = function () {
    try {
      var AI = window.Microsoft && window.Microsoft.ApplicationInsights;
      var inst = new AI.ApplicationInsights({ config: {
        connectionString: cfg.connectionString,
        disableCookiesUsage: true,        // no cookies: no consent banner needed
        disableAjaxTracking: true,        // do not record the sign-up request
        disableFetchTracking: true,
        isBeaconApiDisabled: false,       // allow sendBeacon, so the exit event survives the page closing
        onunloadDisableBeacon: false,
        enableAutoRouteTracking: false,
        disableExceptionTracking: false   // keep JavaScript errors: they show broken pages
      } });
      inst.loadAppInsights();
      inst.trackPageView({ name: document.title, properties: { referrerHost: refHost() } });
      ai = inst;
      queue.forEach(function (q) { ai.trackEvent({ name: q[0], properties: q[1] }); });
      queue = null;
    } catch (e) { queue = null; }
  };
  s.onerror = function () { queue = null; };
  document.head.appendChild(s);

  function refHost() {
    try { return document.referrer ? new URL(document.referrer).host : '(direct)'; } catch (e) { return '(unknown)'; }
  }

  // ---------- visible time and the "engaged" event ----------
  var visibleSec = 0;
  var engagedAt = +cfg.engagedSeconds || 20;
  var engagedSent = false;
  var timer = setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    visibleSec++;
    if (!engagedSent && visibleSec >= engagedAt) {
      engagedSent = true;
      window.sfTrack('engaged', { seconds: String(engagedAt) });
    }
  }, 1000);
  // sent when the tab is hidden or closed (the last moment a browser reliably allows a request);
  // a visitor who comes back and leaves again sends an updated value
  var lastExit = -1;
  function sendExit() {
    if (visibleSec === lastExit) return;
    lastExit = visibleSec;
    window.sfTrack('page_exit', { visibleSeconds: String(visibleSec), maxScroll: String(maxScroll) });
    // onunloadFlush sends with sendBeacon, the only request a closing page is allowed to make
    if (ai) try { if (ai.onunloadFlush) ai.onunloadFlush(false); else ai.flush(false); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') sendExit(); });
  window.addEventListener('pagehide', sendExit);

  // ---------- scroll depth ----------
  var marks = [25, 50, 75, 100];
  var maxScroll = 0;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
    while (marks.length && pct >= marks[0]) {
      maxScroll = marks.shift();
      window.sfTrack('scroll_depth', { percent: String(maxScroll) });
    }
    if (!marks.length) window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- sections reached ----------
  if ('IntersectionObserver' in window) {
    // a section counts once it has stayed in the middle of the screen for a second, so scrolling
    // past it (or a sidebar jump that animates through it) does not count as reading it
    var seen = {};
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = en.target.id;
        if (seen[id]) return;
        if (en.isIntersecting) {
          timers[id] = setTimeout(function () {
            seen[id] = true;
            io.unobserve(en.target);
            window.sfTrack('section_view', { section: id });
          }, 1000);
        } else {
          clearTimeout(timers[id]);
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (sec) { io.observe(sec); });
  }

  // ---------- downloads and outbound links ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (a.hasAttribute('download')) {
      window.sfTrack('download', { file: href.split('/').pop() });
    } else if (a.host && a.host !== location.host) {
      window.sfTrack('outbound_click', { host: a.host });
    }
  });

  // ---------- video ----------
  document.querySelectorAll('video').forEach(function (v) {
    var played = false;
    v.addEventListener('play', function () {
      if (played) return;
      played = true;
      window.sfTrack('video_play', { video: (v.currentSrc || '').split('/').pop() });
    });
    v.addEventListener('ended', function () {
      window.sfTrack('video_complete', { video: (v.currentSrc || '').split('/').pop() });
    });
  });
})();
