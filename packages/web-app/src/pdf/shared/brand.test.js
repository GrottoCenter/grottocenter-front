import grottoTheme from '@/conf/grottoTheme';
import { getPdfBrand, parseBrandSvg } from './brand';

afterEach(() => vi.unstubAllGlobals());

it('preserves vector groups and inherited stroke properties, omitting screen shadows', () => {
  const graphic = parseBrandSvg(
    '<svg viewBox="0 0 20 20"><defs/><g stroke-linecap="round"><path d="M0 0L20 20" fill="#fff"/></g><path filter="url(#shadow)" d="M0 0"/></svg>'
  );
  expect(graphic.props.viewBox).toBe('0 0 20 20');
  expect(graphic.children).toHaveLength(1);
  expect(graphic.children[0].props.strokeLinecap).toBe('round');
  expect(graphic.children[0].children[0].type).toBe('path');
  expect(() => parseBrandSvg('<svg>')).toThrow('Invalid brand SVG');
});

it('serializes the existing icons and current palette without caching theme colors', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 20 20"><path d="M0 0L20 20"/></svg>'
    })
  );
  const { palette } = grottoTheme;
  const brand = await getPdfBrand(new AbortController().signal, palette);
  expect(brand.icons.entrance.children.length).toBeGreaterThan(0);
  expect(brand.icons.network.children.some(child => child.type === 'g')).toBe(
    true
  );
  expect(brand.colors.primary).toBe(palette.primary.main);
  expect(structuredClone(brand)).toEqual(brand);
  const changed = await getPdfBrand(new AbortController().signal, {
    ...palette,
    primary: { ...palette.primary, main: '#123456' }
  });
  expect(changed.colors.primary).toBe('#123456');
  expect(changed.icons).toBe(brand.icons);
});
