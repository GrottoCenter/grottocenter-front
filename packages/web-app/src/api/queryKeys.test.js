import {
  caveKeys,
  countryKeys,
  documentKeys,
  entranceKeys,
  massifKeys,
  massifPreviewKeys,
  organizationKeys,
  personKeys
} from './queryKeys';

describe('entity detail query keys', () => {
  it.each([
    ['document', documentKeys],
    ['massif', massifKeys],
    ['cave', caveKeys],
    ['entrance', entranceKeys],
    ['person', personKeys],
    ['organization', organizationKeys],
    ['country', countryKeys]
  ])('normalizes numeric and string %s ids to the same key', (_name, keys) => {
    expect(keys.detail(42)).toEqual(keys.detail('42'));
  });

  it('keeps document detail options after the normalized id', () => {
    expect(documentKeys.detail(42, true)).toEqual([
      'document',
      'detail',
      '42',
      true
    ]);
  });

  it('normalizes massif preview ids', () => {
    expect(massifPreviewKeys.sensitive(42)).toEqual(
      massifPreviewKeys.sensitive('42')
    );
  });
});
