import fc from 'fast-check';
import { computeBoundingBox } from './boundingBox';

const KM_PER_DEGREE_LAT = 111.32;

describe('computeBoundingBox', () => {
  describe('invalid inputs return null', () => {
    it('returns null when latitude is not finite', () => {
      expect(computeBoundingBox(NaN, 0)).toBeNull();
      expect(computeBoundingBox(Infinity, 0)).toBeNull();
      expect(computeBoundingBox(undefined, 0)).toBeNull();
      expect(computeBoundingBox('abc', 0)).toBeNull();
    });

    it('returns null when longitude is not finite', () => {
      expect(computeBoundingBox(0, NaN)).toBeNull();
      expect(computeBoundingBox(0, -Infinity)).toBeNull();
      expect(computeBoundingBox(0, 'xyz')).toBeNull();
    });

    it('returns null when radius is not a positive finite number', () => {
      expect(computeBoundingBox(0, 0, 0)).toBeNull();
      expect(computeBoundingBox(0, 0, -5)).toBeNull();
      expect(computeBoundingBox(0, 0, NaN)).toBeNull();
      expect(computeBoundingBox(0, 0, Infinity)).toBeNull();
    });
  });

  describe('known values', () => {
    it('builds a symmetric box around the equator (cos lat = 1)', () => {
      const offset = 1 / KM_PER_DEGREE_LAT;
      const box = computeBoundingBox(0, 0, 1);
      expect(box.sw_lat).toBeCloseTo(-offset, 9);
      expect(box.ne_lat).toBeCloseTo(offset, 9);
      // At the equator the longitude offset equals the latitude offset.
      expect(box.sw_lng).toBeCloseTo(-offset, 9);
      expect(box.ne_lng).toBeCloseTo(offset, 9);
    });

    it('coerces numeric strings (the form passes strings)', () => {
      expect(computeBoundingBox('0', '0', 1)).toEqual(computeBoundingBox(0, 0, 1));
    });

    it('falls back to a full-longitude box near the poles', () => {
      const box = computeBoundingBox(90, 0, 1);
      expect(box.sw_lng).toBe(-180);
      expect(box.ne_lng).toBe(180);
    });

    it('defaults the radius to 1 km', () => {
      expect(computeBoundingBox(12, 34)).toEqual(computeBoundingBox(12, 34, 1));
    });
  });

  // Arbitraries restricted to physically meaningful, finite ranges.
  const latArb = fc.double({ min: -90, max: 90, noNaN: true });
  const lngArb = fc.double({ min: -180, max: 180, noNaN: true });
  const radiusArb = fc.double({ min: 0.001, max: 500, noNaN: true });

  describe('properties', () => {
    it('always stays within global coordinate limits', () => {
      fc.assert(
        fc.property(latArb, lngArb, radiusArb, (lat, lng, r) => {
          const box = computeBoundingBox(lat, lng, r);
          expect(box).not.toBeNull();
          expect(box.sw_lat).toBeGreaterThanOrEqual(-90);
          expect(box.ne_lat).toBeLessThanOrEqual(90);
          expect(box.sw_lng).toBeGreaterThanOrEqual(-180);
          expect(box.ne_lng).toBeLessThanOrEqual(180);
        }),
        { numRuns: 200 }
      );
    });

    it('produces a well-ordered box (south-west <= north-east)', () => {
      fc.assert(
        fc.property(latArb, lngArb, radiusArb, (lat, lng, r) => {
          const box = computeBoundingBox(lat, lng, r);
          expect(box.sw_lat).toBeLessThanOrEqual(box.ne_lat);
          expect(box.sw_lng).toBeLessThanOrEqual(box.ne_lng);
        }),
        { numRuns: 200 }
      );
    });

    it('always contains its center point', () => {
      fc.assert(
        fc.property(latArb, lngArb, radiusArb, (lat, lng, r) => {
          const box = computeBoundingBox(lat, lng, r);
          expect(lat).toBeGreaterThanOrEqual(box.sw_lat);
          expect(lat).toBeLessThanOrEqual(box.ne_lat);
          expect(lng).toBeGreaterThanOrEqual(box.sw_lng);
          expect(lng).toBeLessThanOrEqual(box.ne_lng);
        }),
        { numRuns: 200 }
      );
    });

    it('grows (never shrinks) the latitude span as the radius grows', () => {
      fc.assert(
        fc.property(latArb, lngArb, radiusArb, radiusArb, (lat, lng, r1, r2) => {
          const small = Math.min(r1, r2);
          const large = Math.max(r1, r2);
          const spanSmall =
            computeBoundingBox(lat, lng, small).ne_lat -
            computeBoundingBox(lat, lng, small).sw_lat;
          const spanLarge =
            computeBoundingBox(lat, lng, large).ne_lat -
            computeBoundingBox(lat, lng, large).sw_lat;
          expect(spanLarge).toBeGreaterThanOrEqual(spanSmall);
        }),
        { numRuns: 200 }
      );
    });
  });
});
