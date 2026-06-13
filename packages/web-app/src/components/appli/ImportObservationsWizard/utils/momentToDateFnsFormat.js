/**
 * Converts a moment.js/dayjs format string to date-fns format tokens.
 *
 * The API uses moment-style tokens (YYYY, DD, etc.) while this frontend
 * uses date-fns for parsing and formatting. This utility bridges the two.
 *
 * Only the tokens that differ between moment and date-fns are mapped;
 * tokens that are identical (MM, HH, hh, mm, ss, SSS) pass through.
 */

const TOKEN_MAP = {
  YYYY: 'yyyy',
  YY: 'yy',
  DD: 'dd',
  D: 'd',
  // moment `A` → uppercase AM/PM; date-fns `a` → locale-dependent casing.
  // For *parsing* this is safe because date-fns parse is case-insensitive for
  // AM/PM markers. For *formatting* the output casing may differ from moment
  // in non-en-US locales, but formatting only occurs in tests — the wire
  // format always uses moment-style tokens.
  A: 'a'
};

// Sort by length descending so longer tokens match before shorter ones
// (e.g. YYYY before YY)
const SORTED_MOMENT_TOKENS = Object.keys(TOKEN_MAP).sort(
  (a, b) => b.length - a.length
);

/**
 * Converts a moment-style format string to a date-fns format string.
 * Tokens that are identical between the two libraries pass through unchanged.
 *
 * @param {string} momentFormat - Format string using moment/dayjs tokens
 * @returns {string} Format string using date-fns tokens
 */
export const toDateFnsFormat = momentFormat => {
  if (!momentFormat) return momentFormat;

  let result = '';
  let cursor = 0;

  while (cursor < momentFormat.length) {
    let matched = false;
    for (const token of SORTED_MOMENT_TOKENS) {
      if (momentFormat.startsWith(token, cursor)) {
        result += TOKEN_MAP[token];
        cursor += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += momentFormat[cursor];
      cursor += 1;
    }
  }

  return result;
};
