"use client";

import * as React from "react";

import { Button, Card, Field, Select } from "@/atomics";
import { formatDateTime, formatNumber, formatPercent } from "@/shared/utils/format";

import { useUserActiveTrend, useUserActivitySummary, useUserMetricsSummary, useUserSignupTrend } from "../hooks";
import type { UserActiveBucket, UserMetricsSummary, UserSignupBucket } from "../types";
import { ErrorPanel, LoadingPanel, PageHeader, SectionTitle, StatCard } from "./common";

const WINDOW_OPTIONS = [7, 14, 30, 90, 180, 365] as const;

export function UserActivityAdmin() {
  const [windowDays, setWindowDays] = React.useState<number>(30);
  const signupParams = React.useMemo(() => ({ windowDays }), [windowDays]);

  const activity = useUserActivitySummary();
  const metrics = useUserMetricsSummary();
  const activeTrend = useUserActiveTrend(signupParams);
  const signups = useUserSignupTrend(signupParams);

  const isLoading = activity.isLoading || metrics.isLoading || activeTrend.isLoading || signups.isLoading;
  const hasError = activity.isError || metrics.isError || activeTrend.isError || signups.isError;

  function refreshAll() {
    void activity.refetch();
    void metrics.refetch();
    void activeTrend.refetch();
    void signups.refetch();
  }

  const stickiness = activity.data?.stickiness ?? null;

  return (
    <>
      <PageHeader
        overline="Growth"
        title="User activity"
        description="Track active users (DAU/WAU/MAU), signup momentum, and overall user composition without exposing any individual identities."
        actions={
          <Button variant="outline" onClick={refreshAll}>
            Refresh
          </Button>
        }
      />

      {isLoading ? <LoadingPanel label="Loading user activity..." /> : null}
      {hasError ? <ErrorPanel onRetry={refreshAll} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Daily active users"
          value={activity.data?.dau ?? 0}
          detail="Distinct active users in the last 24h"
          tone="teal"
        />
        <StatCard
          label="Weekly active users"
          value={activity.data?.wau ?? 0}
          detail="Distinct active users in the last 7d"
          tone="blue"
        />
        <StatCard
          label="Monthly active users"
          value={activity.data?.mau ?? 0}
          detail="Distinct active users in the last 30d"
          tone="blue"
        />
        <StatCard
          label="Stickiness"
          value={stickiness === null ? "—" : formatPercent(stickiness, 1)}
          detail="DAU / MAU ratio"
          tone={stickiness !== null && stickiness >= 0.2 ? "success" : "neutral"}
        />
      </div>

      <Card>
        <SectionTitle
          title="Active users trend"
          description={`Daily active users, split into new vs returning · generated ${formatDateTime(
            activeTrend.data?.generatedAt,
          )}`}
          action={
            <Field label="Window">
              <Select value={windowDays} onChange={event => setWindowDays(Number(event.target.value))}>
                {WINDOW_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    Last {option} days
                  </option>
                ))}
              </Select>
            </Field>
          }
        />
        <div className="mt-5">
          <ActiveTrendChart buckets={activeTrend.data?.buckets ?? []} />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Signup trend"
          description={`${formatNumber(signups.data?.totalSignups)} signups over the last ${windowDays} days · generated ${formatDateTime(
            signups.data?.generatedAt,
          )}`}
        />
        <div className="mt-5">
          <SignupChart buckets={signups.data?.buckets ?? []} />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="New users"
          description="Recent signups across rolling windows."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCard label="Last 24 hours" value={metrics.data?.newUsersLast24h ?? 0} tone="teal" />
          <StatCard label="Last 7 days" value={metrics.data?.newUsersLast7d ?? 0} tone="blue" />
          <StatCard label="Last 30 days" value={metrics.data?.newUsersLast30d ?? 0} tone="blue" />
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Lifecycle funnel"
          description="Share of all users that reach each stage, from signup to an active session. Step rates compare each stage to the one above it."
        />
        <div className="mt-5">
          <LifecycleFunnel metrics={metrics.data} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="User base" description={`Generated ${formatDateTime(metrics.data?.generatedAt)}`} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricRow label="Total users" value={metrics.data?.totalUsers ?? 0} />
            <MetricRow label="Verified" value={metrics.data?.verifiedUsers ?? 0} />
            <MetricRow label="Unverified" value={metrics.data?.unverifiedUsers ?? 0} />
            <MetricRow label="Active session" value={metrics.data?.usersWithActiveSession ?? 0} />
            <MetricRow label="In a workspace" value={metrics.data?.usersInWorkspace ?? 0} />
            <MetricRow label="No workspace" value={metrics.data?.usersWithoutWorkspace ?? 0} />
          </div>
        </Card>

        <Card>
          <SectionTitle title="Auth providers" description="How users authenticate." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricRow label="Email" value={metrics.data?.usersWithEmailAuth ?? 0} />
            <MetricRow label="Google" value={metrics.data?.usersWithGoogleAuth ?? 0} />
            <MetricRow label="GitHub" value={metrics.data?.usersWithGithubAuth ?? 0} />
            <MetricRow label="Any OAuth" value={metrics.data?.usersWithOauthAuth ?? 0} />
          </div>
        </Card>
      </div>
    </>
  );
}

