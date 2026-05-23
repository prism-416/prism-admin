"use client";

import * as React from "react";

import { Badge, Button, Card, Field, Input, Select } from "@/atomics";
import { formatDateTime } from "@/shared/utils/format";

import { useAdminAuditEvents } from "../hooks";
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_TARGET_TYPES, type AdminAuditAction, type AdminAuditTargetType } from "../types";
import { ErrorPanel, LoadingPanel, PageHeader, SectionTitle, TableShell } from "./common";

const PAGE_SIZE = 25;

export function AuditEventsAdmin() {
  const [action, setAction] = React.useState<AdminAuditAction | "">("");
  const [targetType, setTargetType] = React.useState<AdminAuditTargetType | "">("");
  const [targetId, setTargetId] = React.useState("");
  const [offset, setOffset] = React.useState(0);
  const filters = React.useMemo(
    () => ({ action, targetType, targetId, limit: PAGE_SIZE, offset }),
    [action, offset, targetId, targetType],
  );
  const events = useAdminAuditEvents(filters);
  const total = events.data?.total ?? 0;
  const canGoBack = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  function resetPaging() {
    setOffset(0);
  }

  return (
    <>
      <PageHeader
        overline="Audit"
        title="Admin audit events"
        description="Review metadata-only records for service account and service token mutations."
      />

      <Card>
        <SectionTitle title="Filters" description="Narrow by action, target type, or target identifier." />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Field label="Action">
            <Select
              value={action}
              onChange={event => {
                setAction(event.target.value as AdminAuditAction | "");
                resetPaging();
              }}
            >
              <option value="">All actions</option>
              {ADMIN_AUDIT_ACTIONS.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target type">
            <Select
              value={targetType}
              onChange={event => {
                setTargetType(event.target.value as AdminAuditTargetType | "");
                resetPaging();
              }}
            >
              <option value="">All targets</option>
              {ADMIN_AUDIT_TARGET_TYPES.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Target ID">
            <Input
              value={targetId}
              onChange={event => {
                setTargetId(event.target.value);
                resetPaging();
              }}
              placeholder="UUID or token id"
            />
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => void events.refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Events"
          description={`${total} matching events`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoBack}
                onClick={() => setOffset(current => Math.max(current - PAGE_SIZE, 0))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => setOffset(current => current + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          }
        />

        <div className="mt-5">
          {events.isLoading ? <LoadingPanel label="Loading audit events..." /> : null}
          {events.isError ? <ErrorPanel onRetry={() => void events.refetch()} /> : null}
          {events.data ? (
            <TableShell>
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-prism-navy/5 text-left text-xs uppercase tracking-[0.12em] text-prism-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Target</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                    <th className="px-4 py-3 font-semibold">Request</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {events.data.items.map(event => (
                    <tr key={event.auditEventId}>
                      <td className="px-4 py-4">
                        <Badge tone="blue">{event.action}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-prism-heading">{event.targetName ?? "Unnamed target"}</p>
                        <p className="font-mono text-xs text-prism-muted">{event.targetId ?? "No target id"}</p>
                      </td>
                      <td className="max-w-sm px-4 py-4 text-prism-muted">{event.reason ?? "No reason"}</td>
                      <td className="px-4 py-4 font-mono text-xs text-prism-muted">{event.requestId ?? "No request id"}</td>
                      <td className="px-4 py-4 text-prism-muted">{formatDateTime(event.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : null}
        </div>
      </Card>
    </>
  );
}
