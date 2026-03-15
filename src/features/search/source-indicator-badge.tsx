import { Badge } from "~/components/ui/badge";

export function SourceIndicatorBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="secondary"
      aria-label={`From ${label}`}
      className="h-auto rounded-full border border-border-subtle bg-muted px-2 py-1 text-[11px] font-medium leading-none tracking-[0.02em] text-text-secondary"
    >
      {label}
    </Badge>
  );
}
