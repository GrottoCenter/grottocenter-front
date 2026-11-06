import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import L from 'leaflet';
import useMarkers from './useMarkers';
import {
  getOrganizationMarker,
  shouldReplaceOrganizationMarker
} from './Components/OrganizationMarker';
import {
  PointMarker,
  shouldReplacePointMarker
} from './Components/PointMarker';
import { PointPopup } from './Components/PointPopup';

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
    useMarkers({
      icon: getOrganizationMarker,
      popupContent,
      shouldReplaceMarker: shouldReplaceOrganizationMarker
    })
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

it.each([
  ['a static icon', getOrganizationMarker(record)],
  ['an icon factory', getOrganizationMarker]
])(
  'preserves marker identities without a replacement rule for %s',
  (_label, icon) => {
    const { result, unmount } = renderHook(() => useMarkers({ icon }));
    act(() => result.current([record]));
    const before = [];
    state.map.eachLayer(layer => before.push(layer));
    act(() => result.current([{ ...record, name: 'Updated' }]));
    const after = [];
    state.map.eachLayer(layer => after.push(layer));
    expect(after).toEqual(before);
    unmount();
  }
);

it('retains an unchanged organization marker and its open popup', () => {
  const { result } = renderHook(() =>
    useMarkers({
      icon: getOrganizationMarker,
      popupContent,
      shouldReplaceMarker: shouldReplaceOrganizationMarker
    })
  );
  act(() => result.current([record]));
  const markers = [];
  state.map.eachLayer(layer => markers.push(layer));
  act(() => markers[0].openPopup());
  const popup = markers[0].getPopup();
  act(() => result.current([{ ...record }]));
  expect(markers[0].getPopup()).toBe(popup);
  expect(markers[0].isPopupOpen()).toBe(true);
});

it('retains repeated point tiles but updates a moved or renamed point and its popup', () => {
  const point = {
    id: 6,
    label: 'Surface station',
    latitude: 45,
    longitude: 6,
    city: 'Original city'
  };
  const { result } = renderHook(() =>
    useMarkers({
      icon: PointMarker,
      popupContent: value => (
        <MemoryRouter>
          <PointPopup point={value} />
        </MemoryRouter>
      ),
      shouldReplaceMarker: shouldReplacePointMarker
    })
  );
  act(() => result.current([point]));
  const markers = [];
  state.map.eachLayer(layer => markers.push(layer));
  act(() => markers[0].openPopup());
  const popup = markers[0].getPopup();
  act(() => result.current([{ ...point }]));
  expect(markers[0].getPopup()).toBe(popup);
  expect(markers[0].isPopupOpen()).toBe(true);
  act(() =>
    result.current([
      { ...point, label: 'Moved station', latitude: 46, city: 'New city' }
    ])
  );
  expect(state.map.hasLayer(markers[0])).toBe(false);
  const updated = [];
  state.map.eachLayer(layer => {
    if (layer instanceof L.Marker) updated.push(layer);
  });
  expect(updated).toHaveLength(1);
  expect(updated[0].getLatLng().lat).toBe(46);
  act(() => updated[0].openPopup());
  expect(element.querySelector('.leaflet-popup-content')).toHaveTextContent(
    'Moved station'
  );
  expect(element.querySelector('.leaflet-popup-content')).toHaveTextContent(
    'New city'
  );
});
