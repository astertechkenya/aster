// Aster: the website packages (css/sections.css, "Modern Websites").
//
// 1. The divider tabs. They follow the ARIA tabs pattern: click or tap a tab to open its
//    package; with the keyboard, Left/Right move between tabs (and open them), Home/End jump
//    to the first/last. Only the open tab is in the Tab order, so one Tab press moves on to
//    the package's details rather than through every tab.
// 2. The phone. Each package has its own website, and the phone plays the open one on a loop.
//    They grow more beautiful and capable with the package:
//      essential - a cake shop's one-page site: a tap on "Order on WhatsApp", a scroll;
//      business  - a restaurant's image-led site: a moving hero, a gallery that slides, its
//                  story on a rooftop at dusk, a review and the journal, then an enquiry sent;
//      premium   - a luxury school: under a night sky, stars settle into the shape of the
//                  school and gold lines join them, then its title rises; its numbers counting up, school life drifting by, and a three-step
//                  admissions form that books a visit.
//    Switching tabs stops the current scene at once and starts the new one from the top. A
//    scene only plays while the phone is on screen. People who ask for less motion see each
//    scene's finished picture, still.
(function () {
  var tablist = document.querySelector('.pk-tabs');
  var demo = document.querySelector('.demo-tiers');
  if (!tablist || !demo) return;
  var tabs = [].slice.call(tablist.querySelectorAll('[role="tab"]'));
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = 'animate' in Element.prototype;
  var screen = demo.querySelector('.ph__screen');
  var finger = demo.querySelector('.ph__finger');

  /* ---------- tabs ---------- */
  function open(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    play(tab.getAttribute('data-tier'));
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { open(tab); });
    tab.addEventListener('keydown', function (e) {
      var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      open(tabs[(to + tabs.length) % tabs.length], true);   // wraps round at either end
    });
  });

  /* ---------- the player ----------
     Every run gets a number. A newer run (a tab switch) makes the older one's next wait fail,
     which unwinds it on the spot, so two scenes never play over each other. */
  var run = 0;
  var visible = false;
  function wait(ms, id) {
    return new Promise(function (ok, stop) {
      setTimeout(function () { id === run ? ok() : stop('superseded'); }, ms);
    });
  }
  function whenVisible(id) {
    return new Promise(function (ok, stop) {
      (function check() {
        if (id !== run) return stop('superseded');
        if (visible) return ok();
        setTimeout(check, 300);
      })();
    });
  }
  function move(el, frames, ms, easing) {
    return el.animate(frames, { duration: ms, easing: easing || 'ease', fill: 'forwards' }).finished;
  }
  // Where an element's centre is, in the screen's own pixels: where the finger should land
  function spot(el) {
    var s = screen.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
  }
  // A tap: the touch indicator comes down on the element, it reacts, and the finger lifts
  async function tap(el, id, onDown) {
    var p = spot(el), at = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
    await move(finger, [{ opacity: 0, transform: at + ' scale(1.4)' }, { opacity: 1, transform: at + ' scale(1)' }], 140);
    el.classList.add('is-pressed');
    if (onDown) onDown();
    await wait(130, id);
    el.classList.remove('is-pressed');
    move(finger, [{ opacity: 1, transform: at + ' scale(1)' }, { opacity: 0, transform: at + ' scale(1.15)' }], 160);
  }
  // The scene fades out, is put back to its first frame, and fades in: a clean loop
  async function restart(scene, reset, id) {
    await move(scene, [{ opacity: 1 }, { opacity: 0 }], 300);
    reset();
    await wait(150, id);
    await whenVisible(id);
    await move(scene, [{ opacity: 0 }, { opacity: 1 }], 300);
    scene.getAnimations().forEach(function (a) { a.cancel(); });
  }
  // Stop this script's own motions (not the CSS loops, like the marquee), and jump every
  // transition to its end, so a reset lands at once instead of sliding back into place
  function clear(scene) {
    scene.querySelectorAll('*').forEach(function (el) {
      el.getAnimations().forEach(function (a) {
        if ((window.CSSAnimation && a instanceof CSSAnimation) || (window.CSSTransition && a instanceof CSSTransition)) return;
        a.cancel();
      });
    });
    finger.getAnimations().forEach(function (a) { a.cancel(); });
  }
  function instantly(scene, fn) {
    scene.querySelectorAll('*').forEach(function (el) { el.style.transition = 'none'; });
    fn();
    void scene.offsetHeight;                                 // apply now, before transitions come back
    scene.querySelectorAll('*').forEach(function (el) { el.style.transition = ''; });
  }

  // Scrolling a scene's page: how far down an element is, and a swipe that takes it there
  function scrollOf(scene) { return scene.querySelector('.sc__scroll'); }
  function depth(scene, el, gap) {
    var scroll = scrollOf(scene), view = scroll.parentNode;
    var max = Math.max(0, scroll.scrollHeight - view.clientHeight);
    return Math.min(max, Math.max(0, el.offsetTop - (gap || 0)));
  }
  async function swipe(scene, y, id) {
    var w = screen.clientWidth, h = screen.clientHeight;
    var from = 'translate(' + w * 0.6 + 'px,' + h * 0.74 + 'px)', to = 'translate(' + w * 0.6 + 'px,' + h * 0.4 + 'px)';
    await move(finger, [{ opacity: 0, transform: from + ' scale(1.3)' }, { opacity: 1, transform: from + ' scale(1)' }], 120);
    scrollOf(scene).style.transform = 'translateY(' + -y + 'px)';
    await move(finger, [{ transform: from }, { transform: to }], 420, 'ease-in-out');
    move(finger, [{ opacity: 1, transform: to }, { opacity: 0, transform: to + ' scale(0.9)' }], 160);
    await wait(650, id);                                     // the page coasts to a stop
  }


  /* ---------- Essential: the cake shop ---------- */
  var ES = {
    scene: demo.querySelector('.sc--essential'),
    q: function (s) { return this.scene.querySelector(s); },
    reset: function () { var self = this; clear(this.scene); instantly(this.scene, function () { scrollOf(self.scene).style.transform = ''; }); },
    finish: function () {},
    play: async function (id) {
      var self = this, heads = this.scene.querySelectorAll('.e-h2');
      for (;;) {
        await wait(1300, id);
        await tap(this.q('.e-btn'), id);
        await wait(900, id);
        await swipe(this.scene, depth(this.scene, heads[0], 12), id);    // down to the menu
        await wait(1500, id);
        await swipe(this.scene, depth(this.scene, heads[1], 12), id);    // and where to find them
        await wait(2600, id);
        await restart(this.scene, function () { self.reset(); }, id);
      }
    }
  };

  /* ---------- Business: the restaurant ---------- */
  var BZ = {
    scene: demo.querySelector('.sc--business'),
    q: function (s) { return this.scene.querySelector(s); },
    slide: function (i) {
      var fig = this.scene.querySelector('.b-track figure');
      var step = fig.offsetWidth + parseFloat(getComputedStyle(fig.parentNode).columnGap || 0);
      this.q('.b-track').style.transform = 'translateX(' + -step * i + 'px)';
      this.scene.querySelectorAll('.b-dots i').forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    },
    // A section's contents rise into place as the page reaches it, one after another
    reveal: function (sel) {
      [].forEach.call(this.q(sel).children, function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(5cqw)' }, { opacity: 1, transform: 'none' }],
                   { duration: 600, delay: 120 + i * 110, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
      });
    },
    // The form arrives already filled in: the enquiry is a quick last beat, not the show
    fill: function () {
      this.q('.b-name').textContent = 'Achieng';
      this.q('.b-occasion').textContent = 'Private dinner';
      this.q('.b-occasion').classList.add('is-set');
      this.q('.b-guests').textContent = '12';
    },
    reset: function () {
      var self = this;
      clear(this.scene);
      instantly(this.scene, function () {
        scrollOf(self.scene).style.transform = '';
        self.slide(0);
        self.fill();
        self.q('.b-select').classList.remove('is-open');
        self.q('.b-send').classList.remove('is-sent');
        self.q('.b-sticky').classList.remove('is-on');
      });
    },
    finish: function () {
      this.q('.b-sticky').classList.add('is-on');
      scrollOf(this.scene).style.transform = 'translateY(' + -depth(this.scene, this.q('.b-story'), this.q('.b-sticky').offsetHeight) + 'px)';
    },
    play: async function (id) {
      var self = this;
      var bar = this.q('.b-sticky').offsetHeight;             // stops land just below the frosted bar
      for (;;) {
        // The hero: its words rise in over the slowly moving picture, and it's given time
        this.scene.querySelectorAll('.b-kicker, .b-h1, .b-ghost').forEach(function (el, i) {
          el.animate([{ opacity: 0, transform: 'translateY(4cqw)' }, { opacity: 1, transform: 'none' }],
                     { duration: 700, delay: 250 + i * 160, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
        });
        await wait(2600, id);
        this.q('.b-sticky').classList.add('is-on');           // the frosted bar slides in as the page moves
        await swipe(this.scene, depth(this.scene, this.q('.b-sec'), bar), id);   // the dishes
        this.slide(1); await wait(1500, id);
        this.slide(2); await wait(1500, id);
        this.reveal('.b-story');
        await swipe(this.scene, depth(this.scene, this.q('.b-story'), bar), id); // the rooftop at dusk
        await wait(2200, id);
        this.reveal('.b-journal');
        await swipe(this.scene, depth(this.scene, this.q('.b-quote'), bar + 12), id); // a review, the journal
        await wait(2200, id);
        await swipe(this.scene, depth(this.scene, this.q('.b-form'), bar), id);  // and an enquiry, sent
        await wait(500, id);
        await tap(this.q('.b-send'), id);
        await wait(400, id);
        this.q('.b-send').classList.add('is-sent');
        await wait(2200, id);
        await restart(this.scene, function () { self.reset(); }, id);
      }
    }
  };

  /* ---------- Premium: the school ---------- */
  var PM = {
    scene: demo.querySelector('.sc--premium'),
    q: function (s) { return this.scene.querySelector(s); },
    count: function (k) {                                   // 0..1 of the way to each number
      this.scene.querySelectorAll('.s-stats b').forEach(function (b) {
        b.textContent = Math.round(+b.getAttribute('data-to') * k) + (b.getAttribute('data-suffix') || '');
      });
    },
    step: function (i) {                                     // the admissions form, to step i (0, 1, 2)
      this.q('.s-form__track').style.transform = 'translateX(' + (-100 * i) + '%)';
      this.q('.s-steps__bar').style.width = (33.33 * (i + 1)) + '%';
      this.scene.querySelectorAll('.s-steps span').forEach(function (s, k) { s.classList.toggle('is-on', k <= i); });
    },
    reset: function () {
      var self = this;
      clear(this.scene);
      instantly(this.scene, function () {
        scrollOf(self.scene).style.transform = '';
        self.step(0);
        self.count(0);
        self.scene.querySelectorAll('.s-chips em, .s-days em').forEach(function (e) { e.classList.remove('is-on'); });
        self.q('.s-book').classList.remove('is-done');
      });
    },
    finish: function () {
      this.count(1);
    },
    play: async function (id) {
      var self = this;
      for (;;) {
        // The hero: stars drift in from all over the sky and settle on the school's corners, then
        // gold lines join them, like a constellation being drawn, and the windows warm up.
        // Every line ends where the CSS already has it (drawn), so fill 'backwards' only holds
        // the start until its turn, and a cleared run is left showing the finished picture.
        var ease = 'cubic-bezier(0.65, 0, 0.2, 1)';
        this.scene.querySelectorAll('.s-pts circle').forEach(function (s) {
          var dx = Math.round(Math.random() * 340 - 170), dy = Math.round(Math.random() * 360 - 200);   // somewhere new each loop
          s.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0.35 }, { transform: 'none', opacity: 1 }],
                    { duration: 2200, delay: Math.random() * 700, easing: ease, fill: 'backwards' });
        });
        this.scene.querySelectorAll('.s-etch path').forEach(function (p) {
          var d = 2300 + 1000 * +p.getAttribute('data-d');
          p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1400, delay: d, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'backwards' });
          if (p.classList.contains('s-win')) p.animate([{ fillOpacity: 0 }, { fillOpacity: 0.5 }], { duration: 1400, delay: d + 1100, easing: 'ease', fill: 'backwards' });
        });
        this.scene.querySelectorAll('.s-kicker, .s-h1 span, .s-ctas').forEach(function (el, i) {
          el.animate([{ opacity: 0, transform: 'translateY(4cqw)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 -20% 0)' }],
                     { duration: 1000, delay: 4800 + i * 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
        });
        await wait(8000, id);                                // the finished picture, given its time
        await swipe(this.scene, depth(this.scene, this.q('.s-stats'), 60), id);
        var t0 = performance.now();                         // the numbers count up
        await new Promise(function (ok) {
          (function stepper(now) {
            var k = Math.min(1, (now - t0) / 1100);
            self.count(1 - Math.pow(1 - k, 3));
            k < 1 ? requestAnimationFrame(stepper) : ok();
          })(t0);
        });
        await wait(1600, id);                               // life at the school drifting by
        await swipe(this.scene, depth(this.scene, this.q('.s-adm'), 40), id);
        await wait(600, id);
        // Admissions: the year, then details, then a morning for the tour
        await tap(this.q('.s-y9'), id, function () { self.q('.s-y9').classList.add('is-on'); });
        await wait(500, id);
        var nexts = this.scene.querySelectorAll('.s-next');
        await tap(nexts[0], id, function () { self.step(1); });
        await wait(1200, id);
        await tap(nexts[1], id, function () { self.step(2); });
        await wait(900, id);
        await tap(this.q('.s-thu'), id, function () { self.q('.s-thu').classList.add('is-on'); });
        await wait(500, id);
        await tap(this.q('.s-book'), id, function () { self.q('.s-book').classList.add('is-done'); });
        await wait(2800, id);
        await restart(this.scene, function () { self.reset(); }, id);
      }
    }
  };

  var SCENES = { essential: ES, business: BZ, premium: PM };

  function play(tier) {
    var id = ++run;                                          // stops whatever was playing
    demo.setAttribute('data-scene', tier);
    var s = SCENES[tier];
    s.reset();
    if (still || !canAnimate) { s.finish(); return; }
    whenVisible(id).then(function () { return s.play(id); }).catch(function () { /* superseded by a newer run */ });
  }

  // Play only while the phone is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.5 }).observe(demo);
  } else {
    visible = true;
  }

  // Start with the tab the page opens on (Business)
  var first = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
  open(first);
})();
