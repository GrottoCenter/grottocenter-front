import { apiPost } from './client';

it('passes an AbortSignal through to a POST request', async () => {
  const controller = new AbortController();
  const fetchMock = vi.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        );
      })
  );
  vi.stubGlobal('fetch', fetchMock);

  try {
    const request = apiPost(
      '/api/v1/advanced-search',
      { entity: 'organizations' },
      { signal: controller.signal }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/advanced-search',
      expect.objectContaining({
        method: 'POST',
        signal: controller.signal
      })
    );
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  } finally {
    vi.unstubAllGlobals();
  }
});
