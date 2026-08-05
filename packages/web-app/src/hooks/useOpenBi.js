import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { usePermissions } from './usePermissions';
import { useNotification } from './useNotification';
import { displayLoginDialog } from '../actions/Login';
import { checkAuthStatus } from '../actions/utils';
import { ssoAuthTokenUrl } from '../conf/apiRoutes';
import { biLinks } from '../conf/externalLinks';

const SSO_PRODUCT = 'superset';
const BI_TAB_NAME = 'gcBiTab';

/**
 * Opens the Superset BI site in a new tab with seamless SSO authentication.
 *
 * Flow: fetch a short-lived SSO token from the GC API, then auto-submit a hidden
 * POST form to Superset's /login/sso endpoint. The token travels in the POST body
 * only (never the URL, history or Referer).
 *
 * Anonymous users are prompted to log in first; the action then resumes
 * automatically once authentication succeeds (same mechanism as useAuthNavigate).
 *
 * @returns {{ openBi: () => void, isOpening: boolean }}
 */
export const useOpenBi = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { onError } = useNotification();
  const { isAuth } = usePermissions();
  const authorizationHeader = useSelector(
    state => state.login.authorizationHeader
  );
  const [isOpening, setIsOpening] = useState(false);
  const waitingForAuth = useRef(false);

  const submitSsoForm = useCallback((token, targetWindow) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${biLinks['*']}/login/sso`;
    form.target = targetWindow?.name || '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token';
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }, []);

  const openBi = useCallback(async () => {
    // Not logged in: prompt login first, then auto-resume (see effect below).
    // No tab is opened here, to avoid flashing a blank window for anonymous users.
    if (!isAuth) {
      waitingForAuth.current = true;
      dispatch(displayLoginDialog());
      return;
    }

    // Open the tab synchronously, inside the user gesture, so the browser does
    // not block it once we resume after the async token fetch.
    const biTab = window.open('', BI_TAB_NAME);

    setIsOpening(true);
    try {
      const response = await fetch(ssoAuthTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeader
        },
        body: JSON.stringify({ product: SSO_PRODUCT })
      });

      // checkAuthStatus triggers the global logout/redirect flow on a 401
      // (expired token) and throws for any other non-2xx response.
      await checkAuthStatus(dispatch)(response);

      const { token } = await response.json();
      submitSsoForm(token, biTab);
    } catch (error) {
      biTab?.close();
      // On a 401 the user is being logged out and redirected; no toast needed.
      if (error.isAuthError) return;
      console.error('BI SSO failed:', error);
      onError(
        formatMessage({
          id: 'Unable to open the statistics dashboard. Please try again.'
        })
      );
    } finally {
      setIsOpening(false);
    }
  }, [
    isAuth,
    authorizationHeader,
    dispatch,
    onError,
    formatMessage,
    submitSsoForm
  ]);

  // Resume the action once the user has logged in.
  useEffect(() => {
    if (isAuth && waitingForAuth.current) {
      waitingForAuth.current = false;
      openBi();
    }
  }, [isAuth, openBi]);

  return { openBi, isOpening };
};
