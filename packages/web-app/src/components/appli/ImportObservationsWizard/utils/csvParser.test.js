import Papa from 'papaparse';
import { parseFile } from './csvParser';

vi.mock('papaparse');

describe('parseFile', () => {
  beforeEach(() => {
    Papa.parse.mockReset();
  });

  it('calls PapaParse with header:false, skipEmptyLines:false, and the provided encoding', () => {
    // Arrange: make Papa.parse invoke complete immediately so the promise resolves
    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: [] });
    });

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    parseFile(file, 'UTF-8');

    expect(Papa.parse).toHaveBeenCalledTimes(1);
    const [calledFile, calledOptions] = Papa.parse.mock.calls[0];
    expect(calledFile).toBe(file);
    expect(calledOptions).toMatchObject({
      header: false,
      skipEmptyLines: false,
      encoding: 'UTF-8'
    });
  });

  it('forwards the encoding argument to PapaParse', () => {
    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: [] });
    });

    const file = new File(['a'], 'test.csv');
    parseFile(file, 'windows-1252');

    expect(Papa.parse.mock.calls[0][1].encoding).toBe('windows-1252');
  });

  it('resolves with the data array returned by PapaParse', async () => {
    const expectedData = [
      ['2024-01-01', '23.5'],
      ['2024-01-02', '24.0']
    ];
    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: expectedData });
    });

    const file = new File(['dummy'], 'test.csv');
    const result = await parseFile(file, 'UTF-8');

    expect(result).toBe(expectedData);
  });

  it('resolves with an empty array when PapaParse returns no data', async () => {
    Papa.parse.mockImplementation((file, options) => {
      options.complete({ data: [] });
    });

    const file = new File([''], 'empty.csv');
    const result = await parseFile(file, 'UTF-8');

    expect(result).toEqual([]);
  });

  it('rejects when PapaParse calls the error callback', async () => {
    const parseError = new Error('Parse failure');
    Papa.parse.mockImplementation((file, options) => {
      options.error(parseError);
    });

    const file = new File(['bad data'], 'bad.csv');
    await expect(parseFile(file, 'UTF-8')).rejects.toBe(parseError);
  });
});
