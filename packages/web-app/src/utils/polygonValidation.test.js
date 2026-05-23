import {
  normalizeWinding,
  checkSelfIntersections,
  checkInterPolygonIntersections,
  hasMinimumPoints,
  computeTotalArea,
  validatePolygon,
  AREA_LIMIT_KM2
} from './polygonValidation';

describe('polygonValidation', () => {
  describe('AREA_LIMIT_KM2', () => {
    it('is 35000', () => {
      expect(AREA_LIMIT_KM2).toBe(35000);
    });
  });

  describe('normalizeWinding', () => {
    it('returns null/undefined input unchanged', () => {
      expect(normalizeWinding(null, false)).toBeNull();
      expect(normalizeWinding(undefined, false)).toBeUndefined();
    });

    it('returns input with fewer than 3 points unchanged', () => {
      const twoPoints = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      ];
      expect(normalizeWinding(twoPoints, false)).toEqual(twoPoints);
    });

    it('normalizes an exterior ring to CCW', () => {
      // CW square in GeoJSON space: [lng,lat] order would be
      // [0,0],[0,1],[1,1],[1,0] which is CW. In {lat,lng} that's:
      const cwSquare = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 0, lng: 1 }
      ];
      const result = normalizeWinding(cwSquare, false);
      expect(result).toHaveLength(4);
      // Should be reversed to CCW for exterior
      expect(result).not.toEqual(cwSquare);
      // Idempotent check: running normalizeWinding again should be stable
      const again = normalizeWinding(result, false);
      expect(again).toEqual(result);
    });

    it('normalizes a hole ring to CW', () => {
      // CCW square in GeoJSON space: [lng,lat] order would be
      // [0,0],[1,0],[1,1],[0,1] which is CCW. In {lat,lng} that's:
      const ccwSquare = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 }
      ];
      const result = normalizeWinding(ccwSquare, true);
      expect(result).toHaveLength(4);
      // Should be reversed to CW for hole
      expect(result).not.toEqual(ccwSquare);
      // Idempotent check
      const again = normalizeWinding(result, true);
      expect(again).toEqual(result);
    });

    it('is idempotent for already-correct exterior winding', () => {
      // CCW triangle (already correct for exterior)
      const ccwTriangle = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
        { lat: 0.5, lng: 1 }
      ];
      const result = normalizeWinding(ccwTriangle, false);
      const again = normalizeWinding(result, false);
      expect(again).toEqual(result);
    });
  });

  describe('checkSelfIntersections', () => {
    it('returns no intersection for null/empty input', () => {
      expect(checkSelfIntersections(null)).toEqual({
        hasSelfIntersection: false,
        kinkCount: 0,
        kinkPoints: []
      });
      expect(checkSelfIntersections([])).toEqual({
        hasSelfIntersection: false,
        kinkCount: 0,
        kinkPoints: []
      });
    });

    it('returns no intersection for a simple square', () => {
      const square = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 0, lng: 1 }
      ];
      const result = checkSelfIntersections(square);
      expect(result.hasSelfIntersection).toBe(false);
      expect(result.kinkCount).toBe(0);
      expect(result.kinkPoints).toEqual([]);
    });

    it('detects self-intersection in a bowtie shape', () => {
      // Bowtie: edges cross in the middle
      const bowtie = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 },
        { lat: 0, lng: 1 }
      ];
      const result = checkSelfIntersections(bowtie);
      expect(result.hasSelfIntersection).toBe(true);
      expect(result.kinkCount).toBeGreaterThan(0);
      expect(result.kinkPoints.length).toBeGreaterThan(0);
      // Each kink point should have lat and lng properties
      result.kinkPoints.forEach(point => {
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(typeof point.lat).toBe('number');
        expect(typeof point.lng).toBe('number');
      });
      // The intersection of a bowtie at (0,0)-(1,1) and (1,0)-(0,1) is at (0.5, 0.5)
      expect(result.kinkPoints[0].lat).toBeCloseTo(0.5, 5);
      expect(result.kinkPoints[0].lng).toBeCloseTo(0.5, 5);
    });

    it('returns no intersection for fewer than 4 points', () => {
      const triangle = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
        { lat: 0.5, lng: 1 }
      ];
      // A triangle can't self-intersect, and we skip check for < 4 points
      const result = checkSelfIntersections(triangle);
      expect(result.hasSelfIntersection).toBe(false);
      expect(result.kinkPoints).toEqual([]);
    });
  });

  describe('hasMinimumPoints', () => {
    it('returns false for null', () => {
      expect(hasMinimumPoints(null)).toBe(false);
    });

    it('returns false for 0 points', () => {
      expect(hasMinimumPoints([])).toBe(false);
    });

    it('returns false for 1 point', () => {
      expect(hasMinimumPoints([{ lat: 0, lng: 0 }])).toBe(false);
    });

    it('returns false for 2 points', () => {
      expect(
        hasMinimumPoints([
          { lat: 0, lng: 0 },
          { lat: 1, lng: 1 }
        ])
      ).toBe(false);
    });

    it('returns true for 3 points', () => {
      expect(
        hasMinimumPoints([
          { lat: 0, lng: 0 },
          { lat: 1, lng: 0 },
          { lat: 0.5, lng: 1 }
        ])
      ).toBe(true);
    });

    it('returns true for more than 3 points', () => {
      expect(
        hasMinimumPoints([
          { lat: 0, lng: 0 },
          { lat: 1, lng: 0 },
          { lat: 1, lng: 1 },
          { lat: 0, lng: 1 }
        ])
      ).toBe(true);
    });
  });

  describe('computeTotalArea', () => {
    it('returns 0 for null/empty layers', () => {
      expect(computeTotalArea(null)).toBe(0);
      expect(computeTotalArea([])).toBe(0);
    });

    it('returns 0 when all layers are holes', () => {
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: true
        }
      ];
      expect(computeTotalArea(layers)).toBe(0);
    });

    it('computes area for a single non-hole polygon', () => {
      // ~1 degree square near equator ≈ ~12,300 km²
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: false
        }
      ];
      const result = computeTotalArea(layers);
      expect(result).toBeGreaterThan(10000);
      expect(result).toBeLessThan(15000);
    });

    it('sums area of multiple non-hole polygons', () => {
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 2, lng: 2 },
            { lat: 3, lng: 2 },
            { lat: 3, lng: 3 },
            { lat: 2, lng: 3 }
          ],
          isHole: false
        }
      ];
      const result = computeTotalArea(layers);
      // Two ~1-degree squares ≈ ~24,600 km²
      expect(result).toBeGreaterThan(20000);
      expect(result).toBeLessThan(30000);
    });

    it('skips layers with fewer than 3 points gracefully', () => {
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 5, lng: 5 },
            { lat: 6, lng: 6 }
          ],
          isHole: false
        }
      ];
      const withDegenerate = computeTotalArea(layers);
      const withoutDegenerate = computeTotalArea([layers[0]]);
      // Degenerate layer should be skipped, not cause an error
      expect(withDegenerate).toBe(withoutDegenerate);
    });

    it('excludes holes from area computation', () => {
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 0.2, lng: 0.2 },
            { lat: 0.8, lng: 0.2 },
            { lat: 0.8, lng: 0.8 },
            { lat: 0.2, lng: 0.8 }
          ],
          isHole: true
        }
      ];
      const withHole = computeTotalArea(layers);
      const withoutHole = computeTotalArea([layers[0]]);
      // Hole should not affect the total (holes are excluded entirely)
      expect(withHole).toBe(withoutHole);
    });
  });

  describe('validatePolygon', () => {
    it('returns tooFewPoints=true for fewer than 3 vertices', () => {
      const result = validatePolygon([
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      ]);
      expect(result.tooFewPoints).toBe(true);
      // Should not check self-intersection when too few points
      expect(result.hasSelfIntersection).toBe(false);
      expect(result.kinkPoints).toEqual([]);
    });

    it('returns hasSelfIntersection=true for a bowtie', () => {
      const bowtie = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 1, lng: 0 },
        { lat: 0, lng: 1 }
      ];
      const result = validatePolygon(bowtie);
      expect(result.tooFewPoints).toBe(false);
      expect(result.hasSelfIntersection).toBe(true);
      expect(result.kinkPoints.length).toBeGreaterThan(0);
      // Verify kink point coordinates for the bowtie intersection
      expect(result.kinkPoints[0].lat).toBeCloseTo(0.5, 5);
      expect(result.kinkPoints[0].lng).toBeCloseTo(0.5, 5);
    });

    it('returns all false for a valid square', () => {
      const square = [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
        { lat: 1, lng: 1 },
        { lat: 0, lng: 1 }
      ];
      const result = validatePolygon(square);
      expect(result.tooFewPoints).toBe(false);
      expect(result.hasSelfIntersection).toBe(false);
      expect(result.kinkPoints).toEqual([]);
    });
  });

  describe('checkInterPolygonIntersections', () => {
    it('returns empty array for null/empty/single layer', () => {
      expect(checkInterPolygonIntersections(null)).toEqual([]);
      expect(checkInterPolygonIntersections([])).toEqual([]);
      expect(
        checkInterPolygonIntersections([
          {
            latlngs: [
              { lat: 0, lng: 0 },
              { lat: 1, lng: 0 },
              { lat: 1, lng: 1 },
              { lat: 0, lng: 1 }
            ],
            isHole: false
          }
        ])
      ).toEqual([]);
    });

    it('returns empty array for non-overlapping polygons', () => {
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 1, lng: 0 },
            { lat: 1, lng: 1 },
            { lat: 0, lng: 1 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 2, lng: 2 },
            { lat: 3, lng: 2 },
            { lat: 3, lng: 3 },
            { lat: 2, lng: 3 }
          ],
          isHole: false
        }
      ];
      expect(checkInterPolygonIntersections(layers)).toEqual([]);
    });

    it('detects intersections between crossing polygons', () => {
      // Two squares that overlap in the middle
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 2, lng: 0 },
            { lat: 2, lng: 2 },
            { lat: 0, lng: 2 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 1, lng: 1 },
            { lat: 3, lng: 1 },
            { lat: 3, lng: 3 },
            { lat: 1, lng: 3 }
          ],
          isHole: false
        }
      ];
      const result = checkInterPolygonIntersections(layers);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(point => {
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(typeof point.lat).toBe('number');
        expect(typeof point.lng).toBe('number');
      });
    });

    it('detects intersections even when one layer is a hole', () => {
      // Two overlapping polygons, one marked as hole — should still detect
      const layers = [
        {
          latlngs: [
            { lat: 0, lng: 0 },
            { lat: 2, lng: 0 },
            { lat: 2, lng: 2 },
            { lat: 0, lng: 2 }
          ],
          isHole: false
        },
        {
          latlngs: [
            { lat: 1, lng: 1 },
            { lat: 3, lng: 1 },
            { lat: 3, lng: 3 },
            { lat: 1, lng: 3 }
          ],
          isHole: true
        }
      ];
      const result = checkInterPolygonIntersections(layers);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
