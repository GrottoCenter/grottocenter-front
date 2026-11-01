import {
  DOCUMENT_TYPE_ACCEPT,
  DocumentTypes
} from '@/utils/documentTypeHelpers';
import { validateAndBuildFileEntries } from './FileHelpers';

const formatMessage = ({ id }, values) => `${id}: ${values?.limit ?? ''}`;

describe('validateAndBuildFileEntries', () => {
  it('enforces the topographic extension restriction independently of browser MIME types', () => {
    const files = [
      new File(['model'], 'cave.GLB', { type: 'application/octet-stream' }),
      new File(['model'], 'cave.pdf', { type: 'application/pdf' }),
      new File(['model'], 'cave.zip', { type: 'application/zip' }),
      new File(['model'], 'cave.stl', { type: 'application/octet-stream' }),
      new File(['video'], 'cave.mp4', { type: 'video/mp4' })
    ];
    const result = validateAndBuildFileEntries(
      files,
      [],
      ({ id }, values) => `${id}: ${values.file}`,
      DOCUMENT_TYPE_ACCEPT[DocumentTypes.TOPOGRAPHIC_DATA].extensions
    );

    expect(result.entries.map(entry => entry.fileName)).toEqual([
      'cave.GLB',
      'cave.pdf',
      'cave.zip'
    ]);
    expect(result.errors).toEqual([
      'error on file type: cave.stl',
      'error on file type: cave.mp4'
    ]);
  });

  it('accepts a complete filename of 199 characters', () => {
    const file = { name: `${'a'.repeat(195)}.png` };

    expect(
      validateAndBuildFileEntries([file], [], formatMessage).entries
    ).toHaveLength(1);
  });

  it('accepts a complete filename of exactly 200 characters', () => {
    const file = { name: `${'a'.repeat(196)}.png` };
    const result = validateAndBuildFileEntries([file], [], formatMessage);

    expect(result.errors).toEqual([]);
    expect(result.entries).toHaveLength(1);
  });

  it('rejects a filename longer than 200 including its extension', () => {
    const file = { name: `${'a'.repeat(197)}.png` };
    const result = validateAndBuildFileEntries([file], [], formatMessage);

    expect(result.entries).toEqual([]);
    expect(result.errors).toEqual(['form.fileNameTooLong: 200']);
  });
});
