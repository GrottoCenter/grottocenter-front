import { StrictMode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiGet } from '@/api/client';
import { useVerifyEmail } from './useAuthFlows';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn()
}));

const makeStrictWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <StrictMode>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </StrictMode>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('useVerifyEmail', () => {
  it('deduplicates the StrictMode remount when gcTime is zero', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, networkMode: 'always' }
      }
    });
    apiGet.mockResolvedValue({ message: 'verified' });

    renderHook(() => useVerifyEmail('token'), {
      wrapper: makeStrictWrapper(queryClient)
    });

    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    queryClient.clear();
  });
});
