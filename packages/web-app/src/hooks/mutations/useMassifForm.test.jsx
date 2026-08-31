import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPost, apiPut } from '@/api/client';
import {
  entranceKeys,
  massifKeys,
  massifPreviewKeys,
  statsKeys
} from '@/api/queryKeys';
import {
  markMassifSensitiveUrl,
  postCreateMassifUrl,
  putMassifUrl,
  unmarkMassifSensitiveUrl
} from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  useCreateMassif,
  useMarkMassifSensitive,
  useUnmarkMassifSensitive,
  useUpdateMassif
} from './useMassifForm';

vi.mock('@/api/client', () => ({
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

const renderMutation = hook => {
  const queryClient = createTestQueryClient();
  const invalidateQueries = vi
    .spyOn(queryClient, 'invalidateQueries')
    .mockResolvedValue();
  const rendered = renderHook(hook, { wrapper: makeWrapper(queryClient) });
  return { ...rendered, invalidateQueries, queryClient };
};

describe('massif mutation invalidations', () => {
  beforeEach(() => {
    apiPost.mockResolvedValue({});
    apiPut.mockResolvedValue({});
  });

  it('refreshes entrances after creating a massif polygon', async () => {
    const { result, invalidateQueries, queryClient } = renderMutation(() =>
      useCreateMassif()
    );
    const body = { name: 'New massif', geogPolygon: { coordinates: [] } };

    await act(async () => result.current.mutateAsync(body));

    expect(apiPost).toHaveBeenCalledWith(postCreateMassifUrl, body);
    [massifKeys.all, statsKeys.all, entranceKeys.all].forEach(queryKey => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    });
    queryClient.clear();
  });

  it('refreshes the preview and entrances after a polygon update', async () => {
    const { result, invalidateQueries, queryClient } = renderMutation(() =>
      useUpdateMassif()
    );
    const body = { id: 42, geogPolygon: { coordinates: [] } };

    await act(async () => result.current.mutateAsync(body));

    expect(apiPut).toHaveBeenCalledWith(putMassifUrl(42), body);
    [
      massifKeys.all,
      statsKeys.all,
      entranceKeys.all,
      massifPreviewKeys.sensitive(42)
    ].forEach(queryKey => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    });
    queryClient.clear();
  });

  it('refreshes cascaded entrances after marking a massif sensitive', async () => {
    const { result, invalidateQueries, queryClient } = renderMutation(() =>
      useMarkMassifSensitive()
    );

    await act(async () => result.current.mutateAsync(42));

    expect(apiPost).toHaveBeenCalledWith(markMassifSensitiveUrl(42));
    [massifKeys.all, entranceKeys.all, massifPreviewKeys.sensitive(42)].forEach(
      queryKey => {
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
      }
    );
    queryClient.clear();
  });

  it('refreshes the next preview after unmarking a massif', async () => {
    const { result, invalidateQueries, queryClient } = renderMutation(() =>
      useUnmarkMassifSensitive()
    );

    await act(async () => result.current.mutateAsync(42));

    expect(apiPost).toHaveBeenCalledWith(unmarkMassifSensitiveUrl(42));
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: massifPreviewKeys.sensitive(42)
    });
    queryClient.clear();
  });
});
