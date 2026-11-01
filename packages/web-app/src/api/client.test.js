import { apiGetWithRange, apiPost } from './client';

it.each(['GET', 'POST'])(
  'passes an AbortSignal through to a %s request',
  async method => {
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
      const request =
        method === 'GET'
          ? apiGetWithRange('/api/v1/documents', { signal: controller.signal })
          : apiPost(
              '/api/v1/advanced-search',
              { entity: 'organizations' },
              { signal: controller.signal }
            );
      expect(fetchMock).toHaveBeenCalledWith(
        method === 'GET' ? '/api/v1/documents' : '/api/v1/advanced-search',
        expect.objectContaining({
          signal: controller.signal
        })
      );
      controller.abort();
      await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      vi.unstubAllGlobals();
    }
  }
);
