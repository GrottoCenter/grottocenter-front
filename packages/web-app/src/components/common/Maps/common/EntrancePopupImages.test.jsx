import {
  act,
  cleanup,
  screen,
  waitFor,
  fireEvent
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import L from 'leaflet';
import renderWithProviders from '@/test/renderWithProviders';
import { entranceKeys } from '@/api/queryKeys';
import { apiGet } from '@/api/client';
import { getEntranceUrl } from '@/conf/apiRoutes';
import { createMapPopup } from '@/utils/mapPopup';
import EntrancePopupImages from './EntrancePopupImages';

const state = vi.hoisted(() => ({ map: null }));
vi.mock('react-leaflet', async () => {
  const { useEffect } = await import('react');
  return {
    useMap: () => state.map,
    useMapEvents: handlers => {
      useEffect(() => {
        state.map.on(handlers);
        return () => state.map.off(handlers);
      }, [handlers]);
      return state.map;
    }
  };
});
vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

const file = {
  id: 10,
  fileName: 'entrance.jpg',
  completePath: '/original.jpg',
  thumbnails: { small: '/small.webp' }
};
let element;
beforeEach(() => {
  vi.clearAllMocks();
  element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: 390 },
    clientHeight: { configurable: true, value: 640 }
  });
  document.body.appendChild(element);
  state.map = L.map(element).setView([45, 6], 13);
});
afterEach(() => {
  cleanup();
  state.map.remove();
  element.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const mount = () =>
  renderWithProviders(
    <MemoryRouter>
      <EntrancePopupImages />
    </MemoryRouter>
  );
const open = id => {
  const popup = createMapPopup(
    `<div class="map-popup-entrance" data-testid="entrance-popup"><div data-entrance-popup-image="${id}"></div><div class="map-popup-details"><a href="/ui/entrances/${id}">Entrance ${id}</a></div></div>`,
    state.map
  ).setLatLng([45, 6]);
  act(() => popup.openOn(state.map));
  return popup;
};

it('does not prepare an unrelated popup whose text mentions the image attribute', () => {
  mount();
  const content = '<p>Organization data-entrance-popup-image=1</p>';
  const popup = createMapPopup(content, state.map).setLatLng([45, 6]);
  act(() => popup.openOn(state.map));
  expect(popup.options.autoPan).toBe(true);
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(popup.getContent()).toBe(content);
  expect(apiGet).not.toHaveBeenCalled();
});

it('leaves entrance popups usable on a map without an image manager', () => {
  const popup = open(1);
  expect(popup.options.autoPan).toBe(true);
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(popup.getElement()).not.toHaveAttribute(
    'data-entrance-popup-preparing'
  );
  expect(screen.getByText('Entrance 1')).toBeVisible();
  expect(apiGet).not.toHaveBeenCalled();
});

it('unregisters the map when its image manager unmounts', () => {
  const { unmount } = mount();
  unmount();
  const popup = open(1);
  expect(popup.options.autoPan).toBe(true);
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(screen.getByText('Entrance 1')).toBeVisible();
});

it('keeps autopan disabled until the final image is decoded, then reveals once', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Portrait', featuredFile: file });
  mount();
  const popup = open(1);
  const image = await screen.findByAltText('Portrait');
  const update = vi.spyOn(popup, 'update');
  let resolveDecode;
  image.decode = () =>
    new Promise(resolve => {
      resolveDecode = resolve;
    });
  Object.defineProperties(image, {
    naturalWidth: { value: 320 },
    naturalHeight: { value: 640 }
  });
  fireEvent.load(image);
  expect(popup.options.autoPan).toBe(false);
  expect(popup.getElement()).toHaveAttribute('aria-busy', 'true');
  expect(update).not.toHaveBeenCalled();

  await act(async () => resolveDecode());
  expect(update).toHaveBeenCalledTimes(1);
  expect(popup.options.autoPan).toBe(true);
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(screen.getByTestId('entrance-popup')).toHaveAttribute(
    'data-photo-layout',
    'side'
  );

  // Cached metadata still goes through preparation on the next opening.
  act(() => popup.remove());
  act(() => popup.openOn(state.map));
  expect(popup.options.autoPan).toBe(false);
  expect(popup.getElement()).toHaveAttribute('aria-busy', 'true');
});

it('reveals text at the deadline and upgrades once when late metadata and image arrive', async () => {
  vi.useFakeTimers();
  let resolveMetadata;
  apiGet.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveMetadata = resolve;
      })
  );
  mount();
  const popup = open(1);
  expect(popup.options.autoPan).toBe(false);
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(popup.options.autoPan).toBe(true);
  const update = vi.spyOn(popup, 'update');
  const panBy = vi.spyOn(state.map, 'panBy').mockReturnValue(state.map);
  Object.defineProperty(popup.getElement(), 'offsetHeight', { value: 900 });

  await act(async () => {
    resolveMetadata({ id: 1, name: 'Late', featuredFile: file });
    await vi.advanceTimersByTimeAsync(1);
  });
  const image = screen.getByAltText('Late');
  expect(image).not.toBeVisible();
  expect(screen.getByText('Entrance 1')).toBeVisible();
  expect(update).not.toHaveBeenCalled();
  Object.defineProperties(image, {
    naturalWidth: { value: 640 },
    naturalHeight: { value: 320 }
  });
  fireEvent.load(image);
  expect(image).toBeVisible();
  expect(update).toHaveBeenCalledTimes(1);
  expect(panBy).toHaveBeenCalledTimes(1);
  fireEvent.load(image);
  expect(update).toHaveBeenCalledTimes(1);
});

