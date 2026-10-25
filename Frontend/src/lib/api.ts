import axios from 'axios';
import { getAccessToken } from './supabase';

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    if (url.includes('://localhost')) {
      url = url.replace('://localhost', '://127.0.0.1');
    }
    return url;
  }
  return 'http://127.0.0.1:8000';
}

export const api = axios.create({
  timeout: 120_000,
});

api.interceptors.request.use(async (config) => {
  config.baseURL = `${getBaseUrl()}/api/v1`;
  try {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Graceful fallback for non-browser contexts or uninitialized auth
  }
  return config;
});

export function resolveImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const base = getBaseUrl() || (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000');
  return `${base}${path}`;
}

/** Human-readable message from an API error (FastAPI `detail`), never a stack trace. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the WasteSense API. Is the backend running on port 8000?';
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length && typeof detail[0]?.msg === 'string') {
      const loc = Array.isArray(detail[0].loc) ? detail[0].loc[detail[0].loc.length - 1] : '';
      return loc ? `${loc}: ${detail[0].msg}` : detail[0].msg;
    }
    if (error.response.status === 429) return 'Too many requests. Please wait a moment and try again.';
  }
  return fallback;
}
