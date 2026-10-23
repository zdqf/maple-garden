import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  applyEffectiveTheme,
  DEFAULT_THEME_CHOICE,
  resolveTheme,
  SYSTEM_DARK_THEME_QUERY,
  THEME_CHOICES,
  type EffectiveTheme,
  type ThemeChoice,
} from './themeState';
import {
  createBrowserThemeStorage,
  type ThemeStorage,
} from './themeStorage';

type FrameRequester = (callback: FrameRequestCallback) => number | null;
type FrameCanceller = (handle: number) => void;

export type ThemeContextValue = Readonly<{
  choice: ThemeChoice;
  effectiveTheme: EffectiveTheme;
  choices: typeof THEME_CHOICES;
  setChoice: (choice: ThemeChoice) => void;
}>;

export type ThemeProviderProps = Readonly<{
  children: ReactNode;
  storage?: ThemeStorage;
  mediaQuery?: MediaQueryList | null;
  root?: HTMLElement | null;
  requestFrame?: FrameRequester;
  cancelFrame?: FrameCanceller;
}>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getBrowserMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(SYSTEM_DARK_THEME_QUERY);
}

function getDocumentRoot(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

function requestBrowserFrame(callback: FrameRequestCallback): number | null {
  if (
    typeof window === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function'
  ) {
    return null;
  }

  return window.requestAnimationFrame(callback);
}

function cancelBrowserFrame(handle: number): void {
  if (
    typeof window !== 'undefined' &&
    typeof window.cancelAnimationFrame === 'function'
  ) {
    window.cancelAnimationFrame(handle);
  }
}

export function ThemeProvider({
  children,
  storage,
  mediaQuery,
  root,
  requestFrame = requestBrowserFrame,
  cancelFrame = cancelBrowserFrame,
}: ThemeProviderProps) {
  const resolvedStorage = useMemo(
    () => storage ?? createBrowserThemeStorage(),
    [storage],
  );
  const resolvedMediaQuery = useMemo(
    () => (mediaQuery === undefined ? getBrowserMediaQuery() : mediaQuery),
    [mediaQuery],
  );
  const themeRoot = root === undefined ? getDocumentRoot() : root;
  const [choice, setStoredChoice] = useState<ThemeChoice>(
    () => resolvedStorage.read() ?? DEFAULT_THEME_CHOICE,
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => resolvedMediaQuery?.matches ?? false,
  );
  const currentChoice = useRef(choice);
  const currentSystemPreference = useRef(systemPrefersDark);
  const pendingFrame = useRef<number | null>(null);

  const applyChoice = useCallback(
    (nextChoice: ThemeChoice, prefersDark: boolean) => {
      if (themeRoot !== null) {
        applyEffectiveTheme(themeRoot, resolveTheme(nextChoice, prefersDark));
      }
    },
    [themeRoot],
  );

  const queueCurrentChoice = useCallback(() => {
    if (pendingFrame.current !== null) {
      cancelFrame(pendingFrame.current);
    }

    pendingFrame.current = requestFrame(() => {
      pendingFrame.current = null;
      const prefersDark =
        resolvedMediaQuery?.matches ?? currentSystemPreference.current;
      applyChoice(currentChoice.current, prefersDark);
    });
  }, [applyChoice, cancelFrame, requestFrame, resolvedMediaQuery]);

  const setChoice = useCallback(
    (nextChoice: ThemeChoice) => {
      const prefersDark =
        resolvedMediaQuery?.matches ?? currentSystemPreference.current;

      currentChoice.current = nextChoice;
      currentSystemPreference.current = prefersDark;

      // Apply synchronously; the queued frame reasserts only the latest choice.
      applyChoice(nextChoice, prefersDark);
      queueCurrentChoice();
      resolvedStorage.write(nextChoice);

      setSystemPrefersDark(prefersDark);
      setStoredChoice(nextChoice);
    }, [applyChoice, queueCurrentChoice, resolvedMediaQuery, resolvedStorage],
  );

  useLayoutEffect(() => {
    currentChoice.current = choice;
    currentSystemPreference.current = systemPrefersDark;
    applyChoice(choice, systemPrefersDark);
  }, [applyChoice, choice, systemPrefersDark]);

  useEffect(() => {
    if (choice !== 'system' || resolvedMediaQuery === null) {
      return undefined;
    }

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      currentSystemPreference.current = event.matches;
      setSystemPrefersDark(event.matches);
      applyChoice('system', event.matches);
    };

    resolvedMediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      resolvedMediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [applyChoice, choice, resolvedMediaQuery]);

  useEffect(
    () => () => {
      if (pendingFrame.current !== null) {
        cancelFrame(pendingFrame.current);
      }
    },
    [cancelFrame],
  );

  const effectiveTheme = resolveTheme(choice, systemPrefersDark);
  const value = useMemo<ThemeContextValue>(
    () => ({
      choice,
      choices: THEME_CHOICES,
      effectiveTheme,
      setChoice,
    }),
    [choice, effectiveTheme, setChoice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}

export function useOptionalTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? {
    choice: DEFAULT_THEME_CHOICE,
    effectiveTheme: 'light',
    choices: THEME_CHOICES,
    setChoice: () => undefined,
  };
}
