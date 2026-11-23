import getRouterBasename, {
  getRouterRelativePathname
} from './getRouterBasename';

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

describe('getRouterRelativePathname', () => {
  it('strips the preview prefix, leaving the router-visible path', () => {
    expect(getRouterRelativePathname('/pr/1643')).toBe('/');
    expect(getRouterRelativePathname('/pr/1643/ui/map')).toBe('/ui/map');
  });

  it('returns the pathname unchanged for regular app URLs', () => {
    expect(getRouterRelativePathname('/ui/map')).toBe('/ui/map');
    expect(getRouterRelativePathname('/')).toBe('/');
  });
});
