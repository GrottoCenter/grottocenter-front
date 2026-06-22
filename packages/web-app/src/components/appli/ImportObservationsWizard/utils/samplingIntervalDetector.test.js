import { detectSamplingInterval } from './samplingIntervalDetector';

describe('detectSamplingInterval', () => {
  describe('fewer than 2 timestamps returns null', () => {
    it('returns null for an empty array', () => {
      expect(detectSamplingInterval([])).toBeNull();
    });

    it('returns null for a single timestamp', () => {
      expect(detectSamplingInterval(['2024-01-01T00:00:00Z'])).toBeNull();
    });

    it('returns null for null input', () => {
      expect(detectSamplingInterval(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(detectSamplingInterval(undefined)).toBeNull();
    });
  });

  describe('exactly 2 timestamps returns their gap in seconds', () => {
    it('returns 60 for two timestamps 60 seconds apart', () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:01:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(60);
    });

    it('returns 3600 for two timestamps 1 hour apart', () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T01:00:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(3600);
    });

    it('returns correct gap regardless of input order', () => {
      const timestamps = [
        '2024-01-01T01:00:00Z',
        '2024-01-01T00:00:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(3600);
    });
  });

  describe('odd-length list returns the middle gap', () => {
    it('returns the median gap for 3 timestamps with equal spacing', () => {
      // Diffs: [60, 60] → sorted: [60, 60] → median index floor((2-1)/2) = 0 → 60
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:01:00Z',
        '2024-01-01T00:02:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(60);
    });

    it('returns the middle gap for 4 timestamps (3 diffs, odd)', () => {
      // Diffs: [60, 120, 60] → sorted: [60, 60, 120] → median index floor((3-1)/2) = 1 → 60
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:01:00Z',
        '2024-01-01T00:03:00Z',
        '2024-01-01T00:04:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(60);
    });
  });

  describe('even-length list returns the average median', () => {
    it('returns the averaged median for 3 timestamps (2 diffs, even)', () => {
      // Diffs: [60, 120] → sorted: [60, 120] → median = (60+120)/2 = 90 → floor = 90
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:01:00Z',
        '2024-01-01T00:03:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(90);
    });

    it('returns the averaged median for 5 timestamps (4 diffs, even)', () => {
      // Diffs: [30, 60, 90, 120] → sorted: [30, 60, 90, 120]
      // median = (60+90)/2 = 75 → floor = 75
      const timestamps = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:30Z',
        '2024-01-01T00:01:30Z',
        '2024-01-01T00:03:00Z',
        '2024-01-01T00:05:00Z'
      ];
      expect(detectSamplingInterval(timestamps)).toBe(75);
    });
  });

  describe('null values in array are filtered out', () => {
    it('filters out null values and computes interval from valid timestamps', () => {
      const timestamps = [
        '2024-01-01T00:00:00Z',
        null,
        '2024-01-01T00:01:00Z',
        null
      ];
      expect(detectSamplingInterval(timestamps)).toBe(60);
    });

    it('returns null when only one valid timestamp remains after filtering', () => {
      const timestamps = [null, '2024-01-01T00:00:00Z', null];
      expect(detectSamplingInterval(timestamps)).toBeNull();
    });

    it('returns null when all values are null', () => {
      expect(detectSamplingInterval([null, null, null])).toBeNull();
    });
  });
});
