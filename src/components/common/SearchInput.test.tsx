import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchInput } from './SearchInput';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
function settle(): void { act(() => { vi.advanceTimersByTime(200); }); }

describe('search input editing', () => {
  it('keeps a synchronous draft while URL updates are delayed and ignores older acknowledgements', () => {
    const commit = vi.fn();
    const { rerender } = render(<SearchInput aria-label="搜索" onValueChange={commit} value="" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    expect(input).toHaveValue('React');
    expect(commit).not.toHaveBeenCalled();
    settle();
    fireEvent.change(input, { target: { value: 'React 中文' } });
    settle();
    rerender(<SearchInput aria-label="搜索" onValueChange={commit} value="React" />);
    expect(input).toHaveValue('React 中文');
    rerender(<SearchInput aria-label="搜索" onValueChange={commit} value="React 中文" />);
    expect(input).toHaveValue('React 中文');
    expect(commit.mock.calls).toEqual([['React'], ['React 中文']]);
  });

  it('leaves Chinese candidate text alone and commits the confirmed phrase once', () => {
    const commit = vi.fn();
    render(<SearchInput aria-label="搜索" onValueChange={commit} value="" />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'fu' } });
    settle();
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
    expect(input).toHaveValue('fu');
    expect(input).toHaveFocus();
    expect(commit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '父亲' } });
    fireEvent.compositionEnd(input, { data: '父亲' });
    // Browsers can send one final input event after compositionend.
    fireEvent.input(input, { target: { value: '父亲' } });
    settle();
    expect(input).toHaveValue('父亲');
    expect(commit.mock.calls).toEqual([['父亲']]);
  });

  it('preserves spaces, replacement text and deletion, and cancels pending work on unmount', () => {
    const commit = vi.fn();
    const { unmount } = render(<SearchInput aria-label="搜索" onValueChange={commit} value="原文字" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  React 中文  ' } });
    fireEvent.change(input, { target: { value: '  React 中' } });
    expect(input).toHaveValue('  React 中');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(commit.mock.calls).toEqual([['']]);
    fireEvent.change(input, { target: { value: '未提交' } });
    unmount();
    settle();
    expect(commit.mock.calls).toEqual([['']]);
  });

  it('restores an external history query without overwriting an active composition', () => {
    const commit = vi.fn();
    const { rerender } = render(<SearchInput aria-label="搜索" onValueChange={commit} value="React" />);
    const input = screen.getByRole('textbox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'React shi' } });
    rerender(<SearchInput aria-label="搜索" onValueChange={commit} value="诗歌" />);
    expect(input).toHaveValue('React shi');
    fireEvent.compositionEnd(input, { data: '诗' });
    expect(input).toHaveValue('诗歌');
    settle();
    expect(commit).not.toHaveBeenCalled();
    rerender(<SearchInput aria-label="搜索" onValueChange={commit} value="" />);
    expect(input).toHaveValue('');
  });
});
