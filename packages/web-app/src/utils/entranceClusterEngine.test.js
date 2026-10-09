import { createEntranceClusterEngine } from './entranceClusterEngine';
import {
  DEFAULT_ENTRANCE_FILTERS,
  DEFAULT_QUALITY_FILTERS
} from './entranceMapFilters';

const WORLD = [-180, -85, 180, 85];
const filters = {
  sizes: DEFAULT_ENTRANCE_FILTERS,
  qualities: DEFAULT_QUALITY_FILTERS,
  minInterest: 0
};
const coordinates = [
  [5.5, 45.5, 1, 0, null],
  [5.5001, 45.5001, 2, 40, 4.9],
  [5.5002, 45.5002, 3, 70, 7.5]
];

describe('entrance cluster engine', () => {
  it('rebuilds counts and expansion from filtered points without resending data', () => {
    const engine = createEntranceClusterEngine();
    engine({ type: 'build', revision: 1, data: coordinates, filters });
    const all = engine({
      type: 'clusters',
      revision: 1,
      bounds: WORLD,
      zoom: 10
    });
    expect(all.result).toHaveLength(1);
    expect(all.result[0].properties.point_count).toBe(3);
    const expansion = engine({
      type: 'expansion',
      revision: 1,
      clusterId: all.result[0].properties.cluster_id
    });
    expect(expansion.result).toBe(13);

    engine({
      type: 'build',
      revision: 2,
      filters: { ...filters, minInterest: 5 }
    });
    const selected = engine({
      type: 'clusters',
      revision: 2,
      bounds: WORLD,
      zoom: 10
    });
    expect(selected.result[0].properties.point_count).toBe(2);
    const leaves = engine({
      type: 'clusters',
      revision: 2,
      bounds: WORLD,
      zoom: 13
    });
    expect(leaves.result.map(feature => feature.properties.pointId)).toEqual([
      1, 2
    ]);
    leaves.result.forEach(feature => {
      const expected = coordinates[feature.properties.pointId];
      expect(feature.geometry.coordinates[0]).toBeCloseTo(expected[0], 10);
      expect(feature.geometry.coordinates[1]).toBeCloseTo(expected[1], 10);
    });
    expect(
      engine({ type: 'clusters', revision: 1, bounds: WORLD, zoom: 10 }).result
    ).toBeNull();
  });

  it('handles an empty selection and restores every point after reset', () => {
    const engine = createEntranceClusterEngine();
    engine({
      type: 'build',
      revision: 1,
      data: coordinates,
      filters: {
        ...filters,
        sizes: { small: false, medium: false, large: false }
      }
    });
    expect(
      engine({ type: 'clusters', revision: 1, bounds: WORLD, zoom: 0 }).result
    ).toEqual([]);
    engine({ type: 'build', revision: 2, filters });
    expect(
      engine({ type: 'clusters', revision: 2, bounds: WORLD, zoom: 0 })
        .result[0].properties.point_count
    ).toBe(3);
  });

  it('keeps legacy pairs unfiltered, including mixed legacy/enriched datasets', () => {
    const engine = createEntranceClusterEngine();
    const legacy = [[5.5, 45.5], coordinates[1]];
    engine({
      type: 'build',
      revision: 1,
      data: legacy,
      filters: { ...filters, minInterest: 10 }
    });
    expect(
      engine({ type: 'clusters', revision: 1, bounds: WORLD, zoom: 0 })
        .result[0].properties.point_count
    ).toBe(2);
  });
});
