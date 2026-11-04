// films.js: plays the Safari Ember miniatures' hero film, but only while it's on screen.
//
// The <video> tags carry no autoplay on purpose: four copies looping off-screen would cost
// battery and data for nothing. Here, each one plays when at least a fifth of it is in view
// and pauses when it leaves. preload="none" means a visitor who never scrolls to one never
// downloads it. Anyone who has asked their device for reduced motion keeps the still poster.
(function () {
  var films = document.querySelectorAll('video[data-film]');
  if (!films.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var film = entry.target;
      if (entry.isIntersecting) {
        var playing = film.play();
        // A browser may refuse to play (data saver, low power mode): the poster stays, which is fine.
        if (playing && playing.catch) playing.catch(function () {});
      } else {
        film.pause();
      }
    });
  }, { threshold: 0.2 });

  films.forEach(function (film) { watcher.observe(film); });
})();
