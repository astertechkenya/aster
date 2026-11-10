// Aster: the burger menu in the header.
// The button says whether the menu is open (aria-expanded), so screen readers announce it.
// It closes when you pick a link, press Escape, or click anywhere outside it; Escape also
// puts the keyboard focus back on the button, so keyboard users don't lose their place.
(function () {
  var button = document.querySelector('.burger');
  var menu = document.getElementById('site-menu');
  if (!button || !menu) return;

  function open() {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    // Move focus into the menu, so the next Tab goes through its links
    var first = menu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (returnFocus) button.focus({ preventScroll: true });
  }
  function isOpen() { return button.getAttribute('aria-expanded') === 'true'; }

  button.addEventListener('click', function () {
    if (isOpen()) close(false); else open();
  });

  // Picking a section: close the menu, and let the link scroll to it as normal
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) close(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close(true);
  });

  // A click anywhere outside the header closes it
  document.addEventListener('click', function (e) {
    if (isOpen() && !e.target.closest('header')) close(false);
  });
})();
