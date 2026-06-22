import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { usePermissions } from './usePermissions';
import { useNotification } from './useNotification';
import { displayLoginDialog } from '../actions/Login';
import { ssoAuthTokenUrl } from '../conf/apiRoutes';

const SSO_PRODUCT = 'superset';
const BI_TAB_NAME = 'gcBiTab';
const BI_BASE_URL =
  process.env.REACT_APP_BI_URL || 'https://bi.grottocenter.org';

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
    form.action = `${BI_BASE_URL}/login/sso`;
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
    // Open the tab synchronously, inside the user gesture, so the browser does
    // not block it once we resume after the async token fetch.
    const biTab = window.open('', BI_TAB_NAME);

    if (!isAuth) {
      biTab?.close();
      waitingForAuth.current = true;
      dispatch(displayLoginDialog());
      return;
    }

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

      if (!response.ok) {
        throw new Error(`SSO token request failed (${response.status})`);
      }

      const { token } = await response.json();
      submitSsoForm(token, biTab);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('BI SSO failed:', error);
      biTab?.close();
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
