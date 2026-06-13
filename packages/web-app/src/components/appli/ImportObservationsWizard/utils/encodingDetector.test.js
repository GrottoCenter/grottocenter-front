import { detectEncoding } from './encodingDetector';

describe('detectEncoding', () => {
  describe('UTF-8 BOM (EF BB BF)', () => {
    it('returns UTF-8 when bytes start with UTF-8 BOM', () => {
      const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      expect(detectEncoding(bytes)).toBe('UTF-8');
    });

    it('returns UTF-8 for a buffer that is exactly the UTF-8 BOM with no trailing bytes', () => {
      const bytes = new Uint8Array([0xef, 0xbb, 0xbf]);
      expect(detectEncoding(bytes)).toBe('UTF-8');
    });
  });

  describe('UTF-16 LE BOM (FF FE)', () => {
    it('returns UTF-16 when bytes start with UTF-16 LE BOM', () => {
      const bytes = new Uint8Array([0xff, 0xfe, 0x48, 0x00, 0x65, 0x00]);
      expect(detectEncoding(bytes)).toBe('UTF-16');
    });

    it('returns UTF-16 for a buffer that is exactly the UTF-16 LE BOM', () => {
      const bytes = new Uint8Array([0xff, 0xfe]);
      expect(detectEncoding(bytes)).toBe('UTF-16');
    });
  });

  describe('UTF-16 BE BOM (FE FF)', () => {
    it('returns UTF-16 when bytes start with UTF-16 BE BOM', () => {
      const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0x65]);
      expect(detectEncoding(bytes)).toBe('UTF-16');
    });

    it('returns UTF-16 for a buffer that is exactly the UTF-16 BE BOM', () => {
      const bytes = new Uint8Array([0xfe, 0xff]);
      expect(detectEncoding(bytes)).toBe('UTF-16');
    });
  });

  describe('clean UTF-8 bytes (no BOM, no invalid sequences)', () => {
    it('returns UTF-8 for plain ASCII bytes', () => {
      // "Hello, World!" encoded as ASCII/UTF-8
      const bytes = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64,
        0x21
      ]);
      expect(detectEncoding(bytes)).toBe('UTF-8');
    });

    it('returns UTF-8 for valid 2-byte UTF-8 sequences (e.g. é)', () => {
      // 'é' is 0xC3 0xA9 in UTF-8
      const bytes = new Uint8Array([0xc3, 0xa9]);
      expect(detectEncoding(bytes)).toBe('UTF-8');
    });

    it('returns UTF-8 for valid 3-byte UTF-8 sequences (e.g. €)', () => {
      // '€' is 0xE2 0x82 0xAC in UTF-8
      const bytes = new Uint8Array([0xe2, 0x82, 0xac]);
      expect(detectEncoding(bytes)).toBe('UTF-8');
    });

    it('returns UTF-8 for an empty byte array', () => {
      expect(detectEncoding(new Uint8Array([]))).toBe('UTF-8');
    });

    it('returns UTF-8 for null/undefined input', () => {
      expect(detectEncoding(null)).toBe('UTF-8');
      expect(detectEncoding(undefined)).toBe('UTF-8');
    });
  });

  describe('bytes with invalid UTF-8 sequences', () => {
    it('returns windows-1252 when an isolated continuation byte is present', () => {
      // 0x80 is a continuation byte with no preceding lead byte — invalid UTF-8
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x80]);
      expect(detectEncoding(bytes)).toBe('windows-1252');
    });

    it('returns windows-1252 for an overlong 2-byte sequence (0xC0)', () => {
      const bytes = new Uint8Array([0xc0, 0x80]);
      expect(detectEncoding(bytes)).toBe('windows-1252');
    });

    it('returns windows-1252 for an overlong 2-byte sequence (0xC1)', () => {
      const bytes = new Uint8Array([0xc1, 0x80]);
      expect(detectEncoding(bytes)).toBe('windows-1252');
    });

    it('returns windows-1252 for a 2-byte lead without a continuation byte', () => {
      // 0xC3 must be followed by a continuation byte; 0x20 (space) is not one
      const bytes = new Uint8Array([0xc3, 0x20]);
      expect(detectEncoding(bytes)).toBe('windows-1252');
    });

    it('returns windows-1252 for bytes >= 0xFE (never valid in UTF-8)', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0xfe]);
      expect(detectEncoding(bytes)).toBe('windows-1252');
    });
  });
});
