import { useId, type ReactNode } from 'react';

export type EmptyStateProps = Readonly<{
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}>;

export function EmptyState({
  action,
  className,
  description,
  title,
}: EmptyStateProps) {
  const titleId = `empty-state-title-${useId()}`;

  return (
    <section
      aria-atomic="true"
      aria-labelledby={titleId}
      aria-live="polite"
      className={className}
      data-state="empty"
      role="status"
    >
      <p id={titleId}>
        <strong>{title}</strong>
      </p>
      {description === undefined ? null : <div>{description}</div>}
      {action === undefined ? null : <div>{action}</div>}
    </section>
  );
}
