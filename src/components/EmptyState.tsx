import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="surface rounded-2xl px-5 py-8 text-center">
      <p className="font-[family-name:var(--font-display)] text-2xl text-tj-ink">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-tj-muted">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-primary mt-5 inline-flex">
          {actionLabel}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
