import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiGet } from '@/api/client';
import { previewMassifSensitiveUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { usePreviewSensitiveMassif } from './usePreviewSensitiveMassif';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('usePreviewSensitiveMassif', () => {
  it('fetches fresh counts for every confirmation attempt', async () => {
    const queryClient = createTestQueryClient();
    apiGet
      .mockResolvedValueOnce({ count: 3, lockedCount: 1 })
      .mockResolvedValueOnce({ count: 1, lockedCount: 2 });
    const { result } = renderHook(() => usePreviewSensitiveMassif(), {
      wrapper: makeWrapper(queryClient)
    });

    let firstPreview;
    let secondPreview;
    await act(async () => {
      firstPreview = await result.current(42);
      secondPreview = await result.current(42);
    });

    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(apiGet).toHaveBeenCalledWith(previewMassifSensitiveUrl(42));
    expect(firstPreview).toEqual({ count: 3, lockedCount: 1 });
    expect(secondPreview).toEqual({ count: 1, lockedCount: 2 });
    queryClient.clear();
  });
});