it.each(['dragstart', 'movestart'])(
  'does not pan for a late photo after %s following the text deadline',
  async event => {
    const { queryClient } = mount();
    queryClient.setQueryData(entranceKeys.detail(1), {
      id: 1,
      name: 'Cached',
      featuredFile: file
    });
    vi.useFakeTimers();
    const popup = open(1);
    const image = screen.getByAltText('Cached');
    let resolveDecode;
    image.decode = () =>
      new Promise(resolve => {
        resolveDecode = resolve;
      });
    Object.defineProperties(image, {
      naturalWidth: { value: 640 },
      naturalHeight: { value: 320 }
    });
    fireEvent.load(image);
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText('Entrance 1')).toBeVisible();
    expect(image).not.toBeVisible();
    const panBy = vi.spyOn(state.map, 'panBy').mockReturnValue(state.map);
    const update = vi.spyOn(popup, 'update');
    // Force a popup that would need autopan even in JSDOM's zero-size layout.
    Object.defineProperty(popup.getElement(), 'offsetHeight', { value: 900 });
    const pane = state.map.getPane('mapPane');
    act(() => {
      state.map.fire(event);
      pane.classList.add('leaflet-pan-anim');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
      resolveDecode();
    });
    expect(image).toBeVisible();
    expect(update).toHaveBeenCalledTimes(1);
    expect(popup.options.autoPan).toBe(false);
    expect(panBy).not.toHaveBeenCalled();
    act(() => {
      pane.classList.remove('leaflet-pan-anim');
      state.map.fire('moveend');
      state.map.fire('resize');
    });
    expect(popup.options.autoPan).toBe(false);
    expect(panBy).not.toHaveBeenCalled();

    // A new opening gets its normal preparation and autopan back.
    act(() => popup.remove());
    act(() => popup.openOn(state.map));
    const reopenedImage = screen.getByAltText('Cached');
    Object.defineProperties(reopenedImage, {
      naturalWidth: { value: 640 },
      naturalHeight: { value: 320 }
    });
    fireEvent.load(reopenedImage);
    expect(popup.options.autoPan).toBe(true);
    expect(panBy).toHaveBeenCalledTimes(1);
  }
);

