import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { apiPatch } from '@/api/client';
import { accountKeys, personKeys } from '@/api/queryKeys';
import { accountUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useUpdateAccount } from './useAdminActions';

vi.mock('@/api/client', () => ({ apiPatch: vi.fn() }));

const setup = () => {
  const client = createTestQueryClient();
  client.setQueryData(accountKeys.current(), { id: 1, nickname: 'Before' });
  client.setQueryData(personKeys.detail(1), { id: 1, nickname: 'Before' });
  client.setQueryData(personKeys.detail(2), { id: 2, nickname: 'Other' });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useUpdateAccount(), { wrapper }),
    client
  };
};

beforeEach(() => vi.clearAllMocks());

it.each([
  { nickname: 'After' },
  { name: 'Alex' },
  { surname: 'Martin' },
  { customMessage: 'Hello' }
])(
  'invalidates the account and its public profile after patching %o',
  async fields => {
    const { result, client } = setup();
    apiPatch.mockResolvedValue({ id: 1, ...fields });

    await act(() => result.current.mutateAsync(fields));

    expect(apiPatch).toHaveBeenCalledExactlyOnceWith(accountUrl, fields);
    expect(client.getQueryState(accountKeys.current()).isInvalidated).toBe(
      true
    );
    expect(client.getQueryState(personKeys.detail(1)).isInvalidated).toBe(true);
    expect(client.getQueryState(personKeys.detail(2)).isInvalidated).toBe(
      false
    );
  }
);

it('keeps cached data fresh when an account update fails', async () => {
  const { result, client } = setup();
  const error = new Error('Update failed');
  apiPatch.mockRejectedValue(error);

  await act(async () => {
    await expect(
      result.current.mutateAsync({ nickname: 'After' })
    ).rejects.toBe(error);
  });

  expect(client.getQueryState(accountKeys.current()).isInvalidated).toBe(false);
  expect(client.getQueryState(personKeys.detail(1)).isInvalidated).toBe(false);
  expect(client.getQueryData(personKeys.detail(1)).nickname).toBe('Before');
});
