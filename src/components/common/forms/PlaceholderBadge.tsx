export type PlaceholderBadgeProps = Readonly<{
  className?: string;
}>;

export function PlaceholderBadge({ className }: PlaceholderBadgeProps) {
  return (
    <span
      aria-label="待替换内容"
      className={className}
      data-state="placeholder"
    >
      待替换
    </span>
  );
}
