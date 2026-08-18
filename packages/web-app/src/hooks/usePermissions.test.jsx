import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { usePermissions } from './usePermissions';

const liveToken = groups => ({
  exp: Date.now() / 1000 + 3600,
  groups: groups.map(name => ({ name }))
});

const renderPermissions = login => {
  const store = createStore((state = { login }) => state);
  const Wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => usePermissions(), { wrapper: Wrapper }).result
    .current;
};

describe('usePermissions impersonation', () => {
  it('exposes the selected effective role while preserving real admin status', () => {
    const permissions = renderPermissions({
      authTokenDecoded: liveToken(['Administrator', 'User']),
      impersonatedRole: 'Moderator'
    });

    expect(permissions).toMatchObject({
      impersonatedRole: 'Moderator',
      isAdmin: false,
      isAuth: true,
      isImpersonating: true,
      isModerator: true,
      isRealAdmin: true,
      isUser: false
    });
  });

  it('makes anonymous preview equivalent to a logged-out UI', () => {
    const permissions = renderPermissions({
      authTokenDecoded: liveToken(['Administrator']),
      impersonatedRole: 'Anonymous'
    });

    expect(permissions.isAuth).toBe(false);
    expect(permissions.isAdmin).toBe(false);
    expect(permissions.isRealAdmin).toBe(true);
    expect(permissions.isImpersonating).toBe(true);
  });

  it('ignores impersonation state for non-admin users', () => {
    const permissions = renderPermissions({
      authTokenDecoded: liveToken(['User']),
      impersonatedRole: 'Moderator'
    });

    expect(permissions).toMatchObject({
      impersonatedRole: null,
      isAuth: true,
      isImpersonating: false,
      isModerator: false,
      isRealAdmin: false,
      isUser: true
    });
  });
});
