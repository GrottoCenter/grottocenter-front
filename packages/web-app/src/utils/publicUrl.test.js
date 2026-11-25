import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCacheSuffix, withBase } from './publicUrl';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('withBase', () => {
  it('keeps root paths in production', () => {
    expect(withBase('/images/logo.svg')).toBe('/images/logo.svg');
  });

  it('prefixes paths in a preview', () => {
    vi.stubEnv('BASE_URL', '/pr/42/');
    expect(withBase('/images/logo.svg')).toBe('/pr/42/images/logo.svg');
    expect(withBase('lang/fr.json')).toBe('/pr/42/lang/fr.json');
  });

  it('normalises duplicate leading slashes', () => {
    vi.stubEnv('BASE_URL', '/pr/42/');
    expect(withBase('//lang/fr.json')).toBe('/pr/42/lang/fr.json');
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
