import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useIsDesktopLayout } from './useIsDesktopLayout';

/**
 * How much horizontal room the side menu takes from the rest of the chrome, and
 * the transition to animate it with.
 *
 * Single source of truth for a formula that used to be copy-pasted three times
 * (ApplicationShell's main wrapper, the AppBar, the Storybook story). The AppBar
 * and the content underneath it MUST offset by the same amount or one overlaps
 * the other — a drift between two such copies is exactly how a tablet ended up
 * with an overlay drawer and a 240px margin at the same time.
 *
 * `width` is 0 on mobile: there the drawer is a temporary overlay, it sits on
 * top of the layout instead of displacing it.
 */
export const useSideMenuOffset = () => {
  const theme = useTheme();
  const isDesktop = useIsDesktopLayout();
  const isExpanded = useSelector(state => state.sideMenu.isExpanded);

  if (!isDesktop) return { width: 0, transition: undefined };

  return {
    width: isExpanded ? theme.sideMenuWidth : theme.sideMenuCollapsedWidth,
    // Asymmetric on purpose, per Material's motion guidance: expanding is a
    // deceleration (easeOut, slower) while collapsing gets out of the way
    // (sharp, faster).
    transition: theme.transitions.create(['margin', 'width'], {
      easing: isExpanded
        ? theme.transitions.easing.easeOut
        : theme.transitions.easing.sharp,
      duration: isExpanded
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen
    })
  };
};
