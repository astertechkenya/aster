// scroll-theme.js: light everywhere except the portfolio, which is dark;
// and the two colours of the background lights (data-glow="#a #b" on each part).
//
// Each section that starts a new mood carries data-scroll-theme="light|dark" in index.html.
// The mood is set by the last of those whose top has passed the middle of the screen, so it
// changes as you reach a section, not the moment its first pixel appears. Sections without
// the attribute keep the mood of the one before them.
(function () {
  var marks = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-theme]'));
  var glows = Array.prototype.slice.call(document.querySelectorAll('[data-glow]'));
  if (!marks.length && !glows.length) return;
  var root = document.documentElement;
  var ticking = false;
  var lastGlow = null;

  function update() {
    ticking = false;
    var middle = window.innerHeight / 2;
    // The last marked part whose top has passed the middle of the screen decides.
    function current(list, attr) {
      var value = list.length ? list[0].getAttribute(attr) : null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].getBoundingClientRect().top <= middle) value = list[i].getAttribute(attr);
      }
      return value;
    }
    var theme = current(marks, 'data-scroll-theme');
    if (theme && root.getAttribute('data-theme') !== theme) root.setAttribute('data-theme', theme);
    var glow = current(glows, 'data-glow');
    if (glow && glow !== lastGlow) {
      lastGlow = glow;
      var pair = glow.trim().split(/\s+/);
      root.style.setProperty('--glow-a', pair[0]);
      root.style.setProperty('--glow-b', pair[1] || pair[0]);
    }
  }

  // At most one check per frame, however fast the scroll events arrive.
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();   // a page opened halfway down (a #link, or a reload) starts in the right mood
})();
