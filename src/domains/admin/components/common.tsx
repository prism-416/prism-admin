"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import * as React from "react";

import { Badge, Button, Card } from "@/atomics";
import { formatNumber } from "@/shared/utils/format";

export function PageHeader({
  overline,
  title,
  description,
  actions,
}: {
  overline: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-prism-teal-500">{overline}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-prism-heading md:text-4xl">{title}</h2>
        <p className="text-base leading-7 text-prism-muted">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  detail?: string;
  tone?: "blue" | "teal" | "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_14px_40px_rgba(12,71,103,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-prism-muted">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-prism-heading">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
          {detail ? <p className="text-xs leading-5 text-prism-muted">{detail}</p> : null}
        </div>
        <Badge tone={tone}>{tone}</Badge>
      </div>
    </Card>
  );
}

export function ErrorPanel({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-prism-danger-soft bg-prism-danger-soft/25 px-4 py-3 text-sm text-prism-danger">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4" />
        <span>{message ?? "Something went wrong while loading admin data."}</span>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="dangerSoft"
          size="sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingPanel({ label = "Loading admin data..." }: { label?: string }) {
  return (
    <Card className="flex min-h-32 items-center justify-center gap-3 text-sm text-prism-muted">
      <RefreshCw className="size-4 animate-spin" />
      {label}
    </Card>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-prism-heading">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-prism-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function RawTokenPanel({ token }: { token: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-prism-warning/20 bg-prism-warning-soft/70 p-4">
      <div>
        <h4 className="font-semibold text-prism-heading">Copy this token now</h4>
        <p className="mt-1 text-sm leading-6 text-prism-muted">
          The raw token is shown only once and will not be available after this dialog closes.
        </p>
      </div>
      <code className="block overflow-x-auto rounded-xl border border-border bg-white px-3 py-2 text-xs text-prism-navy">
        {token}
      </code>
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
      >
        {copied ? "Copied" : "Copy token"}
      </Button>
    </div>
  );
}
