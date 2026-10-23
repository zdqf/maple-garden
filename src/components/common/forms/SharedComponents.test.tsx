import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LinkRecordSchema } from '../../../config/schemas';
import { CopyButton } from './CopyButton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { ExternalLink } from './ExternalLink';
import { Field } from './Field';
import { LoadingState } from './LoadingState';
import { PlaceholderBadge } from './PlaceholderBadge';
import { ResultPanel } from './ResultPanel';

afterEach(() => {
  vi.useRealTimers();
});

describe('shared accessible states and forms', () => {
  it('renders textual empty, error, loading, placeholder, and result states', () => {
    render(
      <>
        <EmptyState
          action={<button type="button">清除筛选</button>}
          description="没有匹配项目。"
          title="无结果"
        />
        <ErrorState>输入无效。</ErrorState>
        <LoadingState message="正在加载文章…" />
        <PlaceholderBadge />
        <ResultPanel label="转换结果">保留的结果文本</ResultPanel>
      </>,
    );

    expect(screen.getByText('无结果')).toBeVisible();
    expect(screen.getByRole('button', { name: '清除筛选' })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent('输入无效。');
    expect(screen.getByText('正在加载文章…')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByLabelText('待替换内容')).toHaveTextContent('待替换');
    expect(
      screen.getByRole('region', { name: '转换结果' }),
    ).toHaveTextContent('保留的结果文本');
  });

  it('associates a visible label, persistent description, and adjacent error with its control', () => {
    render(
      <Field
        description="请输入标准 JSON。"
        error="JSON 格式无效。"
        label="JSON 输入"
      >
        <textarea aria-describedby="input-hint" />
      </Field>,
    );

    const input = screen.getByRole('textbox', { name: 'JSON 输入' });
    const description = screen.getByText('请输入标准 JSON。');
    const error = screen.getByRole('alert');
    const describedBy = input.getAttribute('aria-describedby')?.split(/\s+/);

    expect(screen.getByText('JSON 输入')).toBeVisible();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy).toEqual(
      expect.arrayContaining(['input-hint', description.id, error.id]),
    );
  });

  it('renders only the validated configured external destination with an isolated context', () => {
    const href = 'HTTPS://example.com/Project?q=%2F';
    const linkRecord = LinkRecordSchema.parse({
      label: '访问项目',
      href,
      accessibleLabel: '项目主页',
    });

    render(<ExternalLink link={linkRecord} />);

    const link = screen.getByRole('link', {
      name: '项目主页（外部链接）',
    });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer']),
    );
  });
});

describe('CopyButton', () => {
  it('announces a successful copy for exactly two seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(
      <CopyButton
        clipboard={{ writeText }}
        label="复制结果"
        text="需要复制的结果"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制结果' }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('需要复制的结果');
    expect(screen.getByRole('status')).toHaveTextContent('已复制');

    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(screen.getByText('已复制')).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('已复制')).not.toBeInTheDocument();
  });

  it('preserves result content and exposes manual selection guidance when copy fails', async () => {
    const writeText = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('Permission denied'));

    render(
      <ResultPanel
        actions={
          <CopyButton
            clipboard={{ writeText }}
            label="复制结果"
            text="原始结果"
          />
        }
        label="结果"
      >
        <output>原始结果</output>
      </ResultPanel>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '复制结果' }));
      await Promise.resolve();
    });

    expect(screen.getByText('原始结果')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '复制失败，请手动选择内容。',
    );
    expect(screen.getByRole('button', { name: '复制结果' })).toBeEnabled();
  });
});
