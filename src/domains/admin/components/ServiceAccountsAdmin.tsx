"use client";

import { KeyRound, Pencil, Plus, Power, PowerOff } from "lucide-react";
import * as React from "react";

import { Badge, Button, Card, Dialog, EmptyState, Field, Input, Textarea } from "@/atomics";
import { formatDateTime } from "@/shared/utils/format";

import {
  useCreateServiceAccount,
  useCreateServiceAccountToken,
  useServiceAccountHealth,
  useServiceAccounts,
  useServiceAccountTokens,
  useToggleServiceAccount,
  useUpdateServiceAccount,
} from "../hooks";
import type { InternalScope, IssueServiceApiTokenResponse, ServiceAccount } from "../types";
import { ErrorPanel, LoadingPanel, PageHeader, RawTokenPanel, SectionTitle, StatCard, TableShell } from "./common";
import { ExpirationField, fromDateTimeInput, ReasonField, ScopePicker, toIsoDateTimeInput } from "./forms";

export function ServiceAccountsAdmin() {
  const health = useServiceAccountHealth();
  const accounts = useServiceAccounts();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<ServiceAccount | null>(null);
  const [tokenAccount, setTokenAccount] = React.useState<ServiceAccount | null>(null);
  const [rawToken, setRawToken] = React.useState<IssueServiceApiTokenResponse | null>(null);

  return (
    <>
      <PageHeader
        overline="Internal services"
        title="Service accounts"
        description="Create, activate, deactivate, and inspect service accounts used by internal workers."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Create account
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={health.data?.totalServiceAccounts ?? 0} tone="blue" />
        <StatCard label="Active" value={health.data?.activeServiceAccounts ?? 0} tone="success" />
        <StatCard label="Without tokens" value={health.data?.serviceAccountsWithoutTokens ?? 0} tone="warning" />
        <StatCard
          label="Inactive with active tokens"
          value={health.data?.inactiveServiceAccountsWithActiveTokens ?? 0}
          tone={(health.data?.inactiveServiceAccountsWithActiveTokens ?? 0) > 0 ? "danger" : "neutral"}
        />
      </div>

      <Card>
        <SectionTitle
          title="Accounts"
          description="Metadata and activation state for internal service accounts."
        />
        <div className="mt-5">
          {accounts.isLoading ? <LoadingPanel label="Loading service accounts..." /> : null}
          {accounts.isError ? <ErrorPanel onRetry={() => void accounts.refetch()} /> : null}
          {accounts.data?.length === 0 ? (
            <EmptyState
              title="No service accounts"
              description="Create a service account before issuing internal API tokens."
              action={<Button onClick={() => setCreateOpen(true)}>Create account</Button>}
            />
          ) : null}
          {accounts.data?.length ? (
            <TableShell>
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-prism-navy/5 text-left text-xs uppercase tracking-[0.12em] text-prism-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {accounts.data.map(account => (
                    <ServiceAccountRow
                      key={account.serviceAccountId}
                      account={account}
                      onEdit={() => setEditingAccount(account)}
                      onTokens={() => setTokenAccount(account)}
                    />
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : null}
        </div>
      </Card>

      <CreateServiceAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditServiceAccountDialog
        key={editingAccount?.serviceAccountId ?? "edit-account"}
        account={editingAccount}
        onOpenChange={open => {
          if (!open) setEditingAccount(null);
        }}
      />
      <AccountTokensDialog
        key={tokenAccount?.serviceAccountId ?? "account-tokens"}
        account={tokenAccount}
        onOpenChange={open => {
          if (!open) setTokenAccount(null);
        }}
        onIssued={setRawToken}
      />
      <Dialog
        open={Boolean(rawToken)}
        onOpenChange={open => {
          if (!open) setRawToken(null);
        }}
        title="Service token issued"
        description="Persist the raw token in the service secret store before closing."
      >
        {rawToken ? <RawTokenPanel token={rawToken.token} /> : null}
      </Dialog>
    </>
  );
}

function ServiceAccountRow({
  account,
  onEdit,
  onTokens,
}: {
  account: ServiceAccount;
  onEdit: () => void;
  onTokens: () => void;
}) {
  const toggle = useToggleServiceAccount(account.isActive);
  const [reason, setReason] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <tr>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <p className="font-semibold text-prism-heading">{account.name}</p>
          <p className="max-w-md truncate text-sm text-prism-muted">{account.description ?? "No description"}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge tone={account.isActive ? "success" : "neutral"}>{account.isActive ? "Active" : "Inactive"}</Badge>
      </td>
      <td className="px-4 py-4 text-prism-muted">{formatDateTime(account.updatedAt)}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTokens}
          >
            <KeyRound />
            Tokens
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <Pencil />
            Edit
          </Button>
          <Button
            type="button"
            variant={account.isActive ? "dangerSoft" : "outline"}
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            {account.isActive ? <PowerOff /> : <Power />}
            {account.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
        <Dialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`${account.isActive ? "Deactivate" : "Activate"} ${account.name}`}
          description="This action writes an admin audit event."
        >
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              toggle.mutate(
                { serviceAccountId: account.serviceAccountId, reason },
                {
                  onSuccess: () => {
                    setReason("");
                    setConfirmOpen(false);
                  },
                },
              );
            }}
          >
            <ReasonField value={reason} onChange={setReason} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant={account.isActive ? "dangerSoft" : "default"} disabled={toggle.isPending}>
                {toggle.isPending ? "Saving..." : account.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </form>
        </Dialog>
      </td>
    </tr>
  );
}

function CreateServiceAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateServiceAccount();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create service account">
      <form
        className="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          create.mutate(
            { payload: { name, description: description || undefined }, reason },
            {
              onSuccess: () => {
                setName("");
                setDescription("");
                setReason("");
                onOpenChange(false);
              },
            },
          );
        }}
      >
        <Field label="Name">
          <Input value={name} onChange={event => setName(event.target.value)} maxLength={100} required />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} />
        </Field>
        <ReasonField value={reason} onChange={setReason} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditServiceAccountDialog({
  account,
  onOpenChange,
}: {
  account: ServiceAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateServiceAccount();
  const [name, setName] = React.useState(account?.name ?? "");
  const [description, setDescription] = React.useState(account?.description ?? "");
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange} title="Edit service account">
      {account ? (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault();
            update.mutate(
              {
                serviceAccountId: account.serviceAccountId,
                payload: { name, description: description || null },
                reason,
              },
              {
                onSuccess: () => onOpenChange(false),
              },
            );
          }}
        >
          <Field label="Name">
            <Input value={name} onChange={event => setName(event.target.value)} maxLength={100} required />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} />
          </Field>
          <ReasonField value={reason} onChange={setReason} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}

