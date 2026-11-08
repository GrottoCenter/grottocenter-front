import { getUndergroundLocation } from './location';

describe('underground point location', () => {
  it.each([false, true])(
    'centres only non-protected, non-deleted entrances (admin: %s)',
    isAdmin => {
      const cave = {
        entrances: [
          { latitude: 48, longitude: 10 },
          { latitude: 50, longitude: 12 },
          { latitude: 5, longitude: 1, isSensitive: true },
          { latitude: 6, longitude: 2, isDeleted: true },
          { latitude: null, longitude: null }
        ]
      };
      expect(getUndergroundLocation(cave.entrances, isAdmin)).toEqual({
        coordinates: { latitude: 49, longitude: 11 },
        isSensitive: false,
        isSensitiveLocked: false
      });
    }
  );

  it('hides protected coordinates even if a response includes them', () => {
    expect(
      getUndergroundLocation([
        {
          latitude: 48,
          longitude: 10,
          isSensitive: true,
          isSensitiveLocked: true
        }
      ])
    ).toEqual({
      coordinates: null,
      isSensitive: true,
      isSensitiveLocked: true
    });
  });

  it('allows administrators to locate an entirely protected cave', () => {
    expect(
      getUndergroundLocation(
        [{ latitude: 0, longitude: 0, isSensitive: true }],
        true
      )
    ).toMatchObject({
      coordinates: { latitude: 0, longitude: 0 },
      isSensitive: true
    });
  });

  it.each([
    undefined,
    [],
    [{ latitude: 48, longitude: 10, isDeleted: true }],
    [{ latitude: NaN, longitude: 10 }],
    [{ latitude: 48, longitude: Infinity }],
    [{ latitude: 91, longitude: 10 }]
  ])('reports no known location for unusable entrances: %j', entrances => {
    expect(getUndergroundLocation(entrances)).toMatchObject({
      coordinates: null,
      isSensitive: false
    });
  });
});
