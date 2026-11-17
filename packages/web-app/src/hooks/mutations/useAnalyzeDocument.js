import { useMutation } from '@tanstack/react-query';

import { apiPost } from '@/api/client';
import { checkAndGetStatus } from '@/actions/utils';
import { postLogout } from '@/actions/Login';
import { analyzeDocumentUrl, ssoAuthTokenUrl } from '@/conf/apiRoutes';
import store from '@/store';
import { normalizeDocumentAnalysis } from '@/utils/documentAnalysis';

const ANALYSIS_TIMEOUT = 5 * 60 * 1000;

export const useAnalyzeDocument = () =>
  useMutation({
    retry: false,
    gcTime: 0,
    networkMode: 'always',
    // An expired AI token is independent of the Grottocenter session. SSO
    // failures below handle session loss; every other error stays in the form.
    meta: { skip401Logout: true, errorPresentation: 'inline' },
    mutationFn: async ({ file, signal }) => {
      const controller = new AbortController();
      const abort = () => controller.abort(signal.reason);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
      const timeout = setTimeout(
        () => controller.abort(new DOMException('Timeout', 'TimeoutError')),
        ANALYSIS_TIMEOUT
      );
      const authorization = store.getState().login.authorizationHeader;
      try {
        controller.signal.throwIfAborted();
        let token;
        try {
          ({ token } = await apiPost(
            ssoAuthTokenUrl,
            {
              product: 'documents'
            },
            { signal: controller.signal }
          ));
        } catch (error) {
          if (
            error.status === 401 &&
            authorization === store.getState().login.authorizationHeader
          ) {
            store.dispatch(postLogout());
          }
          throw error;
        }
        controller.signal.throwIfAborted();
        if (authorization !== store.getState().login.authorizationHeader) {
          throw new DOMException('Session changed', 'AbortError');
        }
        if (typeof token !== 'string' || !token.trim()) {
          throw new Error('Invalid SSO response');
        }
        const body = new FormData();
        body.append('file', file, file.name);
        // This service has its own token. Never forward the main API's session
        // header or set Content-Type: the browser supplies the multipart boundary.
        const response = await fetch(analyzeDocumentUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
          signal: controller.signal
        });
        await checkAndGetStatus(response);
        const result = await response.json();
        controller.signal.throwIfAborted();
        return normalizeDocumentAnalysis(result);
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
      }
    }
  });
