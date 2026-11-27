// Card rails: the coding-agent rail in Install and the agent rail in Agents.
// Clicking a card selects it and shows its panel below the rail. The arrow buttons scroll a rail
// one screen of cards at a time; picking a card centres it so the next cards come into view.
(function () {
  var track = function (n, p) { if (window.sfTrack) window.sfTrack(n, p); };
  var lessMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  function calm() { return !!(lessMotion && lessMotion.matches); }

  // rail: the .agent-rail element; panelFor(card) returns the panel to show (others are hidden).
  function setupRail(rail, panels, panelFor, onPick) {
    var cards = rail.querySelectorAll('.agent-card');
    var wrap = rail.parentNode;

    // Scroll the rail so the picked card sits in the middle: picking a card near the right edge
    // brings the next cards into view, so nobody takes the visible cards for the whole set.
    // Returns true when the rail had to move.
    function center(card) {
      var r = rail.getBoundingClientRect(), c = card.getBoundingClientRect();
      var max = rail.scrollWidth - rail.clientWidth;
      var left = Math.max(0, Math.min(max, rail.scrollLeft + (c.left - r.left) - (rail.clientWidth - c.width) / 2));
      if (Math.abs(left - rail.scrollLeft) < 4) return false;
      rail.scrollTo({ left: left, behavior: calm() ? 'auto' : 'smooth' });
      return true;
    }

    function pick(card, reveal) {
      cards.forEach(function (c) { c.classList.toggle('is-selected', c === card); });
      var show = panelFor(card);
      panels.forEach(function (p) { p.hidden = p !== show; });
      if (onPick) onPick(card);
      var moved = center(card);
      // Two smooth scrolls started together can cancel each other, so the page waits for the rail.
      if (reveal && show) setTimeout(function () { show.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'nearest' }); }, moved && !calm() ? 420 : 0);
    }

    rail.addEventListener('click', function (e) {
      var card = e.target.closest('.agent-card');
      if (!card) return;
      if (e.target.closest('a[download]')) { pick(card, false); return; } // let the download start
      pick(card, !!e.target.closest('[data-soon], [data-crew-more]'));
    });
    rail.addEventListener('keydown', function (e) {
      var card = e.target.closest && e.target.closest('.agent-card');
      if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(card, true); }
    });

    var prev = wrap.querySelector('.rail-btn.prev');
    var next = wrap.querySelector('.rail-btn.next');
    function arrows() {
      if (!prev || !next) return;
      prev.hidden = rail.scrollLeft <= 4;
      next.hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      wrap.classList.toggle('at-end', next.hidden);
    }
    wrap.querySelectorAll('.rail-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = cards[0].getBoundingClientRect().width + 12;
        rail.scrollBy({ left: step * +b.dataset.rail * Math.max(1, Math.floor(rail.clientWidth / step) - 1), behavior: 'smooth' });
      });
    });
    rail.addEventListener('scroll', arrows, { passive: true });
    window.addEventListener('resize', arrows);
    arrows();

    // The first time the rail comes into view, nudge it to the right and back, once, to show
    // that more cards are waiting. Skipped for visitors who ask for less motion.
    if ('IntersectionObserver' in window && !calm()) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        if (rail.scrollLeft > 4 || rail.scrollWidth - rail.clientWidth < 40) return;
        var by = Math.min(cards[0].getBoundingClientRect().width * .6, rail.scrollWidth - rail.clientWidth);
        setTimeout(function () {
          rail.style.scrollSnapType = 'none';
          rail.scrollTo({ left: by, behavior: 'smooth' });
          setTimeout(function () {
            rail.scrollTo({ left: 0, behavior: 'smooth' });
            setTimeout(function () { rail.style.scrollSnapType = ''; }, 600);
          }, 750);
        }, 500);
      }, { threshold: .6 });
      io.observe(rail);
    }
    return pick;
  }

  // ---------- Install: Claude Code instructions, or a "coming soon" panel ----------
  var agentRail = document.getElementById('agentRail');
  if (agentRail) {
    var claude = document.getElementById('agentPanel-claude');
    var soon = document.getElementById('agentPanel-soon');
    var pickAgent = setupRail(agentRail, [claude, soon],
      function (card) { return card.dataset.agent === 'claude' ? claude : soon; },
      function (card) {
        if (card.dataset.agent === 'claude') return;
        soon.querySelectorAll('[data-soon-name]').forEach(function (el) { el.textContent = card.dataset.name; });
        track('agent_coming_soon', { agent: card.dataset.agent });
      });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-agent-pick]');
      if (!b) return;
      var card = agentRail.querySelector('[data-agent="' + b.dataset.agentPick + '"]');
      if (card) { pickAgent(card, true); card.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }); }
    });
  }

  // ---------- Agents: one detail panel per agent ----------
  var crewRail = document.getElementById('crewRail');
  if (crewRail) {
    var crewPanels = Array.prototype.slice.call(document.querySelectorAll('.crew-panel'));
    setupRail(crewRail, crewPanels,
      function (card) { return document.getElementById('crewPanel-' + card.dataset.agent); },
      function (card) { track('agent_details', { agent: card.dataset.agent }); });
  }

  // ---------- the overview emblem: stop its animation for visitors who ask for less motion ----------
  var emblem = document.querySelector('.emblem');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  function motion() { if (emblem && emblem.pauseAnimations) { if (still && still.matches) emblem.pauseAnimations(); else emblem.unpauseAnimations(); } }
  motion();
  if (still && still.addEventListener) still.addEventListener('change', motion);
})();
