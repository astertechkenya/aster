// Aster: headlines written on the ruled lines.
//
// The page background is ruled like a notebook: a faint line every 48px, starting where the
// header ends (css/styles.css, body). This script sets each headline so the first line of its
// text sits on one of those lines, as handwriting does.
//
// Why a script: a headline's height on the page depends on everything above it (how text
// wraps, how tall the hero is on that screen), which changes with the screen width. So no
// single CSS value can line it up everywhere; the script measures and nudges instead, and
// does it again whenever the layout changes (fonts arriving, images loading, a resize).
//
// How: for each headline, top to bottom, find its baseline and move it to the nearest line,
// up or down (at most 24px). It moves by changing the headline's own top margin, so whatever
// follows moves with it and nothing overlaps. It only moves up if a clear gap stays above it.
// The hero's words are centred on the first screen, so they move as a block with a transform,
// which leaves the hero's height (and what fits on that screen) untouched.
(function () {
  var RULE = 48;        // the distance between lines, as in the CSS
  var MIN_GAP = 12;     // never pull a headline closer than this to whatever is above it...
  var NOTE_GAP = -10;   // ...except right under a handwritten note: the note's box runs low to hold
                        // its arrow, which is meant to curl down into the heading, so the two
                        // boxes may overlap a little (the letters themselves stay clear)

  // The headlines on the ruled paper, in page order. Anything on a white panel or a dark band
  // has its own background, so it isn't on the lines and is left alone.
  var SELECTORS = [
    '.pains__title',
    '.services__title',
    '.offer__head h3', '.services .offer__head + .offer',
    '.work__intro .note', '.work__intro h2',
    '.process .note', '.process h2',
    '.faq .note', '.faq h2'
  ];
  var heroText = document.querySelector('.hero-text');
  var heroH1 = document.querySelector('.hero h1');

  function targets() {
    var list = [];
    SELECTORS.forEach(function (s) { [].push.apply(list, document.querySelectorAll(s)); });
    // page order, so each one is placed after everything above it has settled
    return list.sort(function (a, b) {
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  // An element's top on the page as laid out, ignoring transforms: the hero's words slide in
  // when the page opens, and that animation mustn't throw the measurement off
  function pageTop(el) {
    var y = 0;
    for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  // Where the first line of an element's text sits: a zero-size marker at its start, on the baseline
  function baseline(el) {
    var probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.insertBefore(probe, el.firstChild);
    var y = pageTop(probe);
    probe.remove();
    return y;
  }

  // How far (page px) the baseline is past the nearest line above it: 0..47
  function offset(y) {
    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    var first = header - 1;               // the header's bottom border: line zero
    return (((y - first) % RULE) + RULE) % RULE;
  }

  // The bottom of whatever sits directly above an element (its previous sibling, or its
  // parent's previous sibling...), to know how much room there is to move it up
  function above(el) {
    var n = el;
    while (n && !n.previousElementSibling) n = n.parentElement;
    return n ? n.previousElementSibling : null;
  }
  function roomAbove(el) {
    var prev = above(el);
    if (!prev) return Infinity;
    return pageTop(el) - (pageTop(prev) + prev.offsetHeight);
  }

  var CARD_DROP = 10;   // how far past the line the card's top edge sits
  function lineAtOrBelow(y) {
    var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    var first = header - 1;
    return first + Math.ceil((y - first) / RULE) * RULE;
  }
  function placeCard(el) {
    var words = el.previousElementSibling && el.previousElementSibling.querySelector('.offer__lede');
    var edge = el.querySelector('.pk-tabs') || el.querySelector('.offer__card');
    if (!words || !edge) return;
    var base = parseFloat(getComputedStyle(el).marginTop) || 0, adjust = 0;
    for (var pass = 0; pass < 3; pass++) {
      var drop = parseFloat(getComputedStyle(el).getPropertyValue('--card-drop'));   // a card can ask to sit further in
      var want = lineAtOrBelow(pageTop(words) + words.offsetHeight + 4) + (isNaN(drop) ? CARD_DROP : drop);
      var d = want - pageTop(edge);
      if (Math.abs(d) < 0.5) break;
      adjust += d;
      el.style.marginTop = (base + adjust) + 'px';
    }
  }

  function place() {
    var list = targets();
    // Back to the stylesheet's spacing first, then measure everything fresh
    list.forEach(function (el) { el.style.marginTop = ''; });
    if (heroText) heroText.style.transform = '';

    list.forEach(function (el) {
      // A service's card: its top edge (the package tabs, or the SEO card) goes just past the
      // first line below the words above it, as if set a little into that line
      if (el.classList.contains('offer')) { placeCard(el); return; }
      var base = parseFloat(getComputedStyle(el).marginTop) || 0;
      var adjust = 0;
      // A heading that asks for more room under its note (--note-gap) and doesn't have it yet
      // goes down a line at a time until it does, before being set on a line
      var want = parseFloat(getComputedStyle(el).getPropertyValue('--note-gap'));
      var prev0 = above(el);
      if (!isNaN(want) && prev0 && prev0.classList.contains('note')) {
        for (var k = 0; k < 3 && roomAbove(el) < want; k++) {
          adjust += RULE;
          el.style.marginTop = (base + adjust) + 'px';
        }
      }
      // Up to four tries, in case a move is partly absorbed (collapsing margins, centring)
      for (var pass = 0; pass < 4; pass++) {
        var off = offset(baseline(el));
        if (off < 0.5 || off > RULE - 0.5) break;
        var up = -off, down = RULE - off;
        var prev = above(el);
        var step;
        if (prev && prev.classList.contains('note')) {
          // Under a note: the heading goes on the next line down from the note whenever it
          // fits there, so note and heading always read as a pair, one line apart
          // (a heading can ask for more room with --note-gap in the CSS, e.g. when a doodle
          // above it would otherwise meet the note's arrow)
          var gap = parseFloat(getComputedStyle(el).getPropertyValue('--note-gap'));
          step = roomAbove(el) + up >= (isNaN(gap) ? NOTE_GAP : gap) ? up : down;
        } else {
          // Anywhere else: to the nearest line, as long as it stays clear of what's above
          step = (off <= RULE / 2 && roomAbove(el) + up >= MIN_GAP) ? up : down;
        }
        adjust += step;
        el.style.marginTop = (base + adjust) + 'px';
      }
    });

    // The hero's words: moved as one block, by a transform, so the hero keeps its height
    if (heroText && heroH1) {
      var off = offset(baseline(heroH1));
      var shift = off <= RULE / 2 ? -off : RULE - off;
      if (Math.abs(shift) >= 0.5) heroText.style.transform = 'translateY(' + shift + 'px)';
    }
  }

  // Run now (before the first paint, as this script isn't deferred), and again whenever the
  // layout may have moved: fonts swapping in, images loading, the page resizing. A frame's
  // delay gathers several changes into one pass.
  var queued = false;
  function soon() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; place(); });
  }
  place();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  window.addEventListener('load', soon);
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; soon(); }   // not the phone's address bar showing and hiding
  });
  // Anything that changes the page's height (a lazy image arriving, an FAQ opening) re-places
  // the headlines below it. Our own moves change the height too, but the next pass finds
  // nothing to move, so it settles at once.
  if ('ResizeObserver' in window) {
    var lastH = 0;
    new ResizeObserver(function () {
      var h = document.body.scrollHeight;
      if (h !== lastH) { lastH = h; soon(); }
    }).observe(document.body);
  }
})();
