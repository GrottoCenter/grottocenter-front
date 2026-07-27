import ccBy from '@/assets/icons/cc/cc-by.svg';
import ccBySa from '@/assets/icons/cc/cc-by-sa.svg';
import ccByNc from '@/assets/icons/cc/cc-by-nc.svg';
import ccByNd from '@/assets/icons/cc/cc-by-nd.svg';
import ccByNcSa from '@/assets/icons/cc/cc-by-nc-sa.svg';
import ccByNcNd from '@/assets/icons/cc/cc-by-nc-nd.svg';
import ccZero from '@/assets/icons/cc/cc-zero.svg';
import {
  parseCcClauses,
  getLicenseParts,
  NON_CC_DESCRIPTIONS
} from './helpers';

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

  it('returns null for null / undefined / empty inputs without throwing', () => {
    expect(parseCcClauses(null)).toBeNull();
    expect(parseCcClauses(undefined)).toBeNull();
    expect(parseCcClauses('')).toBeNull();
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
      name: 'ODC-BY',
      text: 'Open Data Commons Attribution',
      url: 'https://opendatacommons.org/licenses/by/'
    });
    expect(parts.isCc).toBe(false);
    expect(parts.badgeSrc).toBeUndefined();
    expect(parts.text).toBe('Open Data Commons Attribution');
    expect(parts.url).toBe('https://opendatacommons.org/licenses/by/');
  });

  it.each([
    ['ODBL', '/images/odbl.png'],
    ['Licence Ouverte', '/images/licence-ouverte.svg']
  ])('exposes the badge for non-CC license %s', (name, expected) => {
    const parts = getLicenseParts(name);
    expect(parts.isCc).toBe(false);
    expect(parts.badgeSrc).toBe(expected);
  });

  // Identity assertions (not just truthy): a copy-paste swap in CC_BADGES —
  // e.g. `'BY-SA': ccByNcNd` — would still produce a truthy badgeSrc, so the
  // previous `toBeTruthy` check missed obviously wrong icons.
  it.each([
    ['CC-BY', ccBy],
    ['CC-BY-SA', ccBySa],
    ['CC BY NC', ccByNc],
    ['CC BY ND', ccByNd],
    ['CC BY NC SA', ccByNcSa],
    ['CC-BY-NC-ND', ccByNcNd],
    ['CC0', ccZero],
    ['CC-0', ccZero],
    ['CC Zero', ccZero]
  ])('maps %s to the expected badge', (name, expected) => {
    expect(getLicenseParts(name).badgeSrc).toBe(expected);
  });

  // Bare "CC" (or "CC" plus only unknown clauses) still counts as a CC
  // license — clauses is `[]`, not null — so `isCc` stays true but no badge
  // matches the empty key. Pin this so a future refactor doesn't silently
  // change the contract.
  it('treats bare "CC" as CC with no badge', () => {
    const parts = getLicenseParts('CC');
    expect(parts.isCc).toBe(true);
    expect(parts.clauses).toEqual([]);
    expect(parts.badgeSrc).toBeUndefined();
  });

  it('handles empty / nullish licenses without throwing', () => {
    expect(getLicenseParts('').name).toBe('');
    expect(getLicenseParts(null).name).toBe('');
    expect(getLicenseParts(undefined).isCc).toBe(false);
  });
});

describe('NON_CC_DESCRIPTIONS', () => {
  // These keys mirror the license names the API returns for non-CC licenses;
  // LicenseTag.jsx looks them up by name. If any is renamed here without
  // updating the API contract (or vice versa) the tag falls back to raw text.
  it.each(['ODBL', 'ODC-BY', 'Licence Ouverte'])(
    'has a description for %s',
    key => {
      expect(NON_CC_DESCRIPTIONS[key]).toEqual(expect.any(String));
      expect(NON_CC_DESCRIPTIONS[key].length).toBeGreaterThan(0);
    }
  );
});
