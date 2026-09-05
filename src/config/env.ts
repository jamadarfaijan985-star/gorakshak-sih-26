/**
 * Central environment configuration.
 * All env variables are read here — never scatter import.meta.env across the codebase.
 */

export const env = {
  /**
   * Base URL of the FastAPI backend, e.g. "http://localhost:8000"
   * Set via VITE_API_BASE_URL in .env
   */
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000',

  /**
   * When true the app shows mock/demo data instead of calling the backend.
   * Set VITE_DEMO_MODE=true in .env to enable.
   */
  DEMO_MODE: (import.meta.env.VITE_DEMO_MODE as string | undefined) === 'true',
} as const;
