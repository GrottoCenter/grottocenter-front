import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ReadableStream, WritableStream } from 'node:stream/web';

import { apiPost } from '@/api/client';
import { analyzeDocumentUrl, ssoAuthTokenUrl } from '@/conf/apiRoutes';
import queryClient from '@/conf/queryClient';
import store from '@/store';
import { DOCUMENT_AI_MAX_FILE_SIZE } from '@/utils/documentAnalysis';
import { useAnalyzeDocument } from './useAnalyzeDocument';

vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
vi.mock('@/store', () => ({
  default: { getState: vi.fn(), dispatch: vi.fn() }
}));

const session = { Authorization: 'Bearer main-session' };
const file = new File(['%PDF test'], 'bulletin.pdf', {
  type: 'application/pdf'
});
const hostedFile = {
  fileName: 'stored.pdf',
  completePath: 'https://files.example.org/stored.pdf'
};
const response = metadata =>
  new Response(
    JSON.stringify({ message: 'success', document_metadata: metadata }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
Wrapper.propTypes = { children: PropTypes.node.isRequired };

const renderAnalysis = () =>
  renderHook(useAnalyzeDocument, { wrapper: Wrapper });
const variables = () => ({ file, signal: new AbortController().signal });

beforeEach(() => {
  vi.clearAllMocks();
  // JSDOM lacks Web Streams; Response bodies use Node's native implementation.
  vi.stubGlobal('WritableStream', WritableStream);
  queryClient.clear();
  store.getState.mockReturnValue({ login: { authorizationHeader: session } });
  apiPost.mockResolvedValue({ token: 'documents-token' });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () =>
      response([
        {
          descriptions: [
            '  Main summary  ',
            null,
            '',
            'Main summary',
            'Other summary'
          ]
        },
        { parent: 'Issue', descriptions: ['Inherited article summary'] }
      ])
    )
  );
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('obtains a fresh documents token, uploads multipart and keeps only main-document summaries', async () => {
  const { result } = renderAnalysis();
  let summaries;
  await act(async () => {
    summaries = await result.current.mutateAsync(variables());
  });
  expect(apiPost).toHaveBeenCalledWith(
    ssoAuthTokenUrl,
    {
      product: 'documents'
    },
    { signal: expect.any(AbortSignal) }
  );
  expect(fetch).toHaveBeenCalledOnce();
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(analyzeDocumentUrl);
  expect(options.headers).toEqual({ Authorization: 'Bearer documents-token' });
  expect([...options.body.keys()]).toEqual(['file']);
  expect(options.body.get('file').name).toBe('bulletin.pdf');
  expect(summaries).toEqual({
    title: null,
    languages: [],
    descriptions: ['Main summary', 'Other summary'],
    datePublication: null
  });
  await act(async () => result.current.mutateAsync(variables()));
  expect(apiPost).toHaveBeenCalledTimes(2);
});

it('does not log out or retry when the AI server rejects its temporary token', async () => {
  fetch.mockResolvedValue(
    new Response('{"detail":"Invalid token"}', { status: 401 })
  );
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toMatchObject(
      { status: 401 }
    );
  });
  expect(store.dispatch).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it('downloads an existing PDF before obtaining its short-lived token and preserves its filename and bytes', async () => {
  const events = [];
  const bytes = '%PDF-1.4 stored document';
  fetch.mockImplementation(async (url, options) => {
    if (url === hostedFile.completePath) {
      events.push('download');
      expect(options.credentials).toBe('omit');
      expect(options.headers).toBeUndefined();
      return new Response(bytes);
    }
    events.push('analysis');
    return response([{ descriptions: ['Stored summary'] }]);
  });
  apiPost.mockImplementation(async () => {
    events.push('sso');
    return { token: 'fresh-token' };
  });
  const { result } = renderAnalysis();
  await act(async () =>
    result.current.mutateAsync({
      file: hostedFile,
      signal: new AbortController().signal
    })
  );
  expect(events).toEqual(['download', 'sso', 'analysis']);
  const uploaded = fetch.mock.calls[1][1].body.get('file');
  expect(uploaded.name).toBe(hostedFile.fileName);
  expect(uploaded.size).toBe(bytes.length);
  expect(uploaded.type).toBe('application/pdf');
  expect(fetch.mock.calls[1][1].headers).toEqual({
    Authorization: 'Bearer fresh-token'
  });
});

it('rejects oversized hosted files from Content-Length before downloading the body or requesting SSO', async () => {
  fetch.mockResolvedValue(
    new Response('%PDF', {
      headers: { 'Content-Length': String(DOCUMENT_AI_MAX_FILE_SIZE + 1) }
    })
  );
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        file: hostedFile,
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ status: 413 });
  });
  expect(apiPost).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it('bounds streamed downloads without Content-Length and cancels on overflow', async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream({
    start: controller =>
      controller.enqueue(new Uint8Array(DOCUMENT_AI_MAX_FILE_SIZE + 1)),
    cancel
  });
  fetch.mockResolvedValue(new Response(stream));
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        file: hostedFile,
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ status: 413 });
  });
  expect(cancel).toHaveBeenCalledOnce();
  expect(apiPost).not.toHaveBeenCalled();
});

