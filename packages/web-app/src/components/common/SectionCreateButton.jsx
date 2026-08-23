import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useOnlineStatus, useIsDesktopLayout } from '../../hooks';
import OfflineDisabled from './OfflineDisabled';
import { MOBILE_SECTION_ACTION_BUTTON_SX } from './sectionActionButtonStyles';

/**
 * The trigger a section header uses to open its own create / associate panel,
 * and to close it again — one button with two states.
 *
 * Extracted because the same fifteen lines of JSX sat in ten section headers
 * (descriptions, comments, histories, locations, riggings, documents ×2,
 * organization caves, account organizations, account entrances), which meant
 * ten places to get the offline rule right. That rule is narrow enough to be
 * worth stating once:
 *
 *   OPENING needs the network — every one of these panels ends in an API
 *   write. CLOSING never does, and must stay available, or an offline user who
 *   opened a panel while online is trapped in it.
 *
 * Hence a single `isBlocked` driving all three of the wrapper, the tooltip and
 * the button: they cannot drift apart. The tooltip is blanked rather than left
 * in place because a disabled <button> emits no hover — MUI warns about it, and
 * OfflineDisabled's own tooltip is the one that shows.
 *
 * Below `md` the label collapses into the tooltip and the button becomes an
 * IconButton, so a "+ Nouveau" doesn't push the section title to a new line on
 * phones.
 */
const SectionCreateButton = ({
  isOpen,
  onToggle,
  label,
  tooltip,
  openTooltip,
  icon = <AddCircleIcon />,
  size = 'small',
  testId = undefined
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const isDesktop = useIsDesktopLayout();
  const isBlocked = !isOnline && !isOpen;

  const cancelLabel = formatMessage({ id: 'Cancel' });
  const currentLabel = isOpen ? cancelLabel : label;
  const currentIcon = isOpen ? <CancelIcon /> : icon;
  const currentColor = isOpen ? 'error' : 'secondary';
  // A section that has nothing verbose to say falls back to the visible label —
  // saves callers from repeating themselves, and matters more since the label
  // is now hidden on mobile and the tooltip is the only affordance left.
  const currentTooltip = (isOpen && openTooltip) || tooltip || currentLabel;

  return (
    <OfflineDisabled disabled={isBlocked}>
      <Tooltip title={isBlocked ? '' : currentTooltip}>
        {isDesktop ? (
          <Button
            // Red once open: the button no longer creates anything, it abandons
            // what is on screen. `inherit` made a destructive action look like
            // plain text.
            color={currentColor}
            size={size}
            variant="outlined"
            disabled={isBlocked}
            onClick={onToggle}
            data-testid={testId}
            startIcon={currentIcon}>
            {currentLabel}
          </Button>
        ) : (
          // Same outlined Button on mobile. Small section actions share one
          // fixed footprint even when callers provide custom composite icons.
          <Button
            color={currentColor}
            size={size}
            variant="outlined"
            disabled={isBlocked}
            onClick={onToggle}
            data-testid={testId}
            aria-label={currentLabel}
            sx={size === 'small' ? MOBILE_SECTION_ACTION_BUTTON_SX : undefined}>
            {currentIcon}
          </Button>
        )}
      </Tooltip>
    </OfflineDisabled>
  );
};

SectionCreateButton.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  // Already translated: the id differs per section (New / Add / Associate /
  // Join), while the closed state's label is always 'Cancel' and is handled
  // here.
  label: PropTypes.node.isRequired,
  // Falls back to `label` when the section has nothing more verbose to say.
  tooltip: PropTypes.string,
  // Falls back to `tooltip` when a section has nothing better to say once open.
  openTooltip: PropTypes.string,
  icon: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  testId: PropTypes.string
};

export default SectionCreateButton;
