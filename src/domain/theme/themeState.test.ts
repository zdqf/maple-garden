import { describe, expect, it } from 'vitest';

import {
  applyEffectiveTheme,
  DEFAULT_THEME_CHOICE,
  isThemeChoice,
  resolveTheme,
  THEME_CHOICES,
} from './themeState';

describe('theme state', () => {
  it('exposes light, dark, and system with system as the default', () => {
    expect(THEME_CHOICES).toEqual(['light', 'dark', 'system']);
    expect(DEFAULT_THEME_CHOICE).toBe('system');
  });

  it.each([
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
    ['system', false, 'light'],
    ['system', true, 'dark'],
  ] as const)(
    'resolves %s with systemDark=%s to %s',
    (choice, systemDark, expected) => {
      expect(resolveTheme(choice, systemDark)).toBe(expected);
    },
  );

  it('accepts only the three supported persisted values', () => {
    expect(THEME_CHOICES.every((choice) => isThemeChoice(choice))).toBe(true);
    expect(isThemeChoice('sepia')).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });

  it('sets both the html theme marker and native color scheme', () => {
    const root = document.createElement('div');

    applyEffectiveTheme(root, 'dark');

    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
  });
});
