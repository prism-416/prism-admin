"use client";

import { ShieldCheck } from "lucide-react";
import * as React from "react";

import { Button, Card, Field, Input } from "@/atomics";

import { AdminApiError, AdminRateLimitError, AdminUnauthorizedError, verifyAdminPassword } from "../api";
import { useAdminSession } from "../session";

export function AdminPasswordGate({ children }: { children: React.ReactNode }) {
  const { adminPassword, setAdminPassword } = useAdminSession();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = React.useState<number | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = password.trim();

    if (!trimmed) {
      setError("Enter the admin password.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setRetryAfterSeconds(null);

    try {
      await verifyAdminPassword(trimmed);
      setAdminPassword(trimmed);
      setPassword("");
    } catch (unknownError) {
      if (unknownError instanceof AdminUnauthorizedError) {
        setError("The admin password is invalid.");
      } else if (unknownError instanceof AdminRateLimitError) {
        setRetryAfterSeconds(unknownError.retryAfterSeconds);
        setError(
          unknownError.retryAfterSeconds
            ? `Too many invalid attempts. Try again in ${unknownError.retryAfterSeconds} seconds.`
            : "Too many invalid attempts. Try again later.",
        );
      } else if (unknownError instanceof AdminApiError) {
        setError(unknownError.message);
      } else {
        setError("Could not verify the admin password.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  if (adminPassword) {
    return children;
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <Card className="relative w-full max-w-md overflow-hidden bg-surface-strong p-8">
        <div className="absolute -right-20 -top-20 size-48 rounded-full bg-prism-glow-violet/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-56 rounded-full bg-prism-glow-sky/20 blur-3xl" />
        <div className="relative space-y-7">
          <div className="space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-prism-navy text-white shadow-lg shadow-prism-navy/15">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-prism-teal-500">Operator access</p>
              <h1 className="text-3xl font-semibold tracking-tight text-prism-heading">Prizmatic Admin</h1>
              <p className="text-sm leading-6 text-prism-muted">
                Enter the admin password to manage service accounts, tokens, embeddings, and audit events.
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <Field label="Admin password">
              <Input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="x-admin-password"
                autoComplete="current-password"
              />
            </Field>

            {error ? (
              <div className="rounded-xl border border-prism-danger-soft bg-prism-danger-soft/25 px-4 py-3 text-sm text-prism-danger">
                {error}
                {retryAfterSeconds ? (
                  <p className="mt-1 text-xs leading-5 text-prism-danger/80">
                    This lockout is enforced by the API with the `Retry-After` response header.
                  </p>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Unlock dashboard"}
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}
