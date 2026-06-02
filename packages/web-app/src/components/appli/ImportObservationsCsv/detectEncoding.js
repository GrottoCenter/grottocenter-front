/**
 * Detect the most likely encoding of a file by reading a small sample.
 * Checks for BOM markers and non-UTF-8 byte patterns.
 *
 * @param {File} file - The File object to sniff
 * @returns {Promise<string>} - Detected encoding label
 */
const detectEncoding = async file => {
  const slice = file.slice(0, 4096);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for BOM (Byte Order Mark)
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8';
  }
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'UTF-16';
  }
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'UTF-16';
  }

  // Try to detect non-UTF-8: look for bytes in the 0x80-0xFF range
  // that don't form valid UTF-8 sequences
  let i = 0;
  let hasHighBytes = false;
  let invalidUtf8 = false;

  while (i < bytes.length) {
    const b = bytes[i];

    if (b < 0x80) {
      // ASCII — valid in all encodings
      i += 1;
    } else {
      hasHighBytes = true;

      // Check if this is a valid UTF-8 multi-byte sequence
      if ((b & 0xE0) === 0xC0) {
        // 2-byte sequence: 110xxxxx 10xxxxxx
        if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) {
          invalidUtf8 = true;
          break;
        }
        i += 2;
      } else if ((b & 0xF0) === 0xE0) {
        // 3-byte sequence: 1110xxxx 10xxxxxx 10xxxxxx
        if (
          i + 2 >= bytes.length ||
          (bytes[i + 1] & 0xC0) !== 0x80 ||
          (bytes[i + 2] & 0xC0) !== 0x80
        ) {
          invalidUtf8 = true;
          break;
        }
        i += 3;
      } else if ((b & 0xF8) === 0xF0) {
        // 4-byte sequence
        if (
          i + 3 >= bytes.length ||
          (bytes[i + 1] & 0xC0) !== 0x80 ||
          (bytes[i + 2] & 0xC0) !== 0x80 ||
          (bytes[i + 3] & 0xC0) !== 0x80
        ) {
          invalidUtf8 = true;
          break;
        }
        i += 4;
      } else {
        // Invalid UTF-8 start byte (0x80-0xBF or 0xF8+)
        invalidUtf8 = true;
        break;
      }
    }
  }

  if (invalidUtf8 || (hasHighBytes && invalidUtf8)) {
    // High bytes that aren't valid UTF-8 → likely Latin-1 or Windows-1252
    return 'windows-1252';
  }

  return 'UTF-8';
};

export default detectEncoding;
