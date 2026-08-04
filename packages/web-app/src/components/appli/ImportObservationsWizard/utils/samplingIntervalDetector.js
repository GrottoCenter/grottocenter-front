/**
 * Computes the median gap (in whole seconds) between consecutive UTC timestamps.
 *
 * @param {string[]} utcTimestamps - ISO strings, may contain nulls (nulls filtered out)
 * @returns {number | null} - Median gap in seconds, or null if fewer than 2 valid timestamps
 */
export const detectSamplingInterval = utcTimestamps => {
  const valid = (utcTimestamps || []).filter(Boolean);

  if (valid.length < 2) {
    return null;
  }

  // Lexicographic sort works for ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ)
  // because the format is designed to sort chronologically as text.
  valid.sort();

  const diffs = [];
  for (let i = 0; i < valid.length - 1; i += 1) {
    const diffSeconds =
      (Date.parse(valid[i + 1]) - Date.parse(valid[i])) / 1000;
    diffs.push(diffSeconds);
  }

  diffs.sort((a, b) => a - b);

  // Proper median: average the two middle values for even-length arrays
  const mid = Math.floor(diffs.length / 2);
  const median =
    diffs.length % 2 === 0 ? (diffs[mid - 1] + diffs[mid]) / 2 : diffs[mid];
  return Math.floor(median);
};
