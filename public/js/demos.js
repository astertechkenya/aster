// Aster: the Google SEO demo (css/sections.css); the website packages' phone is js/tiers.js. Each starts when most of it is on screen
// and loops: after a pause on its last frame, the screen fades, everything is put back to
// its starting state, and it plays again. A demo that's scrolled out of view finishes its
// current run and then waits until it's back on screen, so nothing runs unseen.
//
//   seo - a browser: the pointer clicks the search box, the search is typed and sent, the
//         results load, and "Your Business" climbs from #4 to #1 as the timeline under the
//         results counts the months; then the pointer hovers the result and clicks it.
//
// Movement uses the Web Animations API (element.animate), so each motion gets its own
// realistic easing; the look of each state (pressed, sheet open, paid...) is a class that
// css/sections.css styles. People who ask for less motion get the last frame, still, with no loop.
(function () {
  var demos = document.querySelectorAll('[data-demo]');
  if (!demos.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = typeof Element !== 'undefined' && 'animate' in Element.prototype;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function move(el, frames, ms, easing) {
    return el.animate(frames, { duration: ms, easing: easing || 'ease', fill: 'forwards' }).finished;
  }

  /* ---------------- seo: the search ---------------- */
  function place(demo, p) {                           // "Your Business" to position p, the rest fill in
    var rows = demo.querySelectorAll('.sd-row');
    var you = demo.querySelector('.sd-you');
    var slot = 1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i] === you) continue;
      if (slot === p) slot++;
      rows[i].style.setProperty('--pos', slot);
      slot++;
    }
    you.style.setProperty('--pos', p);
    you.querySelector('.sd-rank').textContent = '#' + p;
  }
  function stage(demo, n) {                           // the timeline: stops up to n lit, n the current one (-1: none)
    var stops = demo.querySelectorAll('.sd-stop');
    for (var i = 0; i < stops.length; i++) {
      stops[i].classList.toggle('is-on', i <= n);
      stops[i].classList.toggle('is-now', i === n);
    }
    demo.querySelector('.sd-timeline').style.setProperty('--t', Math.max(0, n) / (stops.length - 1));
  }

  // Put the search demo back to its first frame
  function resetSeo(demo) {
    demo.querySelectorAll('.sd-cursor, .sd-load').forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
    demo.classList.remove('has-results', 'is-pinned', 'is-hover', 'is-focused', 'is-typing');
    demo.querySelector('.sd-query').textContent = '';
    place(demo, 4);
    stage(demo, -1);
  }

  async function playSeo(demo) {
    var q = function (s) { return demo.querySelector(s); };
    var query = q('.sd-query'), text = query.getAttribute('data-text');
    var load = q('.sd-load'), cursor = q('.sd-cursor');
    var browser = q('.sd-browser');

    if (still || !canAnimate) {
      query.textContent = text;
      place(demo, 1); stage(demo, 3);
      demo.classList.add('has-results', 'is-pinned');
      return;
    }

    // Where an element sits, in the browser's own coordinates, for the pointer to go to
    function spot(el, fx, fy) {
      var b = browser.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - b.left + r.width * fx, y: r.top - b.top + r.height * fy };
    }
    var pos = { x: 0, y: 0 };
    function pointTo(p, ms) {
      var from = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      pos = p;
      return move(cursor, [{ transform: from }, { transform: 'translate(' + p.x + 'px,' + p.y + 'px)' }], ms, 'cubic-bezier(0.3, 0, 0.2, 1)');
    }
    async function click() {
      var t = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
      await move(cursor, [{ transform: t + ' scale(1)' }, { transform: t + ' scale(0.82)' }, { transform: t + ' scale(1)' }], 180);
    }
    function loading(ms) {
      return load.animate([{ width: '0%', opacity: 1 }, { width: '80%', opacity: 1, offset: 0.7 }, { width: '100%', opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' }).finished;
    }

    // The pointer comes in and clicks the search box
    var start = { x: browser.clientWidth * 0.8, y: browser.clientHeight * 0.75 };
    pos = start;
    cursor.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
    await pointTo(spot(q('.sd-search'), 0.3, 0.55), 700);
    await click();
    demo.classList.add('is-focused', 'is-typing');

    // Typed, unevenly, like a person
    for (var i = 1; i <= text.length; i++) {
      query.textContent = text.slice(0, i);
      await wait(45 + Math.random() * 55);
    }
    await wait(350);

    // Enter: the page loads, the results come in
    demo.classList.remove('is-typing', 'is-focused');
    pointTo({ x: browser.clientWidth * 0.86, y: browser.clientHeight * 0.55 }, 600);
    await loading(600);
    demo.classList.add('has-results');
    await wait(500);

    // Time passes: each month the search is run again, and Your Business has moved up
    stage(demo, 0);                                   // Week 1
    await wait(900);
    for (var m = 1; m <= 3; m++) {                    // Month 1, 2, 3
      stage(demo, m);
      await loading(450);
      place(demo, 4 - m);
      await wait(750);
    }
    demo.classList.add('is-pinned');
    await wait(400);

    // The customer goes for it: hover, and click
    await pointTo(spot(q('.sd-title'), 0.35, 0.6), 700);
    demo.classList.add('is-hover');
    await wait(300);
    await click();
  }

  // Looping: play, rest on the last frame, fade the screen out, reset, fade back in, repeat.
  // Only the screen fades (the phone's body, or the browser's content), so the frame stays.
  var visible = new WeakMap();
  function whenVisible(demo) {
    return new Promise(function (r) {
      (function check() { if (visible.get(demo)) r(); else setTimeout(check, 300); })();
    });
  }
  async function loop(demo) {
    var screens = demo.querySelectorAll('.sd-search, .sd-results, .sd-timeline');   // the window's contents, not its frame
    function fade(from, to) {
      return Promise.all([].map.call(screens, function (el) { return move(el, [{ opacity: from }, { opacity: to }], 400); }));
    }
    var first = true;
    for (;;) {
      if (!first) {
        await wait(2600);                             // rest on the finished picture
        await fade(1, 0);
        resetSeo(demo);
        await wait(500);                              // let the states settle while it's hidden
        await whenVisible(demo);
        await fade(0, 1);
        screens.forEach(function (el) { el.getAnimations().forEach(function (an) { an.cancel(); }); });   // drop the fade
      }
      first = false;
      await playSeo(demo);
      if (still || !canAnimate) return;               // no motion wanted: the still picture, no loop
    }
  }

  var started = new WeakSet();
  if (!('IntersectionObserver' in window)) {
    for (var j = 0; j < demos.length; j++) { visible.set(demos[j], true); loop(demos[j]); }
    return;
  }
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      visible.set(e.target, e.isIntersecting);
      if (e.isIntersecting && !started.has(e.target)) { started.add(e.target); loop(e.target); }
    });
  }, { threshold: 0.6 });
  for (var k = 0; k < demos.length; k++) seen.observe(demos[k]);
})();
