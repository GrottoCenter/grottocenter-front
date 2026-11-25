import { describe, expect, it } from 'vitest';
import { getCacheSuffix, withBase } from './publicUrl';

describe('withBase', () => {
  it('keeps root paths in production', () => {
    expect(withBase('/images/logo.svg')).toBe('/images/logo.svg');
  });
});

describe('getCacheSuffix', () => {
  it('is empty at the root', () => {
    expect(getCacheSuffix('/')).toBe('');
  });

  it('identifies a preview', () => {
    expect(getCacheSuffix('/pr/42/')).toBe('-pr-42');
  });
});
