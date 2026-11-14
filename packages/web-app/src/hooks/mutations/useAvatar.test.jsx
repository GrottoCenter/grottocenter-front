import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiDelete, apiPutForm } from '@/api/client';
import { accountKeys, organizationKeys, personKeys } from '@/api/queryKeys';
import { useAvatar } from './useAvatar';

vi.mock('@/api/client', () => ({ apiDelete: vi.fn(), apiPutForm: vi.fn() }));

const setup = options => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } }
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useAvatar(options), { wrapper });
  return { ...hook, client };
};

beforeEach(() => vi.clearAllMocks());

it('uploads the file as multipart and updates both account and public profile caches', async () => {
  const { result, client } = setup({ personId: 1 });
  client.setQueryData(accountKeys.current(), {
    id: 1,
    nickname: 'Caver',
    customMessage: 'Hello',
    avatarUrl: null
  });
  client.setQueryData(personKeys.detail(1), { id: 1, avatarUrl: null });
  apiPutForm.mockResolvedValue({ avatarUrl: '/new.webp' });
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  await act(() => result.current.mutateAsync(file));
  const [url, form] = apiPutForm.mock.calls[0];
  expect(url).toMatch(/\/account\/avatar$/);
  expect(form.get('file')).toBe(file);
  expect(client.getQueryData(accountKeys.current())).toEqual({
    id: 1,
    nickname: 'Caver',
    customMessage: 'Hello',
    avatarUrl: '/new.webp'
  });
  expect(client.getQueryData(personKeys.detail('1')).avatarUrl).toBe(
    '/new.webp'
  );
  expect(client.getQueryState(personKeys.detail(1)).isInvalidated).toBe(true);
});

it('removes an organization avatar on a 204 without overwriting its description', async () => {
  const { result, client } = setup({ organizationId: 42 });
  client.setQueryData(organizationKeys.detail('42'), {
    id: 42,
    customMessage: 'Club',
    avatarUrl: '/old.webp'
  });
  apiDelete.mockResolvedValue(null);
  await act(() => result.current.mutateAsync(null));
  expect(apiDelete).toHaveBeenCalledWith(
    expect.stringMatching(/\/organizations\/42\/avatar$/)
  );
  expect(client.getQueryData(organizationKeys.detail(42))).toEqual({
    id: 42,
    customMessage: 'Club',
    avatarUrl: null
  });
  expect(apiPutForm).not.toHaveBeenCalled();
});

it('preserves the previous avatar when a replacement fails', async () => {
  const { result, client } = setup({ personId: 1 });
  client.setQueryData(accountKeys.current(), { id: 1, avatarUrl: '/old.webp' });
  const error = Object.assign(new Error('failed'), { status: 503 });
  apiPutForm.mockRejectedValue(error);
  await act(async () => {
    await expect(
      result.current.mutateAsync(new File(['image'], 'photo.png'))
    ).rejects.toBe(error);
  });
  expect(client.getQueryData(accountKeys.current()).avatarUrl).toBe(
    '/old.webp'
  );
});
