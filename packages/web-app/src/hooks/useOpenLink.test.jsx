import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import useOpenLink from './useOpenLink';

it('keeps the router basename when opening an internal link in a new tab', () => {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  const { result } = renderHook(() => useOpenLink(), {
    wrapper: ({ children }) => (
      <MemoryRouter
        basename="/pr/1643"
        initialEntries={['/pr/1643/ui/entrances']}>
        {children}
      </MemoryRouter>
    )
  });

  act(() => result.current('/ui/entrances/42'));

  expect(open).toHaveBeenCalledWith('/pr/1643/ui/entrances/42', '_blank');
  open.mockRestore();
});
