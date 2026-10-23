import type { ReactNode } from 'react';

export type ErrorStateProps = Readonly<{
  children: ReactNode;
  id?: string;
  className?: string;
}>;

export function ErrorState({ children, className, id }: ErrorStateProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="assertive"
      className={className}
      data-state="error"
      id={id}
      role="alert"
    >
      {children}
    </div>
  );
}
