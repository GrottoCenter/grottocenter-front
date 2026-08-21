import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import fc from 'fast-check';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { caveKeys, entranceKeys } from '@/api/queryKeys';
import {
  deleteCaveUrl,
  moveEntranceToCaveUrl,
  postCreateCaveUrl
} from '@/conf/apiRoutes';
import { useDetachEntranceToNewCave } from './useAdminActions';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn()
}));

const entranceNameArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.constantFrom(
    '北京洞穴',
    'café grotte',
    '🦇 cave',
    '<script>alert("xss")</script>',
    "O'Brien's Cave",
    '\t leading whitespace',
    'trailing\u00a0nbsp'
  )
);
const languageArbitrary = fc.oneof(
  fc.constantFrom('eng', 'fra', 'deu', 'spa', 'zho', 'ara'),
  fc.string({ minLength: 1, maxLength: 10 })
);
const idArbitrary = fc.integer({ min: 1, max: 100000 });

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'always', gcTime: Infinity },
      mutations: { retry: false, networkMode: 'always' }
    }
  });

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('useDetachEntranceToNewCave properties', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('creates and moves the cave from arbitrary entrance data, then invalidates the affected keys', async () => {
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue();
    const { result } = renderHook(() => useDetachEntranceToNewCave(), {
      wrapper: makeWrapper(queryClient)
    });

    await fc.assert(
      fc.asyncProperty(
        entranceNameArbitrary,
        languageArbitrary,
        idArbitrary,
        idArbitrary,
        async (name, language, entranceId, caveId) => {
          invalidateQueries.mockClear();
          apiPost.mockResolvedValueOnce({ id: caveId });
          apiPatch.mockResolvedValueOnce({});

          await act(async () => {
            await result.current.mutateAsync({
              id: entranceId,
              name,
              language
            });
          });

          expect(apiPost).toHaveBeenLastCalledWith(postCreateCaveUrl, {
            name: { text: name, language }
          });
          expect(apiPatch).toHaveBeenLastCalledWith(
            moveEntranceToCaveUrl(entranceId, caveId),
            undefined
          );
          expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: entranceKeys.detail(entranceId)
          });
          expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: caveKeys.all
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('permanently rolls back the created cave when the move fails', async () => {
    const { result } = renderHook(() => useDetachEntranceToNewCave(), {
      wrapper: makeWrapper(queryClient)
    });

    await fc.assert(
      fc.asyncProperty(
        entranceNameArbitrary,
        languageArbitrary,
        idArbitrary,
        idArbitrary,
        async (name, language, entranceId, caveId) => {
          const moveError = new Error('move failed');
          apiPost.mockResolvedValueOnce({ id: caveId });
          apiPatch.mockRejectedValueOnce(moveError);
          apiDelete.mockResolvedValueOnce(null);

          let caughtError;
          await act(async () => {
            try {
              await result.current.mutateAsync({
                id: entranceId,
                name,
                language
              });
            } catch (error) {
              caughtError = error;
            }
          });

          expect(apiDelete).toHaveBeenLastCalledWith(
            deleteCaveUrl(caveId, { isPermanent: true })
          );
          expect(caughtError).toBe(moveError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mask a move error when the rollback also fails', async () => {
    const { result } = renderHook(() => useDetachEntranceToNewCave(), {
      wrapper: makeWrapper(queryClient)
    });

    await fc.assert(
      fc.asyncProperty(idArbitrary, idArbitrary, async (entranceId, caveId) => {
        const moveError = new Error(`move ${entranceId} failed`);
        apiPost.mockResolvedValueOnce({ id: caveId });
        apiPatch.mockRejectedValueOnce(moveError);
        apiDelete.mockRejectedValueOnce(new Error(`rollback ${caveId} failed`));

        let caughtError;
        await act(async () => {
          try {
            await result.current.mutateAsync({
              id: entranceId,
              name: 'Entrance',
              language: 'eng'
            });
          } catch (error) {
            caughtError = error;
          }
        });

        expect(apiDelete).toHaveBeenLastCalledWith(
          deleteCaveUrl(caveId, { isPermanent: true })
        );
        expect(caughtError).toBe(moveError);
      }),
      { numRuns: 100 }
    );
  });
});
