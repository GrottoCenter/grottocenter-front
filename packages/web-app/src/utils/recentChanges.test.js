import { getRecentChangeKey, getRecentChangesFilters } from './recentChanges';

it('canonicalizes combined filter identifiers', () => {
  const filters = { organizationId: 42, regionId: 'fr-ara', ignored: 'value' };
  expect(getRecentChangesFilters(filters)).toEqual({
    regionId: 'FR-ARA',
    organizationId: '42'
  });
  expect(getRecentChangesFilters({ countryId: '' })).toEqual({ countryId: '' });
});

describe('getRecentChangeKey', () => {
  it('keeps field boundaries unambiguous', () => {
    const baseChange = {
      date: '2026-08-23',
      authorId: 1,
      mainEntityId: 2,
      mainAction: 'update',
      subAction: null
    };

    expect(
      getRecentChangeKey({
        ...baseChange,
        mainEntityType: 'cave-network'
      })
    ).not.toBe(
      getRecentChangeKey({
        ...baseChange,
        mainEntityType: 'cave',
        mainEntityId: 'network-2'
      })
    );
  });
});
