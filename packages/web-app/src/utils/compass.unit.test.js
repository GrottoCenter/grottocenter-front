import {
  normalizeDeg,
  headingToBearing,
  shortestAngleDelta,
  computeHeading
} from './compass';

describe('normalizeDeg', () => {
  it.each([
    [0, 0],
    [360, 0],
    [370, 10],
    [-10, 350],
    [-370, 350],
    [720, 0]
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeDeg(input)).toBe(expected);
  });
});

describe('headingToBearing', () => {
  it('negates the heading (map turns opposite to the device heading)', () => {
    expect(headingToBearing(90)).toBe(-90);
    expect(headingToBearing(0)).toBe(-0);
  });
});

describe('shortestAngleDelta', () => {
  it.each([
    [0, 10, 10],
    [10, 0, -10],
    [350, 10, 20], // crosses 360→0 the short way (+20), not -340
    [10, 350, -20], // crosses 0→360 the short way (-20), not +340
    [0, 370, 10] // unwrapped target still resolves to the short path
  ])('delta from %p to %p is %p', (from, to, expected) => {
    expect(shortestAngleDelta(from, to)).toBe(expected);
  });

  it('never exceeds 180° in magnitude', () => {
    for (let from = 0; from < 360; from += 37) {
      for (let to = 0; to < 720; to += 53) {
        expect(Math.abs(shortestAngleDelta(from, to))).toBeLessThanOrEqual(180);
      }
    }
  });
});

describe('computeHeading', () => {
  it('uses webkitCompassHeading directly (iOS), normalized', () => {
    expect(computeHeading({ webkitCompassHeading: 90 })).toBe(90);
    expect(computeHeading({ webkitCompassHeading: 400 })).toBe(40);
  });

  it('derives an absolute heading from alpha (Android)', () => {
    // alpha increases counter-clockwise, so heading = 360 - alpha.
    expect(computeHeading({ alpha: 90, absolute: true })).toBe(270);
    expect(computeHeading({ alpha: 0, absolute: true })).toBe(0);
  });

  it('accepts events whose absolute flag is undefined', () => {
    expect(computeHeading({ alpha: 90 })).toBe(270);
  });

  it('corrects for screen rotation (landscape)', () => {
    // Same device heading, viewport rotated 90°.
    expect(computeHeading({ alpha: 0, absolute: true }, 90)).toBe(90);
    expect(computeHeading({ alpha: 350, absolute: true }, 20)).toBe(30);
  });

  it('rejects relative-only sensors and missing data', () => {
    expect(computeHeading({ alpha: 90, absolute: false })).toBeNull();
    expect(computeHeading({})).toBeNull();
  });
});
