import { beforeEach, describe, expect, it, vi } from 'vitest';

const reactRoot = vi.hoisted(() => ({
  render: vi.fn(),
}));

const createRoot = vi.hoisted(() => vi.fn(() => reactRoot));

vi.mock('react-dom/client', () => ({ createRoot }));

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.replaceChildren();
  });

  it('mounts the React application into the root element', async () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.append(rootElement);

    await import('./main');

    expect(createRoot).toHaveBeenCalledWith(rootElement);
    expect(reactRoot.render).toHaveBeenCalledOnce();
  });

  it('reports a missing root element', async () => {
    await expect(import('./main')).rejects.toThrow(
      'Application root element was not found.',
    );
  });
});
