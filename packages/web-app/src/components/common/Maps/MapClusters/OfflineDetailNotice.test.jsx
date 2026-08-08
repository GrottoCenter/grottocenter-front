import { shouldShowOfflineDetailNotice } from './OfflineDetailNotice';

// Layer ids as index.jsx passes them (layerTypes from DataControl). Hardcoded
// rather than imported: the predicate is layer-agnostic by design, so binding
// the test to the real ids would assert something it does not promise.
const ENTRANCES = 'entrances';
const NETWORKS = 'networks';
const ORGANIZATIONS = 'organizations';

// Offline, zoomed past MARKERS_LIMIT, entrances layer on, nothing drawn — the
// one situation the notice exists for. Each test below moves a single axis.
const emptyOfflineDetailView = {
  isOnline: false,
  isMarkersMode: true,
  visibleMarkers: [ENTRANCES],
  markerCounts: { [ENTRANCES]: 0, [NETWORKS]: 0, [ORGANIZATIONS]: 0 }
};

const show = overrides =>
  shouldShowOfflineDetailNotice({ ...emptyOfflineDetailView, ...overrides });

describe('shouldShowOfflineDetailNotice', () => {
  it('explains an empty map offline at detail zoom', () => {
    expect(show()).toBe(true);
  });

  it('stays silent online — an empty area is then simply empty', () => {
    expect(show({ isOnline: true })).toBe(false);
  });

  it('stays silent in cluster mode, drawn from the bulk fetch, not from tiles', () => {
    expect(show({ isMarkersMode: false })).toBe(false);
  });

  // The case flagged in review: an empty map the user emptied themselves must
  // not be blamed on the cache.
  it('stays silent when the user unticked every marker layer', () => {
    expect(show({ visibleMarkers: [] })).toBe(false);
  });

  it('stays silent as soon as one visible layer has markers', () => {
    expect(
      show({
        visibleMarkers: [ENTRANCES, NETWORKS],
        markerCounts: { [ENTRANCES]: 0, [NETWORKS]: 3, [ORGANIZATIONS]: 0 }
      })
    ).toBe(false);
  });

  it('is not suppressed by a hidden layer that holds data', () => {
    expect(
      show({
        visibleMarkers: [ENTRANCES],
        markerCounts: { [ENTRANCES]: 0, [NETWORKS]: 12, [ORGANIZATIONS]: 4 }
      })
    ).toBe(true);
  });

  // A layer added to MARKER_LAYERS later reaches the predicate before anyone
  // remembers to feed it a count — treat the unknown as empty, never as a crash.
  it('treats a layer missing from markerCounts as empty', () => {
    expect(show({ visibleMarkers: ['massifs'], markerCounts: {} })).toBe(true);
  });
});
