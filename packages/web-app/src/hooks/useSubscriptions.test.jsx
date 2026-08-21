import { act, renderHook, waitFor } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useMutation
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { useSubscriptions } from './useSubscriptions';

vi.mock('./useUserProperties', () => ({
  useUserProperties: () => ({ id: 42 })
}));

vi.mock('./queries/useSubscriptionsList', () => ({
  useSubscriptionsList: () => ({
    data: { countries: [], regions: [], massifs: [] },
    isPending: false,
    isError: false
  })
}));

const LOADING_FIELDS = [
  'isCountryLoading',
  'isRegionLoading',
  'isMassifLoading'
];

const createDeferred = () => {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always', gcTime: Infinity },
      mutations: { retry: false, networkMode: 'always', gcTime: Infinity }
    }
  });

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

const useMutationHarness = (mutationKey, mutationFn) => {
  const subscriptions = useSubscriptions();
  const mutation = useMutation({ mutationKey, mutationFn });
  return {
    ...subscriptions,
    mutateAsync: mutation.mutateAsync,
    isMutationPending: mutation.isPending
  };
};

describe('useSubscriptions mutation loading state', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('ignores an unkeyed account mutation without throwing', async () => {
    const deferred = createDeferred();
    const { result } = renderHook(
      () => useMutationHarness(undefined, () => deferred.promise),
      { wrapper: makeWrapper(queryClient) }
    );

    let mutationPromise;
    act(() => {
      mutationPromise = result.current.mutateAsync();
    });

    await waitFor(() => {
      expect(result.current.isMutationPending).toBe(true);
    });
    LOADING_FIELDS.forEach(field => {
      expect(result.current[field]).toBe(false);
    });

    await act(async () => {
      deferred.resolve();
      await mutationPromise;
    });
  });

  it.each([
    ['country-subscription', 'isCountryLoading'],
    ['region-subscription', 'isRegionLoading'],
    ['massif-subscription', 'isMassifLoading']
  ])('tracks only %s mutations', async (mutationKey, expectedField) => {
    const deferred = createDeferred();
    const { result } = renderHook(
      () => useMutationHarness([mutationKey], () => deferred.promise),
      { wrapper: makeWrapper(queryClient) }
    );

    let mutationPromise;
    act(() => {
      mutationPromise = result.current.mutateAsync();
    });

    await waitFor(() => {
      expect(result.current[expectedField]).toBe(true);
    });
    LOADING_FIELDS.forEach(field => {
      expect(result.current[field]).toBe(field === expectedField);
    });

    await act(async () => {
      deferred.resolve();
      await mutationPromise;
    });
    await waitFor(() => {
      expect(result.current[expectedField]).toBe(false);
    });
  });
});
