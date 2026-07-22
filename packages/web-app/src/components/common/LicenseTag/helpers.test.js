import { parseCcClauses, getLicenseParts } from './helpers';

describe('parseCcClauses', () => {
  it('parses CC licenses in both API spellings (dashes and spaces)', () => {
    expect(parseCcClauses('CC-BY')).toEqual(['BY']);
    expect(parseCcClauses('CC-BY-SA')).toEqual(['BY', 'SA']);
    expect(parseCcClauses('CC BY NC')).toEqual(['BY', 'NC']);
    expect(parseCcClauses('CC BY ND')).toEqual(['BY', 'ND']);
    expect(parseCcClauses('CC BY NC SA')).toEqual(['BY', 'NC', 'SA']);
    expect(parseCcClauses('CC-BY-NC-ND')).toEqual(['BY', 'NC', 'ND']);
  });

  it('treats CC0 / Zero as the ZERO clause', () => {
    expect(parseCcClauses('CC0')).toEqual(['ZERO']);
    expect(parseCcClauses('CC-0')).toEqual(['ZERO']);
    expect(parseCcClauses('CC Zero')).toEqual(['ZERO']);
  });

  it('returns null for non-CC licenses, including ODC-BY (contains BY but is not CC)', () => {
    expect(parseCcClauses('ODBL')).toBeNull();
    expect(parseCcClauses('ODC-BY')).toBeNull();
    expect(parseCcClauses('Licence Ouverte')).toBeNull();
  });
});

describe('getLicenseParts', () => {
  it('accepts a bare name string', () => {
    const parts = getLicenseParts('CC-BY-SA');
    expect(parts.name).toBe('CC-BY-SA');
    expect(parts.isCc).toBe(true);
    expect(parts.badgeSrc).toBeTruthy();
    expect(parts.url).toBeUndefined();
  });

  it('accepts a full license object and exposes text/url', () => {
    const parts = getLicenseParts({
      name: 'ODBL',
      text: 'Open Database License',
      url: 'https://opendatacommons.org/licenses/odbl/'
    });
    expect(parts.isCc).toBe(false);
    expect(parts.badgeSrc).toBeUndefined();
    expect(parts.text).toBe('Open Database License');
    expect(parts.url).toBe('https://opendatacommons.org/licenses/odbl/');
  });

  it('gives every CC license (incl. CC0) a badge', () => {
    ['CC-BY', 'CC-BY-SA', 'CC BY NC', 'CC BY ND', 'CC BY NC SA', 'CC-BY-NC-ND', 'CC0'].forEach(
      name => expect(getLicenseParts(name).badgeSrc).toBeTruthy()
    );
  });

  it('handles empty / nullish licenses without throwing', () => {
    expect(getLicenseParts('').name).toBe('');
    expect(getLicenseParts(null).name).toBe('');
    expect(getLicenseParts(undefined).isCc).toBe(false);
  });
});
