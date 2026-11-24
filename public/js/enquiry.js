// Aster: the enquiry form in the contact band (css/sections.css, "The enquiry form in two steps").
//
// Two steps, one at a time: what they need (five cards), then how to reach them. Continue checks
// the step's own fields first, so nobody is sent on with a step half done, and each new step's
// question gets the focus so a screen reader reads it out. Netlify collects the form (data-netlify
// in the HTML); this sends it in the background so the visitor stays on the page, then swaps the
// form for a thank-you. If the send fails it says so, points to
// WhatsApp and keeps their answers. Without this script both steps show as one long form that
// posts normally, and Netlify shows its own confirmation page.
(function () {
  var form = document.querySelector('form.enquiry');
  if (!form) return;
  var steps = [].slice.call(form.querySelectorAll('.ef-step'));
  var status = form.querySelector('.enquiry__status');
  var button = form.querySelector('button[type="submit"]');
  var done = form.querySelector('.ef-done');
  var at = 0;

  // Show step i: the counter ("Step 1 of 2"), the bar, which fieldset is open; then focus its question
  function show(i, focus) {
    at = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
    form.querySelector('.ef-n').textContent = i + 1;
    form.querySelector('.ef-bar').style.setProperty('--step', i + 1);
    if (focus) steps[i].querySelector('.ef-q').focus();
  }

  // Is this step complete? If not, the browser points at the first field that needs attention
  function ready(step) {
    var fields = step.querySelectorAll('input, textarea');
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].checkValidity()) { fields[i].reportValidity(); return false; }
    }
    return true;
  }
  function next() { if (ready(steps[at])) show(at + 1, true); }

  form.classList.add('is-stepped');
  show(0, false);
  form.querySelector('.ef-next').addEventListener('click', next);
  form.querySelector('.ef-back').addEventListener('click', function () { show(at - 1, true); });

  // The thank-you, with their first name, set as text (never as HTML)
  function thank() {
    var name = String(new FormData(form).get('name') || '').trim().split(/\s+/)[0];
    done.querySelector('.ef-done__h').textContent = 'Thanks' + (name ? ', ' + name : '') + '. It’s on its way.';
    done.querySelector('.ef-done__p').textContent = 'I’ll get back to you within one working day, with a straight answer on cost and time.';
    form.classList.add('is-sent');
    done.hidden = false;
    status.textContent = '';
    done.focus();
  }

  form.addEventListener('submit', function (e) {
    // Enter pressed on step 1 means "continue", not "send"
    if (at < steps.length - 1) { e.preventDefault(); next(); return; }
    if (!window.fetch || !window.URLSearchParams) return;   // very old browsers: post normally
    if (!form.checkValidity()) return;                      // let the browser point out the missing fields
    e.preventDefault();
    button.disabled = true;
    status.textContent = 'Sending…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      thank();
    }).catch(function () {
      button.disabled = false;
      status.textContent = 'That didn’t send. Please try again, or message me on WhatsApp.';
    });
  });
})();
