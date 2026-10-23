import { useEffect, useId, useRef, useState } from 'react';

import { ErrorState } from './ErrorState';

export type ClipboardWriter = Pick<Clipboard, 'writeText'>;

export type CopyButtonProps = Readonly<{
  text: string;
  label: string;
  clipboard?: ClipboardWriter;
  className?: string;
}>;

type CopyState = 'idle' | 'copying' | 'success' | 'error';

const COPY_SUCCESS_DURATION_MS = 2_000;
const COPY_FAILURE_MESSAGE = '复制失败，请手动选择内容。';

function getBrowserClipboard(): ClipboardWriter | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.clipboard;
}

export function CopyButton({
  className,
  clipboard,
  label,
  text,
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const generatedId = useId();
  const statusId = `copy-status-${generatedId}`;
  const errorId = `copy-error-${generatedId}`;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setCopyState('copying');

    try {
      const clipboardWriter = clipboard ?? getBrowserClipboard();
      if (clipboardWriter === undefined) {
        throw new Error('Clipboard API unavailable.');
      }

      await clipboardWriter.writeText(text);
      if (!mountedRef.current || attemptRef.current !== attempt) {
        return;
      }

      setCopyState('success');
      timerRef.current = window.setTimeout(() => {
        if (mountedRef.current && attemptRef.current === attempt) {
          setCopyState('idle');
        }
        timerRef.current = null;
      }, COPY_SUCCESS_DURATION_MS);
    } catch {
      if (mountedRef.current && attemptRef.current === attempt) {
        setCopyState('error');
      }
    }
  };

  const statusMessage =
    copyState === 'copying'
      ? '正在复制…'
      : copyState === 'success'
        ? '已复制'
        : '';

  return (
    <div data-copy-control="true">
      <button
        aria-describedby={
          copyState === 'error'
            ? errorId
            : copyState === 'idle'
              ? undefined
              : statusId
        }
        className={className}
        onClick={() => void handleCopy()}
        type="button"
      >
        {label}
      </button>
      <span
        aria-atomic="true"
        aria-live="polite"
        id={statusId}
        role="status"
      >
        {statusMessage}
      </span>
      {copyState === 'error' ? (
        <ErrorState id={errorId}>{COPY_FAILURE_MESSAGE}</ErrorState>
      ) : null}
    </div>
  );
}
