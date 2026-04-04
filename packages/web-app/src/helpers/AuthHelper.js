export const hasRole = (authState, roleName) => {
  const groups = authState?.authTokenDecoded?.groups ?? null;
  if (groups === null) return false;
  return groups.some(g => g.name === roleName);
};
