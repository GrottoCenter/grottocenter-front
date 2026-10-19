import { act, renderHook } from '@testing-library/react';
import L from 'leaflet';
import useMarkers from './useMarkers';
import { getOrganizationMarker } from './Components/OrganizationMarker';

const state = vi.hoisted(() => ({ map: null }));
vi.mock('react-leaflet', () => ({ useMap: () => state.map }));
vi.mock('./useRenderPopup', async () => {
  const { renderToString } = await import('react-dom/server');
  return { default: () => renderToString };
});

const popupContent = record => <p>{record.name}</p>;
const record = {
  id: 42,
  name: 'Club',
  type: 'SPELEOLOGY',
  latitude: 45,
  longitude: 6
};
let element;
beforeEach(() => {
  element = document.createElement('div');
  document.body.appendChild(element);
  state.map = L.map(element).setView([45, 6], 13);
});
afterEach(() => {
  state.map.remove();
  element.remove();
});

it('updates same-ID organization pictograms, position and popup, and removes ineligible results', () => {
  const { result, unmount } = renderHook(() =>
    useMarkers({ icon: getOrganizationMarker, popupContent })
  );
  act(() => result.current([record]));
  expect(
    element.querySelector('[data-organization-type="SPELEOLOGY"]')
  ).not.toBeNull();
  act(() =>
    result.current([
      { ...record, type: 'CAVE_RESCUE', name: 'Rescue', latitude: 46 }
    ])
  );
  expect(
    element.querySelector('[data-organization-type="SPELEOLOGY"]')
  ).toBeNull();
  expect(
    element.querySelector('[data-organization-type="CAVE_RESCUE"]')
  ).not.toBeNull();
  const markers = [];
  state.map.eachLayer(layer => {
    if (layer instanceof L.Marker) markers.push(layer);
  });
  expect(markers).toHaveLength(1);
  expect(markers[0].getLatLng().lat).toBe(46);
  act(() => markers[0].openPopup());
  expect(element.querySelector('.leaflet-popup-content')).toHaveTextContent(
    'Rescue'
  );
  act(() => result.current([]));
  expect(element.querySelector('[data-organization-type]')).toBeNull();
  unmount();
});

it('preserves static marker identities for existing network callers', () => {
  const { result, unmount } = renderHook(() =>
    useMarkers({ icon: getOrganizationMarker(record) })
  );
  act(() => result.current([record]));
  const before = [];
  state.map.eachLayer(layer => before.push(layer));
  act(() => result.current([{ ...record, name: 'Updated' }]));
  const after = [];
  state.map.eachLayer(layer => after.push(layer));
  expect(after).toEqual(before);
  unmount();
});
