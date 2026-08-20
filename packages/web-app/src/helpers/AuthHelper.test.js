import { hasRole } from './AuthHelper';

const authState = (groups, impersonatedRole = null) => ({
  authTokenDecoded: { groups: groups.map(name => ({ name })) },
  impersonatedRole
});

describe('hasRole impersonation', () => {
  it('replaces an administrator role with the impersonated role', () => {
    const state = authState(['Administrator', 'User'], 'Moderator');

    expect(hasRole(state, 'Administrator')).toBe(false);
    expect(hasRole(state, 'Moderator')).toBe(true);
    expect(hasRole(state, 'User')).toBe(false);
  });

  it('can inspect the real administrator role while impersonating', () => {
    const state = authState(['Administrator'], 'Leader');

    expect(hasRole(state, 'Administrator', { ignoreImpersonation: true })).toBe(
      true
    );
  });

  it('does not let a non-admin gain a role from stale browser state', () => {
    const state = authState(['User'], 'Moderator');

    expect(hasRole(state, 'Moderator')).toBe(false);
    expect(hasRole(state, 'User')).toBe(true);
  });
});
