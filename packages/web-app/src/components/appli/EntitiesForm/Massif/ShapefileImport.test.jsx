import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import ShapefileImport from './ShapefileImport';

const selection = vi.hoisted(() => ({ files: [] }));

vi.mock('@/components/common/FileSelectorInput', () => ({
  default: ({ onFilesAdd, onFileRemove, files }) => (
    <>
      <button type="button" onClick={() => onFilesAdd(selection.files)}>
        Choose file
      </button>
      <button type="button" onClick={onFileRemove}>
        Remove file
      </button>
      <output data-testid="selected-file">{files[0]?.fileName}</output>
    </>
  )
}));

const geometry = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ]
    ]
  ]
};

const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};

let workers;
beforeEach(() => {
  workers = [];
  selection.files = [];
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        workers.push(this);
      }
    }
  );
});
afterEach(() => vi.unstubAllGlobals());

const openImporter = async () => {
  const onImport = vi.fn();
  const result = render(
    <IntlProvider locale="en" messages={messages}>
      <ShapefileImport onImport={onImport} />
    </IntlProvider>
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Import geometry' })
  );
  return { ...result, onImport };
};

const choose = async (
  name,
  text = Promise.resolve(JSON.stringify(geometry))
) => {
  selection.files = [{ name, text: () => text }];
  await userEvent.click(screen.getByRole('button', { name: 'Choose file' }));
};

const respond = (
  worker,
  request = worker.postMessage.mock.lastCall[0],
  data = geometry
) => {
  act(() =>
    worker.onmessage({
      data: {
        requestId: request.requestId,
        simplifiedData: data,
        vertexCount: 4,
        ...(request.type === 'load' && {
          sliderParams: {
            maxTolerance: 0.01,
            step: 0.0001,
            minAchievableCount: 3
          }
        })
      }
    })
  );
};

const finishLoading = worker => {
  respond(worker);
  respond(worker);
};

it('ignores a file read that finishes after the dialog was closed and reopened', async () => {
  await openImporter();
  const read = deferred();
  await choose('old.geojson', read.promise);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await userEvent.click(
    await screen.findByRole('button', { name: 'Import geometry' })
  );
  await act(async () => read.resolve(JSON.stringify(geometry)));
  expect(screen.getByTestId('selected-file')).toBeEmptyDOMElement();
  expect(workers).toHaveLength(0);
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeDisabled();
});

it('does not replace a newer file with an older pending read', async () => {
  await openImporter();
  const read = deferred();
  await choose('old.geojson', read.promise);
  await choose('new.geojson');
  await waitFor(() => expect(workers).toHaveLength(1));
  finishLoading(workers[0]);
  await act(async () => read.resolve(JSON.stringify(geometry)));
  expect(screen.getByTestId('selected-file')).toHaveTextContent('new.geojson');
  expect(workers).toHaveLength(1);
});

it('terminates obsolete workers and ignores replies from a previous session', async () => {
  const { unmount } = await openImporter();
  await choose('first.geojson');
  await waitFor(() => expect(workers).toHaveLength(1));
  const oldWorker = workers[0];
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(oldWorker.terminate).toHaveBeenCalled();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Import geometry' })
  );
  await choose('second.geojson');
  await waitFor(() => expect(workers).toHaveLength(2));
  respond(oldWorker);
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeDisabled();
  finishLoading(workers[1]);
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeEnabled();
  unmount();
  expect(workers[1].terminate).toHaveBeenCalled();
});

it('imports only the current tolerance result, including a return to a previous tolerance', async () => {
  const { onImport } = await openImporter();
  await choose('geometry.geojson');
  await waitFor(() => expect(workers).toHaveLength(1));
  const worker = workers[0];
  finishLoading(worker);
  const oldRequest = worker.postMessage.mock.lastCall[0];
  const slider = screen.getByRole('slider', {
    name: 'Simplification Tolerance'
  });
  fireEvent.change(slider, { target: { value: '0.002' } });
  respond(worker, oldRequest);
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeDisabled();
  await waitFor(() =>
    expect(worker.postMessage.mock.lastCall[0].tolerance).toBe(0.002)
  );
  respond(worker);
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeEnabled();
  fireEvent.change(slider, { target: { value: '0.003' } });
  fireEvent.change(slider, { target: { value: '0.002' } });
  await waitFor(() =>
    expect(worker.postMessage.mock.calls.length).toBeGreaterThan(3)
  );
  respond(worker);
  await userEvent.click(
    screen.getByRole('button', { name: 'Import', exact: true })
  );
  await waitFor(() =>
    expect(onImport).toHaveBeenCalledExactlyOnceWith(geometry)
  );
});

it('exposes a worker failure and leaves cancellation available', async () => {
  await openImporter();
  await choose('geometry.geojson');
  await waitFor(() => expect(workers).toHaveLength(1));
  act(() => workers[0].onerror(new Error('Worker failed')));
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to parse file');
  expect(screen.queryByRole('slider')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Import', exact: true })
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  expect(workers[0].terminate).toHaveBeenCalled();
});
