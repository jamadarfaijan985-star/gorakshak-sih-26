/**
 * Generic async data-fetching hook used by all domain hooks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../services/api';

export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code: number };

/**
 * useApi — wraps an async fetcher function with loading / error / success state.
 *
 * @param fetcher   Async function that returns data. Recreate with useCallback to control re-runs.
 * @param immediate Whether to fire immediately on mount (default: true).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  immediate = true,
): {
  state: FetchState<T>;
  data: T | undefined;
  isLoading: boolean;
  error: string | undefined;
  refetch: () => void;
} {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetcher();
      if (mountedRef.current) setState({ status: 'success', data });
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof ApiError) {
        setState({ status: 'error', error: err.detail, code: err.status });
      } else {
        setState({ status: 'error', error: String(err), code: 0 });
      }
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute, immediate]);

  return {
    state,
    data: state.status === 'success' ? state.data : undefined,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.error : undefined,
    refetch: execute,
  };
}
