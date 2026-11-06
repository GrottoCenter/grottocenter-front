// @vitest-environment node
import sharp from 'sharp';
import { createPdfImagePreparer } from './images';
import { PDF_LIMITS } from './limits';

const makeImage = () =>
  sharp({
    create: { width: 40, height: 20, channels: 3, background: '#789abc' }
  });

const mockCanvas = bytes => {
  const drawImage = vi.fn();
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor() {
        this.getContext = () => ({ drawImage });
        this.convertToBlob = () => Promise.resolve(new Blob([bytes]));
      }
    }
  );
  return drawImage;
};

it.each(['gif', 'webp', 'webp lossless', 'webp metadata'])(
  'converts %s after reading its encoded dimensions',
  async format => {
    let image = makeImage();
    if (format === 'webp metadata') image = image.withMetadata();
    const bytes = new Uint8Array(
      await (
        format === 'gif'
          ? image.gif()
          : image.webp({ lossless: format === 'webp lossless' })
      ).toBuffer()
    );
    const png = await makeImage().png().toBuffer();
    const bitmap = { width: 40, height: 20, close: vi.fn() };
    const decode = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal('createImageBitmap', decode);
    mockCanvas(png);
    const prepared = await createPdfImagePreparer()({ bytes });
    expect(prepared.format).toBe('png');
    expect(prepared.bytes).toEqual(new Uint8Array(png));
    expect(decode).toHaveBeenCalledOnce();
    expect(bitmap.close).toHaveBeenCalledOnce();
  }
);
afterEach(() => vi.unstubAllGlobals());

it.each(['png', 'jpeg'])(
  'preserves original %s bytes without a bitmap or canvas',
  async format => {
    const bytes = new Uint8Array(await makeImage()[format]().toBuffer());
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    const prepared = await createPdfImagePreparer()({ bytes });
    expect(prepared.bytes).toBe(bytes);
    expect(prepared.format).toBe(format);
    expect(decode).not.toHaveBeenCalled();
  }
);

it('normalizes EXIF rotation once when the same original is used twice', async () => {
  const bytes = new Uint8Array(
    await makeImage().withMetadata({ orientation: 6 }).jpeg().toBuffer()
  );
  const png = await makeImage().png().toBuffer();
  const bitmap = { width: 20, height: 40, close: vi.fn() };
  const decode = vi.fn().mockResolvedValue(bitmap);
  const drawImage = mockCanvas(png);
  vi.stubGlobal('createImageBitmap', decode);
  const prepare = createPdfImagePreparer();
  const first = await prepare({ url: 'https://example.org/image.jpg', bytes });
  const second = await prepare({ url: 'https://example.org/image.jpg', bytes });
  expect(second).toBe(first);
  expect(first.format).toBe('png');
  expect(decode).toHaveBeenCalledOnce();
  expect(drawImage).toHaveBeenCalledOnce();
  expect(bitmap.close).toHaveBeenCalledOnce();
});

it('rejects excessive PNG dimensions before any pixel decode', async () => {
  const bytes = new Uint8Array(await makeImage().png().toBuffer());
  const view = new DataView(bytes.buffer);
  view.setUint32(16, PDF_LIMITS.imagePixels + 1);
  view.setUint32(20, 1);
  const decode = vi.fn();
  vi.stubGlobal('createImageBitmap', decode);
  await expect(createPdfImagePreparer()({ bytes })).rejects.toThrow(
    'pdf.resourceLimit'
  );
  expect(decode).not.toHaveBeenCalled();
});

it('bounds the accumulated image pixels while deduplicating identical input', async () => {
  const bytes = new Uint8Array(await makeImage().png().toBuffer());
  const view = new DataView(bytes.buffer);
  view.setUint32(16, PDF_LIMITS.imagePixels);
  view.setUint32(20, 1);
  const prepare = createPdfImagePreparer();
  await prepare({ url: 'https://example.org/1', bytes });
  await prepare({ url: 'https://example.org/1', bytes });
  await prepare({ url: 'https://example.org/2', bytes });
  await expect(
    prepare({ url: 'https://example.org/3', bytes })
  ).rejects.toThrow('pdf.resourceLimit');
});
