import { act, renderHook } from '@testing-library/react';

import { usePostDeletion } from './usePostDeletion';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const entityType = { url: '/ui/entrances/' };

describe('post-deletion state and navigation', () => {
  beforeEach(() => navigate.mockReset());

  const setup = (entity = { isDeleted: false }) => {
    const deleteMutation = { mutate: vi.fn() };
    return {
      deleteMutation,
      ...renderHook(() =>
        usePostDeletion({ entityType, id: 42, entity, deleteMutation })
      )
    };
  };

  it.each([
    [43, 44, '/ui/entrances/43'],
    [undefined, 44, '/ui/entrances/44'],
    [undefined, undefined, '/']
  ])(
    'navigates after success with replacement %s and redirect %s',
    (replacement, redirectTo, expectedUrl) => {
      const { result, deleteMutation } = setup({ isDeleted: true, redirectTo });

      act(() => result.current.onDeletePress(replacement, true));
      expect(navigate).not.toHaveBeenCalled();
      const [variables, callbacks] = deleteMutation.mutate.mock.calls[0];
      expect(variables).toEqual({
        id: 42,
        entityId: replacement,
        isPermanent: true
      });
      act(() => callbacks.onSuccess());
      expect(navigate).toHaveBeenCalledExactlyOnceWith(expectedUrl, {
        replace: true
      });
    }
  );

  it.each([false, true])(
    'rolls back to the previous deleted state (%s) on failure',
    isDeleted => {
      const { result, deleteMutation } = setup({ isDeleted });

      act(() => result.current.onDeletePress(43));
      expect(result.current.wantedDeletedState).toBe(true);
      act(() => deleteMutation.mutate.mock.calls[0][1].onError());

      expect(result.current.wantedDeletedState).toBe(isDeleted);
      expect(navigate).not.toHaveBeenCalled();
    }
  );

  it('keeps the page during a soft deletion', () => {
    const { result, deleteMutation } = setup();
    act(() => result.current.onDeletePress(43, false));
    act(() => deleteMutation.mutate.mock.calls[0][1].onSuccess());

    expect(result.current.wantedDeletedState).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('syncs deleted state after a restore or entity change', () => {
    const deleteMutation = { mutate: vi.fn() };
    const { result, rerender } = renderHook(
      ({ id, entity }) =>
        usePostDeletion({ entityType, id, entity, deleteMutation }),
      { initialProps: { id: 42, entity: { isDeleted: true } } }
    );
    expect(result.current.wantedDeletedState).toBe(true);
    rerender({ id: 42, entity: { isDeleted: false } });
    expect(result.current.wantedDeletedState).toBe(false);
    act(() => result.current.onDeletePress(44, false));
    rerender({ id: 43, entity: { isDeleted: false } });
    expect(result.current.wantedDeletedState).toBe(false);
  });
});
