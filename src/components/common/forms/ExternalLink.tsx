import type { LinkRecord } from '../../../config/schemas';

export type ExternalLinkProps = Readonly<{
  link: LinkRecord;
  openInNewContext?: boolean;
  className?: string;
}>;

export function ExternalLink({
  className,
  link,
  openInNewContext = true,
}: ExternalLinkProps) {
  const accessibleName = link.accessibleLabel ?? link.label;

  return (
    <a
      aria-label={`${accessibleName}（外部链接）`}
      className={className}
      href={link.href}
      rel={openInNewContext ? 'noopener noreferrer' : undefined}
      target={openInNewContext ? '_blank' : undefined}
    >
      {link.label}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}
