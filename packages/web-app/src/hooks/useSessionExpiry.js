import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePermissions } from './usePermissions';

const SECONDS_IN_DAY = 86400;

/**
 * Tells whether the current admin session is about to expire.
 *
 * Admin-only: this is the MFA-elevated session that cannot be renewed silently,
 * hence the "log out and back in" wording of the warning it drives.
 *
 * The threshold is crossed while the app is open, not at login, so the hook
 * schedules a re-render for the exact moment it flips rather than waiting for
 * an unrelated render to notice.
 */
export function useSessionExpiry() {
  const { isAdmin } = usePermissions();
  const authTokenDecoded = useSelector(state => state.login.authTokenDecoded);
  const expiresAt = authTokenDecoded?.exp ?? null;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isAdmin || !expiresAt) return undefined;
    const msUntilThreshold = (expiresAt - SECONDS_IN_DAY) * 1000 - Date.now();
    if (msUntilThreshold <= 0) return undefined;
    const timer = setTimeout(() => setTick(t => t + 1), msUntilThreshold);
    return () => clearTimeout(timer);
  }, [expiresAt, isAdmin]);

  const isExpiringSoon =
    isAdmin && !!expiresAt && expiresAt - Date.now() / 1000 < SECONDS_IN_DAY;

  return {
    isExpiringSoon,
    // Milliseconds, so callers can hand it straight to Intl — the token carries
    // seconds. Null when there is no session at all.
    expiresAt: expiresAt ? expiresAt * 1000 : null,
    userId: authTokenDecoded?.id ?? null
  };
}
