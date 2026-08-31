import { makeEntranceData, hasEntranceChanged } from './transformers';
import { ENTRANCE_ONLY } from './caveType';

const makeFormData = entranceOverrides => ({
  cave: { id: 1, language: 'eng', name: 'A cave' },
  entrance: {
    name: 'An entrance',
    language: 'eng',
    isSensitive: false,
    latitude: 45,
    longitude: 5,
    ...entranceOverrides
  }
});

describe('makeEntranceData isSensitiveLocked', () => {
  it('includes the lock state when the form holds one', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: true }),
      ENTRANCE_ONLY
    );

    expect(data.isSensitiveLocked).toBe(true);
  });

  it('coerces the lock state to a boolean', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: false }),
      ENTRANCE_ONLY
    );

    expect(data.isSensitiveLocked).toBe(false);
  });

  it.each([undefined, null])(
    'omits the key entirely when the lock state is %s so the API applies its default',
    lockValue => {
      const data = makeEntranceData(
        makeFormData({ isSensitiveLocked: lockValue }),
        ENTRANCE_ONLY
      );

      expect('isSensitiveLocked' in data).toBe(false);
      expect(JSON.stringify(data)).not.toContain('isSensitiveLocked');
    }
  );
});

describe('hasEntranceChanged isSensitiveLocked', () => {
  const originalValues = {
    name: 'An entrance',
    language: 'eng',
    isSensitive: false,
    isSensitiveLocked: false,
    latitude: 45,
    longitude: 5
  };

  it('detects a newly locked entrance', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: true }),
      ENTRANCE_ONLY
    );

    expect(hasEntranceChanged(data, originalValues)).toBe(true);
  });

  it('reports no change when the lock state is untouched', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: false }),
      ENTRANCE_ONLY
    );

    expect(hasEntranceChanged(data, originalValues)).toBe(false);
  });

  it('detects an unlocked entrance', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: false }),
      ENTRANCE_ONLY
    );

    expect(
      hasEntranceChanged(data, { ...originalValues, isSensitiveLocked: true })
    ).toBe(true);
  });

  it('ignores an omitted lock state', () => {
    const data = makeEntranceData(
      makeFormData({ isSensitiveLocked: undefined }),
      ENTRANCE_ONLY
    );

    expect(
      hasEntranceChanged(data, { ...originalValues, isSensitiveLocked: true })
    ).toBe(false);
  });
});
