import {
  cloneElement,
  useId,
  type AriaAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { ErrorState } from './ErrorState';

type FieldControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
};

export type FieldProps = Readonly<{
  label: string;
  children: ReactElement<FieldControlProps>;
  description?: ReactNode;
  error?: string | null;
  className?: string;
}>;

export function Field({
  children,
  className,
  description,
  error,
  label,
}: FieldProps) {
  const generatedId = `field-${useId()}`;
  const controlId = children.props.id?.trim() || generatedId;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const hasDescription =
    description !== undefined && description !== null && description !== false;
  const hasError = error !== undefined && error !== null && error.length > 0;
  const describedByIds = new Set(
    (children.props['aria-describedby'] ?? '').split(/\s+/).filter(Boolean),
  );

  if (hasDescription) {
    describedByIds.add(descriptionId);
  }
  if (hasError) {
    describedByIds.add(errorId);
  }

  const describedBy = [...describedByIds].join(' ');
  const injectedProps: FieldControlProps = { id: controlId };
  if (describedBy.length > 0) {
    injectedProps['aria-describedby'] = describedBy;
  }
  if (hasError) {
    injectedProps['aria-invalid'] = true;
  }

  return (
    <div className={className} data-field="true">
      <label htmlFor={controlId}>{label}</label>
      {hasDescription ? <div id={descriptionId}>{description}</div> : null}
      {cloneElement(children, injectedProps)}
      {hasError ? <ErrorState id={errorId}>{error}</ErrorState> : null}
    </div>
  );
}
