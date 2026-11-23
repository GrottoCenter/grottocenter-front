import getRouterBasename from './getRouterBasename';

describe('getRouterBasename', () => {
  it('uses the PR path as the basename for preview URLs', () => {
    expect(getRouterBasename('/pr/1643')).toBe('/pr/1643');
    expect(getRouterBasename('/pr/1643/ui/entrances')).toBe('/pr/1643');
  });

  it('uses an empty string as the basename for regular app URLs', () => {
    expect(getRouterBasename('/')).toBe('');
    expect(getRouterBasename('/ui/entrances')).toBe('');
    expect(getRouterBasename('/pr/not-a-number')).toBe('');
  });
});
