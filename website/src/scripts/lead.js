// Email sign-up: opens the dialog from "Talk to us", after a download, and from the corner nudge.
//
// Modes (data-lead-open="<mode>"):
//   updates   "Get SF-SDLC updates"
//   talk      "Talk to us", with a message box
//   download  shown just after a download starts; never blocks the download
//   nudge     the corner card's "Get updates" button
//
// The form posts JSON to config.lead.endpoint (the Azure Function in website/api/lead).
// This browser remembers only whether the visitor already signed up or dismissed the prompt
// (localStorage, no cookies), so the nudge and the download prompt are not shown again.
(function () {
  var cfg = (window.SFSDLC_CONFIG && window.SFSDLC_CONFIG.lead) || {};
  var dialog = document.getElementById('leadDialog');
  var form = document.getElementById('leadForm');
  if (cfg.enabled === false || !dialog || !form || typeof dialog.showModal !== 'function') return;

  var KEY = 'sfsdlc-lead';
  var DAY = 864e5;
  var track = function (n, p) { if (window.sfTrack) window.sfTrack(n, p); };
  var $ = function (id) { return document.getElementById(id); };
  var done = $('leadDone');
  var status = $('leadStatus');
  var submit = $('leadSubmit');
  var nudge = $('leadNudge');
  var mode = 'updates';

  var COPY = {
    updates: ['Stay in touch', 'Get SF-SDLC updates', 'New releases, videos and guides for the framework. No spam, and you can unsubscribe at any time.'],
    nudge: ['Stay in touch', 'Get SF-SDLC updates', 'New releases, videos and guides for the framework. No spam, and you can unsubscribe at any time.'],
    talk: ['Talk to us', 'Use SF-SDLC on your project', 'Tell us a little about your Salesforce project and the Nagarro team will get back to you.'],
    download: ['Your download has started', 'Want to hear about new releases?', 'Leave your email and we will tell you when a new version, video or guide is out.']
  };

  // ---------- remembered state ----------
  function state() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(patch) {
    var s = state();
    for (var k in patch) s[k] = patch[k];
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function quiet() {
    var s = state();
    var snooze = (+cfg.snoozeDays || 30) * DAY;
    return !!s.submitted || (s.dismissedAt && Date.now() - s.dismissedAt < snooze);
  }

  // ---------- open / close ----------
  function open(m) {
    mode = COPY[m] ? m : 'updates';
    var c = COPY[mode];
    $('leadEyebrow').textContent = c[0];
    $('leadTitle').textContent = c[1];
    $('leadIntro').textContent = c[2];
    $('leadMessageField').hidden = mode !== 'talk';
    submit.textContent = mode === 'talk' ? 'Send' : 'Submit';
    form.hidden = false;
    done.hidden = true;
    status.textContent = '';
    status.className = 'lead-status';
    hideNudge();
    if (!dialog.open) dialog.showModal();
    var email = form.elements.email;
    setTimeout(function () { email.focus(); }, 30);
    track('lead_open', { mode: mode });
  }
  function close(reason) {
    if (!dialog.open) return;
    var wasSent = !done.hidden;
    dialog.close();
    if (!wasSent) {
      save({ dismissedAt: Date.now() });
      track('lead_dismissed', { mode: mode, how: reason || 'button' });
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-lead-open]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-lead-open')); return; }
    if (e.target.closest && e.target.closest('[data-lead-close]')) { e.preventDefault(); close('button'); }
  });
  // a click on the dimmed backdrop (outside the dialog box) closes it
  dialog.addEventListener('click', function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close('backdrop');
  });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close('escape'); });

  // ---------- after a download ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[download]');
    if (!a || quiet()) return;
    var s = state();
    if (s.downloadPromptAt && Date.now() - s.downloadPromptAt < DAY) return;
    save({ downloadPromptAt: Date.now() });
    setTimeout(function () { open('download'); }, 700); // let the download start first
  });

  // ---------- corner nudge: after scrolling or time on page ----------
  var nudgeShown = false;
  function showNudge(trigger) {
    if (nudgeShown || quiet() || dialog.open || !nudge) return;
    try { if (sessionStorage.getItem('sfsdlc-nudge')) return; sessionStorage.setItem('sfsdlc-nudge', '1'); } catch (e) {}
    nudgeShown = true;
    nudge.hidden = false;
    track('lead_prompt_shown', { trigger: trigger });
    stopWatching();
  }
  function hideNudge() { if (nudge) nudge.hidden = true; }
  if (nudge) {
    $('leadNudgeClose').addEventListener('click', function () {
      hideNudge();
      save({ dismissedAt: Date.now() });
      track('lead_dismissed', { mode: 'nudge', how: 'button' });
    });
  }

  var scrollAt = +cfg.nudgeScrollPercent || 60;
  var timeAt = +cfg.nudgeAfterSeconds || 45;
  var visible = 0;
  var tick = setInterval(function () {
    if (document.visibilityState === 'visible' && ++visible >= timeAt) showNudge('time');
  }, 1000);
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && (window.scrollY / h) * 100 >= scrollAt) showNudge('scroll');
  }
  function stopWatching() { clearInterval(tick); window.removeEventListener('scroll', onScroll); }
  if (cfg.nudge === false || quiet()) stopWatching();
  else window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- submit ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var email = f.email.value.trim();
    status.className = 'lead-status error';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'Please enter a valid email address.'; f.email.focus(); return; }
    if (!f.consent.checked) { status.textContent = 'Please tick the box to agree to be contacted.'; f.consent.focus(); return; }
    if (!cfg.endpoint) { status.textContent = 'Sign-up is not connected yet. Please try again later.'; return; }

    var body = {
      email: email,
      name: f.name.value.trim(),
      company: f.company.value.trim(),
      message: mode === 'talk' ? f.message.value.trim() : '',
      source: mode,
      page: location.pathname + location.hash,
      consent: true,
      consentText: $('leadConsentText').textContent.replace(/\s+/g, ' ').trim(),
      website: f.website.value // spam trap
    };
    submit.disabled = true;
    status.className = 'lead-status';
    status.textContent = 'Sending…';
    fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.error) || 'Something went wrong. Please try again.');
        save({ submitted: Date.now() });
        track('lead_submitted', { mode: mode });
        form.reset();
        form.hidden = true;
        done.hidden = false;
        hideNudge();
        stopWatching();
      })
      .catch(function (err) {
        status.className = 'lead-status error';
        status.textContent = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not send. Please check your connection and try again.';
      })
      .then(function () { submit.disabled = false; });
  });
})();
