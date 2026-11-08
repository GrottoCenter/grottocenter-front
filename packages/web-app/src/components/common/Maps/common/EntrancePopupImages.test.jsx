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
import EntrancePopupImages from './EntrancePopupImages';

const state = vi.hoisted(() => ({ map: null }));
vi.mock('react-leaflet', async () => {
  const { useEffect } = await import('react');
  return {
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
  document.body.appendChild(element);
  state.map = L.map(element).setView([45, 6], 13);
});
afterEach(() => {
  cleanup();
  state.map.remove();
  element.remove();
});

const mount = () =>
  renderWithProviders(
    <MemoryRouter>
      <EntrancePopupImages />
    </MemoryRouter>
  );
const open = id => {
  const popup = L.popup()
    .setLatLng([45, 6])
    .setContent(
      `<div data-entrance-popup-image="${id}"></div><a href="/ui/entrances/${id}">Entrance ${id}</a>`
    );
  act(() => popup.openOn(state.map));
  return popup;
};

it('only fetches an opened entrance and shares the detail cache with its page', async () => {
  apiGet.mockResolvedValue({ id: 1, name: 'Cave', featuredFile: file });
  const { queryClient } = mount();
  expect(apiGet).not.toHaveBeenCalled();
  const popup = open(1);
  const image = await screen.findByAltText('Cave');
  expect(image).toHaveAttribute('src', '/small.webp');
  expect(image.closest('a')).toHaveAttribute('href', '/ui/entrances/1');
  expect(
    queryClient.getQueryData(entranceKeys.detail('1')).featuredFile.id
  ).toBe(10);
  act(() => popup.remove());
  open(1);
  await screen.findByAltText('Cave');
  expect(apiGet).toHaveBeenCalledTimes(1);
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
  await screen.findByAltText('Second');
  await act(async () =>
    resolveFirst({ id: 1, name: 'First', featuredFile: file })
  );
  expect(screen.queryByAltText('First')).toBeNull();
  expect(screen.getByAltText('Second')).toBeVisible();
  act(() => second.remove());
  expect(element.querySelector('.leaflet-popup')).toBeNull();
  expect(apiGet).toHaveBeenCalledTimes(2);
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
