import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { configureGlobal } from 'fast-check';
import { afterEach } from 'vitest';

configureGlobal({ numRuns: 100 });

afterEach(() => {
  cleanup();
});
