import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';
import { useOnlineStatus } from '../../hooks';

/**
 * Explains why an action is unavailable while offline.
 *
 * Wrap a control that needs the network and pass `disabled` down yourself —
 * this only adds the explanation, so callers keep control over their own
 * disabled logic:
 *
 *   <OfflineDisabled>
 *     <Button disabled={isOffline || isSaving}>Save</Button>
 *   </OfflineDisabled>
 *
 * When the control is only *sometimes* blocked offline — the toggle buttons
 * that turn into "Cancel" once their panel is open — hand the same expression
 * to both, or the tooltip ends up claiming a working button is unavailable:
 *
 *   const isBlocked = !isOnline && !isPanelOpen;
 *   <OfflineDisabled disabled={isBlocked}>
 *     <Button disabled={isBlocked}>{isPanelOpen ? 'Cancel' : 'Associate'}</Button>
 *   </OfflineDisabled>
 *
 * Rule: disable, never hide. A control that vanishes shifts the layout and
 * leaves the user wondering what happened to it.
 *
 * The <span> wrapper is required, not cosmetic: MUI sets `pointer-events: none`
 * on a disabled button, so the Tooltip would never receive the hover that
 * triggers it.
 */
const OfflineDisabled = ({
  children,
  title = null,
  fullWidth = false,
  disabled = true
}) => {
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();

  // Nothing to explain when the control still works — and wrapping it anyway
  // would stack this tooltip on top of the child's own one, both firing on the
  // same hover since the events bubble from the button up to the span.
  if (isOnline || !disabled) return children;

  return (
    <Tooltip title={title ?? formatMessage({ id: 'offlineActionUnavailable' })}>
      {/* inline-flex so the wrapper is layout-neutral: a plain inline <span>
          would break button groups and flex rows it gets dropped into.
          It shrinks to its content though, which silently cancels a `fullWidth`
          button inside — hence the opt-in below rather than a width on every
          wrapper, which would stretch the inline cases instead. */}
      <span
        style={{
          display: 'inline-flex',
          width: fullWidth ? '100%' : undefined
        }}>
        {children}
      </span>
    </Tooltip>
  );
};

OfflineDisabled.propTypes = {
  children: PropTypes.node.isRequired,
  // Overrides the generic wording when a screen can say something better.
  title: PropTypes.string,
  // Required when wrapping a `fullWidth` button, or it collapses to its label.
  fullWidth: PropTypes.bool,
  // Whether the wrapped control is actually blocked right now. Defaults to the
  // common case — blocked whenever offline — so only conditional call sites
  // need to say anything.
  disabled: PropTypes.bool
};

export default OfflineDisabled;
