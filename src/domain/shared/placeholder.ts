export const PLACEHOLDER_TOKEN = 'TODO_REPLACE' as const;
export const PLACEHOLDER_VIEW_LABEL = '待替换' as const;

export type PlaceholderViewMarker =
  | Readonly<{
      hasPlaceholder: true;
      placeholderLabel: typeof PLACEHOLDER_VIEW_LABEL;
    }>
  | Readonly<{
      hasPlaceholder: false;
    }>;

export function containsPlaceholder(value: unknown): boolean {
  const visited = new WeakSet<object>();

  function visit(candidate: unknown): boolean {
    if (typeof candidate === 'string') {
      return candidate.includes(PLACEHOLDER_TOKEN);
    }

    if (candidate === null || typeof candidate !== 'object') {
      return false;
    }

    if (visited.has(candidate)) {
      return false;
    }

    visited.add(candidate);
    return Object.values(candidate).some(visit);
  }

  return visit(value);
}

export function createPlaceholderViewMarker(
  source: unknown,
): PlaceholderViewMarker {
  if (containsPlaceholder(source)) {
    return Object.freeze({
      hasPlaceholder: true,
      placeholderLabel: PLACEHOLDER_VIEW_LABEL,
    });
  }

  return Object.freeze({ hasPlaceholder: false });
}
