import { isNil } from 'ramda';

export const PageError = {
  END_POSITIVE: 'The end page must be positive.',
  START_POSITIVE: 'The start page must be positive.',
  INTERVAL: 'The end page must be greater or equal to the start page.'
};

/**
 * Check for startPage and endPage being valid as a document pages property.
 * @param {*} startPage
 * @param {*} endPage
 * @return {[PageError]}
 *    if valid  => array if empty
 *    if not    => array is filled with PageErrors
 */
const checkDocumentPages = (startPage, endPage) => {
  const errors = [];
  // Check positive values
  if (!isNil(startPage) && startPage < 0) errors.push(PageError.START_POSITIVE);
  if (!isNil(endPage) && endPage < 0) errors.push(PageError.END_POSITIVE);

  // Relative check
  if (!isNil(startPage) && !isNil(endPage)) {
    if (startPage > endPage) {
      errors.push(PageError.INTERVAL);
    }
  }
  return errors;
};

export default checkDocumentPages;
