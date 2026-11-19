import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ReadableStream, WritableStream } from 'node:stream/web';

import { apiPostWithHeaders } from '@/api/client';
import { analyzeDocumentUrl, ssoAuthTokenUrl } from '@/conf/apiRoutes';
import queryClient from '@/conf/queryClient';
import store from '@/store';
import { DOCUMENT_AI_MAX_FILE_SIZE } from '@/utils/documentAnalysis';
import { useAnalyzeDocument } from './useAnalyzeDocument';

vi.mock('@/api/client', () => ({ apiPostWithHeaders: vi.fn() }));
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
const tokenResponse = (token = 'documents-token', traceId = undefined) => ({
  data: { token },
  headers: new Headers(traceId == null ? {} : { 'X-Trace-Id': traceId })
});

beforeEach(() => {
  vi.clearAllMocks();
  // JSDOM lacks Web Streams; Response bodies use Node's native implementation.
  vi.stubGlobal('WritableStream', WritableStream);
  queryClient.clear();
  store.getState.mockReturnValue({ login: { authorizationHeader: session } });
  apiPostWithHeaders.mockResolvedValue(tokenResponse());
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
  expect(apiPostWithHeaders).toHaveBeenCalledWith(
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
  expect(apiPostWithHeaders).toHaveBeenCalledTimes(2);
});

it('forwards a fresh API trace id for each attempt after an analysis failure', async () => {
  const firstId = '2f85616b-51be-4003-bc07-7d35ed5b72fa';
  const secondId = '4b3512e9-3215-4e3f-b8f6-75083e92ab32';
  apiPostWithHeaders
    .mockResolvedValueOnce(tokenResponse('first-token', firstId))
    .mockResolvedValueOnce(tokenResponse('second-token', secondId));
  fetch.mockResolvedValueOnce(
    new Response('{}', { status: 503, headers: { 'X-Trace-Id': firstId } })
  );
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toMatchObject(
      {
        status: 503,
        traceId: firstId
      }
    );
  });
  await act(async () => result.current.mutateAsync(variables()));
  expect(apiPostWithHeaders).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls.map(([, options]) => options.headers)).toEqual([
    { Authorization: 'Bearer first-token', 'X-Trace-Id': firstId },
    { Authorization: 'Bearer second-token', 'X-Trace-Id': secondId }
  ]);
});

it('keeps trace ids attached to their attempts when concurrent token responses finish out of order', async () => {
  const firstId = '2f85616b-51be-4003-bc07-7d35ed5b72fa';
  const secondId = '4b3512e9-3215-4e3f-b8f6-75083e92ab32';
  let resolveToken;
  apiPostWithHeaders
    .mockReturnValueOnce(
      new Promise(resolve => {
        resolveToken = resolve;
      })
    )
    .mockResolvedValueOnce(tokenResponse('second-token', secondId));
  const first = renderAnalysis();
  const second = renderAnalysis();
  let firstAttempt;
  await act(async () => {
    firstAttempt = first.result.current.mutateAsync(variables());
  });
  expect(apiPostWithHeaders).toHaveBeenCalledOnce();
  await act(async () => second.result.current.mutateAsync(variables()));
  await act(async () => {
    resolveToken(tokenResponse('first-token', firstId));
    await firstAttempt;
  });
  expect(fetch.mock.calls.map(([, options]) => options.headers)).toEqual([
    { Authorization: 'Bearer second-token', 'X-Trace-Id': secondId },
    { Authorization: 'Bearer first-token', 'X-Trace-Id': firstId }
  ]);
});

it.each([undefined, '', '   ', 'not an id', '<invalid>', 'a'.repeat(129)])(
  'omits an unreadable, empty or invalid token trace header (%j)',
  async traceId => {
    apiPostWithHeaders.mockResolvedValue(
      tokenResponse('documents-token', traceId)
    );
    const { result } = renderAnalysis();
    await act(async () => result.current.mutateAsync(variables()));
    expect(fetch.mock.calls[0][1].headers).toEqual({
      Authorization: 'Bearer documents-token'
    });
  }
);

it.each(['a', 'A_0-valid-id', 'a'.repeat(128)])(
  'trims and forwards a valid token trace header (%j)',
  async traceId => {
    apiPostWithHeaders.mockResolvedValue(
      tokenResponse('documents-token', `  ${traceId}  `)
    );
    const { result } = renderAnalysis();
    await act(async () => result.current.mutateAsync(variables()));
    expect(fetch.mock.calls[0][1].headers['X-Trace-Id']).toBe(traceId);
  }
);

it.each(['not an id', '<invalid>', 'a'.repeat(129)])(
  'discards an invalid trace header on either failed service (%j)',
  async traceId => {
    const { result } = renderAnalysis();
    const ssoFailure = Object.assign(new Error('Unavailable'), {
      status: 503,
      headers: new Headers({ 'X-Trace-Id': traceId })
    });
    apiPostWithHeaders.mockRejectedValueOnce(ssoFailure);
    await act(async () => {
      await expect(result.current.mutateAsync(variables())).rejects.toBe(
        ssoFailure
      );
    });
    expect(ssoFailure).not.toHaveProperty('traceId');
    expect(fetch).not.toHaveBeenCalled();

    fetch.mockResolvedValueOnce(
      new Response('{}', { status: 503, headers: { 'X-Trace-Id': traceId } })
    );
    let analysisFailure;
    await act(async () => {
      analysisFailure = await result.current
        .mutateAsync(variables())
        .catch(error => error);
    });
    expect(analysisFailure.status).toBe(503);
    expect(analysisFailure).not.toHaveProperty('traceId');
  }
);

