import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ArticlePage from './ArticlePage';

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderArticle(slug: string, query = ''): ReturnType<typeof render> {
  return render(<MemoryRouter initialEntries={[`/journal/post/${slug}${query}`]}><LocationProbe /><Routes><Route path="/journal/post/:slug" element={<ArticlePage />} /></Routes></MemoryRouter>);
}

const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
afterEach(() => {
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

describe('Article reading experience', () => {
  it('keeps inline code inline while highlighting and copying fenced code', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const { container } = renderArticle('building-a-local-first-garden');
    const inlineCode = screen.getByText('TODO_REPLACE');
    expect(inlineCode.tagName).toBe('CODE');
    expect(inlineCode.parentElement?.tagName).toBe('P');
    expect(container.querySelector('pre code .hljs-keyword')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '复制代码' }));
    expect(writeText).toHaveBeenCalledWith("const garden = { content: 'markdown', tools: 'browser-only' };\nconsole.log(garden);");
    expect(screen.getByText('已复制')).toBeInTheDocument();
  });

  it('keeps heading links inside the article route and focuses their destination, including repeat visits', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    const user = userEvent.setup();
    renderArticle('building-a-local-first-garden');
    const heading = screen.getByRole('heading', { name: '为什么选择静态内容' });
    const tocItem = screen.getByRole('button', { name: '为什么选择静态内容' });
    await user.click(tocItem);
    expect(screen.getByTestId('location')).toHaveTextContent('/journal/post/building-a-local-first-garden?heading=');
    expect(screen.getByRole('heading', { name: '为什么选择静态内容' })).toHaveFocus();
    expect(screen.getByRole('heading', { name: '为什么选择静态内容' })).toBe(heading);
    await user.click(screen.getByRole('button', { name: '为什么选择静态内容' }));
    expect(screen.getByRole('heading', { name: '为什么选择静态内容' })).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('keeps poetry navigation within its collection and retains its authorship', () => {
    renderArticle('zhu-zhang-fu-qin');
    const navigation = screen.getByRole('navigation', { name: '文章前后篇' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(1);
    expect(within(navigation).getByRole('link', { name: /迟钝/ })).toHaveAttribute('href', '/journal/post/zhu-zhang-chi-dun');
    expect(screen.getByText(/© 2026 Logan.Song/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /收录于竹杖/ })).toHaveAttribute('href', '/journal/collection/zhu-zhang');
  });
});
