import { useEffect, useState, useSyncExternalStore } from 'react';
import { getMapRateLimit, subscribeMapRateLimit } from '@/api/mapClient';

export const useMapRateLimit = () => {
  const limit = useSyncExternalStore(subscribeMapRateLimit, getMapRateLimit);
  const [, setTick] = useState(0);
  const remaining = Math.max(0, (limit?.retryAt ?? 0) - Date.now());

  useEffect(() => {
    if (!remaining) return undefined;
    // Render only when the remaining minute changes, then stop at expiry.
    const delay = remaining % 60000 || 60000;
    const timer = setTimeout(() => setTick(tick => tick + 1), delay);
    return () => clearTimeout(timer);
  }, [limit, remaining]);

  return {
    limit,
    isActive: remaining > 0,
    minutes: Math.max(1, Math.ceil(remaining / 60000))
  };
};
