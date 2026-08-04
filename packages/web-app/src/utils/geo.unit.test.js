import { initialBearing, bearingToCardinal, formatDistance } from './geo';

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
