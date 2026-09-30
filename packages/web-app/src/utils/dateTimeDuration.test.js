import { describe, expect, it } from 'vitest';
import { formatDurationMinutes, formatDurationUnit } from './dateTimeDuration';

const partsFor = locale => (value, options) =>
  new Intl.NumberFormat(locale, options).formatToParts(value);

describe('formatDurationMinutes', () => {
  it('formats standalone minutes, whole hours and mixed durations with non-breaking spaces', () => {
    const formatNumberToParts = partsFor('fr');

    expect(formatDurationMinutes(30, formatNumberToParts)).toBe('30\u00a0min');
    expect(formatDurationMinutes(60, formatNumberToParts)).toBe('1\u00a0h');
    expect(formatDurationMinutes(90, formatNumberToParts)).toBe(
      '1\u00a0h\u00a030\u00a0min'
    );
    expect(formatDurationMinutes(65, formatNumberToParts)).toBe(
      '1\u00a0h\u00a005\u00a0min'
    );
    expect(formatDurationMinutes(125, formatNumberToParts)).toBe(
      '2\u00a0h\u00a005\u00a0min'
    );
    expect(formatDurationMinutes(0, formatNumberToParts)).toBe('');
  });

  it('uses localized numbers and unit abbreviations', () => {
    const formatNumberToParts = partsFor('ja');

    expect(formatDurationMinutes(30, formatNumberToParts)).toBe('30\u00a0分');
    expect(formatDurationMinutes(65, formatNumberToParts)).toBe(
      '1\u00a0時間\u00a005\u00a0分'
    );
  });

  it('inflects hour units for the value in Romanian', () => {
    const formatNumberToParts = partsFor('ro');

    expect(formatDurationMinutes(65, formatNumberToParts)).toBe(
      '1\u00a0oră\u00a005\u00a0min.'
    );
    expect(formatDurationMinutes(125, formatNumberToParts)).toBe(
      '2\u00a0ore\u00a005\u00a0min.'
    );
  });

  it('preserves Hebrew singular and dual hour forms', () => {
    const formatNumberToParts = partsFor('he');

    expect(formatDurationMinutes(65, formatNumberToParts)).toBe(
      '1\u00a0שעה\u00a005\u00a0דק׳'
    );
    expect(formatDurationMinutes(125, formatNumberToParts)).toBe(
      'שעתיים\u00a005\u00a0דק׳'
    );
  });

  it('formats hour and minute units for the duration form', () => {
    const formatNumberToParts = partsFor('de');

    expect(formatDurationUnit('hour', formatNumberToParts)).toBe('Std.');
    expect(formatDurationUnit('minute', formatNumberToParts)).toBe('Min.');
  });
});