it('does not request a token or start analysis when the hosted download fails', async () => {
  fetch.mockResolvedValue(new Response('{}', { status: 404 }));
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        file: hostedFile,
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ status: 404 });
  });
  expect(apiPost).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it('cancels a hosted download before SSO or analysis starts', async () => {
  fetch.mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      })
  );
  const { result } = renderAnalysis();
  const controller = new AbortController();
  let finished;
  await act(async () => {
    finished = result.current
      .mutateAsync({ file: hostedFile, signal: controller.signal })
      .catch(error => error);
  });
  await act(async () => {
    controller.abort();
    await finished;
  });
  expect(await finished).toMatchObject({ name: 'AbortError' });
  expect(apiPost).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it('logs out on an SSO session rejection before sending the PDF', async () => {
  apiPost.mockRejectedValue(
    Object.assign(new Error('Unauthorized'), { status: 401 })
  );
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toMatchObject(
      { status: 401 }
    );
  });
  expect(store.dispatch).toHaveBeenCalledOnce();
  expect(fetch).not.toHaveBeenCalled();
});

it('does not sign out a newer session after an old SSO request fails', async () => {
  apiPost.mockImplementation(async () => {
    store.getState.mockReturnValue({ login: { authorizationHeader: {} } });
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  });
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toMatchObject(
      { status: 401 }
    );
  });
  expect(store.dispatch).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('does not send the PDF after cancellation during the SSO request', async () => {
  let resolveToken;
  apiPost.mockReturnValue(
    new Promise(resolve => {
      resolveToken = resolve;
    })
  );
  const { result } = renderAnalysis();
  const controller = new AbortController();
  let finished;
  await act(async () => {
    finished = result.current
      .mutateAsync({ file, signal: controller.signal })
      .catch(error => error);
  });
  controller.abort();
  await act(async () => {
    resolveToken({ token: 'too-late' });
    await finished;
  });
  expect(await finished).toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  {},
  { message: 'success', document_metadata: [] },
  {
    message: 'success',
    document_metadata: [
      { parent: 'Wrong issue', descriptions: ['Article summary'] }
    ]
  }
])('rejects an unusable response %j', async body => {
  fetch.mockResolvedValue(new Response(JSON.stringify(body)));
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toThrow(
      'Invalid analysis response'
    );
  });
});

it('accepts a valid analysis without a summary', async () => {
  fetch.mockResolvedValue(response([{ title: 'Book', descriptions: [] }]));
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).resolves.toEqual({
      title: 'Book',
      languages: [],
      descriptions: [],
      datePublication: null
    });
  });
});

it('aborts an analysis that exceeds five minutes', async () => {
  vi.useFakeTimers();
  fetch.mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      })
  );
  const { result } = renderAnalysis();
  let finished;
  await act(async () => {
    finished = result.current.mutateAsync(variables()).catch(error => error);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
  });
  expect(await finished).toMatchObject({ name: 'TimeoutError' });
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
});
