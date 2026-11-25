import { describe, expect, it } from 'vitest';
import { resolveCacheSuffix, resolvePreviewBase } from './previewBase.mjs';

describe('resolvePreviewBase', () => {
  it.each([undefined, null, ''])('defaults to / for %s', value => {
    expect(resolvePreviewBase(value)).toBe('/');
  });

  it('prefixes a pull request number', () => {
    expect(resolvePreviewBase('1655')).toBe('/pr/1655/');
  });

  it.each(['abc', '0', '12/../3', '1234567', '-1', '1 2'])(
    'rejects %s',
    value => {
      expect(() => resolvePreviewBase(value)).toThrow(/VITE_PREVIEW_PR/);
    }
  );
});

describe('resolveCacheSuffix', () => {
  it('is empty for production so cache names are unchanged', () => {
    expect(resolveCacheSuffix('/')).toBe('');
  });

  it('names the preview', () => {
    expect(resolveCacheSuffix('/pr/1655/')).toBe('-pr-1655');
  });
});