function AccountTokensDialog({
  account,
  onOpenChange,
  onIssued,
}: {
  account: ServiceAccount | null;
  onOpenChange: (open: boolean) => void;
  onIssued: (response: IssueServiceApiTokenResponse) => void;
}) {
  const tokens = useServiceAccountTokens(account?.serviceAccountId ?? null);
  const issue = useCreateServiceAccountToken();
  const [name, setName] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState(toIsoDateTimeInput());
  const [scopes, setScopes] = React.useState<InternalScope[]>(["embeddings:write"]);
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange} title={`Tokens for ${account?.name ?? "service"}`}>
      {account ? (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-prism-heading">Existing tokens</h4>
            <div className="mt-3">
              {tokens.isLoading ? <LoadingPanel label="Loading tokens..." /> : null}
              {tokens.data?.length ? (
                <TableShell>
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-prism-navy/5 text-left text-xs uppercase tracking-[0.12em] text-prism-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Prefix</th>
                        <th className="px-4 py-3 font-semibold">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {tokens.data.map(token => (
                        <tr key={token.apiTokenId}>
                          <td className="px-4 py-3 font-medium text-prism-heading">{token.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-prism-muted">{token.tokenPrefix}</td>
                          <td className="px-4 py-3 text-prism-muted">{formatDateTime(token.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableShell>
              ) : null}
            </div>
          </div>

          <form
            className="space-y-5 rounded-2xl border border-border bg-prism-surface-field-soft p-4"
            onSubmit={event => {
              event.preventDefault();
              issue.mutate(
                {
                  serviceAccountId: account.serviceAccountId,
                  payload: {
                    name,
                    scopes: [...scopes],
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
            <SectionTitle title="Issue token" description="The raw token will be shown once after creation." />
            <Field label="Token name">
              <Input value={name} onChange={event => setName(event.target.value)} maxLength={100} required />
            </Field>
            <ScopePicker value={scopes} onChange={setScopes} />
            <ExpirationField value={expiresAt} onChange={setExpiresAt} />
            <ReasonField value={reason} onChange={setReason} />
            <div className="flex justify-end">
              <Button type="submit" disabled={issue.isPending || scopes.length === 0}>
                {issue.isPending ? "Issuing..." : "Issue token"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </Dialog>
  );
}
