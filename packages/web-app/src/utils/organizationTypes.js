export const ORGANIZATION_TYPE_LABELS = Object.freeze({
  SPELEOLOGY: 'organizationType.speleology',
  CAVE_RESCUE: 'organizationType.caveRescue',
  EDITION: 'organizationType.edition',
  RESEARCH: 'organizationType.research',
  ADMINISTRATION: 'organizationType.administration',
  NATURE_CONSERVATION: 'organizationType.natureConservation',
  LIBRARY: 'organizationType.library',
  OTHER: 'organizationType.other'
});

export const ORGANIZATION_TYPE_VALUES = Object.freeze(
  Object.keys(ORGANIZATION_TYPE_LABELS)
);

export const isOrganizationType = type =>
  ORGANIZATION_TYPE_VALUES.includes(type);

export const EXPLORING_ORGANIZATION_TYPES = Object.freeze([
  'SPELEOLOGY',
  'CAVE_RESCUE',
  'RESEARCH'
]);

export const canOrganizationExplore = type =>
  // Historical organizations retain club behavior until they are classified.
  type == null || type === '' || EXPLORING_ORGANIZATION_TYPES.includes(type);

export const getDefaultOrganizationType = context => {
  if (context === 'editor') return 'EDITION';
  if (context === 'library') return 'LIBRARY';
  return '';
};

export const getOrganizationTypeLabelId = type => {
  if (type == null || type === '') return 'organizationType.unspecified';
  return isOrganizationType(type)
    ? ORGANIZATION_TYPE_LABELS[type]
    : 'organizationType.unknown';
};
