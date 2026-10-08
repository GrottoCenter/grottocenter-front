import { validateAndBuildFileEntries } from './FileHelpers';

const formatMessage = ({ id }, values) => `${id}: ${values?.limit ?? ''}`;

describe('validateAndBuildFileEntries', () => {
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