it('keeps loading off-layout after the deadline and upgrades when decoding finishes', async () => {
  const { queryClient } = mount();
  queryClient.setQueryData(entranceKeys.detail(1), {
    id: 1,
    name: 'Cached',
    featuredFile: file
  });
  vi.useFakeTimers();
  const popup = open(1);
  const image = screen.getByAltText('Cached');
  let resolveDecode;
  image.decode = () =>
    new Promise(resolve => {
      resolveDecode = resolve;
    });
  Object.defineProperties(image, {
    naturalWidth: { value: 640 },
    naturalHeight: { value: 320 }
  });
  fireEvent.load(image);
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(image).not.toBeVisible();
  expect(image.closest('a')).not.toHaveClass('map-popup-photo');
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  const update = vi.spyOn(popup, 'update');
  await act(async () => resolveDecode());
  expect(update).toHaveBeenCalledTimes(1);
  expect(image).toBeVisible();
});

it('cancels deferred fallback autopan after a drag and still displays the photo', async () => {
  const { queryClient } = mount();
  queryClient.setQueryData(entranceKeys.detail(1), {
    id: 1,
    name: 'Cached',
    featuredFile: file
  });
  vi.useFakeTimers();
  const popup = open(1);
  const pane = state.map.getPane('mapPane');
  const image = screen.getByAltText('Cached');
  Object.defineProperties(image, {
    naturalWidth: { value: 640 },
    naturalHeight: { value: 320 }
  });
  Object.defineProperty(popup.getElement(), 'offsetHeight', { value: 900 });
  const panBy = vi.spyOn(state.map, 'panBy').mockReturnValue(state.map);
  pane.classList.add('leaflet-pan-anim');
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  expect(popup.options.autoPan).toBe(false);
  act(() => {
    state.map.fire('dragstart');
    pane.classList.remove('leaflet-pan-anim');
    state.map.fire('moveend');
  });
  expect(panBy).not.toHaveBeenCalled();
  fireEvent.load(image);
  expect(image).toBeVisible();
  expect(popup.options.autoPan).toBe(false);
  expect(panBy).not.toHaveBeenCalled();
});

it('does not mistake deferred fallback autopan for moving the map away', async () => {
  const { queryClient } = mount();
  queryClient.setQueryData(entranceKeys.detail(1), {
    id: 1,
    name: 'Cached',
    featuredFile: file
  });
  vi.useFakeTimers();
  const popup = open(1);
  const pane = state.map.getPane('mapPane');
  const image = screen.getByAltText('Cached');
  Object.defineProperties(image, {
    naturalWidth: { value: 640 },
    naturalHeight: { value: 320 }
  });
  Object.defineProperty(popup.getElement(), 'offsetHeight', { value: 900 });
  const panBy = vi.spyOn(state.map, 'panBy').mockImplementation(() => {
    state.map.fire('movestart');
    return state.map;
  });
  pane.classList.add('leaflet-pan-anim');
  await act(async () => vi.advanceTimersByTimeAsync(2000));
  act(() => {
    pane.classList.remove('leaflet-pan-anim');
    state.map.fire('moveend');
  });
  expect(panBy).toHaveBeenCalledTimes(1);
  fireEvent.load(image);
  expect(image).toBeVisible();
  expect(popup.options.autoPan).toBe(true);
  expect(panBy).toHaveBeenCalledTimes(2);
});

it('closes a preparing popup when its manager unmounts', () => {
  apiGet.mockImplementation(() => new Promise(() => {}));
  const { unmount } = mount();
  const popup = open(1);
  unmount();
  expect(popup.isOpen()).toBe(false);
});

