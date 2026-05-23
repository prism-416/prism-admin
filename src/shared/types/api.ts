export type ApiResponse<T> = {
  data?: T;
  message?: string;
  code?: string;
};

export type ApiErrorBody = {
  message?: string;
  code?: string;
  requestId?: string;
};
