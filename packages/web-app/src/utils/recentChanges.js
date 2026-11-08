// UI page sizes and the API's current lookback and contribution cap.
export const RECENT_CHANGES_CONFIG = {
  previewLimit: 10,
  pageSize: 50,
  lookbackDays: 7,
  maxContributions: 500
};

export const RECENT_CHANGES_MESSAGE_VALUES = {
  days: RECENT_CHANGES_CONFIG.lookbackDays,
  limit: RECENT_CHANGES_CONFIG.maxContributions
};

export const RECENT_CHANGES_SCOPES = {
  country: {
    filter: 'countryId',
    description:
      'Recent contributions concerning this country in the last {days} days (limited to the latest {limit} contributions).'
  },
  region: {
    filter: 'regionId',
    description:
      'Recent contributions concerning this region in the last {days} days (limited to the latest {limit} contributions).'
  },
  massif: {
    filter: 'massifId',
    description:
      'Recent contributions concerning this massif in the last {days} days (limited to the latest {limit} contributions).'
  },
  organization: {
    filter: 'organizationId',
    description:
      'Recent contributions by current members of this organization in the last {days} days (limited to the latest {limit} contributions).'
  }
};

// Keep URL parameters and query keys in the same canonical shape. Do not drop
// malformed supplied values: the API must reject them instead of showing an
// unfiltered feed that could be mistaken for the requested scope.
export const getRecentChangesFilters = (filters = {}) =>
  Object.fromEntries(
    Object.values(RECENT_CHANGES_SCOPES).flatMap(({ filter }) => {
      const value = filters[filter];
      if (value == null) return [];
      const normalized = String(value).trim();
      return [
        [
          filter,
          ['countryId', 'regionId'].includes(filter)
            ? normalized.toUpperCase()
            : normalized
        ]
      ];
    })
  );

export const getRecentChangeKey = change =>
  JSON.stringify([
    change.date,
    change.authorId,
    change.mainEntityType,
    change.mainEntityId,
    change.mainAction,
    change.subAction
  ]);
