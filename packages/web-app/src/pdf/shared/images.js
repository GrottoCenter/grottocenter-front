import JPEG from 'jay-peg';
import { PDF_LIMITS, checkPdfLimit } from './limits';

const inspectImage = bytes => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = offset =>
    String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    // Reuse the JPEG metadata parser already used by react-pdf, without decoding pixels.
    const markers = JPEG.decode(bytes);
    const frame = markers.find(marker => marker.name === 'SOF');
    const exif = markers.find(marker => marker.name === 'EXIF');
    return {
      ...frame,
      format: 'jpeg',
      orientation: exif?.entries?.orientation ?? 1
    };
  }
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte
    )
  ) {
    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
      format: 'png',
      orientation: 1
    };
  }
  if (bytes.length >= 10 && tag(0) === 'GIF8')
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  if (bytes.length >= 30 && tag(0) === 'RIFF' && tag(8) === 'WEBP') {
    if (tag(12) === 'VP8X')
      return {
        width: 1 + (view.getUint32(24, true) % 16777216),
        height: 1 + Math.floor(view.getUint32(26, true) / 256)
      };
    if (tag(12) === 'VP8L') {
      const dimensions = view.getUint32(21, true);
      return {
        width: 1 + (dimensions % 16384),
        height: 1 + (Math.floor(dimensions / 16384) % 16384)
      };
    }
    if (tag(12) === 'VP8 ')
      return {
        width: view.getUint16(26, true) % 16384,
        height: view.getUint16(28, true) % 16384
      };
  }
  return null;
};

export const createPdfImagePreparer = () => {
  const cache = new Map();
  let totalPixels = 0;
  const account = (width, height) => {
    if (!(width > 0 && height > 0)) throw new Error('Invalid image dimensions');
    const pixels = width * height;
    checkPdfLimit(pixels, PDF_LIMITS.imagePixels);
    totalPixels += pixels;
    checkPdfLimit(totalPixels, PDF_LIMITS.totalImagePixels);
  };
  return async file => {
    // Shared transferred buffers also identify files without URLs in unit callers.
    const key = file.url ?? file.bytes;
    if (cache.has(key)) return cache.get(key);
    const metadata = inspectImage(file.bytes);
    if (!metadata) throw new Error('Unsupported image format');
    account(metadata.width, metadata.height);
    if (metadata?.format && metadata.orientation === 1) {
      const result = { bytes: file.bytes, format: metadata.format };
      cache.set(key, result);
      return result;
    }
    if (
      typeof OffscreenCanvas === 'undefined' ||
      typeof createImageBitmap === 'undefined'
    )
      throw new Error('Image conversion unavailable');
    const image = await createImageBitmap(new Blob([file.bytes]));
    try {
      const canvas = new OffscreenCanvas(image.width, image.height);
      canvas.getContext('2d').drawImage(image, 0, 0);
      const bytes = new Uint8Array(
        await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer()
      );
      const result = { bytes, format: 'png' };
      cache.set(key, result);
      return result;
    } finally {
      image.close();
    }
  };
};
