import { normalizeNumber } from './numberNormalizer';

describe('normalizeNumber', () => {
  describe('null / empty inputs', () => {
    it('returns null for an empty string', () => {
      expect(normalizeNumber('', 'en')).toBeNull();
    });

    it('returns null for a whitespace-only string', () => {
      expect(normalizeNumber('   ', 'en')).toBeNull();
    });

    it('returns null for a non-numeric string', () => {
      expect(normalizeNumber('abc', 'en')).toBeNull();
    });
  });

  describe("locale 'en' (dot decimal)", () => {
    it("parses '1,234.56' as 1234.56", () => {
      expect(normalizeNumber('1,234.56', 'en')).toBe(1234.56);
    });

    it('parses a plain integer string', () => {
      expect(normalizeNumber('42', 'en')).toBe(42);
    });

    it('parses a simple decimal string', () => {
      expect(normalizeNumber('3.14', 'en')).toBe(3.14);
    });
  });

  describe("locale 'fr' (comma decimal)", () => {
    it("parses '1.234,56' as 1234.56", () => {
      expect(normalizeNumber('1.234,56', 'fr')).toBe(1234.56);
    });

    it("parses '1 234,56' (space thousands separator) as 1234.56", () => {
      expect(normalizeNumber('1 234,56', 'fr')).toBe(1234.56);
    });

    it('parses a plain integer string', () => {
      expect(normalizeNumber('42', 'fr')).toBe(42);
    });

    it('parses a simple comma-decimal string', () => {
      expect(normalizeNumber('3,14', 'fr')).toBe(3.14);
    });
  });
});
