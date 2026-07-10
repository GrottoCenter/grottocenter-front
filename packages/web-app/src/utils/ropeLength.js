// Riggings rope cells are free text ("C60", "10m", "2xC30", "2 C30"…).
// Parsing is best-effort: callers must treat the result as an estimate.
// Four alternative capture groups (in order of priority):
//   [1],[2] multiplier × C-value with explicit × sign  →  2xC30 / 2 x C30
//   [3],[4] multiplier × C-value with space only        →  2 C30
//   [5]     plain C-prefixed value                      →  C60 / c 10 / C12,5m
//   [6]     bare number + m                             →  10m / 10 m / 25,5 m
//           (negative lookahead avoids "mm", "metres"…)
const ROPE_PATTERN =
  /(\d+)\s*[xX×]\s*C\s*(\d+(?:[.,]\d+)?)(?:\s*m)?|(\d+)\s+C\s*(\d+(?:[.,]\d+)?)(?:\s*m)?|C\s*(\d+(?:[.,]\d+)?)(?:\s*m)?|(\d+(?:[.,]\d+)?)\s*m(?![a-zA-Z])/gi;

// Cells filled with only dashes or slashes mean "no rope needed", not
// "unparsable" — they must not trigger the estimate marker.
const NO_ROPE_PATTERN = /^[\s\-–—/.]*$/;

const parseMatch = match => {
  if (match[1])
    return parseFloat(match[1]) * parseFloat(match[2].replace(',', '.'));
  if (match[3])
    return parseFloat(match[3]) * parseFloat(match[4].replace(',', '.'));
  return parseFloat((match[5] ?? match[6]).replace(',', '.'));
};

// Note: returns 0 for inputs like "C0". Callers that check `total > 0`
// will silently hide the rope chip — acceptable for an edge case.
export const parseRopeLength = ropeText => {
  if (typeof ropeText !== 'string') return null;
  const matches = [...ropeText.matchAll(ROPE_PATTERN)];
  if (matches.length === 0) return null;
  return matches.reduce((sum, match) => sum + parseMatch(match), 0);
};

export const parseRopeLengths = ropes => {
  const result = { total: 0, parsedCount: 0, unparsedCount: 0 };
  if (!Array.isArray(ropes)) return result;
  return ropes.reduce((acc, ropeText) => {
    if (typeof ropeText !== 'string' || NO_ROPE_PATTERN.test(ropeText)) {
      return acc;
    }
    const length = parseRopeLength(ropeText);
    if (length === null) {
      return { ...acc, unparsedCount: acc.unparsedCount + 1 };
    }
    return {
      ...acc,
      total: acc.total + length,
      parsedCount: acc.parsedCount + 1
    };
  }, result);
};
