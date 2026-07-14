import { parseRopeLength, parseRopeLengths } from './ropeLength';

describe('parseRopeLength', () => {
  it('returns null for non-string or unparsable input', () => {
    expect(parseRopeLength(undefined)).toBeNull();
    expect(parseRopeLength(null)).toBeNull();
    expect(parseRopeLength(60)).toBeNull();
    expect(parseRopeLength('')).toBeNull();
    expect(parseRopeLength('-')).toBeNull();
    expect(parseRopeLength('en fixe')).toBeNull();
  });

  it('parses C-prefixed values', () => {
    expect(parseRopeLength('C60')).toBe(60);
    expect(parseRopeLength('c 25')).toBe(25);
    expect(parseRopeLength('(C10)')).toBe(10);
    expect(parseRopeLength('C60m')).toBe(60);
    expect(parseRopeLength('c 10m')).toBe(10);
  });

  it('parses bare number + m values', () => {
    expect(parseRopeLength('60m')).toBe(60);
    expect(parseRopeLength('10 m')).toBe(10);
    expect(parseRopeLength('25,5 m')).toBe(25.5);
  });

  it('does not parse ambiguous suffixes as rope length', () => {
    expect(parseRopeLength('2B')).toBeNull();
    expect(parseRopeLength('1S + 2S + 1AN')).toBeNull();
  });

  it('sums multiple values in one cell', () => {
    expect(parseRopeLength('C10 + C25')).toBe(35);
    expect(parseRopeLength('C10\nC25')).toBe(35);
  });

  it('handles decimal values with dot or comma', () => {
    expect(parseRopeLength('C12,5')).toBe(12.5);
    expect(parseRopeLength('C12.5')).toBe(12.5);
  });

  it('handles multiplicity notation', () => {
    expect(parseRopeLength('2xC30')).toBe(60);
    expect(parseRopeLength('2 x C30')).toBe(60);
    expect(parseRopeLength('2 C30')).toBe(60);
    expect(parseRopeLength('2XC30')).toBe(60);
    expect(parseRopeLength('3xC20 + C10')).toBe(70);
    expect(parseRopeLength('2 C30 + 2 C10')).toBe(80);
  });
});

describe('parseRopeLengths', () => {
  it('returns zeroed counters for invalid or empty input', () => {
    const empty = { total: 0, parsedCount: 0, unparsedCount: 0 };
    expect(parseRopeLengths(undefined)).toEqual(empty);
    expect(parseRopeLengths([])).toEqual(empty);
  });

  it('ignores empty and "no rope" cells', () => {
    expect(parseRopeLengths(['', '-', ' — ', '/', undefined])).toEqual({
      total: 0,
      parsedCount: 0,
      unparsedCount: 0
    });
  });

  it('sums parsable cells and counts unparsable ones', () => {
    expect(parseRopeLengths(['C60', '(C10)', 'en fixe', 'C20+C5'])).toEqual({
      total: 95,
      parsedCount: 3,
      unparsedCount: 1
    });
  });
});
