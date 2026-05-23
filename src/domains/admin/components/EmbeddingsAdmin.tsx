"use client";

import * as React from "react";

import { Button, Card, Field, Input } from "@/atomics";
import { formatDateTime, formatNumber, formatPercent } from "@/shared/utils/format";

import { useEmbeddingCoverage, useEmbeddingJobHealth } from "../hooks";
import { ErrorPanel, LoadingPanel, PageHeader, SectionTitle, StatCard } from "./common";

const coverageRows = [
  ["Document chunks", "documentChunkTargets", "documentChunkCurrentEmbeddings", "documentChunkMissingEmbeddings", "documentChunkStaleEmbeddings"],
  ["Work items", "workItemTargets", "workItemCurrentEmbeddings", "workItemMissingEmbeddings", "workItemStaleEmbeddings"],
  ["Comments", "workItemCommentTargets", "workItemCommentCurrentEmbeddings", "workItemCommentMissingEmbeddings", "workItemCommentStaleEmbeddings"],
  ["Agent memories", "agentMemoryTargets", "agentMemoryCurrentEmbeddings", "agentMemoryMissingEmbeddings", "agentMemoryStaleEmbeddings"],
] as const;

export function EmbeddingsAdmin() {
  const [staleQueuedAfterMinutes, setStaleQueuedAfterMinutes] = React.useState(60);
  const [staleRunningAfterMinutes, setStaleRunningAfterMinutes] = React.useState(30);
  const jobParams = React.useMemo(
    () => ({ staleQueuedAfterMinutes, staleRunningAfterMinutes }),
    [staleQueuedAfterMinutes, staleRunningAfterMinutes],
  );
  const coverage = useEmbeddingCoverage();
  const jobs = useEmbeddingJobHealth(jobParams);

  return (
    <>
      <PageHeader
        overline="AI operations"
        title="Embeddings"
        description="Track aggregate embedding coverage and queue health without exposing customer content or vectors."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void coverage.refetch();
              void jobs.refetch();
            }}
          >
            Refresh
          </Button>
        }
      />

      {(coverage.isLoading || jobs.isLoading) && <LoadingPanel label="Loading embedding health..." />}
      {(coverage.isError || jobs.isError) && <ErrorPanel onRetry={() => {
        void coverage.refetch();
        void jobs.refetch();
      }} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Coverage"
          value={formatPercent(coverage.data?.currentEmbeddings ?? 0, coverage.data?.totalTargets ?? 0)}
          detail={`${formatNumber(coverage.data?.currentEmbeddings)} current of ${formatNumber(coverage.data?.totalTargets)}`}
          tone="teal"
        />
        <StatCard label="Missing embeddings" value={coverage.data?.missingEmbeddings ?? 0} tone="warning" />
        <StatCard label="Stale embeddings" value={coverage.data?.staleEmbeddings ?? 0} tone="danger" />
        <StatCard label="Pending projects" value={jobs.data?.projectsWithPendingJobs ?? 0} tone="blue" />
      </div>

      <Card>
        <SectionTitle
          title="Coverage by source"
          description={`Generated ${formatDateTime(coverage.data?.generatedAt)}`}
        />
        <div className="mt-5 grid gap-3">
          {coverageRows.map(([label, totalKey, currentKey, missingKey, staleKey]) => {
            const total = coverage.data?.[totalKey] ?? 0;
            const current = coverage.data?.[currentKey] ?? 0;
            const missing = coverage.data?.[missingKey] ?? 0;
            const stale = coverage.data?.[staleKey] ?? 0;

            return (
              <div key={label} className="rounded-2xl border border-border bg-prism-surface-field p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-prism-heading">{label}</p>
                    <p className="text-sm text-prism-muted">{formatPercent(current, total)} current</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right text-sm">
                    <Metric label="Current" value={current} />
                    <Metric label="Missing" value={missing} />
                    <Metric label="Stale" value={stale} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Embedding job health"
          description={`Generated ${formatDateTime(jobs.data?.generatedAt)}`}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label="Stale queued after minutes">
            <Input
              type="number"
              min={1}
              max={10080}
              value={staleQueuedAfterMinutes}
              onChange={event => setStaleQueuedAfterMinutes(Number(event.target.value))}
            />
          </Field>
          <Field label="Stale running after minutes">
            <Input
              type="number"
              min={1}
              max={1440}
              value={staleRunningAfterMinutes}
              onChange={event => setStaleRunningAfterMinutes(Number(event.target.value))}
            />
          </Field>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Queued" value={jobs.data?.queuedJobs ?? 0} tone="blue" />
          <StatCard label="Running" value={jobs.data?.runningJobs ?? 0} tone="teal" />
          <StatCard label="Stale queued" value={jobs.data?.staleQueuedJobs ?? 0} tone="warning" />
          <StatCard label="Stale running" value={jobs.data?.staleRunningJobs ?? 0} tone="danger" />
          <StatCard label="Completed" value={jobs.data?.completedJobs ?? 0} tone="success" />
          <StatCard label="Failed" value={jobs.data?.failedJobs ?? 0} tone="danger" />
          <StatCard label="Cancelled" value={jobs.data?.cancelledJobs ?? 0} tone="neutral" />
          <StatCard label="Exhausted queued" value={jobs.data?.exhaustedQueuedJobs ?? 0} tone="warning" />
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-prism-heading">{formatNumber(value)}</p>
      <p className="text-xs text-prism-muted">{label}</p>
    </div>
  );
}
