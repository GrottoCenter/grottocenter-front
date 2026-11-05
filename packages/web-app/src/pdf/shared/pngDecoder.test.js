// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const decoderPath = require.resolve('png-js');
const { default: PNG } = await import(decoderPath);
const browserDecoderPath = path.join(
  path.dirname(decoderPath),
  'png-js.browser.js'
);
const { default: BrowserPNG } = await import(browserDecoderPath);
const image = fs.readFileSync(
  new URL('../../../cypress/fixtures/entrance-map-tile.png', import.meta.url)
);

class WorkerScope {
  static [Symbol.hasInstance](value) {
    return value === globalThis;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('PNG decoding in the PDF worker', () => {
  it('decodes losslessly without launching a nested worker', async () => {
    vi.stubGlobal('WorkerGlobalScope', WorkerScope);
    const worker = vi.fn(() => {
      throw new Error('Nested workers must not be needed to finish the PDF');
    });
    vi.stubGlobal('Worker', worker);
    const expected = await new Promise(resolve => {
      new PNG(image).decodePixels(resolve);
    });
    const actual = await new Promise(resolve => {
      new BrowserPNG(image).decodePixels(resolve);
    });

    expect(actual).toEqual(expected);
    expect(worker).not.toHaveBeenCalled();
  });

  it('propagates invalid compressed image data rather than hanging', () => {
    vi.stubGlobal('WorkerGlobalScope', WorkerScope);
    const decoder = new BrowserPNG(image);
    decoder.imgData = [0];

    expect(() => decoder.decodePixels(vi.fn())).toThrow();
  });
});