it.each([401, 403, 429, 503])(
  'preserves the failed SSO request reference on HTTP %i before uploading',
  async status => {
    const failure = Object.assign(new Error('SSO failed'), {
      status,
      headers: new Headers({ 'X-Trace-Id': '  sso-failure-id  ' })
    });
    apiPostWithHeaders.mockRejectedValueOnce(failure);
    const { result } = renderAnalysis();
    await act(async () => {
      await expect(
        result.current.mutateAsync(variables())
      ).rejects.toMatchObject({
        status,
        traceId: 'sso-failure-id'
      });
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  }
);

it.each([undefined, '2f85616b-51be-4003-bc07-7d35ed5b72fa'])(
  'uses the failed analysis response trace id independently of the token trace (%j)',
  async traceId => {
    const responseId = '4b3512e9-3215-4e3f-b8f6-75083e92ab32';
    apiPostWithHeaders.mockResolvedValue(
      tokenResponse('documents-token', traceId)
    );
    fetch.mockResolvedValue(
      new Response('{"message":"Service unavailable","code":"UNAVAILABLE"}', {
        status: 503,
        headers: { 'X-Trace-Id': responseId }
      })
    );
    const { result } = renderAnalysis();
    await act(async () => {
      await expect(
        result.current.mutateAsync(variables())
      ).rejects.toMatchObject({
        status: 503,
        traceId: responseId,
        body: { message: 'Service unavailable', code: 'UNAVAILABLE' }
      });
    });
  }
);

it.each(['<html>Bad gateway</html>', ''])(
  'preserves the failed analysis trace id with a non-JSON error body (%j)',
  async body => {
    const traceId = '2f85616b-51be-4003-bc07-7d35ed5b72fa';
    fetch.mockResolvedValue(
      new Response(body, { status: 502, headers: { 'X-Trace-Id': traceId } })
    );
    const { result } = renderAnalysis();
    await act(async () => {
      await expect(
        result.current.mutateAsync(variables())
      ).rejects.toMatchObject({
        status: 502,
        traceId
      });
    });
  }
);

it('does not use the token trace id when the failed analysis exposes none', async () => {
  apiPostWithHeaders.mockResolvedValue(
    tokenResponse('documents-token', '2f85616b-51be-4003-bc07-7d35ed5b72fa')
  );
  fetch.mockResolvedValue(new Response('{}', { status: 503 }));
  const { result } = renderAnalysis();
  let failure;
  await act(async () => {
    failure = await result.current
      .mutateAsync(variables())
      .catch(error => error);
  });
  expect(failure.status).toBe(503);
  expect(failure).not.toHaveProperty('traceId');
});

it('does not invent a reference when the analysis fails before receiving a response', async () => {
  apiPostWithHeaders.mockResolvedValue(
    tokenResponse('documents-token', '2f85616b-51be-4003-bc07-7d35ed5b72fa')
  );
  const failure = new TypeError('Failed to fetch');
  fetch.mockRejectedValue(failure);
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(result.current.mutateAsync(variables())).rejects.toBe(failure);
  });
  expect(failure).not.toHaveProperty('traceId');
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
  apiPostWithHeaders.mockImplementation(async () => {
    events.push('sso');
    return tokenResponse('fresh-token');
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
  expect(apiPostWithHeaders).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it.each([50000001, 60 * 1024 * 1024])(
  'accepts a local PDF of %s bytes within the service limit',
  async size => {
    const upload = new File(['%PDF test'], 'large.pdf', {
      type: 'application/pdf'
    });
    Object.defineProperty(upload, 'size', { value: size });
    const { result } = renderAnalysis();
    await act(async () =>
      result.current.mutateAsync({
        file: upload,
        signal: new AbortController().signal
      })
    );
    expect(apiPostWithHeaders).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
  }
);

it('rejects a local PDF one byte above the service 60 MB limit before requesting SSO', async () => {
  const upload = new File(['%PDF test'], 'oversized.pdf', {
    type: 'application/pdf'
  });
  Object.defineProperty(upload, 'size', { value: 60 * 1024 * 1024 + 1 });
  const { result } = renderAnalysis();
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        file: upload,
        signal: new AbortController().signal
      })
    ).rejects.toMatchObject({ status: 413 });
  });
  expect(apiPostWithHeaders).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
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
  expect(apiPostWithHeaders).not.toHaveBeenCalled();
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
  expect(apiPostWithHeaders).not.toHaveBeenCalled();
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
  expect(apiPostWithHeaders).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledOnce();
});

it('logs out on an SSO session rejection before sending the PDF', async () => {
  apiPostWithHeaders.mockRejectedValue(
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
  apiPostWithHeaders.mockImplementation(async () => {
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
  apiPostWithHeaders.mockReturnValue(
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
    resolveToken(tokenResponse('too-late'));
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
