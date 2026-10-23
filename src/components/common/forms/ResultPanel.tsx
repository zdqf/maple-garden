import { useId, type ReactNode } from 'react';

export type ResultPanelProps = Readonly<{
  label: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}>;

export function ResultPanel({
  actions,
  children,
  className,
  label,
}: ResultPanelProps) {
  const labelId = `result-panel-label-${useId()}`;

  return (
    <section
      aria-labelledby={labelId}
      aria-live="polite"
      className={className}
      data-result-panel="true"
    >
      <div>
        <p id={labelId}>
          <strong>{label}</strong>
        </p>
        {actions === undefined ? null : <div>{actions}</div>}
      </div>
      <div data-result-content="true">{children}</div>
    </section>
  );
}
