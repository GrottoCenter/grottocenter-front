import { buildFormData } from './utils';

const entries = formData => Array.from(formData.entries());

describe('buildFormData', () => {
  it('flattens nested objects with bracket notation', () => {
    const formData = new FormData();
    buildFormData(formData, { title: 'Cave map', editor: { id: 12 } });

    expect(entries(formData)).toEqual([
      ['title', 'Cave map'],
      ['editor[id]', '12']
    ]);
  });

  it('indexes array items', () => {
    const formData = new FormData();
    buildFormData(formData, { authors: [{ id: 3 }, { id: 7 }] });

    expect(entries(formData)).toEqual([
      ['authors[0][id]', '3'],
      ['authors[1][id]', '7']
    ]);
  });

  // FormData cannot express an empty array: without the sentinel the key would
  // be missing altogether and the API would keep the existing associations.
  it('sends the "[]" sentinel for an empty array', () => {
    const formData = new FormData();
    buildFormData(formData, { authors: [], subjects: [], iso3166: [] });

    expect(entries(formData)).toEqual([
      ['authors', '[]'],
      ['subjects', '[]'],
      ['iso3166', '[]']
    ]);
  });

  it('does not send a sentinel when the root value is an empty array', () => {
    const formData = new FormData();
    buildFormData(formData, []);

    expect(entries(formData)).toEqual([]);
  });

  it('omits null and undefined values but keeps empty strings', () => {
    const formData = new FormData();
    buildFormData(formData, {
      pages: null,
      issue: undefined,
      identifier: ''
    });

    expect(entries(formData)).toEqual([['identifier', '']]);
  });

  it('appends File values as-is', () => {
    const formData = new FormData();
    const file = new File(['topo'], 'topo.png', { type: 'image/png' });
    buildFormData(formData, { file });

    const [[key, value]] = entries(formData);
    expect(key).toBe('file');
    expect(value).toBeInstanceOf(File);
    expect(value.name).toBe('topo.png');
  });

  it('appends Date values as their string representation instead of iterating them', () => {
    const formData = new FormData();
    const datePublication = new Date('2024-01-01T00:00:00.000Z');
    buildFormData(formData, { datePublication });

    const [[key, value]] = entries(formData);
    expect(key).toBe('datePublication');
    expect(value).toBe(datePublication.toString());
  });

  it('appends nested data under the given parent key', () => {
    const formData = new FormData();
    buildFormData(formData, { id: 4, fileName: 'a.png' }, 'deletedFiles[0]');

    expect(entries(formData)).toEqual([
      ['deletedFiles[0][id]', '4'],
      ['deletedFiles[0][fileName]', 'a.png']
    ]);
  });
});
