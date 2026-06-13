/**
 * Detects the character encoding of a file by inspecting its first bytes.
 *
 * Decision logic:
 * 1. UTF-8 BOM (0xEF, 0xBB, 0xBF) → 'UTF-8'
 * 2. UTF-16 LE BOM (0xFF, 0xFE) or UTF-16 BE BOM (0xFE, 0xFF) → 'UTF-16'
 * 3. Invalid UTF-8 byte sequences detected → 'windows-1252'
 * 4. Otherwise → 'UTF-8'
 *
 * @param {Uint8Array} bytes - First 4096 bytes of the file
 * @returns {'UTF-8' | 'UTF-16' | 'windows-1252'}
 */
export const detectEncoding = bytes => {
  if (!bytes || bytes.length === 0) {
    return 'UTF-8';
  }

  // Check for UTF-8 BOM
  if (bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf) {
    return 'UTF-8';
  }

  // Check for UTF-16 LE BOM
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'UTF-16';
  }

  // Check for UTF-16 BE BOM
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'UTF-16';
  }

  // Scan for invalid UTF-8 sequences
  if (hasInvalidUtf8(bytes)) {
    return 'windows-1252';
  }

  return 'UTF-8';
};

/**
 * Checks whether the byte array contains sequences that are invalid in UTF-8.
 *
 * Valid UTF-8 byte patterns:
 * - 0xxxxxxx (0x00-0x7F): single byte (ASCII)
 * - 110xxxxx 10xxxxxx (0xC0-0xDF + 1 continuation): 2-byte
 * - 1110xxxx 10xxxxxx 10xxxxxx (0xE0-0xEF + 2 continuations): 3-byte
 * - 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx (0xF0-0xF7 + 3 continuations): 4-byte
 *
 * Invalid patterns detected:
 * - Continuation byte (0x80-0xBF) without a preceding lead byte
 * - Overlong 2-byte sequences (0xC0, 0xC1)
 * - Bytes >= 0xFE (never valid in UTF-8)
 * - 5-byte sequences (lead byte 0xF8-0xFB)
 * - 6-byte sequences (lead byte 0xFC-0xFD)
 * - Insufficient continuation bytes after a lead byte
 *
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
const hasInvalidUtf8 = bytes => {
  let i = 0;

  while (i < bytes.length) {
    const byte = bytes[i];

    // Single byte (ASCII): 0x00-0x7F
    if (byte <= 0x7f) {
      i += 1;
      continue;
    }

    // Continuation byte without lead byte: 0x80-0xBF
    if (byte >= 0x80 && byte <= 0xbf) {
      return true;
    }

    // Overlong 2-byte encodings: 0xC0, 0xC1
    if (byte === 0xc0 || byte === 0xc1) {
      return true;
    }

    // 2-byte sequence: 0xC2-0xDF
    if (byte >= 0xc2 && byte <= 0xdf) {
      if (i + 1 >= bytes.length || !isContinuation(bytes[i + 1])) {
        return true;
      }
      i += 2;
      continue;
    }

    // 3-byte sequence: 0xE0-0xEF
    if (byte >= 0xe0 && byte <= 0xef) {
      if (
        i + 2 >= bytes.length ||
        !isContinuation(bytes[i + 1]) ||
        !isContinuation(bytes[i + 2])
      ) {
        return true;
      }
      i += 3;
      continue;
    }

    // 4-byte sequence: 0xF0-0xF7
    if (byte >= 0xf0 && byte <= 0xf7) {
      if (
        i + 3 >= bytes.length ||
        !isContinuation(bytes[i + 1]) ||
        !isContinuation(bytes[i + 2]) ||
        !isContinuation(bytes[i + 3])
      ) {
        return true;
      }
      i += 4;
      continue;
    }

    // 5-byte (0xF8-0xFB), 6-byte (0xFC-0xFD), or 0xFE-0xFF: all invalid
    return true;
  }

  return false;
};

/**
 * @param {number} byte
 * @returns {boolean}
 */
const isContinuation = byte => byte >= 0x80 && byte <= 0xbf;
