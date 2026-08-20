// When an admin uses ImpersonationIndicator to "view as another role", we
// replace — not augment — the effective role set with a single group. Pass
// { ignoreImpersonation: true } to read the underlying token instead (used by
// the impersonation UI itself, which must stay visible to real admins even
// after they downgrade the view).
export const hasRole = (authState, roleName, options = {}) => {
  const { ignoreImpersonation = false } = options;
  const groups = authState?.authTokenDecoded?.groups ?? null;
  if (groups === null) return false;

  const isRealAdmin = groups.some(group => group.name === 'Administrator');
  if (!ignoreImpersonation && isRealAdmin && authState?.impersonatedRole) {
    return authState.impersonatedRole === roleName;
  }
  return groups.some(g => g.name === roleName);
};
