import { COLUMN_ROLES } from './constants';

/**
 * Resolve a raw CSV row by merging columns marked as DECIMAL_PART with
 * their preceding column. Returns a new array with merged values.
 *
 * Example: if columns are [... "280", "91"] and col 12 is DECIMAL_PART,
 * the resolved row will have col 11 = "280.91" and col 12 = null.
 *
 * @param {Array} row - Raw CSV row (array of strings)
 * @param {object} columnMappings - Column mappings keyed by column index
 * @returns {Array} - New row with decimal parts merged into preceding column
 */
const resolveRow = (row, columnMappings) => {
  const resolved = [...row];

  // Process in reverse so indices stay valid
  for (let i = resolved.length - 1; i > 0; i -= 1) {
    const mapping = columnMappings[i];
    if (mapping && mapping.role === COLUMN_ROLES.DECIMAL_PART) {
      // Merge into previous column: "280" + "." + "91" = "280.91"
      const prev = resolved[i - 1] || '';
      const decimal = resolved[i] || '';
      resolved[i - 1] = `${prev}.${decimal}`;
      resolved[i] = null;
    }
  }

  return resolved;
};

export default resolveRow;
