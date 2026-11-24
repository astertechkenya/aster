// Aster: the process, one step at a time (css/sections.css, "Process: one step at a time").
//
// The four numbered tabs follow the ARIA tabs pattern, like the website packages: click or tap a
// step to open it; with the keyboard, Left/Right move between steps (and open them), Home/End jump
// to the first/last, and only the open tab is in the Tab order.
//
// When the section is first well in view, the steps play on their own: each stays open for a few
// seconds (a yellow bar fills under its tab to show it), then the next opens, round all four
// once. Anything the visitor does in the section (a click, a tap, a key) stops it for good, and
// it pauses while the pointer rests on it. People who ask for less motion get no autoplay.
// Without this script there are no tabs and all four steps simply show.
(function () {
  var proc = document.querySelector('.proc');
  if (!proc) return;
  var tabs = [].slice.call(proc.querySelectorAll('[role="tab"]'));
  var panes = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var DWELL = 5000;                                          // ms each step stays open while playing
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var at = 0;

  function open(i, focus) {
    if (i !== at) {
      panes[i].classList.remove('is-in');
      void panes[i].offsetWidth;                             // restart the arrival animation
      panes[i].classList.add('is-in');
    }
    at = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panes[k].hidden = !on;
    });
    proc.style.setProperty('--at', i);                       // slides the ink rule under the open tab
    if (focus) tabs[i].focus();
  }

  proc.classList.add('is-ready');
  open(0, false);

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { open(i); });
    tab.addEventListener('keydown', function (e) {
      var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      open((to + tabs.length) % tabs.length, true);         // wraps round at either end
    });
  });

  /* ---------- playing on its own ---------- */
  if (reduce || !('IntersectionObserver' in window)) return;
  var timer = null, playing = false, stopped = false, shown = 1;
  proc.style.setProperty('--dwell', DWELL + 'ms');

  function tick() {
    if (shown >= tabs.length) { stop(); return; }            // round all four once, then rest on the last
    shown++;
    open((at + 1) % tabs.length);
    restartBar();
    timer = setTimeout(tick, DWELL);
  }
  function restartBar() {                                    // the yellow timer under the open tab starts again
    proc.classList.remove('is-auto'); void proc.offsetWidth; proc.classList.add('is-auto');
  }
  function play() {
    if (stopped || playing) return;
    playing = true; restartBar();
    timer = setTimeout(tick, DWELL);
  }
  function pause() { playing = false; clearTimeout(timer); proc.classList.remove('is-auto'); }
  function stop() { stopped = true; pause(); }

  ['pointerdown', 'keydown'].forEach(function (type) { proc.addEventListener(type, stop, { once: true }); });
  proc.addEventListener('mouseenter', pause);
  proc.addEventListener('mouseleave', function () { if (!stopped) play(); });
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) play(); else pause(); });
  }, { threshold: 0.5 }).observe(proc);
})();
