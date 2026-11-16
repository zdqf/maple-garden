import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppRoutes } from '../../app/AppRoutes';

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  // jsdom has dialog elements but no browser top-layer implementation.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});

afterEach(() => {
  cleanup();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  document.body.style.overflow = '';
});

describe('Site search and navigation', () => {
  it('keeps the dialog open while the Chinese input method confirms or cancels candidates', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/about']}><AppRoutes /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: '打开全站搜索' }));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('searchbox');
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'qin' } });
    fireEvent.keyDown(input, { key: 'k', ctrlKey: true, isComposing: true, keyCode: 229 });
    const cancel = new Event('cancel', { bubbles: false, cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '亲情' } });
    fireEvent.compositionEnd(input, { data: '亲情' });
    await within(dialog).findByText('找到 1 个结果');
    expect(within(dialog).getByRole('link', { name: /父亲/ })).toBeInTheDocument();
    expect(input).toHaveValue('亲情');
  });

  it('opens with keyboard focus, finds article tags, and follows a result', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/about']}><AppRoutes /></MemoryRouter>);
    const trigger = screen.getByRole('button', { name: '打开全站搜索' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '在花园里找一找' });
    const search = within(dialog).getByRole('searchbox', { name: '搜索全站内容' });
    expect(search).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.type(search, '亲情');
    await within(dialog).findByText('找到 1 个结果');
    const result = within(dialog).getByRole('link', { name: /父亲/ });
    expect(result).toHaveAttribute('href', '/journal/post/zhu-zhang-fu-qin');
    await user.click(result);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: '父亲' }, { timeout: 5000 })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });

  it('restores focus and body scrolling when the native dialog is cancelled', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/about']}><AppRoutes /></MemoryRouter>);
    const trigger = screen.getByRole('button', { name: '打开全站搜索' });
    await user.click(trigger);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('retains a project search input and its focus while synchronizing each keystroke to the URL', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/projects']}><AppRoutes /></MemoryRouter>);
    const input = await screen.findByRole('textbox', { name: '搜索项目' });
    await user.type(input, 'React');
    expect(screen.getByRole('textbox', { name: '搜索项目' })).toBe(input);
    expect(input).toHaveValue('React');
    expect(input).toHaveFocus();
    expect(screen.getByRole('heading', { level: 2, name: 'Maple-Garden' })).toBeInTheDocument();
  });
});
