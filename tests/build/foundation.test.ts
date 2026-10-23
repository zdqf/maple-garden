// @vitest-environment node

import { access, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import { describe, expect, it } from 'vitest';

import packageManifest from '../../package.json';
import appTypeScriptConfig from '../../tsconfig.app.json';
import nodeTypeScriptConfig from '../../tsconfig.node.json';
import viteConfig from '../../vite.config';
import vitestConfig from '../../vitest.config';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const temporaryBuildRoot = join(
  projectRoot,
  'node_modules',
  '.tmp',
  'foundation-build-test',
);
const temporaryDistDirectory = join(temporaryBuildRoot, 'dist');

const requiredStrictOptions = {
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  useUnknownInCatchVariables: true,
  noImplicitOverride: true,
  noFallthroughCasesInSwitch: true,
} as const;

const nonWatchScripts = {
  typecheck: 'tsc -b --pretty false',
  lint: 'eslint . --max-warnings 0',
  test: 'vitest --run',
  'test:coverage': 'vitest --run --coverage',
  build: 'vite build',
} as const;

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(
  directory: string,
  prefix = '',
): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = prefix
        ? `${prefix}/${entry.name}`
        : entry.name;
      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFiles(absolutePath, relativePath);
      }

      expect(entry.isFile()).toBe(true);
      return [relativePath];
    }),
  );

  return nestedFiles.flat().sort();
}

describe('foundation configuration', () => {
  // Validates: Requirements 1.2
  it('enables strict TypeScript checks for browser and build code', () => {
    for (const config of [appTypeScriptConfig, nodeTypeScriptConfig]) {
      expect(config.compilerOptions).toMatchObject(requiredStrictOptions);
    }
  });

  // Validates: Requirements 18.1
  it('provides deterministic non-watch quality commands', () => {
    expect(packageManifest.scripts).toMatchObject(nonWatchScripts);

    for (const command of Object.values(nonWatchScripts)) {
      expect(command).not.toMatch(/(?:^|\s)(?:--watch|-w)(?:\s|$)/u);
    }
  });

  // Validates: Requirements 18.13
  it('enforces the required application coverage thresholds', () => {
    expect(vitestConfig).toMatchObject({
      test: {
        coverage: {
          provider: 'v8',
          include: ['src/**/*.{ts,tsx}'],
          thresholds: {
            statements: 80,
            lines: 80,
            functions: 80,
            branches: 75,
          },
        },
      },
    });
  });

  // Validates: Requirements 1.5, 20.13
  it('targets the GitHub Pages subpath and the dist directory', () => {
    expect(viteConfig).toMatchObject({
      base: '/maple-garden/',
      build: {
        outDir: 'dist',
        sourcemap: false,
      },
    });
  });

  // Validates: Requirements 1.3
  it('declares only a browser entry point and no server application entry', async () => {
    expect('main' in packageManifest).toBe(false);
    expect('bin' in packageManifest).toBe(false);
    expect(packageManifest.scripts).not.toHaveProperty('start');
    expect(packageManifest.scripts).not.toHaveProperty('server');

    const forbiddenServerEntries = [
      'server.ts',
      'server.js',
      'server.mjs',
      'server.cjs',
      'src/server.ts',
      'src/server.tsx',
      'src/server.js',
      'src/server.mjs',
      'api',
      'functions',
      'src/api',
      'src/functions',
    ];
    const presentServerEntries = (
      await Promise.all(
        forbiddenServerEntries.map(async (entry) => ({
          entry,
          present: await pathExists(join(projectRoot, entry)),
        })),
      )
    )
      .filter(({ present }) => present)
      .map(({ entry }) => entry);

    expect(presentServerEntries).toEqual([]);
  });
});

describe('production artifact', () => {
  // Validates: Requirements 1.3, 1.5, 20.13
  it(
    'builds a static index and browser assets under the configured base',
    { timeout: 30_000 },
    async () => {
      await rm(temporaryBuildRoot, { recursive: true, force: true });

      try {
        await build({
          root: projectRoot,
          configFile: join(projectRoot, 'vite.config.ts'),
          build: {
            outDir: temporaryDistDirectory,
            emptyOutDir: true,
          },
        });

        const files = await listFiles(temporaryDistDirectory);
        const indexHtml = await readFile(
          join(temporaryDistDirectory, 'index.html'),
          'utf8',
        );
        const localAssetReferences = [
          ...indexHtml.matchAll(/(?:src|href)="([^"]+)"/gu),
        ]
          .map((match) => match[1])
          .filter((reference): reference is string =>
            reference?.startsWith('/') ?? false,
          );

        expect(files).toContain('index.html');
        expect(files.some((file) => /^assets\/.+\.js$/u.test(file))).toBe(
          true,
        );
        expect(files).not.toContain('package.json');
        expect(files.some((file) => file.endsWith('.map'))).toBe(false);
        expect(
          files.filter((file) =>
            /(?:^|\/)(?:server|api|lambda|functions?)(?:[./-]|$)|\.(?:php|py|rb|jar|war)$/iu.test(
              file,
            ),
          ),
        ).toEqual([]);
        expect(localAssetReferences.length).toBeGreaterThan(0);
        expect(
          localAssetReferences.every((reference) =>
            reference.startsWith('/maple-garden/'),
          ),
        ).toBe(true);
        expect(indexHtml).not.toContain('/src/main.tsx');
      } finally {
        await rm(temporaryBuildRoot, { recursive: true, force: true });
      }
    },
  );
});
