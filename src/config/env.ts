/**
 * Central environment configuration.
 * All env variables are read here — never scatter import.meta.env across the codebase.
 */

function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (envUrl && envUrl !== '') {
    return envUrl.replace(/\/$/, '');
  }

  // Fallback: Dynamically align API base URL with the active browser hostname (e.g. 10.250.43.53:3000 -> 10.250.43.53:8000)
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }

  return 'http://localhost:8000';
}

export const env = {
  /**
   * Base URL of the FastAPI backend.
   * Dynamically aligns with the active host (localhost or LAN IP) for desktop and mobile devices.
   */
  API_BASE_URL: getApiBaseUrl(),

  /**
   * When true the app shows mock/demo data instead of calling the backend.
   * Set VITE_DEMO_MODE=true in .env to enable.
   */
  DEMO_MODE: (import.meta.env.VITE_DEMO_MODE as string | undefined) === 'true',
} as const;
