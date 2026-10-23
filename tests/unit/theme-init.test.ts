import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = process.cwd();
const initializationSource = readFileSync(
  join(projectRoot, 'public', 'theme-init.js'),
  'utf8',
);
const indexSource = readFileSync(
  join(projectRoot, 'index.html'),
  'utf8',
);

function executeInitialization(options: {
  savedChoice?: string | null;
  systemPrefersDark?: boolean;
  storageThrows?: boolean;
}) {
  const attributes = new Map<string, string>();
  const root = {
    attributes,
    style: { colorScheme: '' },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };
  const getItem = vi.fn(() => {
    if (options.storageThrows === true) {
      throw new DOMException('denied', 'SecurityError');
    }
    return options.savedChoice ?? null;
  });
  const matchMedia = vi.fn(() => ({
    matches: options.systemPrefersDark ?? false,
  }));

  runInNewContext(initializationSource, {
    document: { documentElement: root },
    window: {
      localStorage: { getItem },
      matchMedia,
    },
  });

  return { getItem, matchMedia, root };
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}

describe('pre-paint theme initialization', () => {
  it('is parser-blocking and appears before visible application content', () => {
    const scriptTag = '<script src="/theme-init.js"></script>';
    const scriptPosition = indexSource.indexOf(scriptTag);

    expect(scriptPosition).toBeGreaterThan(-1);
    expect(scriptPosition).toBeLessThan(indexSource.indexOf('<body>'));
    expect(scriptTag).not.toContain('async');
    expect(scriptTag).not.toContain('defer');
  });

  it('applies a saved explicit theme synchronously', () => {
    const { getItem, root } = executeInitialization({
      savedChoice: 'dark',
      systemPrefersDark: false,
    });

    expect(getItem).toHaveBeenCalledWith('maple-garden.theme');
    expect(root.attributes.get('data-theme')).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('defaults invalid or missing values to the current system preference', () => {
    const missing = executeInitialization({ systemPrefersDark: true });
    expect(missing.root.attributes.get('data-theme')).toBe('dark');

    const invalid = executeInitialization({
      savedChoice: 'sepia',
      systemPrefersDark: false,
    });
    expect(invalid.root.attributes.get('data-theme')).toBe('light');
  });

  it('continues with the system preference when storage throws', () => {
    const result = executeInitialization({
      storageThrows: true,
      systemPrefersDark: true,
    });

    expect(result.root.attributes.get('data-theme')).toBe('dark');
    expect(result.root.style.colorScheme).toBe('dark');
  });
});

describe('tool storage boundary', () => {
  it('keeps tool modules free of browser storage and the theme adapter', () => {
    const toolsDirectory = join(projectRoot, 'src', 'tools');
    const forbiddenStorageUse =
      /\b(?:localStorage|sessionStorage|indexedDB)\b|from\s+['"][^'"]*domain\/theme[^'"]*['"]/;

    for (const filePath of collectSourceFiles(toolsDirectory)) {
      expect(readFileSync(filePath, 'utf8')).not.toMatch(forbiddenStorageUse);
    }
  });
});
