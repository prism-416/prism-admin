"use client";

import { Pencil, Plus, RotateCcw } from "lucide-react";
import * as React from "react";

import { Badge, Button, Card, Dialog, Field, Input, Select } from "@/atomics";
import { formatDateTime } from "@/shared/utils/format";

import {
  useIssueServiceApiToken,
  useRevokeServiceApiToken,
  useServiceApiTokenHealth,
  useServiceApiTokens,
  useUpdateServiceApiToken,
} from "../hooks";
import type { InternalScope, IssueServiceApiTokenResponse, ServiceApiTokenInventoryItem, ServiceTokenStatus } from "../types";
import { SERVICE_TOKEN_STATUSES } from "../types";
import { ErrorPanel, LoadingPanel, PageHeader, RawTokenPanel, SectionTitle, StatCard, TableShell } from "./common";
import { ExpirationField, fromDateTimeInput, ReasonField, ScopePicker, toIsoDateTimeInput } from "./forms";

const PAGE_SIZE = 50;

function toOptionalIsoDateTime(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toOptionalPositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function ServiceTokensAdmin() {
  const [status, setStatus] = React.useState<ServiceTokenStatus | "">("");
  const [serviceName, setServiceName] = React.useState("");
  const [serviceAccountId, setServiceAccountId] = React.useState("");
  const [expiresBefore, setExpiresBefore] = React.useState("");
  const [lastUsedBefore, setLastUsedBefore] = React.useState("");
  const [expiringWithinDays, setExpiringWithinDays] = React.useState("30");
  const [staleAfterDays, setStaleAfterDays] = React.useState("90");
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [editingToken, setEditingToken] = React.useState<ServiceApiTokenInventoryItem | null>(null);
  const [revokingToken, setRevokingToken] = React.useState<ServiceApiTokenInventoryItem | null>(null);
  const [rawToken, setRawToken] = React.useState<IssueServiceApiTokenResponse | null>(null);
  const filters = React.useMemo(
    () => ({
      serviceAccountId: serviceAccountId.trim(),
      serviceName: serviceName.trim(),
      status,
      expiresBefore: toOptionalIsoDateTime(expiresBefore),
      lastUsedBefore: toOptionalIsoDateTime(lastUsedBefore),
      limit: PAGE_SIZE,
      offset: 0,
    }),
    [expiresBefore, lastUsedBefore, serviceAccountId, serviceName, status],
  );
  const healthParams = React.useMemo(
    () => ({
      expiringWithinDays: toOptionalPositiveNumber(expiringWithinDays),
      staleAfterDays: toOptionalPositiveNumber(staleAfterDays),
    }),
    [expiringWithinDays, staleAfterDays],
  );
  const tokens = useServiceApiTokens(filters);
  const health = useServiceApiTokenHealth(healthParams);
  const expiringWindowDays = health.data?.expiringWithinDays ?? healthParams.expiringWithinDays ?? 30;
  const staleWindowDays = health.data?.staleAfterDays ?? healthParams.staleAfterDays ?? 90;

  function clearFilters() {
    setStatus("");
    setServiceName("");
    setServiceAccountId("");
    setExpiresBefore("");
    setLastUsedBefore("");
  }

  return (
    <>
      <PageHeader
        overline="Internal API"
        title="Service tokens"
        description="Search, issue, update, and revoke internal service API tokens without exposing token hashes."
        actions={
          <Button onClick={() => setIssueOpen(true)}>
            <Plus />
            Issue token
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total tokens" value={health.data?.totalTokens ?? 0} tone="blue" />
        <StatCard label="Active" value={health.data?.activeTokens ?? 0} tone="success" />
        <StatCard
          label="Expiring soon"
          value={health.data?.expiringSoonTokens ?? 0}
          detail={`Within ${expiringWindowDays} days`}
          tone="warning"
        />
        <StatCard
          label="Stale active"
          value={health.data?.staleActiveTokens ?? 0}
          detail={`Unused for ${staleWindowDays} days`}
          tone="danger"
        />
      </div>

      <Card>
        <SectionTitle
          title="Health thresholds"
          description="These controls use the documented token health query parameters."
        />
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Expiring within days">
            <Input
              type="number"
              min={1}
              max={365}
              value={expiringWithinDays}
              onChange={event => setExpiringWithinDays(event.target.value)}
            />
          </Field>
          <Field label="Stale after days">
            <Input
              type="number"
              min={1}
              max={3650}
              value={staleAfterDays}
              onChange={event => setStaleAfterDays(event.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => void health.refetch()} className="w-full">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Token inventory"
          description="Filter by the documented token search fields. Raw token values are never returned in inventory."
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Field label="Service name">
            <Input value={serviceName} onChange={event => setServiceName(event.target.value)} placeholder="embedding-worker" />
          </Field>
          <Field label="Service account ID">
            <Input
              value={serviceAccountId}
              onChange={event => setServiceAccountId(event.target.value)}
              placeholder="UUID"
            />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={event => setStatus(event.target.value as ServiceTokenStatus | "")}>
              <option value="">All statuses</option>
              {SERVICE_TOKEN_STATUSES.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expires before">
            <Input
              type="datetime-local"
              value={expiresBefore}
              onChange={event => setExpiresBefore(event.target.value)}
            />
          </Field>
          <Field label="Last used before">
            <Input
              type="datetime-local"
              value={lastUsedBefore}
              onChange={event => setLastUsedBefore(event.target.value)}
            />
          </Field>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => void tokens.refetch()}>
              Refresh
            </Button>
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {tokens.isLoading ? <LoadingPanel label="Loading token inventory..." /> : null}
          {tokens.isError ? <ErrorPanel onRetry={() => void tokens.refetch()} /> : null}
          {tokens.data ? (
            <TableShell>
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-prism-navy/5 text-left text-xs uppercase tracking-[0.12em] text-prism-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Token</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Expires</th>
                    <th className="px-4 py-3 font-semibold">Last used</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {tokens.data.items.map(token => (
                    <tr key={token.apiTokenId}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-prism-heading">{token.name}</p>
                        <p className="font-mono text-xs text-prism-muted">{token.tokenPrefix}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-prism-body">{token.serviceAccountName}</p>
                        <p className="text-xs text-prism-muted">{token.serviceAccountActive ? "active account" : "inactive account"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={token.status === "active" ? "success" : token.status === "expired" ? "warning" : "danger"}>
                          {token.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-prism-muted">{formatDateTime(token.expiresAt)}</td>
                      <td className="px-4 py-4 text-prism-muted">{formatDateTime(token.lastUsedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingToken(token)}>
                            <Pencil />
                            Edit
                          </Button>
                          <Button variant="dangerSoft" size="sm" onClick={() => setRevokingToken(token)} disabled={token.status === "revoked"}>
                            <RotateCcw />
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : null}
        </div>
      </Card>

      <IssueTokenDialog open={issueOpen} onOpenChange={setIssueOpen} onIssued={setRawToken} />
      <EditTokenDialog
        key={editingToken?.apiTokenId ?? "edit-token"}
        token={editingToken}
        onOpenChange={open => !open && setEditingToken(null)}
      />
      <RevokeTokenDialog
        key={revokingToken?.apiTokenId ?? "revoke-token"}
        token={revokingToken}
        onOpenChange={open => !open && setRevokingToken(null)}
      />
      <Dialog
        open={Boolean(rawToken)}
        onOpenChange={open => {
          if (!open) setRawToken(null);
        }}
        title="Service token issued"
      >
        {rawToken ? <RawTokenPanel token={rawToken.token} /> : null}
      </Dialog>
    </>
  );
}

function IssueTokenDialog({
  open,
  onOpenChange,
  onIssued,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: (response: IssueServiceApiTokenResponse) => void;
}) {
  const issue = useIssueServiceApiToken();
  const [serviceName, setServiceName] = React.useState("");
  const [serviceDescription, setServiceDescription] = React.useState("");
  const [tokenName, setTokenName] = React.useState("");
  const [scopes, setScopes] = React.useState<InternalScope[]>(["embeddings:write"]);
  const [expiresAt, setExpiresAt] = React.useState(toIsoDateTimeInput());
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Issue service API token">
      <form
        className="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          issue.mutate(
            {
              payload: {
                serviceName,
                serviceDescription: serviceDescription || undefined,
                tokenName,
                scopes,
                expiresAt: fromDateTimeInput(expiresAt),
              },
              reason,
            },
            {
              onSuccess: response => {
                onIssued(response);
                onOpenChange(false);
              },
            },
          );
        }}
      >
        <Field label="Service name">
          <Input value={serviceName} onChange={event => setServiceName(event.target.value)} required maxLength={100} />
        </Field>
        <Field label="Service description">
          <Input value={serviceDescription} onChange={event => setServiceDescription(event.target.value)} maxLength={1000} />
        </Field>
        <Field label="Token name">
          <Input value={tokenName} onChange={event => setTokenName(event.target.value)} required maxLength={100} />
        </Field>
        <ScopePicker value={scopes} onChange={setScopes} />
        <ExpirationField value={expiresAt} onChange={setExpiresAt} />
        <ReasonField value={reason} onChange={setReason} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={issue.isPending || scopes.length === 0}>
            {issue.isPending ? "Issuing..." : "Issue token"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditTokenDialog({
  token,
  onOpenChange,
}: {
  token: ServiceApiTokenInventoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateServiceApiToken();
  const [name, setName] = React.useState(token?.name ?? "");
  const [scopes, setScopes] = React.useState<InternalScope[]>(token?.scopes ?? []);
  const [expiresAt, setExpiresAt] = React.useState(
    token?.expiresAt ? new Date(token.expiresAt).toISOString().slice(0, 16) : toIsoDateTimeInput(),
  );
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(token)} onOpenChange={onOpenChange} title="Edit service token">
      {token ? (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault();
            update.mutate(
              {
                apiTokenId: token.apiTokenId,
                payload: { name, scopes, expiresAt: fromDateTimeInput(expiresAt) },
                reason,
              },
              { onSuccess: () => onOpenChange(false) },
            );
          }}
        >
          <Field label="Token name">
            <Input value={name} onChange={event => setName(event.target.value)} required maxLength={100} />
          </Field>
          <ScopePicker value={scopes} onChange={setScopes} />
          <ExpirationField value={expiresAt} onChange={setExpiresAt} />
          <ReasonField value={reason} onChange={setReason} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending || scopes.length === 0}>
              {update.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}

function RevokeTokenDialog({
  token,
  onOpenChange,
}: {
  token: ServiceApiTokenInventoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const revoke = useRevokeServiceApiToken();
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(token)} onOpenChange={onOpenChange} title={`Revoke ${token?.name ?? "token"}`}>
      {token ? (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault();
            revoke.mutate({ apiTokenId: token.apiTokenId, reason }, { onSuccess: () => onOpenChange(false) });
          }}
        >
          <p className="rounded-xl border border-prism-danger-soft bg-prism-danger-soft/25 px-4 py-3 text-sm leading-6 text-prism-danger">
            Revoking a token cannot be undone. The service must be rotated to a new token.
          </p>
          <ReasonField value={reason} onChange={setReason} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="dangerSoft" disabled={revoke.isPending}>
              {revoke.isPending ? "Revoking..." : "Revoke token"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
