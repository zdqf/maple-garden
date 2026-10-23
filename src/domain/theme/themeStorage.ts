import { isThemeChoice, type ThemeChoice } from './themeState';

export const THEME_STORAGE_KEY = 'maple-garden.theme';

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export type ThemeStorage = Readonly<{
  read: () => ThemeChoice | null;
  write: (choice: ThemeChoice) => void;
}>;

export function createThemeStorage(
  storage: StoragePort | null | undefined,
): ThemeStorage {
  return {
    read() {
      try {
        const storedChoice = storage?.getItem(THEME_STORAGE_KEY);
        return isThemeChoice(storedChoice) ? storedChoice : null;
      } catch {
        return null;
      }
    },
    write(choice) {
      try {
        storage?.setItem(THEME_STORAGE_KEY, choice);
      } catch {
        // Persistence is optional. The provider keeps the choice in memory.
      }
    },
  };
}

export function createBrowserThemeStorage(): ThemeStorage {
  let browserStorage: StoragePort | null = null;

  try {
    if (typeof window !== 'undefined') {
      browserStorage = window.localStorage;
    }
  } catch {
    // Accessing localStorage itself can throw in restricted browser contexts.
  }

  return createThemeStorage(browserStorage);
}
