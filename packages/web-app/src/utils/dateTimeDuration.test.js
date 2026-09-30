import { describe, expect, it } from 'vitest';
import { formatDurationMinutes } from './dateTimeDuration';

const partsFor = locale => (value, options) =>
  new Intl.NumberFormat(locale, options).formatToParts(value);

describe('formatDurationMinutes', () => {
  it('formats standalone minutes, whole hours and mixed durations with non-breaking spaces', () => {
    const formatNumberToParts = partsFor('fr');

    expect(formatDurationMinutes(30, formatNumberToParts)).toBe('30\u00a0min');
    expect(formatDurationMinutes(60, formatNumberToParts)).toBe('1\u00a0h');
    expect(formatDurationMinutes(90, formatNumberToParts)).toBe(
      '1\u00a0h\u00a030'
    );
    expect(formatDurationMinutes(0, formatNumberToParts)).toBe('');
  });

  it('uses localized numbers and unit abbreviations', () => {
    const formatNumberToParts = partsFor('en');

    expect(formatDurationMinutes(30, formatNumberToParts)).toBe('30\u00a0min');
    expect(formatDurationMinutes(90, formatNumberToParts)).toBe(
      '1\u00a0h\u00a030'
    );
  });
});
