export const ORGANIZATION_TYPE_LABELS = Object.freeze({
  SPELEOLOGY: 'organizationType.speleology',
  CAVE_RESCUE: 'organizationType.caveRescue',
  EDITION: 'organizationType.edition',
  RESEARCH: 'organizationType.research',
  ADMINISTRATION: 'organizationType.administration',
  NATURE_CONSERVATION: 'organizationType.natureConservation',
  LIBRARY: 'organizationType.library'
});

export const ORGANIZATION_TYPE_VALUES = Object.freeze(
  Object.keys(ORGANIZATION_TYPE_LABELS)
);

export const isOrganizationType = type =>
  ORGANIZATION_TYPE_VALUES.includes(type);

export const getOrganizationTypeLabelId = type => {
  if (type == null || type === '') return 'organizationType.unspecified';
  return isOrganizationType(type)
    ? ORGANIZATION_TYPE_LABELS[type]
    : 'organizationType.unknown';
};