function ActiveTrendChart({ buckets }: { buckets: UserActiveBucket[] }) {
  if (buckets.length === 0) {
    return <p className="text-sm text-prism-muted">No active users recorded in this window.</p>;
  }

  const maxActive = Math.max(...buckets.map(bucket => bucket.activeUsers), 1);
  const peakBucket = buckets.reduce((peak, bucket) => (bucket.activeUsers > peak.activeUsers ? bucket : peak), buckets[0]);
  const firstDate = buckets[0]?.date;
  const lastDate = buckets[buckets.length - 1]?.date;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-prism-muted">
        <LegendSwatch className="bg-prism-teal-500/80" label="Returning" />
        <LegendSwatch className="bg-prism-glow-sky/80" label="New" />
      </div>
      <div className="flex h-44 items-end gap-px rounded-2xl border border-border bg-prism-surface-field p-3">
        {buckets.map(bucket => {
          const totalPercent = Math.round((bucket.activeUsers / maxActive) * 100);
          const newPercent = bucket.activeUsers > 0 ? (bucket.newUsers / bucket.activeUsers) * totalPercent : 0;
          const returningPercent = totalPercent - newPercent;

          return (
            <div
              key={bucket.date}
              className="group flex h-full flex-1 flex-col justify-end overflow-hidden rounded-t"
              title={`${bucket.date}: ${formatNumber(bucket.activeUsers)} active (${formatNumber(
                bucket.newUsers,
              )} new, ${formatNumber(bucket.returningUsers)} returning)`}
            >
              <div
                className="w-full bg-prism-glow-sky/80"
                style={{ height: `${Math.max(newPercent, bucket.newUsers > 0 ? 2 : 0)}%` }}
              />
              <div
                className="w-full bg-prism-teal-500/80 transition-colors group-hover:bg-prism-teal-500"
                style={{ height: `${Math.max(returningPercent, bucket.returningUsers > 0 ? 2 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-prism-muted">
        <span>{firstDate}</span>
        <span>
          Peak {formatNumber(peakBucket.activeUsers)} on {peakBucket.date}
        </span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}

function SignupChart({ buckets }: { buckets: UserSignupBucket[] }) {
  if (buckets.length === 0) {
    return <p className="text-sm text-prism-muted">No signups recorded in this window.</p>;
  }

  const maxCount = Math.max(...buckets.map(bucket => bucket.count), 1);
  const firstDate = buckets[0]?.date;
  const lastDate = buckets[buckets.length - 1]?.date;

  return (
    <div className="space-y-2">
      <div className="flex h-44 items-end gap-px rounded-2xl border border-border bg-prism-surface-field p-3">
        {buckets.map(bucket => {
          const heightPercent = Math.round((bucket.count / maxCount) * 100);

          return (
            <div
              key={bucket.date}
              className="group relative flex h-full flex-1 items-end"
              title={`${bucket.date}: ${formatNumber(bucket.count)} signups`}
            >
              <div
                className="w-full rounded-t bg-prism-teal-500/70 transition-colors group-hover:bg-prism-teal-500"
                style={{ height: `${Math.max(heightPercent, bucket.count > 0 ? 4 : 1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-prism-muted">
        <span>{firstDate}</span>
        <span>Peak {formatNumber(maxCount)}/day</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

const FUNNEL_BAR_TONES = [
  "bg-prism-teal-500",
  "bg-prism-teal-500/80",
  "bg-prism-glow-sky/80",
  "bg-prism-glow-sky/60",
] as const;

function LifecycleFunnel({ metrics }: { metrics: UserMetricsSummary | null | undefined }) {
  if (!metrics) {
    return <p className="text-sm text-prism-muted">No user metrics available yet.</p>;
  }

  const stages = [
    { label: "Signed up", value: metrics.totalUsers, detail: "All registered accounts" },
    { label: "Verified email", value: metrics.verifiedUsers, detail: "Confirmed their email address" },
    { label: "Joined a workspace", value: metrics.usersInWorkspace, detail: "Belong to at least one workspace" },
    { label: "Active session", value: metrics.usersWithActiveSession, detail: "Currently signed in" },
  ];

  const total = stages[0].value;

  if (total <= 0) {
    return <p className="text-sm text-prism-muted">No users recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const previous = index === 0 ? null : stages[index - 1];
        const overallPercent = Math.round((stage.value / total) * 100);
        const dropOff = previous ? previous.value - stage.value : 0;

        return (
          <div
            key={stage.label}
            className="rounded-2xl border border-border bg-prism-surface-field p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-prism-heading">{stage.label}</p>
                <p className="text-xs text-prism-muted">{stage.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-prism-heading">{formatNumber(stage.value)}</p>
                <p className="text-xs text-prism-muted">{formatPercent(stage.value, total)} of all users</p>
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border/60">
              <div
                className={`h-full rounded-full ${FUNNEL_BAR_TONES[index] ?? FUNNEL_BAR_TONES[0]}`}
                style={{ width: `${Math.max(overallPercent, stage.value > 0 ? 2 : 0)}%` }}
              />
            </div>
            {previous ? (
              <p className="mt-2 text-xs text-prism-muted">
                {formatPercent(stage.value, previous.value)} of {previous.label.toLowerCase()}
                {dropOff > 0 ? ` · ${formatNumber(dropOff)} dropped off` : null}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-prism-surface-field px-4 py-3">
      <span className="text-sm text-prism-muted">{label}</span>
      <span className="text-sm font-semibold text-prism-heading">{formatNumber(value)}</span>
    </div>
  );
}