it('only fetches an opened entrance image and reuses its separate cache', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Cave', featuredFile: file });
  const { queryClient } = mount();
  expect(apiGet).not.toHaveBeenCalled();
  const popup = open(1);
  const image = await screen.findByAltText('Cave');
  expect(image).toHaveAttribute('src', '/small.webp');
  expect(image.closest('a')).toHaveAttribute('href', '/ui/entrances/1');
  expect(apiGet).toHaveBeenCalledWith(`${getEntranceUrl}1/featured-image`);
  expect(queryClient.getQueryData(entranceKeys.detail('1'))).toBeUndefined();
  expect(
    queryClient.getQueryData(entranceKeys.featuredImage('1')).featuredFile.id
  ).toBe(10);
  act(() => popup.remove());
  open(1);
  await screen.findByAltText('Cave');
  expect(apiGet).toHaveBeenCalledTimes(1);
});

it('adapts portraits to the map width and remeasures the open popup after loading and resizing', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Portrait', featuredFile: file });
  mount();
  const popup = open(1);
  const image = await screen.findByAltText('Portrait');
  const update = vi.spyOn(popup, 'update');
  Object.defineProperties(image, {
    naturalWidth: { value: 320 },
    naturalHeight: { value: 640 }
  });
  fireEvent.load(image);
  expect(screen.getByTestId('entrance-popup')).toHaveAttribute(
    'data-photo-layout',
    'side'
  );
  expect(update).toHaveBeenCalled();
  update.mockClear();

  Object.defineProperty(element, 'clientWidth', { value: 320 });
  act(() => state.map.invalidateSize({ animate: false }));
  expect(screen.getByTestId('entrance-popup')).toHaveAttribute(
    'data-photo-layout',
    'top'
  );
  expect(popup.getElement().style.getPropertyValue('--map-popup-width')).toBe(
    '272px'
  );
  expect(update).toHaveBeenCalled();
  expect(screen.getByText('Entrance 1')).toBeVisible();
  expect(image).toBeVisible();

  // Closing restores the lazy content; resize must not reopen or update it.
  act(() => popup.remove());
  expect(popup.options.maxHeight).toBeNull();
  update.mockClear();
  Object.defineProperty(element, 'clientWidth', { value: 390 });
  act(() => state.map.invalidateSize({ animate: false }));
  expect(update).not.toHaveBeenCalled();
  expect(popup.isOpen()).toBe(false);
});

it.each([
  [640, 320],
  [320, 320]
])('keeps a %s × %s image above the information', async (width, height) => {
  apiGet.mockResolvedValue({ id: 1, name: 'Landscape', featuredFile: file });
  mount();
  open(1);
  const image = await screen.findByAltText('Landscape');
  Object.defineProperties(image, {
    naturalWidth: { value: width },
    naturalHeight: { value: height }
  });
  fireEvent.load(image);
  expect(screen.getByTestId('entrance-popup')).toHaveAttribute(
    'data-photo-layout',
    'top'
  );
});

it('measures during an ongoing pan and waits for moveend before enabling autopan', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Landscape', featuredFile: file });
  mount();
  const popup = open(1);
  const image = await screen.findByAltText('Landscape');
  const update = vi.spyOn(popup, 'update');
  const pane = state.map.getPane('mapPane');
  pane.classList.add('leaflet-pan-anim');
  Object.defineProperties(image, {
    naturalWidth: { value: 640 },
    naturalHeight: { value: 320 }
  });
  fireEvent.load(image);
  expect(update).toHaveBeenCalledTimes(1);
  expect(popup.options.autoPan).toBe(false);
  expect(popup.getElement()).not.toHaveAttribute('aria-busy');
  update.mockClear();
  act(() => {
    pane.classList.remove('leaflet-pan-anim');
    state.map.fire('moveend');
  });
  expect(update).toHaveBeenCalledTimes(1);
  expect(popup.options.autoPan).toBe(true);
  expect(image).toBeVisible();
});

