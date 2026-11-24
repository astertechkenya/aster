// Aster: the "Sound familiar?" row (css/sections.css, "Problems").
//
// The row drifts slowly from left to right on its own, loops without end, and can still be
// scrolled by hand at any moment: swipe, trackpad, or drag with the mouse.
//
// How: it's an ordinary sideways-scrolling row. Every frame, the script moves its scroll
// position back a fraction of a pixel, which slides the cards to the right. For the loop, the
// cards are copied so the row holds them four times over: whenever the position runs past one
// half, it jumps by exactly half the row, to a spot that looks identical, so the jump can't be
// seen. Four times, not twice: there are seven cards alternating white and black, and an odd
// number can't repeat its colours seamlessly; fourteen can.
//
// The drift pauses under the pointer, while someone is scrolling or dragging (and for a moment
// after), and while a card has keyboard focus. The copies are for the eye only: screen readers
// skip them and the keyboard can't land on them. People who ask for less motion get the still
// row, scrollable by hand; nothing is copied.
(function () {
  var row = document.getElementById('pains-row');
  if (!row) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;

  var track = row.querySelector('.pains__track');
  var cards = [].slice.call(track.children);
  for (var round = 0; round < 3; round++) {
    cards.forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('inert', '');
      copy.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });   // for browsers without inert
      track.appendChild(copy);
    });
  }
  row.classList.add('is-drifting');

  var SPEED = 36;                 // pixels a second
  var half = 0;                   // the width of one half of the row: the loop's length
  var pos = 0;                    // our own, fractional, copy of the scroll position
  var hovering = false, focused = false, held = false, idleUntil = 0;

  function measure() { half = track.scrollWidth / 2; }
  // Keep the position inside one half's span, jumping by a whole half (invisible) when needed
  function wrap(x) {
    if (half <= 0) return x;
    while (x < 1) x += half;
    while (x > half + 1) x -= half;
    return x;
  }
  function pause(ms) { idleUntil = Math.max(idleUntil, performance.now() + ms); }

  measure();
  pos = half / 2;                 // start in the middle, with room to move either way
  row.scrollLeft = pos;

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(64, now - last) / 1000;
    last = now;
    if (!hovering && !focused && !held && now > idleUntil && half > 0) {
      pos = wrap(pos - SPEED * dt);                     // scroll position down = cards move right
      row.scrollLeft = pos;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Someone scrolling by hand (swipe, trackpad, wheel): follow them, wrap, and wait a moment
  // after they stop before drifting again
  row.addEventListener('scroll', function () {
    if (Math.abs(row.scrollLeft - pos) > 1) {         // not our own nudge
      pos = wrap(row.scrollLeft);
      if (Math.abs(pos - row.scrollLeft) > 1) row.scrollLeft = pos;
      pause(2500);
    }
  }, { passive: true });
  row.addEventListener('wheel', function () { pause(2500); }, { passive: true });
  row.addEventListener('touchstart', function () { held = true; }, { passive: true });
  row.addEventListener('touchend', function () { held = false; pause(2500); }, { passive: true });

  // Dragging with the mouse (touch already scrolls natively)
  var dragX = 0, dragStart = 0, dragging = false;
  row.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    held = true; dragging = false; dragX = e.clientX; dragStart = pos;
    row.setPointerCapture(e.pointerId);
  });
  row.addEventListener('pointermove', function (e) {
    if (!held || e.pointerType !== 'mouse') return;
    var dx = e.clientX - dragX;
    if (!dragging && Math.abs(dx) > 4) { dragging = true; row.classList.add('is-dragging'); }
    if (dragging) { pos = wrap(dragStart - dx); row.scrollLeft = pos; }
  });
  function release(e) {
    if (e.pointerType !== 'mouse' || !held) return;
    held = false; pause(2500);
    setTimeout(function () { row.classList.remove('is-dragging'); }, 0);   // after the would-be click
  }
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);

  row.addEventListener('mouseenter', function () { hovering = true; });
  row.addEventListener('mouseleave', function () { hovering = false; });
  row.addEventListener('focusin', function () { focused = true; });
  row.addEventListener('focusout', function () { focused = false; });
  window.addEventListener('resize', function () { measure(); pos = wrap(pos); row.scrollLeft = pos; });
})();
