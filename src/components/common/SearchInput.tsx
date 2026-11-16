import { useCallback, useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type RefObject } from 'react';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onCompositionStart' | 'onCompositionEnd'
> & {
  value: string;
  onValueChange: (value: string) => void;
  onComposingChange?: (composing: boolean) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
};

/** Keep the live editor synchronous; URL transitions receive only settled searches. */
export function SearchInput({ value, onValueChange, onComposingChange, inputRef, onBlur, onKeyDown, ...props }: SearchInputProps): React.JSX.Element {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCommitted = useRef(value);
  const pendingWrites = useRef(new Set<string>());
  const deferredExternal = useRef<string | undefined>(undefined);
  const commitCallback = useRef(onValueChange);

  useLayoutEffect(() => { commitCallback.current = onValueChange; }, [onValueChange]);

  const cancelPending = useCallback((): void => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const acceptExternal = useCallback((next: string): void => {
    cancelPending();
    pendingWrites.current.clear();
    lastCommitted.current = next;
    draftRef.current = next;
    setDraft(next);
  }, [cancelPending]);

  useLayoutEffect(() => {
    // A router acknowledgement, including an older transition, must not roll back edits.
    if (pendingWrites.current.has(value)) {
      pendingWrites.current.delete(value);
      if (value === lastCommitted.current) pendingWrites.current.clear();
      return;
    }
    if (value === lastCommitted.current) return;
    if (composing.current) deferredExternal.current = value;
    else acceptExternal(value);
  }, [value, acceptExternal]);

  useEffect(() => () => { clearTimeout(timer.current); }, []);

  function commit(): void {
    cancelPending();
    if (composing.current || draftRef.current === lastCommitted.current) return;
    const next = draftRef.current;
    pendingWrites.current.add(next);
    lastCommitted.current = next;
    commitCallback.current(next);
  }

  function edit(next: string): void {
    draftRef.current = next;
    setDraft(next);
    cancelPending();
    if (!composing.current && next !== lastCommitted.current) timer.current = setTimeout(commit, 160);
  }

  return <input {...props} ref={inputRef} value={draft}
    onChange={(event) => edit(event.currentTarget.value)}
    onCompositionStart={() => {
      composing.current = true;
      cancelPending();
      onComposingChange?.(true);
    }}
    onCompositionEnd={(event) => {
      composing.current = false;
      onComposingChange?.(false);
      if (deferredExternal.current !== undefined) {
        const next = deferredExternal.current;
        deferredExternal.current = undefined;
        acceptExternal(next);
      } else edit(event.currentTarget.value);
    }}
    onBlur={(event) => { if (!composing.current) commit(); onBlur?.(event); }}
    onKeyDown={(event) => {
      if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter') { event.preventDefault(); commit(); }
      onKeyDown?.(event);
    }}
  />;
}
