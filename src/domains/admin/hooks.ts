"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/query";

import {
  activateServiceAccount,
  createServiceAccount,
  createServiceAccountToken,
  deactivateServiceAccount,
  getEmbeddingCoverage,
  getEmbeddingJobHealth,
  getServiceAccountHealth,
  getServiceAccounts,
  getServiceAccountTokens,
  getServiceApiTokenHealth,
  getUserActiveTrend,
  getUserActivitySummary,
  getUserMetricsSummary,
  getUserSignupTrend,
  issueServiceApiToken,
  revokeServiceApiToken,
  searchAdminAuditEvents,
  searchServiceApiTokens,
  updateServiceAccount,
  updateServiceApiToken,
} from "./api";
import { useAdminSession } from "./session";
import type {
  AdminMutationOptions,
  CreateServiceAccountPayload,
  CreateServiceApiTokenPayload,
  GetEmbeddingJobHealthParams,
  GetServiceApiTokenHealthParams,
  GetUserActiveTrendParams,
  GetUserSignupTrendParams,
  IssueServiceApiTokenPayload,
  SearchAdminAuditEventsParams,
  SearchServiceApiTokensParams,
  UpdateServiceAccountPayload,
  UpdateServiceApiTokenPayload,
} from "./types";

function usePassword() {
  const { adminPassword } = useAdminSession();
  return adminPassword ?? "";
}

export function useServiceAccounts() {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.serviceAccounts(),
    queryFn: () => getServiceAccounts(password),
    enabled: Boolean(password),
  });
}

export function useServiceAccountHealth() {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.serviceAccountHealth(),
    queryFn: () => getServiceAccountHealth(password),
    enabled: Boolean(password),
  });
}

export function useServiceAccountTokens(serviceAccountId: string | null) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.serviceAccountTokens(serviceAccountId ?? "none"),
    queryFn: () => getServiceAccountTokens(password, serviceAccountId ?? ""),
    enabled: Boolean(password && serviceAccountId),
  });
}

export function useServiceApiTokenHealth(params?: GetServiceApiTokenHealthParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.serviceTokenHealth(params),
    queryFn: () => getServiceApiTokenHealth(password, params),
    enabled: Boolean(password),
  });
}

export function useServiceApiTokens(params?: SearchServiceApiTokensParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.serviceTokens(params),
    queryFn: () => searchServiceApiTokens(password, params),
    enabled: Boolean(password),
  });
}

export function useEmbeddingCoverage() {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.embeddingCoverage(),
    queryFn: () => getEmbeddingCoverage(password),
    enabled: Boolean(password),
  });
}

export function useEmbeddingJobHealth(params?: GetEmbeddingJobHealthParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.embeddingJobHealth(params),
    queryFn: () => getEmbeddingJobHealth(password, params),
    enabled: Boolean(password),
  });
}

export function useAdminAuditEvents(params?: SearchAdminAuditEventsParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.auditEvents(params),
    queryFn: () => searchAdminAuditEvents(password, params),
    enabled: Boolean(password),
  });
}

export function useUserActivitySummary() {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.userActivity(),
    queryFn: () => getUserActivitySummary(password),
    enabled: Boolean(password),
  });
}

export function useUserMetricsSummary() {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.userMetrics(),
    queryFn: () => getUserMetricsSummary(password),
    enabled: Boolean(password),
  });
}

export function useUserSignupTrend(params?: GetUserSignupTrendParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.userSignups(params),
    queryFn: () => getUserSignupTrend(password, params),
    enabled: Boolean(password),
  });
}

export function useUserActiveTrend(params?: GetUserActiveTrendParams) {
  const password = usePassword();
  return useQuery({
    queryKey: QUERY_KEYS.admin.userActiveTrend(params),
    queryFn: () => getUserActiveTrend(password, params),
    enabled: Boolean(password),
  });
}

export function useCreateServiceAccount() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, reason }: { payload: CreateServiceAccountPayload; reason?: string }) =>
      createServiceAccount(password, payload, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}

export function useUpdateServiceAccount() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceAccountId,
      payload,
      reason,
    }: {
      serviceAccountId: string;
      payload: UpdateServiceAccountPayload;
      reason?: string;
    }) => updateServiceAccount(password, serviceAccountId, payload, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}

export function useToggleServiceAccount(active: boolean) {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceAccountId, reason }: { serviceAccountId: string; reason?: string }) =>
      active
        ? deactivateServiceAccount(password, serviceAccountId, { reason })
        : activateServiceAccount(password, serviceAccountId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}

export function useCreateServiceAccountToken() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceAccountId,
      payload,
      reason,
    }: {
      serviceAccountId: string;
      payload: CreateServiceApiTokenPayload;
      reason?: string;
    }) => createServiceAccountToken(password, serviceAccountId, payload, { reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admin.serviceAccountTokens(variables.serviceAccountId),
      });
    },
  });
}

export function useIssueServiceApiToken() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, reason }: { payload: IssueServiceApiTokenPayload; reason?: string }) =>
      issueServiceApiToken(password, payload, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}

export function useUpdateServiceApiToken() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      apiTokenId,
      payload,
      reason,
    }: {
      apiTokenId: string;
      payload: UpdateServiceApiTokenPayload;
    } & AdminMutationOptions) => updateServiceApiToken(password, apiTokenId, payload, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}

export function useRevokeServiceApiToken() {
  const password = usePassword();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ apiTokenId, reason }: { apiTokenId: string; reason?: string }) =>
      revokeServiceApiToken(password, apiTokenId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.all });
    },
  });
}
