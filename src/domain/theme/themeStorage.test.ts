import { describe, expect, it, vi } from 'vitest';

import {
  createThemeStorage,
  THEME_STORAGE_KEY,
} from './themeStorage';

describe('theme storage adapter', () => {
  it.each(['light', 'dark', 'system'] as const)(
    'reads the supported %s choice from the only allowed key',
    (choice) => {
      const getItem = vi.fn(() => choice);
      const storage = createThemeStorage({ getItem, setItem: vi.fn() });

      expect(storage.read()).toBe(choice);
      expect(getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
      expect(getItem).toHaveBeenCalledOnce();
    },
  );

  it('treats missing and invalid values as no saved choice', () => {
    const getItem = vi
      .fn<(key: string) => string | null>()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('sepia');
    const storage = createThemeStorage({ getItem, setItem: vi.fn() });

    expect(storage.read()).toBeNull();
    expect(storage.read()).toBeNull();
  });

  it('writes only maple-garden.theme', () => {
    const setItem = vi.fn();
    const storage = createThemeStorage({ getItem: vi.fn(), setItem });

    storage.write('dark');

    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    expect(setItem).toHaveBeenCalledOnce();
  });

  it('silently degrades when reads or writes are rejected', () => {
    const storage = createThemeStorage({
      getItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
    });

    expect(storage.read()).toBeNull();
    expect(() => storage.write('light')).not.toThrow();
  });
});
