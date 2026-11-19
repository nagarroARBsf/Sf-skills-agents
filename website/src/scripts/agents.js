// Card rails: the coding-agent rail in Install and the six-agent rail in Agents.
// Clicking a card selects it and shows its panel below the rail. The arrow buttons scroll a rail
// one screen of cards at a time.
(function () {
  var track = function (n, p) { if (window.sfTrack) window.sfTrack(n, p); };

  // rail: the .agent-rail element; panelFor(card) returns the panel to show (others are hidden).
  function setupRail(rail, panels, panelFor, onPick) {
    var cards = rail.querySelectorAll('.agent-card');
    var wrap = rail.parentNode;

    function pick(card, reveal) {
      cards.forEach(function (c) { c.classList.toggle('is-selected', c === card); });
      var show = panelFor(card);
      panels.forEach(function (p) { p.hidden = p !== show; });
      if (onPick) onPick(card);
      if (reveal && show) show.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
