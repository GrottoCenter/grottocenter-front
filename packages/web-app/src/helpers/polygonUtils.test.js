import { isNeedlePolygon } from './polygonUtils';

// d3-polygon ships ESM which Jest can't parse without extra config.
// Mock it with a simple shoelace implementation so we test our logic,
// not d3's math. Jest hoists vi.mock() above imports automatically.
vi.mock('d3-polygon', () => ({
  polygonArea: coords => {
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i][0] * coords[j][1];
      area -= coords[j][0] * coords[i][1];
    }
    return area / 2; // signed
  },
  polygonLength: coords => {
    let len = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const dx = coords[j][0] - coords[i][0];
      const dy = coords[j][1] - coords[i][1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }
}));

describe('isNeedlePolygon', () => {
  it('returns true for 3 or fewer points', () => {
    expect(
      isNeedlePolygon([
        [0, 0],
        [1, 0],
        [2, 0]
      ])
    ).toBe(true);
  });

  it('returns true for a very thin sliver', () => {
    const sliver = [
      [0, 0],
      [100, 0],
      [100, 0.001],
      [0, 0.001]
    ];
    expect(isNeedlePolygon(sliver)).toBe(true);
  });

  it('returns false for a square', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ];
    expect(isNeedlePolygon(square)).toBe(false);
  });

  it('returns false for a regular-ish rectangle', () => {
    const rect = [
      [0, 0],
      [2, 0],
      [2, 1],
      [0, 1]
    ];
    expect(isNeedlePolygon(rect)).toBe(false);
  });

  it('returns true for a diagonal sliver', () => {
    const diagonalSliver = [
      [0, 0],
      [100, 100],
      [100.001, 100],
      [0.001, 0]
    ];
    expect(isNeedlePolygon(diagonalSliver)).toBe(true);
  });

  it('respects custom threshold', () => {
    const thinRect = [
      [0, 0],
      [10, 0],
      [10, 0.1],
      [0, 0.1]
    ];
    expect(isNeedlePolygon(thinRect, 0.05)).toBe(true);
    expect(isNeedlePolygon(thinRect, 0.0001)).toBe(false);
  });

  /**
   * A stream-corridor polygon (like the Wienbach nature reserve) spans a
   * significant geographic area but has a very high perimeter-to-area ratio
   * because it follows a narrow river valley.
   *
   * isNeedlePolygon correctly rejects it. When all polygons are rejected this
   * way, the import pipeline must surface a clear error to the user (not a
   * silent success) so they understand why nothing appeared on the map.
   */
  it('classifies a stream-corridor polygon as a needle', () => {
    // Approximate bounding box of Bachsystem des Wienbaches (Germany):
    // lon 6.91–7.04, lat 51.68–51.78. Spans ~14 km × ~11 km but the
    // polygon follows a narrow river valley, giving area ≈ 0.000043 deg²
    // and perimeter ≈ 0.748 deg, so ratio ≈ 0.000077 < 0.0001 threshold.
    // Modelled here as a very thin rectangle with the same isoperimetric
    // ratio: lat span 0.10°, lon width 0.00003° → ratio ≈ 0.000075.
    const streamCorridor = [
      [51.68, 6.91],
      [51.78, 6.91],
      [51.78, 6.91003],
      [51.68, 6.91003]
    ];
    expect(isNeedlePolygon(streamCorridor)).toBe(true);
  });
});
