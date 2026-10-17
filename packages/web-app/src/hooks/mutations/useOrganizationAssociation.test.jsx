import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { apiPost, apiPut } from '@/api/client';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { invalidateOrganizationCaches } from '@/utils/organizationCache';
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

vi.mock('@/utils/organizationCache', () => ({
  invalidateOrganizationCaches: vi.fn()
}));

const renderMutation = hook => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper: Wrapper });
};

const cases = [
  [
    'country',
    useSetCountryOrganization,
    { countryId: 'FR' },
    '/countries/FR/organizations/42'
  ],
  [
    'region',
    useSetRegionOrganization,
    { countryId: 'FR', regionId: 'ARA' },
    '/countries/FR/regions/ARA/organizations/42'
  ],
  [
    'massif',
    useSetMassifOrganization,
    { massifId: 7 },
    '/massifs/7/organizations/42'
  ]
];

beforeEach(() => {
  vi.clearAllMocks();
  apiPost.mockResolvedValue({ id: 42 });
  apiPut.mockResolvedValue({});
});

describe.each(cases)(
  '%s organization association',
  (_name, hook, scope, path) => {
    it('creates the explicitly typed organization before linking its returned ID', async () => {
      const { result } = renderMutation(hook);
      await act(async () =>
        result.current.mutateAsync({
          ...scope,
          organizationName: 'New organization',
          organizationType: 'RESEARCH'
        })
      );
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/organizations'),
        {
          name: { text: 'New organization', language: 'en' },
          type: 'RESEARCH'
        }
      );
      expect(apiPut).toHaveBeenCalledWith(expect.stringContaining(path));
      expect(invalidateOrganizationCaches).toHaveBeenCalledTimes(1);
      expect(apiPost.mock.invocationCallOrder[0]).toBeLessThan(
        apiPut.mock.invocationCallOrder[0]
      );
    });

    it('links an existing organization without creating or classifying it', async () => {
      const { result } = renderMutation(hook);
      await act(async () =>
        result.current.mutateAsync({ ...scope, organizationId: 42 })
      );
      expect(apiPost).not.toHaveBeenCalled();
      expect(invalidateOrganizationCaches).not.toHaveBeenCalled();
      expect(apiPut).toHaveBeenCalledWith(expect.stringContaining(path));
    });

    it('never links when creation was rejected', async () => {
      const error = {
        status: 400,
        body: { message: 'Invalid organization type' }
      };
      apiPost.mockRejectedValueOnce(error);
      const { result } = renderMutation(hook);
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            ...scope,
            organizationName: 'New organization',
            organizationType: 'RESEARCH'
          })
        ).rejects.toBe(error);
      });
      expect(apiPut).not.toHaveBeenCalled();
      expect(invalidateOrganizationCaches).not.toHaveBeenCalled();
    });

    it('refreshes the created organization even when linking fails', async () => {
      const error = new Error('Association rejected');
      apiPut.mockRejectedValueOnce(error);
      const { result } = renderMutation(hook);
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            ...scope,
            organizationName: 'New organization',
            organizationType: 'RESEARCH'
          })
        ).rejects.toBe(error);
      });
      expect(invalidateOrganizationCaches).toHaveBeenCalledTimes(1);
    });
  }
);
