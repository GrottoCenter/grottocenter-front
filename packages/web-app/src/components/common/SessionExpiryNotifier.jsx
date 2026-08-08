import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useNotification, useSessionExpiry } from '../../hooks';
import { createCloseAction } from './snackbarActions';

const SESSION_EXPIRY_SNACKBAR_KEY = 'session-expiry';

// Key kept from the banner this replaced, despite the now-inaccurate name:
// renaming it would make every admin who had already dismissed the warning in
// the current tab see it again after deploy, for no gain.
const dismissStorageKey = userId =>
  userId ? `mfaExpiryBannerDismissed_${userId}` : 'mfaExpiryBannerDismissed';

/**
 * Warns an admin that the current session is about to expire. Renders nothing.
 *
 * Was a full-width Alert banner between the AppBar and the page. Being in the
 * normal flow, it did not carry the `margin-left: sideMenuWidth` that only
 * MainWrapper has, so the persistent SideMenu covered its first 240px and cut
 * the sentence in half (#1489). A snackbar is position:fixed, so no layout
 * offset applies to it at all.
 *
 * `persist` on purpose: this asks for an action (log out and back in), so it
 * stays until the admin acknowledges it. That makes the close action below the
 * ONLY way it can go away — and makes the "close it when it no longer applies"
 * effect mandatory, or the message would outlive its own resolution.
 */
const SessionExpiryNotifier = () => {
  const { isExpiringSoon, userId } = useSessionExpiry();
  const { formatMessage } = useIntl();
  const { onWarning, onClose } = useNotification();

  useEffect(() => {
    if (!isExpiringSoon) {
      // Covers the case that matters most: the admin does exactly what the
      // message asks and logs out. Without this the snackbar would stay on
      // screen, still demanding an action that has already been taken.
      onClose(SESSION_EXPIRY_SNACKBAR_KEY);
      return;
    }

    const storageKey = dismissStorageKey(userId);
    if (sessionStorage.getItem(storageKey) === 'true') return;

    const dismiss = key => {
      sessionStorage.setItem(storageKey, 'true');
      onClose(key);
    };

    // Changing the language re-runs this effect (formatMessage is a new
    // identity), but preventDuplicate keys on SESSION_EXPIRY_SNACKBAR_KEY, so
    // the snackbar is not re-added — it keeps its original wording until
    // dismissed. Same accepted trade-off as NetworkStatusNotifier.
    onWarning(formatMessage({ id: 'mfaSessionExpiryWarning' }), {
      key: SESSION_EXPIRY_SNACKBAR_KEY,
      persist: true,
      preventDuplicate: true,
      action: createCloseAction(dismiss, formatMessage({ id: 'Close' }))
    });
  }, [isExpiringSoon, userId, formatMessage, onWarning, onClose]);

  return null;
};

export default SessionExpiryNotifier;
