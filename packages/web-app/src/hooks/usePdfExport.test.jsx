import { act, renderHook, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { createPdfMap, fetchPdfResource } from '@/pdf/shared/resources';
import { getPdfBrand } from '@/pdf/shared/brand';
import { usePdfExport } from './usePdfExport';

vi.mock('@/pdf/shared/resources', () => ({
  createPdfMap: vi.fn(),
  fetchPdfResource: vi.fn()
}));
vi.mock('@/pdf/shared/brand', () => ({ getPdfBrand: vi.fn() }));

const workers = [];
const request = {
  model: { labels: { Map: 'Map' } },
  files: [],
  format: 'a4',
  mapZoom: 14
};
const theme = createTheme({ palette: { primary: { main: '#123456' } } });
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

beforeEach(() => {
  workers.length = 0;
  getPdfBrand.mockResolvedValue({
    colors: { primary: theme.palette.primary.main }
  });
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
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('keeps working on progress messages until the final PDF arrives', async () => {
  const { result } = renderHook(usePdfExport);
  let pending;
  act(() => {
    pending = result.current.generate(request);
  });
  await waitFor(() => expect(workers).toHaveLength(1));
  act(() =>
    workers[0].onmessage({ data: { progress: 'General information' } })
  );
  expect(result.current.progress).toBe('General information');
  expect(result.current.isGenerating).toBe(true);
  await act(async () => {
    workers[0].onmessage({ data: { bytes: new Uint8Array([37, 80, 68, 70]) } });
    expect(await pending).toBeInstanceOf(Blob);
  });
});

it('stops an unresponsive worker and allows another attempt', async () => {
  vi.useFakeTimers();
  const { result } = renderHook(usePdfExport);
  let pending;
  await act(async () => {
    pending = result.current.generate(request);
  });
  expect(workers).toHaveLength(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(120000);
    expect(await pending).toBeNull();
  });
  expect(workers[0].terminate).toHaveBeenCalled();
  expect(result.current.isGenerating).toBe(false);
  expect(result.current.error.id).toBe('pdf.exportError');
});

it('allows downloads beyond two minutes before starting the rendering timeout', async () => {
  vi.useFakeTimers();
  let completeDownload;
  fetchPdfResource.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        completeDownload = resolve;
      })
  );
  const { result } = renderHook(usePdfExport);
  let pending;
  await act(async () => {
    pending = result.current.generate({
      ...request,
      files: [{ fileName: 'survey.pdf', url: 'https://example.org/survey.pdf' }]
    });
  });
  await act(async () => vi.advanceTimersByTimeAsync(150000));
  expect(result.current.isGenerating).toBe(true);
  expect(result.current.error).toBeNull();
  expect(workers).toHaveLength(0);
  expect(fetchPdfResource.mock.calls.at(-1)[1].aborted).toBe(false);
  await act(async () => completeDownload(new ArrayBuffer(8)));
  expect(workers).toHaveLength(1);
  await act(async () => {
    workers[0].onmessage({ data: { bytes: new Uint8Array([37, 80, 68, 70]) } });
    expect(await pending).toBeInstanceOf(Blob);
  });
});

it('returns the generated Blob directly and uses the active theme', async () => {
  const { result } = renderHook(usePdfExport, { wrapper: Wrapper });
  let pending;
  act(() => {
    pending = result.current.generate(request);
  });
  await waitFor(() => expect(workers).toHaveLength(1));
  let blob;
  await act(async () => {
    workers[0].onmessage({ data: { bytes: new Uint8Array([37, 80, 68, 70]) } });
    blob = await pending;
  });
  expect(blob.type).toBe('application/pdf');
  expect(getPdfBrand).toHaveBeenCalledWith(
    expect.any(AbortSignal),
    theme.palette
  );
  expect(
    workers[0].postMessage.mock.calls[0][0].model.brand.colors.primary
  ).toBe('#123456');
  expect(result.current).not.toHaveProperty('result');
});

it('terminates cancelled workers and ignores a late response from an obsolete job', async () => {
  const { result } = renderHook(usePdfExport);
  let oldJob;
  act(() => {
    oldJob = result.current.generate(request);
  });
  await waitFor(() => expect(workers).toHaveLength(1));
  act(() => result.current.cancel());
  let newJob;
  act(() => {
    newJob = result.current.generate(request);
  });
  await waitFor(() => expect(workers).toHaveLength(2));
  await act(async () => {
    workers[0].onmessage({ data: { bytes: new Uint8Array([1]) } });
    expect(await oldJob).toBeNull();
  });
  expect(result.current.isGenerating).toBe(true);
  await act(async () => {
    workers[1].onmessage({ data: { bytes: new Uint8Array([2]) } });
    expect(await newJob).toBeInstanceOf(Blob);
  });
  expect(workers[0].terminate).toHaveBeenCalled();
});

it('fetches shared inline and full-page images once and transfers their buffer only once', async () => {
  fetchPdfResource.mockResolvedValueOnce(new ArrayBuffer(8));
  const file = {
    key: 'original',
    fileName: 'photo.png',
    url: 'https://example.org/photo.png'
  };
  const inlineFile = { ...file, key: 'inline' };
  const { result } = renderHook(usePdfExport);
  let pending;
  act(() => {
    pending = result.current.generate({
      ...request,
      files: [file],
      model: { ...request.model, inlineDocuments: [{ files: [inlineFile] }] }
    });
  });
  await waitFor(() => expect(workers).toHaveLength(1));
  const [data, transfers] = workers[0].postMessage.mock.calls[0];
  expect(fetchPdfResource).toHaveBeenCalledTimes(1);
  expect(transfers).toHaveLength(1);
  expect(data.attachments[0].bytes).toBe(data.inlineImages[0].bytes);
  await act(async () => {
    workers[0].onmessage({ data: { bytes: new Uint8Array([37, 80, 68, 70]) } });
    await pending;
  });
});

it('does not start a worker after cancellation during brand preparation', async () => {
  let resolveBrand;
  getPdfBrand.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveBrand = resolve;
      })
  );
  const { result } = renderHook(usePdfExport);
  let pending;
  act(() => {
    pending = result.current.generate(request);
  });
  act(() => result.current.cancel());
  await act(async () => {
    resolveBrand({ colors: {} });
    expect(await pending).toBeNull();
  });
  expect(workers).toHaveLength(0);
});

it('does not silently omit a failed original or map', async () => {
  const { result } = renderHook(usePdfExport);
  fetchPdfResource.mockRejectedValueOnce(new Error('CORS'));
  await act(() =>
    result.current.generate({
      ...request,
      files: [{ fileName: 'survey.pdf', url: 'https://example.org/survey.pdf' }]
    })
  );
  expect(result.current.error).toEqual({
    id: 'pdf.exportError',
    resource: 'survey.pdf'
  });
  createPdfMap.mockRejectedValueOnce(new Error('Missing tile'));
  await act(() =>
    result.current.generate({
      ...request,
      model: { ...request.model, coordinates: { latitude: 0, longitude: 0 } }
    })
  );
  expect(result.current.error).toEqual({
    id: 'pdf.exportError',
    resource: 'Map'
  });
  expect(workers).toHaveLength(0);
});
