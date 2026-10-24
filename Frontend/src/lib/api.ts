import axios from 'axios';

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    if (url.endsWith('/api/v1')) {
      url = url.substring(0, url.length - 7);
    }
    return url;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
}

export const api = axios.create({
  timeout: 120_000,
});

api.interceptors.request.use((config) => {
  config.baseURL = `${getBaseUrl()}/api/v1`;
  return config;
});

export function resolveImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${getBaseUrl()}${path}`;
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
