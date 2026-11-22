import { countMultiPolygonVertices } from '@/helpers/vertexCount';
import {
  analyzeSimplificationCurve,
  simplifyPolygon
} from './geometrySimplification';

it('preserves polygon boundaries and holes at zero tolerance without mutating the source', () => {
  const geometry = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0]
        ],
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
          [1, 1]
        ]
      ]
    ]
  };
  const original = structuredClone(geometry);
  expect(simplifyPolygon(geometry, 0)).toEqual(original);
  expect(geometry).toEqual(original);
});

it('calibrates a useful slider range for a dense closed geometry', () => {
  const ring = Array.from({ length: 720 }, (_point, index) => {
    const angle = (index / 720) * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  });
  ring.push(ring[0]);
  const geometry = { type: 'MultiPolygon', coordinates: [[ring]] };
  const rawCount = countMultiPolygonVertices(geometry.coordinates);
  const params = analyzeSimplificationCurve(geometry, rawCount);
  const reduced = simplifyPolygon(geometry, params.maxTolerance);
  const count = countMultiPolygonVertices(reduced.coordinates);
  expect(count).toBeLessThan(rawCount);
  expect(count).toBeLessThanOrEqual(500);
  expect(params.step).toBeGreaterThan(0);
  expect(params.step).toBeLessThan(params.maxTolerance);
  expect(params.minAchievableCount).toBeLessThanOrEqual(count);
});
