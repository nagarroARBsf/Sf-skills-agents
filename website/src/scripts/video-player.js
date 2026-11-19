// Chapter video player: a YouTube-style player for a <figure data-player>.
//
// Markup (see sections/tutorial.html):
//   <figure data-player>
//     <div class="vp-stage"><video src="..." controls data-duration="12:18"></video></div>
//     <ol class="vp-chapters"><li data-t="0:00">Title</li>...</ol>
//   </figure>
//
// Without JavaScript the video keeps its native controls and the chapter list is plain text.
// With it, the native controls are replaced by: a progress bar split into one segment per chapter,
// a hover tip with time and chapter title, the current chapter next to the time, speed, full screen,
// keyboard shortcuts (space/k, arrows, j/l, m, f), and a clickable chapter list that follows playback.
(function () {
  'use strict';

  function parseTime(s) {
    return String(s).split(':').reduce(function (a, p) { return a * 60 + Number(p); }, 0);
  }
  function fmt(t) {
    t = Math.max(0, Math.floor(t || 0));
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
  }
  function track(name, data) { if (window.sfTrack) window.sfTrack(name, data); }

  var ICONS =
    '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' +
    '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/></svg>';
  var VOL =
    '<svg class="i-vol" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '<svg class="i-muted" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var FS =
    '<svg class="i-fs" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
    '<svg class="i-fs-exit" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  var CONTROLS =
    '<button class="vp-big" type="button" aria-label="Play video">' + ICONS + '</button>' +
    '<div class="vp-controls">' +
      '<div class="vp-bar" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0">' +
        '<div class="vp-segs"></div>' +
        '<div class="vp-thumb"></div>' +
        '<div class="vp-tip" hidden><span class="vp-tip-title"></span><span class="vp-tip-time"></span></div>' +
      '</div>' +
      '<div class="vp-row">' +
        '<button class="vp-btn vp-play" type="button" aria-label="Play">' + ICONS + '</button>' +
        '<button class="vp-btn vp-mute" type="button" aria-label="Mute">' + VOL + '</button>' +
        '<span class="vp-time"><span class="vp-cur">0:00</span> / <span class="vp-dur">0:00</span></span>' +
        '<button class="vp-chap" type="button" aria-label="Show chapters"><span class="vp-chap-title"></span><span aria-hidden="true">&rsaquo;</span></button>' +
        '<span class="vp-spacer"></span>' +
        '<button class="vp-btn vp-speed" type="button" aria-label="Playback speed">1&times;</button>' +
        '<button class="vp-btn vp-fs" type="button" aria-label="Full screen">' + FS + '</button>' +
      '</div>' +
    '</div>';

  var SPEEDS = [1, 1.25, 1.5, 2, 0.75];

  document.querySelectorAll('[data-player]').forEach(setup);

  function setup(root) {
    var video = root.querySelector('video');
    var stage = root.querySelector('.vp-stage');
    var list = root.querySelector('.vp-chapters');
    if (!video || !stage) return;
    var name = (video.getAttribute('src') || '').split('/').pop();

    var chapters = (list ? [].slice.call(list.querySelectorAll('li[data-t]')) : []).map(function (li) {
      var tEl = li.querySelector('.vp-ct');
      var title = li.textContent.replace(tEl ? tEl.textContent : '', '').trim();
      return { start: parseTime(li.getAttribute('data-t')), title: title, li: li };
    }).sort(function (a, b) { return a.start - b.start; });

    video.controls = false;
    stage.insertAdjacentHTML('beforeend', CONTROLS);
    root.classList.add('vp-ready');

    var $ = function (sel) { return stage.querySelector(sel); };
    var bar = $('.vp-bar'), segsEl = $('.vp-segs'), thumb = $('.vp-thumb');
    var tip = $('.vp-tip'), tipTitle = $('.vp-tip-title'), tipTime = $('.vp-tip-time');
    var cur = $('.vp-cur'), dur = $('.vp-dur'), chapBtn = $('.vp-chap'), chapTitle = $('.vp-chap-title');
    var playBtn = $('.vp-play'), bigBtn = $('.vp-big'), muteBtn = $('.vp-mute');
    var speedBtn = $('.vp-speed'), fsBtn = $('.vp-fs');

    var duration = parseTime(video.getAttribute('data-duration') || 0);
    var segs = [];
    var current = -1;

    // ---------- chapter segments ----------
    function buildSegments() {
      segsEl.textContent = '';
      segs = [];
      var marks = chapters.length ? chapters : [{ start: 0, title: '' }];
      marks.forEach(function (c, i) {
        var end = i + 1 < marks.length ? marks[i + 1].start : duration;
        var seg = document.createElement('div');
        seg.className = 'vp-seg';
        seg.style.flexGrow = Math.max(end - c.start, 0.001);
        seg.innerHTML = '<span class="vp-buf"></span><span class="vp-fill"></span>';
        segsEl.appendChild(seg);
        segs.push({ el: seg, start: c.start, end: end, fill: seg.lastChild, buf: seg.firstChild });
      });
      dur.textContent = fmt(duration);
      bar.setAttribute('aria-valuemax', Math.floor(duration));
    }

    function chapterAt(t) {
      for (var i = chapters.length - 1; i >= 0; i--) if (t >= chapters[i].start) return i;
      return chapters.length ? 0 : -1;
    }

    function render() {
      var t = video.currentTime;
      var bufEnd = 0;
      for (var b = 0; b < video.buffered.length; b++) {
        if (video.buffered.start(b) <= t + 0.5) bufEnd = Math.max(bufEnd, video.buffered.end(b));
      }
      segs.forEach(function (s) {
        var len = s.end - s.start || 1;
        s.fill.style.transform = 'scaleX(' + Math.min(Math.max((t - s.start) / len, 0), 1) + ')';
        s.buf.style.transform = 'scaleX(' + Math.min(Math.max((bufEnd - s.start) / len, 0), 1) + ')';
      });
      thumb.style.left = (duration ? (t / duration) * 100 : 0) + '%';
      cur.textContent = fmt(t);
      bar.setAttribute('aria-valuenow', Math.floor(t));
      bar.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(duration));

      var i = chapterAt(t);
      if (i !== current) {
        if (current >= 0) { chapters[current].li.classList.remove('is-current'); chapters[current].li.removeAttribute('aria-current'); }
        current = i;
        if (i >= 0) {
          var c = chapters[i];
          c.li.classList.add('is-current');
          c.li.setAttribute('aria-current', 'true');
          chapTitle.textContent = c.title;
          followInList(c.li);
        }
      }
    }

    // Keep the current chapter visible inside the list without scrolling the page.
    function followInList(li) {
      if (!list) return;
      var top = li.offsetTop, bottom = top + li.offsetHeight;
      if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = top - list.clientHeight / 2 + li.offsetHeight / 2;
      }
    }

    function seek(t) {
      video.currentTime = Math.min(Math.max(t, 0), Math.max(duration - 0.1, 0));
      render();
    }
    function toggle() {
      if (video.paused || video.ended) video.play(); else video.pause();
    }

    // ---------- progress bar: click, drag, hover tip ----------
    function timeAt(clientX) {
      var r = bar.getBoundingClientRect();
      return Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * duration;
    }
    function showTip(clientX) {
      var t = timeAt(clientX), r = bar.getBoundingClientRect();
      var i = chapterAt(t);
      tipTitle.textContent = i >= 0 ? chapters[i].title : '';
      tipTime.textContent = fmt(t);
      tip.hidden = false;
      var half = tip.offsetWidth / 2;
      var x = Math.min(Math.max(clientX - r.left, half), r.width - half);
      tip.style.left = x + 'px';
      segs.forEach(function (s, k) { s.el.classList.toggle('is-hover', k === i || (i < 0 && k === 0)); });
    }
    function hideTip() {
      tip.hidden = true;
      segs.forEach(function (s) { s.el.classList.remove('is-hover'); });
    }
    var dragging = false;
    bar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      root.classList.add('vp-dragging');
      seek(timeAt(e.clientX));
      showTip(e.clientX);
    });
    bar.addEventListener('pointermove', function (e) {
      if (dragging) seek(timeAt(e.clientX));
      if (e.pointerType !== 'touch' || dragging) showTip(e.clientX);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('vp-dragging');
      hideTip();
    }
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
    bar.addEventListener('pointerleave', function () { if (!dragging) hideTip(); });

    // ---------- buttons ----------
    playBtn.addEventListener('click', toggle);
    bigBtn.addEventListener('click', toggle);
    video.addEventListener('click', toggle);
    video.addEventListener('dblclick', toggleFullscreen);
    muteBtn.addEventListener('click', function () { video.muted = !video.muted; });
    speedBtn.addEventListener('click', function () {
      var next = SPEEDS[(SPEEDS.indexOf(video.playbackRate) + 1) % SPEEDS.length] || 1;
      video.playbackRate = next;
      speedBtn.textContent = next + '×';
    });
    chapBtn.addEventListener('click', function () {
      if (!list) return;
      if (document.fullscreenElement) document.exitFullscreen();
      list.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (current >= 0) followInList(chapters[current].li);
    });

    function toggleFullscreen() {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      if (stage.requestFullscreen) stage.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone: native player
    }
    fsBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', function () {
      var on = document.fullscreenElement === stage;
      root.classList.toggle('vp-fullscreen', on);
      fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    });

    // ---------- chapter list ----------
    chapters.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      while (c.li.firstChild) btn.appendChild(c.li.firstChild);
      c.li.appendChild(btn);
      btn.addEventListener('click', function () {
        seek(c.start);
        video.play();
        track('video_chapter', { video: name, chapter: c.title });
      });
    });

    // ---------- keyboard (when focus is inside the player) ----------
    stage.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var onButton = e.target.tagName === 'BUTTON';
      switch (e.key) {
        case ' ': if (onButton) return; toggle(); break;
        case 'k': case 'K': toggle(); break;
        case 'ArrowLeft': seek(video.currentTime - 5); break;
        case 'ArrowRight': seek(video.currentTime + 5); break;
        case 'j': case 'J': seek(video.currentTime - 10); break;
        case 'l': case 'L': seek(video.currentTime + 10); break;
        case 'Home': seek(0); break;
        case 'End': seek(duration); break;
        case 'm': case 'M': video.muted = !video.muted; break;
        case 'f': case 'F': toggleFullscreen(); break;
        default: return;
      }
      e.preventDefault();
      wake();
    });

    // ---------- hide the controls while playing and idle ----------
    var idleTimer = 0;
    function wake() {
      root.classList.remove('vp-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!video.paused && !dragging) root.classList.add('vp-idle');
      }, 2500);
    }
    stage.addEventListener('pointermove', wake);
    stage.addEventListener('focusin', wake);
    stage.addEventListener('pointerleave', function () { if (!video.paused) root.classList.add('vp-idle'); });

    // ---------- video state ----------
    function syncState() {
      var playing = !video.paused && !video.ended;
      root.classList.toggle('vp-playing', playing);
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      if (!playing) root.classList.remove('vp-idle'); else wake();
    }
    video.addEventListener('play', function () { root.classList.add('vp-started'); syncState(); });
    video.addEventListener('pause', syncState);
    video.addEventListener('ended', syncState);
    video.addEventListener('volumechange', function () {
      root.classList.toggle('vp-muted', video.muted);
      muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
    });
    video.addEventListener('timeupdate', render);
    video.addEventListener('progress', render);
    video.addEventListener('loadedmetadata', function () {
      if (isFinite(video.duration) && video.duration > 0) { duration = video.duration; buildSegments(); render(); }
    });

    buildSegments();
    render();
  }
})();
