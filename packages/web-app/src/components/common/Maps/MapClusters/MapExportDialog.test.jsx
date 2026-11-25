import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor
} from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import MapExportDialog from './MapExportDialog';

const { downloadBlob, enqueueSnackbar } = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  enqueueSnackbar: vi.fn()
}));
vi.mock('@/utils/download', () => ({ downloadBlob }));
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar, closeSnackbar: vi.fn() }),
  enqueueSnackbar
}));

const selection = { south: -0.1, west: -0.1, north: 0.1, east: 0.1 };
const gpx =
  '<gpx xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="0" lon="0"><name>Grotte</name><link href="https://grottocenter.org/ui/entrances/1" /></wpt></gpx>';
const response = (data, status = 200) => ({
  status,
  headers: new Headers(),
  json: async () => data,
  blob: async () => ({ text: async () => data })
});
let fetchMock;
beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn(async () => response(gpx));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const show = (onClose = vi.fn()) =>
  renderWithProviders(
    <MapExportDialog selection={selection} onClose={onClose} />,
    { messages }
  );
const download = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));

it('explains ignored filters and makes no preview request before download', () => {
  show();
  expect(screen.getByRole('note')).toHaveTextContent(
    messages['mapExport.scope']
  );
  expect(screen.getByRole('radio', { name: /GPX/ })).toBeChecked();
  expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('calls export directly with geographic bounds and downloads the validated file', async () => {
  const close = vi.fn();
  show(close);
  download();
  await waitFor(() => expect(downloadBlob).toHaveBeenCalledOnce());
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, options] = fetchMock.mock.calls[0];
  expect(String(url)).toContain('/advanced-search/export?format=gpx');
  expect(JSON.parse(options.body)).toEqual({
    entity: 'entrances',
    query: '*',
    matchAllFields: true,
    filter: {
      latitude: [-0.1, 0.1],
      longitude: [-0.1, 0.1],
      isSensitive: false
    },
    columns: ['name']
  });
  expect(downloadBlob.mock.calls[0][1]).toMatch(
    /^Grottocenter_map_export_.*\.gpx$/
  );
  expect(close).toHaveBeenCalledOnce();
  expect(enqueueSnackbar).toHaveBeenCalledWith(
    'Download started.',
    expect.anything()
  );
});

it('downloads hundreds of entrances with a constant-size request and no ID list', async () => {
  const features = Array.from({ length: 500 }, (_, id) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      name: `Cave ${id}`,
      grottocenterUrl: `https://grottocenter.org/ui/entrances/${id + 1}`
    }
  }));
  fetchMock.mockResolvedValue(
    response(JSON.stringify({ type: 'FeatureCollection', features }))
  );
  show();
  fireEvent.click(screen.getByRole('radio', { name: /GeoJSON/ }));
  download();
  await waitFor(() => expect(downloadBlob).toHaveBeenCalledOnce());
  expect(fetchMock.mock.calls[0][1].body.length).toBeLessThan(400);
  expect(fetchMock).toHaveBeenCalledOnce();
});

it('explains an empty area without saving an empty file', async () => {
  fetchMock.mockResolvedValue(response('<gpx/>'));
  show();
  download();
  await screen.findByText(messages['mapExport.empty']);
  expect(downloadBlob).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
});

it.each(['message', 'error'])(
  'recognizes the server limit in body.%s and asks to zoom',
  async key => {
    fetchMock.mockResolvedValue(
      response(
        {
          [key]:
            'To be exported a search cannot contain more than 10000 results'
        },
        400
      )
    );
    show();
    download();
    await screen.findByText(/This area contains more than 10,000 entrances/);
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  }
);

it('retries a failed export without losing the format choice', async () => {
  fetchMock.mockResolvedValue(response({ message: 'Unavailable' }, 500));
  show();
  fireEvent.click(screen.getByRole('radio', { name: /KML/ }));
  download();
  await screen.findByText(messages['mapExport.error']);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(String(fetchMock.mock.calls[1][0])).toContain('format=kml');
  expect(screen.getByRole('radio', { name: /KML/ })).toBeChecked();
});

it('rejects an incomplete streamed export', async () => {
  fetchMock.mockResolvedValue(response(gpx.slice(0, -5)));
  show();
  download();
  await screen.findByText(messages['mapExport.invalidFile']);
  expect(downloadBlob).not.toHaveBeenCalled();
});

it('aborts on cancel and ignores a response arriving after cancellation', async () => {
  let resolve;
  fetchMock.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  const close = vi.fn();
  show(close);
  download();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => resolve(response(gpx)));
  expect(close).toHaveBeenCalledOnce();
  expect(downloadBlob).not.toHaveBeenCalled();
});

it('disables export offline without fetching', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  show();
  expect(screen.getByText(messages['mapExport.offline'])).toBeVisible();
  expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('explains a rate limit inline without automatic retries', async () => {
  fetchMock.mockResolvedValue(response({}, 429));
  show();
  download();
  await screen.findByText(messages['Too many requests']);
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(downloadBlob).not.toHaveBeenCalled();
});
