import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import CollectionPage from './CollectionPage';
import JournalPage from './JournalPage';

function CurrentLocation(): React.JSX.Element {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderArchive(path = '/journal'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/category/:category" element={<JournalPage />} />
        <Route path="/journal/tag/:tag" element={<JournalPage />} />
        <Route path="/journal/collection/:collection" element={<CollectionPage />} />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>,
  );
}

describe('journal archive', () => {
  it('keeps Chinese composition out of the URL until confirmed, without duplicating the final word', async () => {
    vi.useFakeTimers();
    try {
      renderArchive();
      const input = screen.getByRole('searchbox', { name: '搜索文章' });
      input.focus();
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'fu' } });
      await act(async () => { vi.advanceTimersByTime(250); });
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/journal$/);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
      fireEvent.change(input, { target: { value: '父亲' } });
      fireEvent.compositionEnd(input, { data: '父亲' });
      fireEvent.input(input, { target: { value: '父亲' } });
      await act(async () => { vi.advanceTimersByTime(250); });
      expect(input).toHaveValue('父亲');
      expect(input).toHaveFocus();
      expect(screen.getByRole('searchbox', { name: '搜索文章' })).toBe(input);
      expect(screen.getByTestId('location')).toHaveTextContent('q=%E7%88%B6%E4%BA%B2');
      expect(screen.getByRole('heading', { level: 3, name: '父亲' })).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '' } });
      await act(async () => { vi.advanceTimersByTime(250); });
      expect(input).toHaveValue('');
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/journal$/);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
    } finally { vi.useRealTimers(); }
  });

  it('restores a shareable combination of collection, tag, year and body search', () => {
    renderArchive('/journal?category=poetry&collection=zhu-zhang&tag=现代诗&year=2026&q=终日升起的雾');

    expect(screen.getByRole('heading', { name: '父亲', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '迟钝', level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText('找到 1 篇记录')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: '搜索文章' })).toHaveValue('终日升起的雾');
    expect(screen.getByRole('combobox', { name: '文章年份' })).toHaveValue('2026');
  });

  it('keeps legacy category links and persists the category when searching', async () => {
    const user = userEvent.setup();
    renderArchive('/journal/category/developer');

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    await user.type(screen.getByRole('searchbox', { name: '搜索文章' }), '不依赖后端');

    expect(screen.getByRole('heading', { name: '不依赖后端的浏览器工具' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/journal/category/developer?q='));
    expect(screen.getByTestId('location').textContent).toContain('category=developer');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('sorts the full archive and can clear a conflicting filter combination', async () => {
    const user = userEvent.setup();
    renderArchive();

    await user.selectOptions(screen.getByRole('combobox', { name: '文章排序' }), 'oldest');
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('构建一个 Local-first Maple-Garden');
    await user.click(within(screen.getByRole('navigation', { name: '文章主题' })).getByRole('link', { name: /写点什么/ }));
    expect(screen.getByText('暂时没有找到这篇文字')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '清除筛选 ↗' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
    expect(screen.getByRole('combobox', { name: '文章排序' })).toHaveValue('newest');
  });

  it('keeps Chinese tag links readable and exposes a collapsible mobile directory', async () => {
    const user = userEvent.setup();
    renderArchive('/journal/tag/%E7%8E%B0%E4%BB%A3%E8%AF%97');

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    const toggle = screen.getByRole('button', { name: '浏览主题与文集' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: '移除# 现代诗筛选' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
  });

  it('opens a collection as a complete chapter index with preserved article URLs', () => {
    renderArchive('/journal/collection/zhu-zhang');

    expect(screen.getByRole('heading', { level: 1, name: '竹杖' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.getByRole('link', { name: '阅读：父亲' })).toHaveAttribute('href', '/journal/post/zhu-zhang-fu-qin');
    expect(screen.getByRole('link', { name: '在归档中浏览 ↗' })).toHaveAttribute('href', '/journal?collection=zhu-zhang');
  });
});
