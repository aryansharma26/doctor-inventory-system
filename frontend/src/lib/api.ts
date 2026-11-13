import { supabase } from "./supabase";

const baseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export type ApiEnvelope<T> = { data: T; meta?: PaginationMeta };

export async function apiEnvelope<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const { data } = await supabase.auth.getSession();
  const clinicId = localStorage.getItem("clinora.clinicId");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(data.session?.access_token
        ? { Authorization: `Bearer ${data.session.access_token}` }
        : {}),
      ...(clinicId ? { "x-clinic-id": clinicId } : {}),
      ...init.headers,
    },
  });
  if (response.status === 204) return { data: undefined as T };
  const payload = (await response.json()) as {
    success: boolean;
    data?: T;
    meta?: PaginationMeta;
    error?: { code: string; message: string; details?: unknown };
  };
  if (!response.ok || !payload.success)
    throw new ApiClientError(
      response.status,
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ?? "Request failed",
      payload.error?.details,
    );
  return {
    data: payload.data as T,
    ...(payload.meta ? { meta: payload.meta } : {}),
  };
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiEnvelope<T>(path, init)).data;
}

export async function downloadApi(path: string): Promise<Blob> {
  const { data } = await supabase.auth.getSession();
  const clinicId = localStorage.getItem("clinora.clinicId");
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...(data.session?.access_token
        ? { Authorization: `Bearer ${data.session.access_token}` }
        : {}),
      ...(clinicId ? { "x-clinic-id": clinicId } : {}),
    },
  });
  if (!response.ok)
    throw new ApiClientError(
      response.status,
      "DOWNLOAD_FAILED",
      "Download failed",
    );
  return response.blob();
}
