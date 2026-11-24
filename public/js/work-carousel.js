// Aster: the portfolio's sideways row (css/sections.css, "The portfolio, a sideways row").
//
// The row scrolls on its own: a swipe, a trackpad, or Tab into a project all work without this
// script. This adds the bar under it and keeps it in step with wherever the row is: the
// "01 / 02", the name of the project the arrows lead to, the arrow that leads nowhere dimmed,
// and a line read out to screen readers when the project changes. It also sets the band's glow to the showing project's colour.
(function () {
  var track = document.getElementById('work-track');
  if (!track) return;
  var cases = track.querySelectorAll('.case');
  var buttons = document.querySelectorAll('.work__arrow');   // [previous, next]
  var pos = document.querySelector('.work__pos');
  var to = document.querySelector('.work__to');
  var live = document.querySelector('.work__live');
  if (!cases.length || buttons.length < 2) return;

  function name(i) { var h = cases[i].querySelector('h3'); return h ? h.textContent.trim() : 'project ' + (i + 1); }

  // Which project is showing: the one whose left edge is nearest the row's left edge
  function current() {
    var left = track.getBoundingClientRect().left, best = 0, bestGap = Infinity;
    for (var i = 0; i < cases.length; i++) {
      var gap = Math.abs(cases[i].getBoundingClientRect().left - left);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    return best;
  }

  var shown = -1;
  function update() {
    var i = current();
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    if (pos) { pos.querySelector('b').textContent = two(i + 1); pos.querySelector('span').textContent = '/ ' + two(cases.length); }
    var last = i === cases.length - 1;
    // the arrow that leads nowhere is dimmed (and moves keyboard focus to the other one if it had it)
    [[buttons[0], i === 0], [buttons[1], last]].forEach(function (pair, k) {
      if (pair[1] && document.activeElement === pair[0]) buttons[1 - k].focus();
      pair[0].disabled = pair[1];
    });
    // where the arrows lead: the next project, or from the last one, the one before it
    if (to) {
      to.firstChild.textContent = last ? 'Previous: ' : 'Next: ';
      to.querySelector('b').textContent = name(last ? i - 1 : i + 1);
    }
    var glow = cases[i].getAttribute('data-glow');
    if (glow) track.closest('.work').style.setProperty('--glow', glow);   // CSS fades it in
    if (live && i !== shown && shown !== -1) live.textContent = 'Project ' + (i + 1) + ' of ' + cases.length + ': ' + name(i);
    shown = i;
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = Math.min(cases.length - 1, Math.max(0, current() + Number(btn.dataset.dir)));
      // scroll the row (not the page) so that project's left edge lines up with the row's
      track.scrollTo({ left: cases[i].offsetLeft - cases[0].offsetLeft });
    });
  });

  // The tease: once the row is well in view and the visitor hasn't touched it, slide it a little
  // to show the next project's edge, then spring back. First after 1.5s, then twice more at
  // 7-second intervals if they still haven't moved it; any swipe, scroll, click or tap on the
  // row stops it for good. Skipped entirely for people who've asked for reduced motion.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window && cases.length > 1) {
    var timer = null, teases = 0, done = false;
    var tease = function () {
      if (done || current() !== 0) return;
      track.classList.remove('is-teasing');
      void track.offsetWidth;                         // restart the animation if it ran before
      track.classList.add('is-teasing');
      teases++;
      if (teases < 3) timer = setTimeout(tease, 7000);
    };
    var stop = function () { done = true; clearTimeout(timer); track.classList.remove('is-teasing'); };
    track.addEventListener('animationend', function () { track.classList.remove('is-teasing'); });
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (type) {
      track.addEventListener(type, stop, { passive: true, once: true });
    });
    buttons.forEach(function (btn) { btn.addEventListener('click', stop, { once: true }); });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        clearTimeout(timer);
        if (e.isIntersecting && !done) timer = setTimeout(tease, teases ? 7000 : 1500);
      });
    }, { threshold: 0.6 }).observe(track);
  }

  var ticking = false;
  track.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
