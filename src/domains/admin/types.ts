export const INTERNAL_SCOPES = [
  "agents:invoke",
  "documents:read",
  "documents:write",
  "embeddings:write",
  "projects:read",
  "projects:write",
  "sprints:write",
] as const;

export type InternalScope = (typeof INTERNAL_SCOPES)[number];

export const INTERNAL_SCOPE_DETAILS: Record<InternalScope, { label: string; description: string }> = {
  "agents:invoke": {
    label: "Agent workers",
    description: "Read run state and write agent run status, steps, actions, and action events.",
  },
  "documents:read": {
    label: "Document readers",
    description: "Read project document metadata and content needed by internal services.",
  },
  "documents:write": {
    label: "Document writers",
    description: "Upload documents, append chunks, and write document chunk embeddings.",
  },
  "embeddings:write": {
    label: "Embedding workers",
    description: "Claim embedding jobs, update job status, and write work item embeddings.",
  },
  "projects:read": {
    label: "Project readers",
    description: "Search work items, read work item detail, and list child work items.",
  },
  "projects:write": {
    label: "Project writers",
    description: "Create, update, delete, and reorder work items for internal workflows.",
  },
  "sprints:write": {
    label: "Sprint writers",
    description: "Create and update sprints, delete sprints, and manage sprint work items.",
  },
};

export const SERVICE_TOKEN_STATUSES = ["active", "expired", "revoked"] as const;
export type ServiceTokenStatus = (typeof SERVICE_TOKEN_STATUSES)[number];

export const ADMIN_AUDIT_ACTIONS = [
  "service_account.create",
  "service_account.update",
  "service_account.activate",
  "service_account.deactivate",
  "service_api_token.create",
  "service_api_token.update",
  "service_api_token.revoke",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_TARGET_TYPES = ["service_account", "service_api_token"] as const;
export type AdminAuditTargetType = (typeof ADMIN_AUDIT_TARGET_TYPES)[number];

export type ServiceAccount = {
  serviceAccountId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceAccountHealthSummary = {
  generatedAt: string;
  totalServiceAccounts: number;
  activeServiceAccounts: number;
  inactiveServiceAccounts: number;
  serviceAccountsWithTokens: number;
  serviceAccountsWithoutTokens: number;
  activeServiceAccountsWithoutActiveTokens: number;
  inactiveServiceAccountsWithActiveTokens: number;
  serviceAccountsWithMultipleActiveTokens: number;
};

export type ServiceApiToken = {
  apiTokenId: string;
  serviceAccountId: string;
  name: string;
  tokenPrefix: string;
  scopes: InternalScope[];
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceApiTokenInventoryItem = ServiceApiToken & {
  serviceAccountName: string;
  serviceAccountActive: boolean;
  status: ServiceTokenStatus;
};

export type SearchServiceApiTokensResult = {
  items: ServiceApiTokenInventoryItem[];
  total: number;
  limit: number;
  offset: number;
};

export type ServiceApiTokenHealthSummary = {
  generatedAt: string;
  expiringWithinDays: number;
  staleAfterDays: number;
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
  revokedTokens: number;
  expiringSoonTokens: number;
  neverUsedActiveTokens: number;
  staleActiveTokens: number;
  activeTokensOnInactiveAccounts: number;
};

export type IssueServiceApiTokenResponse = {
  token: string;
  apiToken: ServiceApiToken;
};

export type EmbeddingCoverageSummary = {
  generatedAt: string;
  totalTargets: number;
  embeddedTargets: number;
  currentEmbeddings: number;
  missingEmbeddings: number;
  staleEmbeddings: number;
  documentChunkTargets: number;
  documentChunkCurrentEmbeddings: number;
  documentChunkMissingEmbeddings: number;
  documentChunkStaleEmbeddings: number;
  workItemTargets: number;
  workItemCurrentEmbeddings: number;
  workItemMissingEmbeddings: number;
  workItemStaleEmbeddings: number;
  workItemCommentTargets: number;
  workItemCommentCurrentEmbeddings: number;
  workItemCommentMissingEmbeddings: number;
  workItemCommentStaleEmbeddings: number;
  agentMemoryTargets: number;
  agentMemoryCurrentEmbeddings: number;
  agentMemoryMissingEmbeddings: number;
  agentMemoryStaleEmbeddings: number;
  projectsWithMissingEmbeddings: number;
  projectsWithStaleEmbeddings: number;
};

export type EmbeddingJobHealthSummary = {
  generatedAt: string;
  staleQueuedAfterMinutes: number;
  staleRunningAfterMinutes: number;
  totalJobs: number;
  queuedJobs: number;
  claimableQueuedJobs: number;
  scheduledQueuedJobs: number;
  staleQueuedJobs: number;
  exhaustedQueuedJobs: number;
  runningJobs: number;
  staleRunningJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  projectsWithPendingJobs: number;
};

export type AdminAuditEvent = {
  auditEventId: string;
  actorType: "admin-password";
  actorId: string | null;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string | null;
  targetName: string | null;
  requestId: string | null;
  reason: string | null;
  createdAt: string;
};

export type SearchAdminAuditEventsResult = {
  items: AdminAuditEvent[];
  total: number;
  limit: number;
  offset: number;
};

export type SearchServiceApiTokensParams = {
  serviceAccountId?: string;
  serviceName?: string;
  status?: ServiceTokenStatus | "";
  expiresBefore?: string;
  lastUsedBefore?: string;
  limit?: number;
  offset?: number;
};

export type SearchAdminAuditEventsParams = {
  action?: AdminAuditAction | "";
  targetType?: AdminAuditTargetType | "";
  targetId?: string;
  limit?: number;
  offset?: number;
};

export type GetServiceApiTokenHealthParams = {
  expiringWithinDays?: number;
  staleAfterDays?: number;
};

export type GetEmbeddingJobHealthParams = {
  staleQueuedAfterMinutes?: number;
  staleRunningAfterMinutes?: number;
};

export type CreateServiceAccountPayload = {
  name: string;
  description?: string;
};

export type UpdateServiceAccountPayload = {
  name?: string;
  description?: string | null;
};

export type CreateServiceApiTokenPayload = {
  name: string;
  scopes: InternalScope[];
  expiresAt: string;
};

export type IssueServiceApiTokenPayload = {
  serviceName: string;
  serviceDescription?: string;
  tokenName: string;
  scopes: InternalScope[];
  expiresAt: string;
};

export type UpdateServiceApiTokenPayload = {
  name?: string;
  scopes?: InternalScope[];
  expiresAt?: string;
};

export type AdminMutationOptions = {
  reason?: string;
};

export type UserActivitySummary = {
  generatedAt: string;
  dau: number;
  wau: number;
  mau: number;
  stickiness: number | null;
};

export type UserMetricsSummary = {
  generatedAt: string;
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersWithEmailAuth: number;
  usersWithGoogleAuth: number;
  usersWithGithubAuth: number;
  usersWithOauthAuth: number;
  usersWithActiveSession: number;
  usersInWorkspace: number;
  usersWithoutWorkspace: number;
  newUsersLast24h: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
};

export type UserSignupBucket = {
  date: string;
  count: number;
};

export type UserSignupTrend = {
  generatedAt: string;
  windowDays: number;
  totalSignups: number;
  buckets: UserSignupBucket[];
};

export type UserActiveBucket = {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
};

export type UserActiveTrend = {
  generatedAt: string;
  windowDays: number;
  buckets: UserActiveBucket[];
};

export type GetUserSignupTrendParams = {
  windowDays?: number;
};

export type GetUserActiveTrendParams = {
  windowDays?: number;
};
