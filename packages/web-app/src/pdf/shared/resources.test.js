import { ReadableStream } from 'node:stream/web';
import { fetchPdfResource } from './resources';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('keeps a slow response alive while chunks arrive and clears its timer on completion', async () => {
  vi.useFakeTimers();
  let body;
  let requestSignal;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url, { signal }) => {
      requestSignal = signal;
      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(controller) {
              body = controller;
            }
          })
        )
      );
    })
  );
  const pending = fetchPdfResource('https://example.org/file.pdf');
  for (const value of [1, 2, 3]) {
    // Each chunk arrives before the inactivity deadline, but total time exceeds it.
    // eslint-disable-next-line no-await-in-loop
    await vi.advanceTimersByTimeAsync(20000);
    body.enqueue(new Uint8Array([value]));
  }
  body.close();
  expect(new Uint8Array(await pending)).toEqual(new Uint8Array([1, 2, 3]));
  await vi.advanceTimersByTimeAsync(30000);
  expect(requestSignal.aborted).toBe(false);
});

it.each(['stalled headers', 'stalled body', 'caller cancellation'])(
  'aborts a request on %s and clears the timer',
  async mode => {
    vi.useFakeTimers();
    const caller = new AbortController();
    let requestSignal;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, { signal }) => {
        requestSignal = signal;
        if (mode === 'stalled headers') {
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason));
          });
        }
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                signal.addEventListener('abort', () =>
                  controller.error(signal.reason)
                );
              }
            })
          )
        );
      })
    );
    const pending = fetchPdfResource(
      'https://example.org/file.pdf',
      caller.signal
    );
    const rejected = expect(pending).rejects.toMatchObject({
      name: mode === 'caller cancellation' ? 'AbortError' : 'TimeoutError'
    });
    if (mode === 'caller cancellation') {
      await vi.advanceTimersByTimeAsync(10000);
      caller.abort();
    } else await vi.advanceTimersByTimeAsync(30000);
    await rejected;
    expect(requestSignal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  }
);

it('stops a response exceeding the remaining budget without Content-Length', async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(4));
    },
    cancel
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)));
  await expect(
    fetchPdfResource(
      'https://example.org/file.pdf',
      new AbortController().signal,
      3
    )
  ).rejects.toThrow('pdf.resourceLimit');
  expect(cancel).toHaveBeenCalledOnce();
});

it('rejects an oversized advertised body before reading it', async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream({ cancel });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(stream, { headers: { 'content-length': '4' } })
      )
  );
  await expect(
    fetchPdfResource(
      'https://example.org/file.pdf',
      new AbortController().signal,
      3
    )
  ).rejects.toThrow('pdf.resourceLimit');
  expect(cancel).toHaveBeenCalledOnce();
});

it('returns complete bytes at the exact resource limit', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3])))
  );
  const result = await fetchPdfResource(
    'https://example.org/file.pdf',
    new AbortController().signal,
    3
  );
  expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3]));
});
