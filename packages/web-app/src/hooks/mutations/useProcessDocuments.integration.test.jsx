import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useProcessDocuments } from './useProcessDocuments';

vi.mock('@/store', () => ({
  default: { getState: () => ({ login: { authorizationHeader: {} } }) }
}));

afterEach(() => vi.unstubAllGlobals());

describe('moderation HTTP responses', () => {
  it.each([200, 207])(
    'forwards the actual result array for HTTP %i',
    async status => {
      const results = [
        { id: 12, status: 'auto_rejected', reason: 'Invalid file' },
        { id: 13, status: 'not_found', reason: null }
      ];
      const fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(results), { status }));
      vi.stubGlobal('fetch', fetch);
      const queryClient = createTestQueryClient();
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useProcessDocuments({ onSuccess }), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      });
      const variables = { ids: [12, 13], isValidated: true, comment: '' };
      await act(async () => {
        expect(await result.current.mutateAsync(variables)).toEqual(results);
      });
      expect(onSuccess).toHaveBeenCalledWith(results, variables);
      expect(fetch).toHaveBeenCalledTimes(1);
      queryClient.clear();
    }
  );

  it('surfaces invalid JSON as an uncertain failure without retrying', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('invalid JSON', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const queryClient = createTestQueryClient();
    const onError = vi.fn();
    const { result } = renderHook(() => useProcessDocuments({ onError }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          ids: [12],
          isValidated: true,
          comment: ''
        })
      ).rejects.toThrow();
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
