import { fetchPdfResource } from './resources';

afterEach(() => vi.unstubAllGlobals());

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
