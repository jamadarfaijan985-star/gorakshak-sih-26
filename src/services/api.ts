/**
 * INNOVX Central API Client
 * All backend communication goes through this file.
 * Never scatter fetch() calls in UI components.
 */

import { env } from '../config/env';

// ─── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'innovx_access_token';

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// ─── API Error ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly body?: unknown,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

// ─── Request helpers ─────────────────────────────────────────────────────────

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  /** Override timeout in ms (default 30 000) */
  timeout?: number;
  /** Send as multipart/form-data instead of JSON */
  formData?: FormData;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Query-string params appended to the URL */
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = env.API_BASE_URL.replace(/\/$/, '');
  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  method: RequestMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = 30_000, formData, headers: extraHeaders = {}, params } = options;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  const token = tokenStore.get();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const isForm = formData instanceof FormData;

  const fetchHeaders: Record<string, string> = {
    ...authHeader,
    ...extraHeaders,
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
  };

  try {
    const response = await fetch(buildUrl(path, params), {
      method,
      headers: fetchHeaders,
      body: isForm ? formData : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timerId);

    if (response.status === 401) {
      // Token expired / invalid — clear and let callers handle redirect
      tokenStore.clear();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        detail = err?.detail || err?.message || detail;
      } catch {
        // body not json
      }
      throw new ApiError(response.status, detail);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  } catch (err) {
    clearTimeout(timerId);
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please check your connection.');
    }
    throw new ApiError(0, 'Network error. Could not reach the server.');
  }
}

// ─── Public API surface ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
  /** multipart/form-data upload */
  upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, undefined, { ...options, formData });
  },
};
