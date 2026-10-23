export const THEME_CHOICES = ['light', 'dark', 'system'] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type EffectiveTheme = Exclude<ThemeChoice, 'system'>;

export const DEFAULT_THEME_CHOICE: ThemeChoice = 'system';
export const SYSTEM_DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return (
    typeof value === 'string' &&
    THEME_CHOICES.some((choice) => choice === value)
  );
}

export function resolveTheme(
  choice: ThemeChoice,
  systemPrefersDark: boolean,
): EffectiveTheme {
  if (choice === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }

  return choice;
}

export function applyEffectiveTheme(
  root: HTMLElement,
  theme: EffectiveTheme,
): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
