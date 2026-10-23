import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SiteShell } from '../components/shell/SiteShell';
import { AppRoutes } from './AppRoutes';

function renderRoute(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  it.each([
    ['/', 'Maple-Garden'],
    ['/projects', '项目'],
    ['/journal', '日志'],
    ['/journal/tag/TypeScript', '日志'],
    ['/journal/category/Frontend', '日志'],
    ['/tools', '工具'],
    ['/tools/json', 'JSON'],
    ['/about', '关于'],
  ])('lazily renders %s inside the shared shell', async (path, heading) => {
    renderRoute(path);

    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it.each([
    '/journal/post/unknown-or-draft',
    '/tools/not-a-tool',
    '/unknown/hash/route',
  ])('keeps the shell while routing %s to Not Found', async (path) => {
    renderRoute(path);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '页面未找到',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('marks the parent navigation destination active on a nested route', async () => {
    renderRoute('/journal/post/not-published');
    await screen.findByRole('heading', { name: '页面未找到' });

    expect(screen.getByRole('link', { name: /日志/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('places the skip link first and moves focus to the single main landmark', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    await screen.findByRole('heading', { name: 'Maple-Garden' });

    const skipLink = screen.getByRole('link', { name: '跳到主要内容' });
    const firstFocusable = document.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    expect(firstFocusable).toBe(skipLink);
    skipLink.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('contains route render failures without unmounting the shell', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    function BrokenPage(): React.JSX.Element {
      throw new Error('test-only render failure');
    }

    render(
      <MemoryRouter initialEntries={['/broken']}>
        <Routes>
          <Route element={<SiteShell />}>
            <Route path="broken" element={<BrokenPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: '页面暂时无法显示',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
