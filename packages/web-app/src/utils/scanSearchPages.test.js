import { scanSearchPages } from './scanSearchPages';

const makeOptions = extra => ({
  signal: new AbortController().signal,
  onProgress: vi.fn(),
  incompleteMessage: 'Incomplete',
  ...extra
});

it('continues after cached pages and reports the complete scan', async () => {
  const options = makeOptions({
    initialPages: [{ results: [{ id: 1 }], totalResults: 2 }],
    getPage: vi
      .fn()
      .mockResolvedValue({ results: [{ id: 2 }], totalResults: 2 })
  });
  expect(await scanSearchPages(options)).toEqual([{ id: 1 }, { id: 2 }]);
  expect(options.getPage).toHaveBeenCalledWith({
    pageParam: 2,
    signal: options.signal
  });
  expect(options.onProgress).toHaveBeenLastCalledWith({ loaded: 2, total: 2 });
});

it.each([
  { results: [], totalResults: 2 },
  { results: [{ id: 1 }], totalResults: 2 },
  { results: [{ id: 2 }], totalResults: 3 },
  { results: null, totalResults: 2 }
])('rejects incomplete or shifted person pages: %j', async lastPage => {
  const options = makeOptions({
    requireUniqueIds: true,
    getPage: vi
      .fn()
      .mockResolvedValueOnce({ results: [{ id: 1 }], totalResults: 2 })
      .mockResolvedValueOnce(lastPage)
  });
  await expect(scanSearchPages(options)).rejects.toThrow('Incomplete');
});

it('does not request the next page after cancellation', async () => {
  const controller = new AbortController();
  const getPage = vi.fn().mockImplementation(async () => {
    controller.abort();
    return { results: [{ id: 1 }], totalResults: 2 };
  });
  await expect(
    scanSearchPages(makeOptions({ signal: controller.signal, getPage }))
  ).rejects.toThrow();
  expect(getPage).toHaveBeenCalledTimes(1);
});

it('accepts a genuinely empty catalog', async () => {
  expect(
    await scanSearchPages(
      makeOptions({
        getPage: vi.fn().mockResolvedValue({ results: [], totalResults: 0 })
      })
    )
  ).toEqual([]);
});
