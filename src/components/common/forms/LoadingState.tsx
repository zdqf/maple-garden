export type LoadingStateProps = Readonly<{
  message?: string;
  className?: string;
}>;

export function LoadingState({
  className,
  message = '加载中…',
}: LoadingStateProps) {
  return (
    <div
      aria-atomic="true"
      aria-busy="true"
      aria-live="polite"
      className={className}
      data-state="loading"
      role="status"
    >
      {message}
    </div>
  );
}
