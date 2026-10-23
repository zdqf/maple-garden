import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the default HashRouter page without automated accessibility violations', async () => {
    window.location.hash = '#/';
    const { container } = render(<App />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Maple-Garden',
      }),
    ).toBeInTheDocument();

    const results = await axe.run(container, {
      rules: {
        // jsdom cannot calculate rendered color contrast; browser checks cover it.
        'color-contrast': { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
