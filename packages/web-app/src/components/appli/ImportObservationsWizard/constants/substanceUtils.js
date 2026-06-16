/**
 * Quantity kind codes that require a substance identifier.
 */
export const SUBSTANCE_REQUIRING_CODES = ['Concentration', 'IsotopeDelta'];

/**
 * Returns true if the given quantity kind code requires a substance field.
 * @param {string} code - The quantity kind code
 * @returns {boolean}
 */
export const isSubstanceRequired = code =>
  SUBSTANCE_REQUIRING_CODES.includes(code);
