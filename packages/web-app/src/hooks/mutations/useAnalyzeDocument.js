import { useMutation } from '@tanstack/react-query';

import { apiPost } from '@/api/client';
import { checkAndGetStatus } from '@/actions/utils';
import { postLogout } from '@/actions/Login';
import { analyzeDocumentUrl, ssoAuthTokenUrl } from '@/conf/apiRoutes';
import store from '@/store';
import {
  DOCUMENT_AI_MAX_FILE_SIZE,
  normalizeDocumentAnalysis
} from '@/utils/documentAnalysis';

const ANALYSIS_TIMEOUT = 5 * 60 * 1000;

const fileSizeError = () =>
  Object.assign(new Error('PDF exceeds the analysis size limit'), {
    status: 413
  });

const loadAnalysisFile = async (file, signal) => {
  if (file instanceof File) {
    if (file.size > DOCUMENT_AI_MAX_FILE_SIZE) throw fileSizeError();
    return file;
  }
  // Hosted attachments are downloaded only after confirmation. Never forward
  // the Grottocenter session or SSO token to a file host.
  const response = await fetch(file.completePath, {
    signal,
    credentials: 'omit'
  });
  await checkAndGetStatus(response);
  if (
    Number(response.headers.get('Content-Length')) > DOCUMENT_AI_MAX_FILE_SIZE
  ) {
    await response.body?.cancel();
    throw fileSizeError();
  }
  const chunks = [];
  let size = 0;
  if (response.body) {
    // pipeTo cancels the download on overflow or cancellation, including when
    // the file host does not expose Content-Length. Never buffer an unbounded PDF.
    await response.body.pipeTo(
      new WritableStream({
        write: chunk => {
          size += chunk.byteLength;
          if (size > DOCUMENT_AI_MAX_FILE_SIZE) throw fileSizeError();
          chunks.push(chunk);
        }
      }),
      { signal }
    );
  }
  signal.throwIfAborted();
  return new File(chunks, file.fileName, { type: 'application/pdf' });
};

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
        const upload = await loadAnalysisFile(file, controller.signal);
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
        body.append('file', upload, upload.name);
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
