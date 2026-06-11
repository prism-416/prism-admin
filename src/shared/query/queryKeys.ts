export const QUERY_KEYS = {
  admin: {
    all: ["admin"] as const,
    auditEvents: (filters?: object) => [...QUERY_KEYS.admin.all, "audit-events", filters ?? {}] as const,
    embeddingCoverage: () => [...QUERY_KEYS.admin.all, "embedding-coverage"] as const,
    embeddingJobHealth: (filters?: object) => [...QUERY_KEYS.admin.all, "embedding-job-health", filters ?? {}] as const,
    serviceAccountHealth: () => [...QUERY_KEYS.admin.all, "service-account-health"] as const,
    serviceAccounts: () => [...QUERY_KEYS.admin.all, "service-accounts"] as const,
    serviceAccountTokens: (serviceAccountId: string) =>
      [...QUERY_KEYS.admin.all, "service-accounts", serviceAccountId, "tokens"] as const,
    serviceTokenHealth: (filters?: object) => [...QUERY_KEYS.admin.all, "service-token-health", filters ?? {}] as const,
    serviceTokens: (filters?: object) => [...QUERY_KEYS.admin.all, "service-tokens", filters ?? {}] as const,
    userActivity: () => [...QUERY_KEYS.admin.all, "user-activity"] as const,
    userActiveTrend: (filters?: object) => [...QUERY_KEYS.admin.all, "user-active-trend", filters ?? {}] as const,
    userMetrics: () => [...QUERY_KEYS.admin.all, "user-metrics"] as const,
    userSignups: (filters?: object) => [...QUERY_KEYS.admin.all, "user-signups", filters ?? {}] as const,
  },
} as const;
