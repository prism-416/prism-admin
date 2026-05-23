"use client";

import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import * as React from "react";

import { AdminRateLimitError, AdminUnauthorizedError } from "./api";

const ADMIN_PASSWORD_STORAGE_KEY = "prizmatic.admin.password";

type AdminSessionContextValue = {
  adminPassword: string | null;
  setAdminPassword: (password: string) => void;
  clearAdminPassword: () => void;
};

const AdminSessionContext = React.createContext<AdminSessionContextValue | null>(null);

export function useAdminSession() {
  const context = React.useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider.");
  }

  return context;
}

function isUnauthorized(error: unknown) {
  return error instanceof AdminUnauthorizedError;
}

function shouldRetry(error: unknown) {
  return !(error instanceof AdminUnauthorizedError) && !(error instanceof AdminRateLimitError);
}

function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [adminPassword, setAdminPasswordState] = React.useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
  });

  const clearAdminPassword = React.useCallback(() => {
    window.sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    setAdminPasswordState(null);
  }, []);

  const setAdminPassword = React.useCallback((password: string) => {
    window.sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
    setAdminPasswordState(password);
  }, []);

  const value = React.useMemo(
    () => ({ adminPassword, clearAdminPassword, setAdminPassword }),
    [adminPassword, clearAdminPassword, setAdminPassword],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const { clearAdminPassword } = useAdminSession();

  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError(error) {
            if (isUnauthorized(error)) {
              clearAdminPassword();
            }
          },
        }),
        mutationCache: new MutationCache({
          onError(error) {
            if (isUnauthorized(error)) {
              clearAdminPassword();
            }
          },
        }),
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => shouldRetry(error) && failureCount < 1,
            staleTime: 30_000,
          },
        },
      }),
    [clearAdminPassword],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminQueryProvider>{children}</AdminQueryProvider>
    </AdminSessionProvider>
  );
}
