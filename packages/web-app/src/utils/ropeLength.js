// Riggings rope cells are free text ("C60", "10m", "C10 + 25 m", "2xC20"…).
// Parsing is best-effort: callers must treat the result as an estimate.
// Two alternative capture groups:
//   [1] C-prefixed value  →  C60 / c 10 / C12,5m
//   [2] bare number + m   →  10m / 10 m / 25,5 m  (not followed by another letter to avoid "mm", "metres"…)
const ROPE_PATTERN =
  /C\s*(\d+(?:[.,]\d+)?)(?:\s*m)?|(\d+(?:[.,]\d+)?)\s*m(?![a-zA-Z])/gi;

// Cells filled with only dashes or slashes mean "no rope needed", not
// "unparsable" — they must not trigger the estimate marker.
const NO_ROPE_PATTERN = /^[\s\-–—/.]*$/;

export const parseRopeLength = ropeText => {
  if (typeof ropeText !== 'string') return null;
  const matches = [...ropeText.matchAll(ROPE_PATTERN)];
  if (matches.length === 0) return null;
  return matches.reduce(
    (sum, match) => sum + parseFloat((match[1] ?? match[2]).replace(',', '.')),
    0
  );
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
