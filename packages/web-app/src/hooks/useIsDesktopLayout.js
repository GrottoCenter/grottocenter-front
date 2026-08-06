import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Whether the app chrome should use its desktop layout: a permanent side rail
 * that collapses to icons, rather than a temporary overlay drawer.
 *
 * A hook, not an inline `useMediaQuery`, because three components must agree on
 * this single boolean — ApplicationShell (content margin), AppBar (width and
 * offset) and SideMenu (drawer variant). They used to disagree: SideMenu picked
 * its variant with `isMobile` (phone AND tablet) while the other two offset the
 * layout with `isMobileOnly` (phone only), so a tablet got an overlay drawer
 * *and* a 240px margin next to it.
 *
 * Viewport-based rather than user-agent based: what matters here is how much
 * horizontal room there is, not what kind of device asked. `md` (900px) is the
 * first width where a 240px rail plus the content is comfortable, and it keeps
 * portrait tablets on the overlay they already had.
 */
export const useIsDesktopLayout = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
};
