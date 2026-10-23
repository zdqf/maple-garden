import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from './ThemeProvider';
import { createThemeStorage, type ThemeStorage } from './themeStorage';

function createMediaQuery(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<EventListener>();
  const media = '(prefers-color-scheme: dark)';
  const query = {
    get matches() {
      return matches;
    },
    media,
    onchange: null,
    addEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.add(listener);
        }
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.delete(listener);
        }
      },
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;

  return {
    emit(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
    query,
  };
}

function createStorage(saved: 'light' | 'dark' | 'system' | null = null) {
  return {
    read: vi.fn(() => saved),
    write: vi.fn(),
  } satisfies ThemeStorage;
}

function ThemeHarness() {
  const { choice, choices, effectiveTheme, setChoice } = useTheme();

  return (
    <section>
      <output aria-label="selected theme">{choice}</output>
      <output aria-label="effective theme">{effectiveTheme}</output>
      {choices.map((availableChoice) => (
        <button
          key={availableChoice}
          type="button"
          onClick={() => {
            setChoice(availableChoice);
          }}
        >
          {availableChoice}
        </button>
      ))}
    </section>
  );
}

describe('ThemeProvider', () => {
  it('defaults to system and exposes exactly all three choices', () => {
    const mediaQuery = createMediaQuery(true);
    const root = document.createElement('div');

    render(
      <ThemeProvider
        mediaQuery={mediaQuery.query}
        root={root}
        storage={createStorage()}
      >
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('system');
    expect(screen.getByLabelText('effective theme')).toHaveTextContent('dark');
    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(['light', 'dark', 'system']);
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('restores a saved explicit choice independently of the system preference', () => {
    const mediaQuery = createMediaQuery(false);
    const root = document.createElement('div');

    render(
      <ThemeProvider
        mediaQuery={mediaQuery.query}
        root={root}
        storage={createStorage('dark')}
      >
        <ThemeHarness />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('dark');
    expect(root).toHaveAttribute('data-theme', 'dark');
  });

  it('applies and persists a selection before its queued animation frame', () => {
    const mediaQuery = createMediaQuery(false);
    const root = document.createElement('div');
    const storage = createStorage();
    let queuedFrame: FrameRequestCallback | null = null;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      queuedFrame = callback;
      return 17;
    });

    render(
      <ThemeProvider
        mediaQuery={mediaQuery.query}
        requestFrame={requestFrame}
        root={root}
        storage={storage}
      >
        <ThemeHarness />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root.style.colorScheme).toBe('dark');
    expect(requestFrame).toHaveBeenCalledOnce();
    expect(storage.write).toHaveBeenCalledWith('dark');

    act(() => {
      queuedFrame?.(0);
    });
    expect(root).toHaveAttribute('data-theme', 'dark');
  });

  it('tracks operating-system changes only while system is selected', () => {
    const mediaQuery = createMediaQuery(false);
    const root = document.createElement('div');

    render(
      <ThemeProvider
        mediaQuery={mediaQuery.query}
        root={root}
        storage={createStorage()}
      >
        <ThemeHarness />
      </ThemeProvider>,
    );

    act(() => {
      mediaQuery.emit(true);
    });
    expect(root).toHaveAttribute('data-theme', 'dark');

    fireEvent.click(screen.getByRole('button', { name: 'light' }));
    act(() => {
      mediaQuery.emit(false);
      mediaQuery.emit(true);
    });
    expect(root).toHaveAttribute('data-theme', 'light');
  });

  it('retains the current-session choice when browser storage rejects access', () => {
    const mediaQuery = createMediaQuery(false);
    const root = document.createElement('div');
    const storage = createThemeStorage({
      getItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
    });

    render(
      <ThemeProvider
        mediaQuery={mediaQuery.query}
        root={root}
        storage={storage}
      >
        <ThemeHarness />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    expect(screen.getByLabelText('selected theme')).toHaveTextContent('dark');
    expect(root).toHaveAttribute('data-theme', 'dark');
  });

  it('rejects theme consumers outside the provider boundary', () => {
    expect(() => render(<ThemeHarness />)).toThrow(
      'useTheme must be used within ThemeProvider.',
    );
  });
});
