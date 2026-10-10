import { act, render, waitFor } from '@testing-library/react';

import ClusterLayer from './ClusterLayer';

const { map, markers, events } = vi.hoisted(() => ({
  map: {
    getBounds: () => ({
      getWest: () => -180,
      getSouth: () => -85,
      getEast: () => 180,
      getNorth: () => 85
    }),
    getZoom: () => 8,
    getMaxZoom: () => 18,
    fire: vi.fn(),
    flyTo: vi.fn()
  },
  markers: [],
  events: new Map()
}));

vi.mock('react-leaflet', () => ({
  useMap: () => map,
  useMapEvent: (name, callback) => events.set(name, callback)
}));
vi.mock('leaflet', () => ({
  default: {
    divIcon: options => options,
    marker: (position, options) => {
      const handlers = new Map();
      const marker = {
        position,
        options,
        remove: vi.fn(),
        setIcon: vi.fn(),
        addTo: vi.fn(),
        on: (event, callback) => handlers.set(event, callback),
        click: () => handlers.get('click')()
      };
      markers.push(marker);
      return marker;
    }
  }
}));

const feature = (lng, count = 3, clusterId = 18) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lng, 45] },
  properties: { cluster: true, cluster_id: clusterId, point_count: count }
});
const source = lng => ({
  getClusters: vi.fn().mockResolvedValue([feature(lng)]),
  getClusterExpansionZoom: vi.fn().mockResolvedValue(12)
});

describe('ClusterLayer asynchronous indexes', () => {
  beforeEach(() => {
    markers.length = 0;
    events.clear();
    vi.clearAllMocks();
  });

  it('renews positions and click handlers when cluster ids repeat in a new index', async () => {
    const first = source(5);
    const second = source(10);
    const { rerender } = render(
      <ClusterLayer data={[]} type="entrance" clusterSource={first} />
    );
    await waitFor(() => expect(markers).toHaveLength(1));
    rerender(<ClusterLayer data={[]} type="entrance" clusterSource={second} />);
    await waitFor(() => expect(markers).toHaveLength(2));
    expect(markers[0].remove).toHaveBeenCalledTimes(1);
    expect(markers[1].position).toEqual([45, 10]);
    await act(() => markers[1].click());
    expect(second.getClusterExpansionZoom).toHaveBeenCalledWith(18);
    expect(first.getClusterExpansionZoom).not.toHaveBeenCalled();
    expect(map.flyTo).toHaveBeenCalledWith([45, 10], 14, { duration: 0.6 });
  });

  it('ignores an old viewport/index response arriving after its replacement', async () => {
    let resolveFirst;
    const old = {
      ...source(5),
      getClusters: () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    };
    const { rerender } = render(
      <ClusterLayer data={[]} type="entrance" clusterSource={old} />
    );
    rerender(
      <ClusterLayer data={[]} type="entrance" clusterSource={source(10)} />
    );
    await waitFor(() => expect(markers).toHaveLength(1));
    await act(async () => resolveFirst([feature(5)]));
    expect(markers).toHaveLength(1);
    expect(markers[0].position).toEqual([45, 10]);
  });

  it('ignores an older viewport response within the same index', async () => {
    const replies = [];
    const current = {
      ...source(5),
      getClusters: () =>
        new Promise(resolve => {
          replies.push(resolve);
        })
    };
    render(<ClusterLayer data={[]} type="entrance" clusterSource={current} />);
    act(() => {
      events.get('moveend')();
    });
    await act(async () => replies[1]([feature(10, 3, 19)]));
    expect(markers).toHaveLength(1);
    await act(async () => replies[0]([feature(5, 3, 18)]));
    expect(markers).toHaveLength(1);
    expect(markers[0].remove).not.toHaveBeenCalled();
    expect(markers[0].position).toEqual([45, 10]);
  });

  it('ignores replies after hiding the layer or unmounting', async () => {
    let resolveQuery;
    const pending = {
      ...source(5),
      getClusters: () =>
        new Promise(resolve => {
          resolveQuery = resolve;
        })
    };
    const { rerender, unmount } = render(
      <ClusterLayer data={[]} type="entrance" clusterSource={pending} />
    );
    rerender(
      <ClusterLayer
        data={[]}
        type="entrance"
        clusterSource={pending}
        enabled={false}
      />
    );
    await act(async () => resolveQuery([feature(5)]));
    expect(markers).toHaveLength(0);
    rerender(
      <ClusterLayer data={[]} type="entrance" clusterSource={pending} />
    );
    unmount();
    await act(async () => resolveQuery([feature(5)]));
    expect(markers).toHaveLength(0);
  });

  it('ignores a pending expansion click after the index is replaced', async () => {
    let resolveExpansion;
    const first = {
      ...source(5),
      getClusterExpansionZoom: () =>
        new Promise(resolve => {
          resolveExpansion = resolve;
        })
    };
    const { rerender } = render(
      <ClusterLayer data={[]} type="entrance" clusterSource={first} />
    );
    await waitFor(() => expect(markers).toHaveLength(1));
    const click = markers[0].click();
    rerender(
      <ClusterLayer data={[]} type="entrance" clusterSource={source(10)} />
    );
    await act(async () => {
      resolveExpansion(12);
      await click;
    });
    expect(map.flyTo).not.toHaveBeenCalled();
  });
});
