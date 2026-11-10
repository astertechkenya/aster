// Aster: the pinned portfolio (css/sections.css, "The portfolio, pinned").
//
// On a screen big enough to show a whole project at once, the projects' frame sticks below
// the header while you scroll through its tall stage. How far through the stage you are
// (0 to 1) decides which project shows: the first holds, then slides up as the second slides
// in from below, then the second holds, and the page carries on.
//
// The movement follows the scroll exactly (nothing plays on its own), so it stays in the
// visitor's hands. On phones and short windows the class is never added and the projects
// stack as normal.
(function () {
  var work = document.querySelector('.work');
  var stage = work && work.querySelector('.work__stage');
  if (!stage) return;
  var cases = stage.querySelectorAll('.case');
  var counter = stage.querySelector('.work__n');
  var fits = window.matchMedia('(min-width: 900px) and (min-height: 560px)');
  var ticking = false;

  // 0 to 1 through the stage -> how far the slide has got (0 = first project, 1 = second).
  // The first quarter and the last quarter hold still, so each project is seen at rest.
  function slide(p) {
    var t = Math.min(1, Math.max(0, (p - 0.25) / 0.5));
    return t * t * (3 - 2 * t);                      // smoothstep: eases in and out of the move
  }

  function update() {
    ticking = false;
    if (!work.classList.contains('work--pin')) return;
    var r = stage.getBoundingClientRect();
    var frameH = stage.firstElementChild.offsetHeight;
    var p = Math.min(1, Math.max(0, -r.top / (r.height - frameH)));
    var s = slide(p);
    for (var i = 0; i < cases.length; i++) {
      var offset = (i - s) * 100;                    // each project one frame-height apart
      cases[i].style.transform = 'translateY(' + offset + '%)';
      cases[i].style.opacity = String(1 - Math.min(1, Math.abs(i - s)) * 0.6);
      cases[i].style.pointerEvents = Math.abs(i - s) > 0.5 ? 'none' : '';   // the one out of view can't be clicked by mistake
    }
    if (counter) counter.textContent = s < 0.5 ? '01' : '02';
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function setMode() {
    var on = fits.matches;
    work.classList.toggle('work--pin', on);
    if (!on) {                                       // stacked: clear what the pin set
      for (var i = 0; i < cases.length; i++) {
        cases[i].style.transform = '';
        cases[i].style.opacity = '';
        cases[i].style.pointerEvents = '';
      }
    }
    update();
  }

  // Keyboard and screen-reader users reach both projects in order: when focus moves into a
  // project that's out of view, scroll to where that project is showing.
  stage.addEventListener('focusin', function (e) {
    if (!work.classList.contains('work--pin')) return;
    for (var i = 0; i < cases.length; i++) {
      if (!cases[i].contains(e.target)) continue;
      var r = stage.getBoundingClientRect();
      var span = r.height - stage.firstElementChild.offsetHeight;
      var top = window.scrollY + r.top + (i === 0 ? 0.1 : 0.9) * span;
      window.scrollTo(0, top);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (fits.addEventListener) fits.addEventListener('change', setMode);
  setMode();
})();
