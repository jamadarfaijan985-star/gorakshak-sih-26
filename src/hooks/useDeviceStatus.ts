import { useCallback, useEffect, useState } from 'react';
import { deviceApiService, DeviceStatusResponse } from '../services/deviceApiService';

export function useDeviceStatus(deviceId: string | undefined, intervalMs = 5000) {
  const [data, setData] = useState<DeviceStatusResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    try {
      setData(await deviceApiService.getStatus(deviceId));
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    refetch();
    if (!deviceId) return;
    const timer = window.setInterval(refetch, intervalMs);
    return () => window.clearInterval(timer);
  }, [deviceId, intervalMs, refetch]);

  return { data, error, isLoading, refetch };
}