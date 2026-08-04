/**
 * Merges decimal_part columns into the preceding measurement column.
 * Processes columns right-to-left so that column indices remain valid
 * during merging.
 *
 * @param {string[][]} rows - 2D array of raw string values
 * @param {Array<{columnIndex: number, role: string}>} mappings - Column mapping objects
 * @returns {string[][]} New rows array with decimal_part columns set to null
 */
export const resolveRows = (rows, mappings) => {
  const resolved = rows.map(row => [...row]);

  const decimalPartIndices = mappings
    .filter(m => m.role === 'decimal_part')
    .map(m => m.columnIndex)
    .sort((a, b) => b - a);

  for (const colIndex of decimalPartIndices) {
    // Guard: decimal_part at column 0 is invalid (no preceding column to merge into).
    // The UI prevents this, but guard here for safety.
    if (colIndex === 0) continue; // eslint-disable-line no-continue
    for (const row of resolved) {
      row[colIndex - 1] = `${row[colIndex - 1] ?? ''}.${row[colIndex] ?? ''}`;
      row[colIndex] = null;
    }
  }

  return resolved;
};
