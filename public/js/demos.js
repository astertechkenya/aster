// Aster: the two service demos (css/sections.css). Each starts when most of it is on screen
// and loops: after a pause on its last frame, the screen fades, everything is put back to
// its starting state, and it plays again. A demo that's scrolled out of view finishes its
// current run and then waits until it's back on screen, so nothing runs unseen.
//
//   web - a shop app on a phone: a fingertip scrolls the page in two swipes (each with a
//         drag, then momentum) and taps "Pay with M-Pesa"; the phone's M-Pesa prompt pops
//         up, the PIN is typed on the number pad and sent, the M-PESA confirmation message
//         drops in, and the shop confirms the order.
//   seo - a browser: the pointer clicks the search box, the search is typed and sent, the
//         results load, and "Your Business" climbs from #4 to #1 as the months pass; then
//         the pointer hovers the result and clicks it.
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
  var DECEL = 'cubic-bezier(0.1, 0.7, 0.25, 1)';     // a flick slowing to a stop
  var SPRING = 'cubic-bezier(0.2, 1.15, 0.35, 1)';    // a sheet that lands with a little bounce

  /* ---------------- web: the shop app ---------------- */
  function at(x, y, s) { return 'translate(' + x + 'px,' + y + 'px) scale(' + (s || 1) + ')'; }

  // Put the shop demo back to its first frame: stop every motion, clear every state
  function resetWeb(demo) {
    demo.querySelectorAll('.dw-page, .dw-finger, .dw-scrollbar, .dw-ripple, .dw-keyboard, .dw-note, .dw-done')
      .forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); el.style.transform = ''; });
    demo.classList.remove('is-pressed', 'is-waiting', 'is-prompt', 'is-paid');
    demo.querySelectorAll('.dw-dot').forEach(function (d) { d.classList.remove('is-on'); });
    demo.querySelector('.dw-caret').setAttribute('x', 38);
  }

  async function playWeb(demo) {
    var q = function (s) { return demo.querySelector(s); };
    var page = q('.dw-page'), finger = q('.dw-finger'), bar = q('.dw-scrollbar'), ripple = q('.dw-ripple');
    var keyboard = q('.dw-keyboard'), note = q('.dw-note'), done = q('.dw-done');
    var dots = demo.querySelectorAll('.dw-dot'), caret = q('.dw-caret');
    var scroll = 0;

    if (still || !canAnimate) {                       // the finished picture: paid, order confirmed
      page.style.transform = 'translateY(-160px)';
      done.style.transform = 'translateY(0)';
      demo.classList.add('is-paid');
      return;
    }

    // One swipe: the finger lands, drags the page up with it, lifts, and the page coasts on
    async function swipe(x, y, drag, coast) {
      var from = scroll;
      await move(finger, [{ opacity: 0, transform: at(x, y, 1.3) }, { opacity: 1, transform: at(x, y) }], 120);
      bar.animate([{ opacity: 0 }, { opacity: 0.35 }], { duration: 150, fill: 'forwards' });
      move(page, [{ transform: 'translateY(' + -from + 'px)' }, { transform: 'translateY(' + -(from + drag) + 'px)' }], 380, 'ease-in-out');
      move(bar, [{ transform: 'translateY(' + from * 0.6 + 'px)' }, { transform: 'translateY(' + (from + drag) * 0.6 + 'px)' }], 380, 'ease-in-out');
      await move(finger, [{ transform: at(x, y) }, { transform: at(x, y - drag) }], 380, 'ease-in-out');
      move(finger, [{ opacity: 1, transform: at(x, y - drag) }, { opacity: 0, transform: at(x, y - drag - 8, 0.9) }], 160);
      scroll = from + drag + coast;
      move(bar, [{ transform: 'translateY(' + (from + drag) * 0.6 + 'px)' }, { transform: 'translateY(' + scroll * 0.6 + 'px)' }], 650, DECEL);
      await move(page, [{ transform: 'translateY(' + -(from + drag) + 'px)' }, { transform: 'translateY(' + -scroll + 'px)' }], 650, DECEL);
      bar.animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: 400, delay: 250, fill: 'forwards' });
    }

    // One tap: the finger comes down, the target reacts, the finger lifts
    async function tap(x, y, onDown) {
      await move(finger, [{ opacity: 0, transform: at(x, y, 1.4) }, { opacity: 1, transform: at(x, y) }], 130);
      if (onDown) onDown();
      await wait(100);
      move(finger, [{ opacity: 1, transform: at(x, y) }, { opacity: 0, transform: at(x, y, 1.15) }], 140);
    }

    await wait(500);
    await swipe(165, 360, 55, 25);                   // first swipe: past the description
    await wait(450);
    await swipe(165, 350, 55, 25);                   // second: the Pay button comes into view
    await wait(450);

    // Tap "Pay with M-Pesa" (y 506 on the page, now scrolled up by 160); the shop sends the request
    await tap(150, 346, function () {
      demo.classList.add('is-pressed');
      ripple.animate([{ opacity: 0.4, transform: at(150, 346, 0.3) }, { opacity: 0, transform: at(150, 346, 2.2) }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
    });
    await wait(250);
    demo.classList.remove('is-pressed');
    demo.classList.add('is-waiting');
    await wait(900);

    // The phone's own M-Pesa prompt pops up, with the number pad
    demo.classList.add('is-prompt');
    await move(keyboard, [{ transform: 'translateY(145px)' }, { transform: 'translateY(0)' }], 300, 'cubic-bezier(0.2, 0.8, 0.2, 1)');
    await wait(450);

    // The PIN, typed on the number pad
    var keys = ['2', '7', '0', '5'];
    for (var i = 0; i < keys.length; i++) {
      var key = demo.querySelector('.dw-key[data-key="' + keys[i] + '"]');
      var r = key.querySelector('rect');
      var kx = +r.getAttribute('x') + 30, ky = +r.getAttribute('y') + 13;
      await tap(kx, ky, (function (k, d) {
        return function () {
          k.classList.add('is-down');
          d.classList.add('is-on');
          caret.setAttribute('x', +d.getAttribute('cx') + 5);   // the cursor steps along after each digit
          setTimeout(function () { k.classList.remove('is-down'); }, 130);
        };
      })(key, dots[i]));
      await wait(120);
    }
    await wait(300);

    // SEND: the prompt and the number pad go away
    await tap(172, 229);
    await wait(150);
    demo.classList.remove('is-prompt');
    move(keyboard, [{ transform: 'translateY(0)' }, { transform: 'translateY(145px)' }], 250, 'ease-in');
    await wait(900);

    // The M-PESA message drops in; the shop confirms the order
    await move(note, [{ transform: 'translateY(-80px)' }, { transform: 'translateY(0)' }], 450, SPRING);
    await wait(700);
    demo.classList.remove('is-waiting');
    move(done, [{ transform: 'translateY(170px)' }, { transform: 'translateY(0)' }], 520, SPRING);
    demo.classList.add('is-paid');
    await wait(2200);
    move(note, [{ transform: 'translateY(0)' }, { transform: 'translateY(-80px)' }], 350, 'ease-in');
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

  // Put the search demo back to its first frame
  function resetSeo(demo) {
    demo.querySelectorAll('.sd-cursor, .sd-load').forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
    demo.classList.remove('has-results', 'has-time', 'is-pinned', 'is-hover', 'is-focused', 'is-typing');
    demo.querySelector('.sd-query').textContent = '';
    demo.querySelector('.sd-time').textContent = '';
    place(demo, 4);
  }

  async function playSeo(demo) {
    var q = function (s) { return demo.querySelector(s); };
    var query = q('.sd-query'), text = query.getAttribute('data-text');
    var time = q('.sd-time'), load = q('.sd-load'), cursor = q('.sd-cursor');
    var browser = q('.sd-browser');

    if (still || !canAnimate) {
      query.textContent = text; time.textContent = 'Month 3';
      place(demo, 1);
      demo.classList.add('has-results', 'has-time', 'is-pinned');
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
    time.textContent = 'Week 1';
    demo.classList.add('has-time');
    await wait(900);
    var months = ['Month 1', 'Month 2', 'Month 3'];
    for (var m = 0; m < months.length; m++) {
      time.textContent = months[m];
      await loading(450);
      place(demo, 3 - m);
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
    var seo = demo.getAttribute('data-demo') === 'seo';
    var screens = seo ? demo.querySelectorAll('.sd-search, .sd-results, .sd-time')    // the window's contents, not its frame
                      : demo.querySelectorAll('g[clip-path="url(#dw-screen)"]');        // the screen, not the phone
    function fade(from, to) {
      return Promise.all([].map.call(screens, function (el) { return move(el, [{ opacity: from }, { opacity: to }], 400); }));
    }
    var first = true;
    for (;;) {
      if (!first) {
        await wait(seo ? 2600 : 1800);                // rest on the finished picture
        await fade(1, 0);
        if (seo) resetSeo(demo); else resetWeb(demo);
        await wait(500);                              // let the states settle while it's hidden
        await whenVisible(demo);
        await fade(0, 1);
        screens.forEach(function (el) { el.getAnimations().forEach(function (an) { an.cancel(); }); });   // drop the fade
      }
      first = false;
      if (seo) await playSeo(demo); else await playWeb(demo);
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
