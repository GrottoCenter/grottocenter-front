import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { apiPost, apiPut } from '@/api/client';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  countryKeys,
  regionKeys,
  massifKeys,
  organizationKeys
} from '@/api/queryKeys';
import { invalidateAll } from '@/utils/mapTileCache';
import {
  useSetCountryOrganization,
  useSetRegionOrganization,
  useSetMassifOrganization
} from './useOrganizationAssociation';

vi.mock('@/api/client', () => ({
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn()
}));

vi.mock('@/utils/mapTileCache', () => ({ invalidateAll: vi.fn() }));

const renderMutation = hook => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...renderHook(hook, { wrapper: Wrapper }), queryClient };
};

const cases = [
  [
    'country',
    useSetCountryOrganization,
    { countryId: 'FR' },
    '/countries/FR/organizations/42',
    countryKeys.detail('FR')
  ],
  [
    'region',
    useSetRegionOrganization,
    { countryId: 'FR', regionId: 'ARA' },
    '/countries/FR/regions/ARA/organizations/42',
    regionKeys.detail('FR', 'ARA')
  ],
  [
    'massif',
    useSetMassifOrganization,
    { massifId: 7 },
    '/massifs/7/organizations/42',
    massifKeys.detail(7)
  ]
];

beforeEach(() => {
  vi.clearAllMocks();
  apiPost.mockResolvedValue({ id: 42 });
  apiPut.mockResolvedValue({});
});

describe.each(cases)(
  '%s organization association',
  (_name, hook, scope, path, detailKey) => {
    it('links the selected ID and refreshes geographic and organization caches', async () => {
      const { result, queryClient } = renderMutation(hook);
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
      await act(async () =>
        result.current.mutateAsync({ ...scope, organizationId: 42 })
      );
      expect(apiPost).not.toHaveBeenCalled();
      expect(apiPut).toHaveBeenCalledWith(expect.stringContaining(path));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: detailKey });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: organizationKeys.all
      });
      expect(invalidateAll).toHaveBeenCalledWith('organizations');
    });

    it('rejects free text without silently creating an organization', async () => {
      const { result } = renderMutation(hook);
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            ...scope,
            organizationName: 'Unselected organization',
            organizationType: 'RESEARCH'
          })
        ).rejects.toThrow('Organization ID is missing');
      });
      expect(apiPost).not.toHaveBeenCalled();
      expect(apiPut).not.toHaveBeenCalled();
    });

    it('retries a failed association with the same ID and never creates again', async () => {
      const error = new Error('Association rejected');
      apiPut.mockRejectedValueOnce(error);
      const { result } = renderMutation(hook);
      await act(async () => {
        await expect(
          result.current.mutateAsync({ ...scope, organizationId: 42 })
        ).rejects.toBe(error);
      });
      expect(invalidateAll).not.toHaveBeenCalled();
      await act(async () =>
        result.current.mutateAsync({ ...scope, organizationId: 42 })
      );
      expect(apiPut).toHaveBeenCalledTimes(2);
      expect(apiPut.mock.calls[0]).toEqual(apiPut.mock.calls[1]);
      expect(apiPost).not.toHaveBeenCalled();
    });
  }
);
