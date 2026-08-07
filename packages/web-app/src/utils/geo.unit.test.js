import {
  initialBearing,
  bearingToCardinal,
  formatDistance,
  relativeBearing,
  followCenterYOffset
} from './geo';

describe('initialBearing', () => {
  const origin = { lat: 0, lng: 0 };
  it.each([
    ['due North', { lat: 1, lng: 0 }, 0],
    ['due East', { lat: 0, lng: 1 }, 90],
    ['due West', { lat: 0, lng: -1 }, 270]
  ])('is %s → %p°', (_label, to, expected) => {
    expect(initialBearing(origin, to)).toBeCloseTo(expected, 5);
  });

  it('points South when the target is below', () => {
    expect(initialBearing({ lat: 1, lng: 0 }, origin)).toBeCloseTo(180, 5);
  });
});

describe('bearingToCardinal', () => {
  it.each([
    [0, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [180, 'S'],
    [270, 'W'],
    [22.5, 'NNE'],
    [360, 'N'],
    [-22.5, 'NNW']
  ])('maps %p° to %p', (deg, expected) => {
    expect(bearingToCardinal(deg)).toBe(expected);
  });
});

describe('relativeBearing', () => {
  it.each([
    ['target ahead when facing it', 90, 90, 0],
    ['target to the right', 90, 0, 90],
    ['target to the left', 0, 90, 270],
    ['target behind', 180, 0, 180],
    ['wraps across North', 10, 350, 20],
    ['wraps the other way', 350, 10, 340]
  ])('%s → %p°', (_label, bearing, heading, expected) => {
    expect(relativeBearing(bearing, heading)).toBeCloseTo(expected, 5);
  });

  it('always returns a value within [0, 360)', () => {
    for (let bearing = 0; bearing < 360; bearing += 37) {
      for (let heading = 0; heading < 360; heading += 53) {
        const result = relativeBearing(bearing, heading);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    }
  });
});

describe('followCenterYOffset', () => {
  it('is zero when the user stays centered', () => {
    expect(followCenterYOffset(600, 0.5)).toBe(0);
  });

  it('is negative so the center sits above the user (user appears lower)', () => {
    // ratio 0.66 → user at 66% down the viewport, center 16% of height above it.
    expect(followCenterYOffset(600, 0.66)).toBeCloseTo(-96, 5);
  });

  it('scales with the viewport height', () => {
    expect(followCenterYOffset(300, 0.66)).toBeCloseTo(
      followCenterYOffset(600, 0.66) / 2,
      5
    );
  });
});

describe('formatDistance', () => {
  it('uses meters below 1 km and always appends miles', () => {
    const result = formatDistance(500, 'en');
    expect(result).toContain('mi');
    expect(result).not.toContain('km');
  });

  it('switches to kilometers at/above 1 km', () => {
    const result = formatDistance(1500, 'en');
    expect(result).toContain('km');
    expect(result).toContain('mi');
  });
});
