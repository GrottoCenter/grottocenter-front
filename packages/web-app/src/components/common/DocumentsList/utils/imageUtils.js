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
 * See: https://github.com/Grottocenter/grottocenter-api/issues/1503
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
 * Download a file from a (potentially cross-origin) URL.
 *
 * The HTML `download` attribute is silently ignored for cross-origin resources
 * in all major browsers (spec §4.6.4). Files on Azure Blob Storage
 * (grottocenter.blob.core.windows.net) are cross-origin relative to this app.
 *
 * Strategy:
 *  1. fetch() the file — works only if the server returns CORS headers
 *     (Access-Control-Allow-Origin). Without them the browser blocks the read.
 *  2. Wrap the response in a same-origin Blob URL so `download` is honoured.
 *  3. Fallback: window.open() if CORS is absent; the browser will display the
 *     file instead of saving it (unavoidable without server-side cooperation).
 *
 * Permanent fix options (require infra / backend work):
 *  A. Add CORS rules to the Azure Blob Storage container (GET, correct origin).
 *  B. Add a backend proxy endpoint that re-serves files with
 *     Content-Disposition: attachment — always works regardless of CORS.
 *
 * @param {string} url      URL of the file to download
 * @param {string} fileName Suggested filename for the saved file
 */
export const downloadFile = async (url, fileName) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke asynchronously to let the browser start the download first
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    // CORS headers missing on the file server: open in new tab as last resort.
    window.open(url, '_blank');
  }
};

/**
 * Check if a file is an image based on its extension
 * @param {string} fileName - The name of the file
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = fileName => {
  const extension = getFileExtension(fileName);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.includes(extension);
};

/**
 * Build `src`/`srcSet` for a responsive thumbnail card, falling back to
 * `completePath` when `thumbnails` (or a given variant) is null - e.g.
 * non-image files, failed generation, or uploads predating the backfill.
 * @param {object} file - File object with `completePath` and optional `thumbnails`
 * @returns {{src: string, srcSet: string|undefined}}
 */
export const getThumbnailSources = file => {
  const { completePath, thumbnails } = file;

  if (!thumbnails) {
    return { src: completePath, srcSet: undefined };
  }

  const { small, medium, large } = thumbnails;
  const srcSet = [
    small && `${small} 480w`,
    medium && `${medium} 1280w`,
    large && `${large} 1920w`
  ]
    .filter(Boolean)
    .join(', ');

  return {
    src: small || medium || large || completePath,
    srcSet: srcSet || undefined
  };
};

/**
 * Pick the best image source for a full-screen lightbox view: the `large`
 * thumbnail variant, falling back to `completePath` when unavailable.
 * @param {object} file - File object with `completePath` and optional `thumbnails`
 * @returns {string}
 */
export const getLightboxSrc = file =>
  file.thumbnails?.large || file.completePath;
