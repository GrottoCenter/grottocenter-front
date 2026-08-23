import formatBytes from './formatBytes';

describe('formatBytes', () => {
  test('renders 0 B for a genuine zero-byte input', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('renders an empty string for invalid inputs', () => {
    expect(formatBytes(NaN)).toBe('');
    expect(formatBytes(-1)).toBe('');
    expect(formatBytes(undefined)).toBe('');
    expect(formatBytes(null)).toBe('');
  });

  test('renders bytes without a decimal for sub-KB values', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  test('renders KB with one decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  test('scales up to MB and GB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});
