import { parse, format as formatDate, isValid as isValidDate } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { toDateFnsFormat } from '../../utils/momentToDateFnsFormat';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DATE_TOKENS = ['YYYY', 'YY', 'MM', 'M', 'DD', 'D'];
export const TIME_TOKENS = [
  'HH',
  'H',
  'hh',
  'h',
  'mm',
  'm',
  'ss',
  's',
  'SSS',
  'A'
];
export const ALL_TOKENS = [...DATE_TOKENS, ...TIME_TOKENS];

export const SEPARATORS = ['/', '-', ':', ' ', 'T', '.'];

export const TOKENS_BY_TYPE = {
  datetime: ALL_TOKENS,
  dateOnly: DATE_TOKENS,
  timeOnly: TIME_TOKENS
};

// ─── Pure Functions ───────────────────────────────────────────────────────────

/**
 * Returns the set of tokens available for a given timestampType.
 * @param {'datetime'|'dateOnly'|'timeOnly'} timestampType
 * @returns {string[]}
 */
export const getTokensForType = timestampType =>
  TOKENS_BY_TYPE[timestampType] || ALL_TOKENS;

// Mutually exclusive token groups — selecting one hides the others
const EXCLUSIVE_PAIRS = [
  ['YYYY', 'YY'],
  ['MM', 'M'],
  ['DD', 'D'],
  ['HH', 'H'],
  ['HH', 'hh'],
  ['HH', 'h'],
  ['H', 'hh'],
  ['H', 'h'],
  ['hh', 'h'],
  ['mm', 'm'],
  ['ss', 's']
];

/**
 * Returns available options given current composition and timestampType.
 * Tokens already in composition are excluded; mutually exclusive variants
 * are also excluded. Separators are always available (can be reused).
 * @param {Array<{value: string, type: string}>} pills
 * @param {'datetime'|'dateOnly'|'timeOnly'} timestampType
 * @returns {Array<{value: string, type: 'token'|'separator', group: string}>}
 */
export const getAvailableOptions = (pills, timestampType) => {
  const usedTokens = new Set(
    pills.filter(p => p.type === 'token').map(p => p.value)
  );

  // Build set of tokens to exclude (used + their exclusive counterparts)
  const excludedTokens = new Set(usedTokens);
  for (const [a, b] of EXCLUSIVE_PAIRS) {
    if (usedTokens.has(a)) excludedTokens.add(b);
    if (usedTokens.has(b)) excludedTokens.add(a);
  }

  const tokens = getTokensForType(timestampType);

  const tokenOptions = tokens
    .filter(t => !excludedTokens.has(t))
    .map(value => ({ value, type: 'token', group: 'Tokens' }));

  const separatorOptions = SEPARATORS.map(value => ({
    value,
    type: 'separator',
    group: 'Separators'
  }));

  return [...tokenOptions, ...separatorOptions];
};

/**
 * Builds the format string from the pill array.
 * @param {Array<{value: string}>} pills
 * @returns {string}
 */
export const buildFormatString = pills => pills.map(p => p.value).join('');

/**
 * Parses an existing format string back into a pill array.
 * Uses greedy longest-match against known tokens, falling back to
 * single-char separators.
 * @param {string} formatString
 * @param {'datetime'|'dateOnly'|'timeOnly'} timestampType
 * @returns {Array<{id: string, value: string, type: 'token'|'separator'}>}
 */
export const parseFormatToPills = (formatString, timestampType) => {
  if (!formatString) return [];

  const tokens = getTokensForType(timestampType);
  // Sort by length descending for greedy longest-match
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);

  const pills = [];
  let cursor = 0;
  let pillId = 0;

  while (cursor < formatString.length) {
    let matched = false;

    for (const token of sortedTokens) {
      if (formatString.startsWith(token, cursor)) {
        pillId += 1;
        pills.push({
          id: `pill-${pillId}`,
          value: token,
          type: 'token'
        });
        cursor += token.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Treat the character as a separator
      pillId += 1;
      pills.push({
        id: `pill-${pillId}`,
        value: formatString[cursor],
        type: 'separator'
      });
      cursor += 1;
    }
  }

  return pills;
};

/**
 * Validates sample values against a format string using strict parsing.
 * After date-fns parses the value, it is formatted back with the same format
 * and compared to the original input. This catches padding mismatches
 * (e.g. "1" vs "01" when the format requires "DD"/"MM"/"HH").
 * The format string uses moment-style tokens (the API wire format).
 * @param {string} formatString - moment-style format string
 * @param {string[]} sampleValues - up to 10 sample values
 * @returns {{ isValid: boolean, parsedFirst: Date|null, failCount: number }}
 */
export const validateFormat = (formatString, sampleValues) => {
  if (!formatString || !sampleValues || sampleValues.length === 0) {
    return { isValid: false, parsedFirst: null, failCount: 0 };
  }

  let dfFormat;
  try {
    dfFormat = toDateFnsFormat(formatString);
  } catch {
    return {
      isValid: false,
      parsedFirst: null,
      failCount: sampleValues.length
    };
  }

  let failCount = 0;
  let parsedFirst = null;

  for (let i = 0; i < sampleValues.length; i += 1) {
    const value = sampleValues[i];
    try {
      const parsed = parse(value, dfFormat, new UTCDate(0));
      if (!isValidDate(parsed) || Number.isNaN(parsed.getTime())) {
        failCount += 1;
      } else {
        // Strict check: format the parsed date back and compare to original.
        // This catches padding mismatches (e.g. "1" for "dd" format).
        const roundTrip = formatDate(parsed, dfFormat);
        if (roundTrip !== value) {
          failCount += 1;
        } else if (i === 0) {
          parsedFirst = parsed;
        }
      }
    } catch {
      failCount += 1;
    }
  }

  return {
    isValid: failCount === 0,
    parsedFirst: failCount === 0 ? parsedFirst : null,
    failCount
  };
};
