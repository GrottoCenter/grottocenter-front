import { getRecentChangeKey } from './recentChanges';

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
