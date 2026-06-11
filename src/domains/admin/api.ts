import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import type { ApiErrorBody, ApiResponse } from "@/shared/types/api";

import type {
  AdminMutationOptions,
  CreateServiceAccountPayload,
  CreateServiceApiTokenPayload,
  EmbeddingCoverageSummary,
  EmbeddingJobHealthSummary,
  GetEmbeddingJobHealthParams,
  GetServiceApiTokenHealthParams,
  IssueServiceApiTokenPayload,
  IssueServiceApiTokenResponse,
  SearchAdminAuditEventsParams,
  SearchAdminAuditEventsResult,
  GetUserActiveTrendParams,
  GetUserSignupTrendParams,
  SearchServiceApiTokensParams,
  SearchServiceApiTokensResult,
  ServiceAccount,
  ServiceAccountHealthSummary,
  ServiceApiToken,
  ServiceApiTokenHealthSummary,
  UpdateServiceAccountPayload,
  UpdateServiceApiTokenPayload,
  UserActiveTrend,
  UserActivitySummary,
  UserMetricsSummary,
  UserSignupTrend,
} from "./types";

const DEFAULT_API_HOST = "https://api.prizmatic.app/dev";
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || DEFAULT_API_HOST;

const client = axios.create({
  baseURL: API_HOST.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

export class AdminUnauthorizedError extends Error {
  constructor(message = "Invalid admin password") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

export class AdminRateLimitError extends Error {
  retryAfterSeconds: number | null;

  constructor(message = "Too many invalid admin password attempts", retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "AdminRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AdminApiError extends Error {
  code?: string;
  requestId?: string;

  constructor(message: string, code?: string, requestId?: string) {
    super(message);
    this.name = "AdminApiError";
    this.code = code;
    this.requestId = requestId;
  }
}

type AdminRequestOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PATCH";
  password: string;
  data?: TBody;
  params?: Record<string, unknown>;
  reason?: string;
};

function normalizeParams(params?: Record<string, unknown>) {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function getRetryAfterSeconds(error: AxiosError<ApiErrorBody>) {
  const retryAfter = error.response?.headers?.["retry-after"];
  const retryAfterValue = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;
  const parsed = Number(retryAfterValue);

  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : null;
}

async function requestAdmin<TResponse, TBody = unknown>(
  url: string,
  { method = "GET", password, data, params, reason }: AdminRequestOptions<TBody>,
) {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      params: normalizeParams(params),
      headers: {
        "x-admin-password": password,
        ...(reason?.trim() ? { "x-admin-reason": reason.trim() } : {}),
      },
    };

    const response = await client.request<ApiResponse<TResponse>>(config);
    return response.data.data as TResponse;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    if (axiosError.response?.status === 429) {
      throw new AdminRateLimitError(axiosError.response.data?.message, getRetryAfterSeconds(axiosError));
    }

    if (axiosError.response?.status === 401) {
      throw new AdminUnauthorizedError(axiosError.response.data?.message);
    }

    const body = axiosError.response?.data;
    throw new AdminApiError(body?.message ?? axiosError.message, body?.code, body?.requestId);
  }
}

export async function verifyAdminPassword(password: string) {
  await requestAdmin<ServiceAccountHealthSummary>("/admin/service-accounts/health", { password });
}

export function getServiceAccounts(password: string) {
  return requestAdmin<ServiceAccount[]>("/admin/service-accounts", { password });
}

export function getServiceAccountHealth(password: string) {
  return requestAdmin<ServiceAccountHealthSummary>("/admin/service-accounts/health", { password });
}

export function createServiceAccount(
  password: string,
  payload: CreateServiceAccountPayload,
  options?: AdminMutationOptions,
) {
  return requestAdmin<ServiceAccount, CreateServiceAccountPayload>("/admin/service-accounts", {
    method: "POST",
    password,
    data: payload,
    reason: options?.reason,
  });
}

export function updateServiceAccount(
  password: string,
  serviceAccountId: string,
  payload: UpdateServiceAccountPayload,
  options?: AdminMutationOptions,
) {
  return requestAdmin<ServiceAccount, UpdateServiceAccountPayload>(
    `/admin/service-accounts/${encodeURIComponent(serviceAccountId)}`,
    {
      method: "PATCH",
      password,
      data: payload,
      reason: options?.reason,
    },
  );
}

export function activateServiceAccount(password: string, serviceAccountId: string, options?: AdminMutationOptions) {
  return requestAdmin<ServiceAccount>(`/admin/service-accounts/${encodeURIComponent(serviceAccountId)}/activate`, {
    method: "POST",
    password,
    reason: options?.reason,
  });
}

export function deactivateServiceAccount(password: string, serviceAccountId: string, options?: AdminMutationOptions) {
  return requestAdmin<ServiceAccount>(`/admin/service-accounts/${encodeURIComponent(serviceAccountId)}/deactivate`, {
    method: "POST",
    password,
    reason: options?.reason,
  });
}

export function getServiceAccountTokens(password: string, serviceAccountId: string) {
  return requestAdmin<ServiceApiToken[]>(`/admin/service-accounts/${encodeURIComponent(serviceAccountId)}/api-tokens`, {
    password,
  });
}

export function createServiceAccountToken(
  password: string,
  serviceAccountId: string,
  payload: CreateServiceApiTokenPayload,
  options?: AdminMutationOptions,
) {
  return requestAdmin<IssueServiceApiTokenResponse, CreateServiceApiTokenPayload>(
    `/admin/service-accounts/${encodeURIComponent(serviceAccountId)}/api-tokens`,
    {
      method: "POST",
      password,
      data: payload,
      reason: options?.reason,
    },
  );
}

export function getServiceApiTokenHealth(password: string, params?: GetServiceApiTokenHealthParams) {
  return requestAdmin<ServiceApiTokenHealthSummary>("/admin/service-api-tokens/health", { password, params });
}

export function searchServiceApiTokens(password: string, params?: SearchServiceApiTokensParams) {
  return requestAdmin<SearchServiceApiTokensResult>("/admin/service-api-tokens", { password, params });
}

export function issueServiceApiToken(
  password: string,
  payload: IssueServiceApiTokenPayload,
  options?: AdminMutationOptions,
) {
  return requestAdmin<IssueServiceApiTokenResponse, IssueServiceApiTokenPayload>("/admin/service-api-tokens", {
    method: "POST",
    password,
    data: payload,
    reason: options?.reason,
  });
}

export function updateServiceApiToken(
  password: string,
  apiTokenId: string,
  payload: UpdateServiceApiTokenPayload,
  options?: AdminMutationOptions,
) {
  return requestAdmin<ServiceApiToken, UpdateServiceApiTokenPayload>(
    `/admin/service-api-tokens/${encodeURIComponent(apiTokenId)}`,
    {
      method: "PATCH",
      password,
      data: payload,
      reason: options?.reason,
    },
  );
}

export function revokeServiceApiToken(password: string, apiTokenId: string, options?: AdminMutationOptions) {
  return requestAdmin<ServiceApiToken>(`/admin/service-api-tokens/${encodeURIComponent(apiTokenId)}/revoke`, {
    method: "POST",
    password,
    reason: options?.reason,
  });
}

export function getEmbeddingCoverage(password: string) {
  return requestAdmin<EmbeddingCoverageSummary>("/admin/embeddings/coverage", { password });
}

export function getEmbeddingJobHealth(password: string, params?: GetEmbeddingJobHealthParams) {
  return requestAdmin<EmbeddingJobHealthSummary>("/admin/embedding-jobs/health", { password, params });
}

export function searchAdminAuditEvents(password: string, params?: SearchAdminAuditEventsParams) {
  return requestAdmin<SearchAdminAuditEventsResult>("/admin/audit-events", { password, params });
}

export function getUserActivitySummary(password: string) {
  return requestAdmin<UserActivitySummary>("/admin/users/activity", { password });
}

export function getUserMetricsSummary(password: string) {
  return requestAdmin<UserMetricsSummary>("/admin/users/metrics", { password });
}

export function getUserSignupTrend(password: string, params?: GetUserSignupTrendParams) {
  return requestAdmin<UserSignupTrend>("/admin/users/signups", { password, params });
}

export function getUserActiveTrend(password: string, params?: GetUserActiveTrendParams) {
  return requestAdmin<UserActiveTrend>("/admin/users/activity/trend", { password, params });
}
