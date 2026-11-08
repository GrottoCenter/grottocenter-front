// DELETE this entire fallback after the coordinated deployment of
// https://github.com/GrottoCenter/grottocenter-api/issues/1978.
// Until then, caveId + the cave's displayable entrances reproduce the future
// entrance/network presentation. No entrance means no displayable association.
const getLegacyAssociation = cave => {
  const entrances = (cave?.entrances ?? []).filter(
    entrance => entrance.id != null && !entrance.isDeleted
  );
  if (entrances.length === 1) {
    return { ...entrances[0], type: 'entrance' };
  }
  if (entrances.length > 1) {
    return { type: 'network', id: cave.id, name: cave.name };
  }
  return null;
};

export const getPointAssociation = (point, cave) => {
  if (point?.entrance) return { ...point.entrance, type: 'entrance' };
  if (point?.network) return { ...point.network, type: 'network' };
  // Explicit nulls belong to the new contract: do not resurrect an association.
  if (!point || 'entrance' in point || 'network' in point) return null;

  // DELETE this legacy branch with getLegacyAssociation after #1978.
  return point.caveId ? getLegacyAssociation(cave) : null;
};