it('reserves space for map controls even when the entrance has no photo', async () => {
  Object.defineProperty(element, 'clientWidth', { value: 320 });
  state.map.invalidateSize({ animate: false });
  const controls = element.querySelector('.leaflet-top.leaflet-right');
  controls.getBoundingClientRect = () => ({ width: 42 });
  apiGet.mockResolvedValue({ id: 1, name: 'No photo', featuredFile: null });
  mount();
  const popup = open(1);
  await waitFor(() =>
    expect(popup.getElement()).not.toHaveAttribute('aria-busy')
  );
  expect(popup.getElement().style.getPropertyValue('--map-popup-width')).toBe(
    '230px'
  );
  expect(popup.options.autoPanPaddingBottomRight.x).toBe(47);
  expect(screen.getByText('Entrance 1')).toBeVisible();
  expect(element.querySelector('img')).toBeNull();
  act(() => popup.remove());
  expect(popup.options.autoPanPaddingBottomRight).toBeNull();
});

it('does not fetch a fresh cached entrance and removes a photo when both URLs fail', async () => {
  const { queryClient } = mount();
  queryClient.setQueryData(entranceKeys.detail(1), {
    id: 1,
    name: 'Cached',
    featuredFile: file
  });
  open(1);
  const image = await screen.findByAltText('Cached');
  expect(apiGet).not.toHaveBeenCalled();
  fireEvent.error(image);
  expect(image).toHaveAttribute('src', '/original.jpg');
  expect(image).not.toHaveAttribute('srcset');
  fireEvent.error(image);
  expect(screen.queryByAltText('Cached')).toBeNull();
  expect(screen.getByText('Entrance 1')).toBeVisible();
});

it('remeasures the text layout if a displayed image becomes unavailable', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Portrait', featuredFile: file });
  mount();
  const popup = open(1);
  const image = await screen.findByAltText('Portrait');
  Object.defineProperties(image, {
    naturalWidth: { value: 320 },
    naturalHeight: { value: 640 }
  });
  fireEvent.load(image);
  const update = vi.spyOn(popup, 'update');
  // A new responsive candidate can fail after an earlier one was displayed.
  fireEvent.error(image);
  fireEvent.error(image);
  expect(screen.queryByTestId('entrance-popup-photo')).toBeNull();
  expect(update).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Entrance 1')).toBeVisible();
});

it('ignores late responses after switching or closing popups', async () => {
  let resolveFirst;
  apiGet.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveFirst = resolve;
      })
  );
  apiGet.mockResolvedValueOnce({
    id: 2,
    name: 'Second',
    featuredFile: { ...file, id: 20 }
  });
  mount();
  open(1);
  const second = open(2);
  const image = await screen.findByAltText('Second');
  Object.defineProperties(image, {
    naturalWidth: { value: 320 },
    naturalHeight: { value: 640 }
  });
  fireEvent.load(image);
  await act(async () =>
    resolveFirst({ id: 1, name: 'First', featuredFile: file })
  );
  expect(screen.queryByAltText('First')).toBeNull();
  expect(screen.getByAltText('Second')).toBeVisible();
  act(() => second.remove());
  expect(element.querySelector('.leaflet-popup')).toBeNull();
  expect(apiGet).toHaveBeenCalledTimes(2);
});

it('does not restore a closed popup when its request finishes', async () => {
  let resolveRequest;
  apiGet.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRequest = resolve;
      })
  );
  mount();
  const popup = open(1);
  act(() => popup.remove());
  await act(async () =>
    resolveRequest({ id: 1, name: 'Closed', featuredFile: file })
  );
  expect(screen.queryByAltText('Closed')).toBeNull();
  expect(popup.isOpen()).toBe(false);
  expect(element.querySelector('.leaflet-popup')).toBeNull();
});

it.each([null, new Error('offline')])(
  'keeps the text popup usable without a photo: %s',
  async result => {
    if (result instanceof Error) apiGet.mockRejectedValue(result);
    else apiGet.mockResolvedValue({ id: 1, featuredFile: null });
    mount();
    open(1);
    await waitFor(() => expect(apiGet).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Entrance 1')).toBeVisible();
    expect(element.querySelector('img')).toBeNull();
  }
);
