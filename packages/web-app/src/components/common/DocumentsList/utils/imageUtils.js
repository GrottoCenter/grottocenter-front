/**
 * Utility functions for handling image files in DocumentsList
 */

/**
 * Extract file extension from filename
 * @param {string} fileName - The name of the file
 * @returns {string} The file extension with leading dot (e.g., '.jpg') or empty string
 */
export const getFileExtension = fileName => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
};

/**
 * Attempt to fix Latin-1 mojibake in filenames returned by the API.
 *
 * Root cause: the backend serialises filenames stored as UTF-8 bytes but the
 * HTTP response (or DB layer) treats those bytes as Latin-1 code points, so
 * each UTF-8 continuation byte becomes the corresponding Latin-1 character
 * (e.g. "é" → U+00C3 U+00A9 → "Ã©").
 *
 * Strategy:
 *  1. If any code point > 255, the string already contains genuine Unicode - skip.
 *  2. Re-interpret each code point as a raw byte and decode as UTF-8 (fatal mode).
 *  3. If decoding fails, the string was already correct - return as-is.
 *
 * Known limitation: a filename whose bytes happen to be both valid Latin-1 and
 * valid UTF-8 would be wrongly re-decoded (rare in practice).
 *
 * TODO: remove once the backend returns filenames with the correct encoding.
 * See: https://github.com/GrottoCenter/grottocenter-api/issues/1503
 *
 * @param {string} str - The potentially garbled filename
 * @returns {string} The decoded filename, or the original if decoding fails
 */
export const decodeFileName = str => {
  if (!str) return str;
  if ([...str].some(c => c.charCodeAt(0) > 255)) return str;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(
      new Uint8Array([...str].map(c => c.charCodeAt(0)))
    );
  } catch {
    return str;
  }
};

/**
 * Check if a file is an image based on its extension
 * @param {string} fileName - The name of the file
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = fileName => {
  const extension = getFileExtension(fileName);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.includes(extension);
};
