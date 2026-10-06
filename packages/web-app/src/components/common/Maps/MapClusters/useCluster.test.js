import { renderHook } from '@testing-library/react';

import useCluster from './useCluster';

const WORLD_BOUNDS = [-180, -85, 180, 85];

describe('useCluster', () => {
  it('returns no index until coordinates arrive and handles an empty array', () => {
    const { result, rerender } = renderHook(
      ({ points }) => useCluster(points),
      { initialProps: { points: null } }
    );

    expect(result.current).toBeNull();

    rerender({ points: [] });
    expect(result.current.getClusters(WORLD_BOUNDS, 0)).toEqual([]);
  });

  it('clusters close points at map zoom and returns leaves above maxZoom 16', () => {
    const points = [
      [0, 0],
      [0.0001, 0.0001],
      [100, 45]
    ];
    const { result } = renderHook(() => useCluster(points));

    for (const zoom of [12, 13]) {
      const features = result.current.getClusters(WORLD_BOUNDS, zoom);
      const cluster = features.find(feature => feature.properties.cluster);

      expect(features).toHaveLength(2);
      expect(cluster.properties.point_count).toBe(2);
      expect(
        result.current.getClusterExpansionZoom(cluster.id)
      ).toBeGreaterThan(zoom);
      expect(
        features.find(feature => !feature.properties.cluster).properties
      ).toMatchObject({ pointId: 2 });
    }

    const leaves = result.current.getClusters(WORLD_BOUNDS, 17);
    expect(leaves).toHaveLength(3);
    expect(leaves.every(feature => !feature.properties.cluster)).toBe(true);
    expect(leaves.map(feature => feature.properties.pointId).sort()).toEqual([
      0, 1, 2
    ]);
  });

  it('indexes all points in a larger dataset without losing their ids', () => {
    const points = Array.from({ length: 2000 }, (_, index) => [
      (index % 100) * 0.01,
      Math.floor(index / 100) * 0.01
    ]);
    const { result } = renderHook(() => useCluster(points));

    const clusters = result.current.getClusters(WORLD_BOUNDS, 0);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].properties.point_count).toBe(points.length);

    const leaves = result.current.getClusters(WORLD_BOUNDS, 17);
    expect(leaves).toHaveLength(points.length);
    expect(
      new Set(leaves.map(feature => feature.properties.pointId)).size
    ).toBe(points.length);
  });

  it('reuses the index for unchanged data and rebuilds it for new data', () => {
    const points = [[0, 0]];
    const { result, rerender } = renderHook(({ data }) => useCluster(data), {
      initialProps: { data: points }
    });
    const first = result.current;

    rerender({ data: points });
    expect(result.current).toBe(first);

    rerender({ data: [...points, [1, 1]] });
    expect(result.current).not.toBe(first);
    expect(result.current.getClusters(WORLD_BOUNDS, 17)).toHaveLength(2);
  });
});
