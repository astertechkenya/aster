// Aster: draw each hand-drawn mark (css/marks.css) the first time it scrolls into view.
// One observer watches them all; once a mark is drawn it's left alone, so scrolling back up
// doesn't replay it.
(function () {
  var marks = document.querySelectorAll('.mark');
  if (!marks.length) return;

  // How long each line is ON SCREEN, in pixels. The SVG is stretched to fit its word, and its
  // pen line isn't (vector-effect: non-scaling-stroke), so the dash that draws it has to be
  // measured after the stretch: walk along the path and add up the on-screen steps.
  function measure(mark) {
    var paths = mark.querySelectorAll('path');
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i], m = p.getScreenCTM();
      if (!m) continue;
      var total = p.getTotalLength(), steps = 48, len = 0, prev = null;
      for (var s = 0; s <= steps; s++) {
        var pt = p.getPointAtLength(total * s / steps);
        var x = m.a * pt.x + m.c * pt.y, y = m.b * pt.x + m.d * pt.y;
        if (prev) len += Math.hypot(x - prev[0], y - prev[1]);
        prev = [x, y];
      }
      p.style.setProperty('--len', Math.ceil(len + 2) + 'px');   // +2: no sliver left at the end
    }
  }

  function draw(mark) {
    measure(mark);
    mark.getBoundingClientRect();          // let the browser take in --len before it animates
    mark.classList.add('is-drawn');
    // When the last line has finished, drop the dash so a resize can't leave a gap in it
    setTimeout(function () { mark.classList.add('is-done'); }, 2000);
  }

  // Very old browsers: just show them
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < marks.length; i++) marks[i].classList.add('is-drawn', 'is-done');
    return;
  }

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      seen.unobserve(e.target);
      // A short pause after the word arrives, so the reader sees the pen start
      setTimeout(function () { draw(e.target); }, 250);
    });
  }, {
    // Wait until the word is well onto the screen (above the bottom 15%), not at its very edge
    rootMargin: '0px 0px -15% 0px',
    // Most of it on screen. Not all: a mark inside a tilted note never quite counts as
    // fully visible, and would never be drawn.
    threshold: 0.6
  });

  for (var j = 0; j < marks.length; j++) seen.observe(marks[j]);
})();
