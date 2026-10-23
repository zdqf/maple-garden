(function initializeTheme() {
  'use strict';

  var storageKey = 'maple-garden.theme';
  var choice = 'system';
  var systemPrefersDark = false;

  try {
    var savedChoice = window.localStorage.getItem(storageKey);
    if (
      savedChoice === 'light' ||
      savedChoice === 'dark' ||
      savedChoice === 'system'
    ) {
      choice = savedChoice;
    }
  } catch {
    // Restricted storage falls back to the system preference for this session.
  }

  try {
    if (typeof window.matchMedia === 'function') {
      systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
    }
  } catch {
    // Browsers without a usable media query API use light as the safe default.
  }

  var effectiveTheme =
    choice === 'system'
      ? systemPrefersDark
        ? 'dark'
        : 'light'
      : choice;
  var root = document.documentElement;

  root.setAttribute('data-theme', effectiveTheme);
  root.style.colorScheme = effectiveTheme;
})();
