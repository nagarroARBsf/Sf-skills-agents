// Install section: the coding-agent card rail.
// Clicking a card shows its install panel: Claude Code's instructions, or a "coming soon" panel for
// the agents whose packages are not released yet. The arrow buttons scroll the rail one card at a time.
(function () {
  var rail = document.getElementById('agentRail');
  if (!rail) return;
  var cards = rail.querySelectorAll('.agent-card');
  var claude = document.getElementById('agentPanel-claude');
  var soon = document.getElementById('agentPanel-soon');
  var track = function (n, p) { if (window.sfTrack) window.sfTrack(n, p); };

  function pick(card, reveal) {
    cards.forEach(function (c) { c.classList.toggle('is-selected', c === card); });
    var isClaude = card.dataset.agent === 'claude';
    claude.hidden = !isClaude;
    soon.hidden = isClaude;
    if (!isClaude) {
      soon.querySelectorAll('[data-soon-name]').forEach(function (el) { el.textContent = card.dataset.name; });
      track('agent_coming_soon', { agent: card.dataset.agent });
    }
    if (reveal) (isClaude ? claude : soon).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  rail.addEventListener('click', function (e) {
    var card = e.target.closest('.agent-card');
    if (!card) return;
    if (e.target.closest('a[download]')) { pick(card, false); return; } // let the download start
    pick(card, !!e.target.closest('[data-soon]'));
  });
  rail.addEventListener('keydown', function (e) {
    var card = e.target.closest && e.target.closest('.agent-card');
    if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(card, true); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-agent-pick]');
    if (!b) return;
    var card = rail.querySelector('[data-agent="' + b.dataset.agentPick + '"]');
    if (card) { pick(card, true); card.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }); }
  });

  // ---------- arrows ----------
  var prev = document.querySelector('.rail-btn.prev');
  var next = document.querySelector('.rail-btn.next');
  function arrows() {
    prev.hidden = rail.scrollLeft <= 4;
    next.hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    rail.parentNode.classList.toggle('at-end', next.hidden);
  }
  document.querySelectorAll('.rail-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var step = cards[0].getBoundingClientRect().width + 12;
      rail.scrollBy({ left: step * +b.dataset.rail * Math.max(1, Math.floor(rail.clientWidth / step) - 1), behavior: 'smooth' });
    });
  });
  rail.addEventListener('scroll', arrows, { passive: true });
  window.addEventListener('resize', arrows);
  arrows();

  // ---------- the overview emblem: stop its animation for visitors who ask for less motion ----------
  var emblem = document.querySelector('.emblem');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  function motion() { if (emblem && emblem.pauseAnimations) { if (still && still.matches) emblem.pauseAnimations(); else emblem.unpauseAnimations(); } }
  motion();
  if (still && still.addEventListener) still.addEventListener('change', motion);
})();
