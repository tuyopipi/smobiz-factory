/**
 * Nurevo AEO setup wizard: progressive enhancement only.
 *
 * The wizard is a set of plain server-rendered forms and works without this
 * file. It only moves keyboard and screen-reader focus to the step heading
 * when a step opens, and marks the chosen category card in browsers that do
 * not support the CSS :has() selector.
 *
 * No build step: plain ES5, no dependencies.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var heading = document.getElementById('webmcp-wizard-heading');
    // Keep the browser's own jump when the URL names a target (e.g. the hours).
    if (heading && !window.location.hash) {
      heading.focus();
    }

    var cards = document.querySelectorAll('.webmcp-wizard-card input[type=radio]');
    function sync() {
      for (var i = 0; i < cards.length; i++) {
        var label = cards[i].closest ? cards[i].closest('.webmcp-wizard-card') : cards[i].parentNode;
        if (label) {
          label.classList.toggle('is-selected', cards[i].checked);
        }
      }
    }
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('change', sync);
    }
  });
}());
