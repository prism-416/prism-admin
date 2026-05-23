"use client";

import Link from "next/link";

import { Badge, Button, Card } from "@/atomics";
import { formatDateTime, formatNumber, formatPercent } from "@/shared/utils/format";

import {
  useAdminAuditEvents,
  useEmbeddingCoverage,
  useEmbeddingJobHealth,
  useServiceAccountHealth,
  useServiceApiTokenHealth,
} from "../hooks";
import { ErrorPanel, LoadingPanel, PageHeader, SectionTitle, StatCard, TableShell } from "./common";

export function AdminOverview() {
  const serviceAccounts = useServiceAccountHealth();
  const serviceTokens = useServiceApiTokenHealth();
  const coverage = useEmbeddingCoverage();
  const jobs = useEmbeddingJobHealth();
  const audit = useAdminAuditEvents({ limit: 8, offset: 0 });

  const isLoading = serviceAccounts.isLoading || serviceTokens.isLoading || coverage.isLoading || jobs.isLoading;
  const hasError = serviceAccounts.isError || serviceTokens.isError || coverage.isError || jobs.isError;

  return (
    <>
      <PageHeader
        overline="Prizmatic admin"
        title="Operations overview"
        description="Monitor internal token posture, embedding health, and recent admin changes from one calm control surface."
        actions={
          <Button
            asChild
            size="lg"
          >
            <Link href="/service-tokens">Issue service token</Link>
          </Button>
        }
      />

      {isLoading ? <LoadingPanel /> : null}
      {hasError ? (
        <ErrorPanel
          onRetry={() => {
            void serviceAccounts.refetch();
            void serviceTokens.refetch();
            void coverage.refetch();
            void jobs.refetch();
          }}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active service accounts"
          value={serviceAccounts.data?.activeServiceAccounts ?? 0}
          detail={`${formatNumber(serviceAccounts.data?.totalServiceAccounts)} total accounts`}
          tone="teal"
        />
        <StatCard
          label="Active service tokens"
          value={serviceTokens.data?.activeTokens ?? 0}
          detail={`${formatNumber(serviceTokens.data?.expiringSoonTokens)} expiring soon`}
          tone={serviceTokens.data?.expiringSoonTokens ? "warning" : "success"}
        />
        <StatCard
          label="Embedding coverage"
          value={formatPercent(coverage.data?.currentEmbeddings ?? 0, coverage.data?.totalTargets ?? 0)}
          detail={`${formatNumber(coverage.data?.missingEmbeddings)} missing, ${formatNumber(coverage.data?.staleEmbeddings)} stale`}
          tone={(coverage.data?.missingEmbeddings ?? 0) > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Pending embedding jobs"
          value={(jobs.data?.queuedJobs ?? 0) + (jobs.data?.runningJobs ?? 0)}
          detail={`${formatNumber(jobs.data?.staleQueuedJobs)} stale queued, ${formatNumber(jobs.data?.staleRunningJobs)} stale running`}
          tone={(jobs.data?.staleQueuedJobs ?? 0) + (jobs.data?.staleRunningJobs ?? 0) > 0 ? "danger" : "blue"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Token posture"
            description="Health signals for service API tokens."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Expired" value={serviceTokens.data?.expiredTokens ?? 0} tone="danger" />
            <MiniMetric label="Revoked" value={serviceTokens.data?.revokedTokens ?? 0} tone="neutral" />
            <MiniMetric label="Never used" value={serviceTokens.data?.neverUsedActiveTokens ?? 0} tone="warning" />
            <MiniMetric label="Stale active" value={serviceTokens.data?.staleActiveTokens ?? 0} tone="warning" />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Embedding pipeline"
            description="Aggregate coverage and worker queue status."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Total jobs" value={jobs.data?.totalJobs ?? 0} tone="blue" />
            <MiniMetric label="Completed" value={jobs.data?.completedJobs ?? 0} tone="success" />
            <MiniMetric label="Failed" value={jobs.data?.failedJobs ?? 0} tone="danger" />
            <MiniMetric label="Projects pending" value={jobs.data?.projectsWithPendingJobs ?? 0} tone="teal" />
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Recent audit events"
          description="Metadata-only events for admin mutations."
          action={
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href="/audit-events">View all</Link>
            </Button>
          }
        />
        <div className="mt-5">
          <TableShell>
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-prism-navy/5 text-left text-xs uppercase tracking-[0.12em] text-prism-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {(audit.data?.items ?? []).map(event => (
                  <tr key={event.auditEventId}>
                    <td className="px-4 py-3">
                      <Badge tone="blue">{event.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-prism-body">{event.targetName ?? event.targetId ?? "Unknown"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-prism-muted">{event.reason ?? "No reason"}</td>
                    <td className="px-4 py-3 text-prism-muted">{formatDateTime(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      </Card>
    </>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "teal" | "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className="rounded-xl border border-border bg-prism-surface-field px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-prism-muted">{label}</span>
        <Badge tone={tone}>{formatNumber(value)}</Badge>
      </div>
    </div>
  );
}
