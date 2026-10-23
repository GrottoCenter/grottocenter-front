import { act, renderHook } from '@testing-library/react';

import { usePostDeletion } from './usePostDeletion';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const entityType = { url: '/ui/entrances/' };

describe('post-deletion navigation', () => {
  beforeEach(() => navigate.mockReset());

  const setup = () => renderHook(() => usePostDeletion({ entityType }));

  it.each([
    [43, '/ui/entrances/43'],
    [undefined, '/'],
    [null, '/']
  ])(
    'navigates after permanent success with replacement %s',
    (replacement, expectedUrl) => {
      const { result } = setup();
      act(() => result.current.onDeleted(replacement, true));
      expect(navigate).toHaveBeenCalledExactlyOnceWith(expectedUrl, {
        replace: true
      });
    }
  );

  it('keeps the page during a soft deletion', () => {
    const { result } = setup();
    act(() => result.current.onDeleted(43, false));
    expect(navigate).not.toHaveBeenCalled();
  });
});
