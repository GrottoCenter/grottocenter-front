import { cloneElement, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useIntl } from 'react-intl';
import {
  useAuthNavigate,
  useOnlineStatus,
  useIsDesktopLayout
} from '../../hooks';
import OfflineDisabled from './OfflineDisabled';

/**
 * The one-shot counterpart to SectionCreateButton: it navigates to a creation
 * page instead of toggling a panel open. Same offline rule — the page it leads
 * to only ends in an API write — but with nothing to close, so it is simply
 * disabled whenever there is no connection.
 *
 * Below `md` the label collapses into a tooltip and the button becomes
 * icon-only: the entity glyph already carries an AddCircle badge, so the "+"
 * meaning survives without the "New" text taking a whole line on phones.
 *
 * The tooltip is blanked while disabled because a disabled <button> emits no
 * hover: MUI warns about it, and OfflineDisabled's tooltip is what shows.
 */
const NewEntityButton = ({
  to,
  icon = <AddCircleIcon />,
  size = 'medium',
  tooltip = null
}) => {
  const { formatMessage } = useIntl();
  const handleClick = useAuthNavigate(to);
  const isOnline = useOnlineStatus();
  const isDesktop = useIsDesktopLayout();

  const label = formatMessage({ id: 'New' });
  const tooltipText = tooltip || label;

  // On mobile the label collapses to a tooltip, so the icon becomes the whole
  // affordance and gets scaled up for page-header usages. Section-header
  // usages (size="small") keep the caller's icon size so they line up with the
  // adjacent SectionCreateButton / ResponsiveActions burger.
  //
  // cloneElement overrides `size` — the prop EntityIcon (used by every real
  // caller) understands. The AddCircleIcon fallback ignores it, which is fine:
  // no caller in the codebase relies on that fallback.
  const mobileIcon =
    size === 'small' || !isValidElement(icon)
      ? icon
      : cloneElement(icon, { size: 26 });

  // Same outlined Button on both breakpoints — the only difference on mobile is
  // that the label collapses to the tooltip and the button becomes square, so
  // the outline stays consistent instead of the icon floating unbounded.
  //
  // Mobile minWidth is size-aware:
  //   - size="small"  → 40px, so section-header usages line up with the
  //                     ResponsiveActions burger sitting next to them.
  //   - size="medium" → MUI default (64px), so page-header usages (Documents,
  //                     Entrances, Massifs, Organizations search pages) keep a
  //                     tappable, visible primary action instead of collapsing
  //                     to a tiny icon.
  const button = isDesktop ? (
    <Button
      color="secondary"
      variant="outlined"
      size={size}
      startIcon={icon}
      disabled={!isOnline}
      onClick={handleClick}>
      {label}
    </Button>
  ) : (
    <Button
      color="secondary"
      variant="outlined"
      size={size}
      disabled={!isOnline}
      onClick={handleClick}
      aria-label={tooltipText}
      sx={size === 'small' ? { minWidth: 40, padding: 0.5 } : undefined}>
      {mobileIcon}
    </Button>
  );

  return (
    <OfflineDisabled>
      {isDesktop && !tooltip ? (
        button
      ) : (
        <Tooltip title={isOnline ? tooltipText : ''}>{button}</Tooltip>
      )}
    </OfflineDisabled>
  );
};

NewEntityButton.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  // Already translated. Omitted where the label alone is explicit enough.
  tooltip: PropTypes.string
};

export default NewEntityButton;
